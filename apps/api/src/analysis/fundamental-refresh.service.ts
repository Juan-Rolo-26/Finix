import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma.service';
import { fetchVerifiedFundamentals } from './verified-fundamentals';
import { addTwoMonths, collectFundamentalInputs, marketObservation } from './fundamental-providers';

export const REFRESH_VERSION = 'fundamentals-v2';
const stateKey = (id: string) => 'analysis.refresh.' + id;
const marketKey = (id: string) => 'analysis.market.' + id;
const localDay = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }).format(d);
const parse = (value: string | null | undefined) => { try { return JSON.parse(value || '{}'); } catch { return {}; } };
export function refreshIsDue(state: any, now = new Date()) {
    if (state.retryAt && Date.parse(state.retryAt) > now.getTime()) return false;
    return state.version !== REFRESH_VERSION || !state.nextDueAt || !Number.isFinite(Date.parse(state.nextDueAt)) || Date.parse(state.nextDueAt) <= now.getTime();
}
/** Persistent per-company schedule, shared lease and optimistic writes survive restarts. No email campaigns are created. */
@Injectable()
export class FundamentalRefreshService implements OnModuleInit {
    private readonly logger = new Logger(FundamentalRefreshService.name);
    private running = false;
    constructor(private readonly prisma: PrismaService) {}
    onModuleInit() {
        if (this.enabled()) { const timer = setTimeout(() => { void this.scheduledRefresh().catch(() => this.logger.warn('No se pudo iniciar la actualización fundamental.')); }, 15000); timer.unref(); }
    }
    private enabled() { return process.env.NODE_ENV === 'production' && process.env.FINIX_LOCAL_MODE !== 'true' && process.env.FINIX_FUNDAMENTAL_REFRESH_ENABLED !== 'false'; }
    @Cron('0 */10 * * * *', { timeZone: 'America/Argentina/Buenos_Aires' })
    async scheduledRefresh() {
        if (!this.enabled()) return;
        await this.runBatch().catch(() => this.logger.warn('Se reintentará la actualización fundamental.'));
        const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Argentina/Buenos_Aires', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
        const part = (key: string) => parts.find(p => p.type === key)?.value || '';
        if (!['Sat','Sun'].includes(part('weekday')) && Number(part('hour')) * 60 + Number(part('minute')) >= 1110) await this.runBatch(10, false, true).catch(() => this.logger.warn('Se reintentará la consulta de volúmenes.'));
    }
    @Cron('0 30 18 * * 1-5', { timeZone: 'America/Argentina/Buenos_Aires' })
    async scheduledMarket() { if (this.enabled()) await this.runBatch(150, false, true).catch(() => this.logger.warn('Se reintentará la consulta de volúmenes.')); }

    private async acquireLease() {
        const key = 'analysis.refresh.lease', initial = JSON.stringify({ until: 0 });
        await this.prisma.platformSetting.upsert({ where: { key }, create: { key, value: initial }, update: {} });
        const existing = await this.prisma.platformSetting.findUnique({ where: { key } });
        if (!existing || Number(parse(existing.value).until) > Date.now()) return null;
        const value = JSON.stringify({ owner: randomUUID(), until: Date.now() + 20 * 60000 });
        const claim = await this.prisma.platformSetting.updateMany({ where: { key, value: existing.value }, data: { value } });
        return claim.count === 1 ? { key, value } : null;
    }
    async runBatch(limit = 5, force = false, marketOnly = false) {
        if (this.running) return { processed: 0, failed: 0, busy: true };
        this.running = true; let lease: { key: string; value: string } | null = null;
        try {
            lease = await this.acquireLease(); if (!lease) return { processed: 0, failed: 0, busy: true };
            const rows = await this.prisma.assetAnalysis.findMany({ where: { status: 'PUBLISHED', isActive: true }, orderBy: [{ analysisDate: 'asc' }, { id: 'asc' }] });
            const keyFor = marketOnly ? marketKey : stateKey;
            const settings = await this.prisma.platformSetting.findMany({ where: { key: { in: rows.map(row => keyFor(row.id)) } } });
            const states = new Map(settings.map(row => [row.key, parse(row.value)]));
            const selected = rows.filter(row => { const state = states.get(keyFor(row.id)) || {}; return force || (marketOnly ? (!state.retryAt || Date.parse(state.retryAt) <= Date.now()) && (!state.lastSuccessAt || localDay(new Date(state.lastSuccessAt)) !== localDay(new Date())) : refreshIsDue(state)); }).slice(0, Math.min(150, Math.max(1, limit)));
            let processed = 0, failed = 0;
            for (const row of selected) {
                const key = keyFor(row.id), previous = states.get(key) || {};
                try {
                    if (marketOnly) {
                        await this.refreshMarket(row);
                        const value = JSON.stringify({ lastSuccessAt: new Date().toISOString(), retryAt: null, error: null });
                        await this.prisma.platformSetting.upsert({ where: { key }, create: { key, value }, update: { value } });
                    }
                    else await this.refreshFundamentals(row, previous);
                    processed++;
                } catch {
                    failed++;
                    const value = JSON.stringify({ ...previous, lastAttemptAt: new Date().toISOString(), retryAt: new Date(Date.now() + 3600000).toISOString(), error: 'No se pudo completar la consulta; se conservan los últimos datos verificados.' });
                    await this.prisma.platformSetting.upsert({ where: { key }, create: { key, value }, update: { value } });
                    this.logger.warn('Actualización pendiente: ' + row.ticker);
                }
            }
            const key = 'analysis.refresh.status', value = JSON.stringify({ version: REFRESH_VERSION, at: new Date().toISOString(), calendarMonths: 2, marketOnly, processed, failed, total: rows.length });
            await this.prisma.platformSetting.upsert({ where: { key }, create: { key, value }, update: { value } });
            return { processed, failed, total: rows.length };
        } finally {
            if (lease) await this.prisma.platformSetting.updateMany({ where: { key: lease.key, value: lease.value }, data: { value: JSON.stringify({ until: 0 }) } }).catch(() => {});
            this.running = false;
        }
    }
    private async refreshFundamentals(row: any, previous: any) {
        const observed = await fetchVerifiedFundamentals(row.ticker || row.symbol);
        if (!(observed.revenue > 0) || !(observed.totalAssets > 0)) throw new Error('Estados financieros incompletos.');
        const oldSeries = parse(row.historicalSeries), meta = observed.historicalSeries.meta;
        const cashFields = ['operatingCashFlow','capEx','freeCashFlow','fcfMargin','earningsToCashConversion'];
        if (observed.operatingCashFlow == null || observed.capEx == null) {
            for (const field of cashFields) observed[field] = null;
            if (row.freeCashFlow != null) { meta.cashFlow = oldSeries.meta?.cashFlow; meta.cashFlowBasis = oldSeries.meta?.cashFlowBasis; }
        }
        for (const field of ['revenue','margins']) {
            const values = new Map((oldSeries[field] || []).map((point: any) => [point.period, point]));
            for (const point of observed.historicalSeries[field] || []) values.set(point.period, point);
            observed.historicalSeries[field] = [...values.values()].sort((a: any, b: any) => a.period.localeCompare(b.period)).slice(-8);
        }
        const floats = new Set(Prisma.dmmf.datamodel.models.find(m => m.name === 'AssetAnalysis')!.fields.filter(f => f.type === 'Float' || f.type === 'Int').map(f => f.name));
        const data: Record<string, any> = {};
        meta.retainedValues = {};
        for (const [key, value] of Object.entries(observed)) {
            if (!floats.has(key)) continue;
            if (typeof value === 'number' && Number.isFinite(value)) data[key] = value;
            else if (row[key] !== null && row[key] !== undefined) meta.retainedValues[key] = { verifiedAt: oldSeries.meta?.retainedValues?.[key]?.verifiedAt || oldSeries.meta?.queriedAt || row.analysisDate, period: oldSeries.meta?.fieldSources?.[key]?.period || (cashFields.includes(key) ? oldSeries.meta?.cashFlow : oldSeries.meta?.balance), reason: 'La nueva consulta no aportó un reemplazo verificable; se conserva el valor anterior.' };
        }
        const summary = observed.executiveSummary;
        const description = (row.businessDescription || '').split('Los importes contables')[0].trim();
        if (description) summary.summary = description + ' ' + summary.summary;
        data.executiveSummary = JSON.stringify(summary); data.historicalSeries = JSON.stringify(observed.historicalSeries);
        data.sources = observed.sources + (row.sources?.includes('Perfil corporativo:') ? ' Perfil corporativo: ' + row.sources.split('Perfil corporativo:')[1].split(' · ')[0] : '');
        data.analysisDate = new Date();
        if (observed.logoUrl) data.logoUrl = observed.logoUrl;
        if (observed.ceo) data.ceo = observed.ceo;
        const visibility = parse(row.sectionVisibility); data.sectionVisibility = JSON.stringify({ ...visibility, showTechnical: false });
        const now = new Date(), value = JSON.stringify({ version: REFRESH_VERSION, lastAttemptAt: now.toISOString(), lastSuccessAt: now.toISOString(), nextDueAt: addTwoMonths(now).toISOString(), providers: meta.providers, retained: Object.keys(meta.retainedValues), error: null, retryAt: null });
        await this.prisma.$transaction(async tx => {
            const changed = await tx.assetAnalysis.updateMany({ where: { id: row.id, updatedAt: row.updatedAt }, data });
            if (changed.count !== 1) throw new Error('Edición concurrente.');
            await tx.analysisAuditLog.create({ data: { analysisId: row.id, userId: 'system', action: 'AUTO_BIMONTHLY_REFRESH', field: 'fundamentals', newValue: 'Fuentes verificadas; próxima revisión ' + addTwoMonths(now).toISOString() } });
            const key = stateKey(row.id); await tx.platformSetting.upsert({ where: { key }, create: { key, value }, update: { value } });
        });
    }
    private async refreshMarket(row: any) {
        const collected = await collectFundamentalInputs(row.ticker || row.symbol, true), obs = marketObservation(collected);
        if (obs.values.volume === null || obs.values.avgVolume === null) throw new Error('Sin 30 sesiones verificables.');
        const series = parse(row.historicalSeries); series.meta ||= {}; series.meta.market = obs.meta;
        const data: Record<string, any> = { historicalSeries: JSON.stringify(series) };
        for (const [key, value] of Object.entries(obs.values)) if (value !== null) { data[key] = value; if (series.meta.unavailable) delete series.meta.unavailable[key]; if (series.meta.retainedValues) delete series.meta.retainedValues[key]; }
        data.historicalSeries = JSON.stringify(series);
        const updated = await this.prisma.assetAnalysis.updateMany({ where: { id: row.id, updatedAt: row.updatedAt }, data });
        if (!updated.count) throw new Error('Edición concurrente.');
    }
}
