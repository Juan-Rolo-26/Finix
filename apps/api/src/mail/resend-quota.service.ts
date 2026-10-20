import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma.service';
import { isLocalMode } from '../config/local-mode';

type WindowUsage = { used: number; limit: number | null; resets_at: string };
export type EmailUsage = { daily: WindowUsage; monthly: WindowUsage };
const OWNER = 'juanpablorolo2007@gmail.com';

@Injectable()
export class ResendQuotaService implements OnModuleInit {
    private readonly logger = new Logger(ResendQuotaService.name);
    private cached?: { usage: EmailUsage; at: number };
    private loading?: Promise<EmailUsage>;
    private checking = false;
    readonly reserve = 3; // Leave room for owner warnings and transactional mail.
    constructor(private readonly prisma: PrismaService) {}

    enabled() {
        return !isLocalMode() && (process.env.MAIL_PROVIDER?.trim().toLowerCase() || (process.env.RESEND_API_KEY ? 'resend' : 'smtp')) === 'resend' && Boolean(process.env.RESEND_API_KEY);
    }
    onModuleInit() { void this.monitor(); }
    @Interval(15 * 60 * 1000)
    async monitor() {
        if (!this.enabled() || this.checking) return;
        this.checking = true;
        try { await this.check(0, true); }
        catch { this.logger.warn('No se pudo consultar la cuota de Resend; se volverá a intentar.'); }
        finally { this.checking = false; }
    }
    async usage(force = false): Promise<EmailUsage> {
        if (!force && this.cached && Date.now() - this.cached.at < 60000) return this.cached.usage;
        if (this.loading) return this.loading;
        this.loading = (async () => {
            const response = await fetch('https://api.resend.com/usage', { headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` }, signal: AbortSignal.timeout(10000) });
            if (!response.ok) throw Error('Resend usage unavailable');
            const payload = await response.json();
            const usage = payload?.emails;
            for (const period of ['daily', 'monthly']) {
                const item = usage?.[period];
                if (!item || typeof item.used !== 'number' || !Number.isFinite(item.used) || item.used < 0 || (item.limit !== null && (typeof item.limit !== 'number' || !Number.isFinite(item.limit) || item.limit <= 0)) || !Number.isFinite(Date.parse(item.resets_at))) throw Error('Invalid Resend usage');
            }
            this.cached = { usage, at: Date.now() };
            await this.prisma.platformSetting.upsert({ where: { key: 'resend.quota.usage' }, create: { key: 'resend.quota.usage', value: JSON.stringify(usage), description: 'Última cuota consultada directamente a Resend' }, update: { value: JSON.stringify(usage) } });
            return usage;
        })().finally(() => { this.loading = undefined; });
        return this.loading;
    }
    async check(expectedSends = 0, force = false) {
        if (!this.enabled()) return null;
        const usage = await this.usage(force);
        for (const period of ['daily','monthly'] as const) {
            const item = usage[period];
            if (item.limit == null) continue;
            const percentage = item.used / item.limit * 100;
            const level = percentage >= 95 ? '95' : percentage >= 80 ? '80' : item.limit - item.used <= expectedSends + this.reserve ? 'forecast' : null;
            if (level) await this.warnOnce(period, level, usage);
        }
        return usage;
    }
    async bulkAllowance(requested: number) {
        if (!this.enabled()) return { count: requested, retryAt: null as Date | null };
        try {
            const usage = await this.check(requested);
            let count = requested;
            const resets: number[] = [];
            for (const period of ['daily','monthly'] as const) {
                const item = usage![period];
                if (item.limit == null) continue;
                count = Math.min(count, Math.max(0, item.limit - item.used - this.reserve));
                if (item.limit - item.used <= this.reserve) resets.push(Date.parse(item.resets_at) + 1000);
            }
            return { count, retryAt: count ? null : new Date(resets.length ? Math.max(...resets) : Date.now() + 5*60000) };
        } catch {
            this.logger.warn('Boletines en espera: no se pudo verificar la cuota. Los correos de acceso mantienen su funcionamiento.');
            return { count: 0, retryAt: new Date(Date.now() + 5*60000) };
        }
    }
    recordSuccessfulSend() {
        if (!this.enabled()) return;
        if (this.cached) for (const period of ['daily','monthly'] as const) this.cached.usage[period].used++;
        if (!this.checking) {
            this.checking = true;
            void this.check().catch(() => undefined).finally(() => { this.checking = false; });
        }
    }
    private async warnOnce(period: 'daily' | 'monthly', level: string, usage: EmailUsage) {
        const item = usage[period];
        const key = `resend.quota.alert.${period}.${item.resets_at}.${level}`;
        const previous = await this.prisma.platformSetting.findUnique({ where: { key } });
        if (previous) {
            const state = JSON.parse(previous.value);
            if (state.status !== 'FAILED' || Date.now() - previous.updatedAt.getTime() < 5*60000 || Date.now() - previous.createdAt.getTime() > 23*3600000) return;
        } else {
            try { await this.prisma.platformSetting.create({ data: { key, value: JSON.stringify({ status: 'PENDING' }), description: 'Alerta de cuota con deduplicación por período y umbral' } }); }
            catch (error: any) { if (error.code === 'P2002') return; throw error; }
        }
        try {
            const receipt = await this.sendAlert(usage, false, createHash('sha256').update(key).digest('hex'));
            await this.prisma.platformSetting.update({ where: { key }, data: { value: JSON.stringify({ status: 'SENT', providerId: receipt.id, period, level }) } });
        } catch {
            await this.prisma.platformSetting.update({ where: { key }, data: { value: JSON.stringify({ status: 'FAILED' }) } });
        }
    }
    async sendTestAlert() { return this.sendAlert(await this.usage(true), true, 'quota-preview-v1-' + new Date().toISOString().slice(0,10)); }
    private async sendAlert(usage: EmailUsage, test: boolean, key: string) {
        const line = (name: string, item: WindowUsage) => `${name}: ${item.used} usados de ${item.limit ?? 'sin límite'}; ${item.limit == null ? 'sin límite' : Math.max(0,item.limit-item.used)} disponibles. Reinicio: ${new Date(item.resets_at).toLocaleString('es-AR',{ timeZone:'America/Argentina/Buenos_Aires' })} (Argentina).`;
        const text = (test ? 'Esta es una prueba del aviso automático. No significa que la cuota esté por agotarse.\n\n' : 'Finix está cerca de su cuota de correo o el próximo lote podría consumir el saldo disponible.\n\n') + line('Cuota diaria',usage.daily) + '\n' + line('Cuota mensual',usage.monthly) + '\n\nLos avisos se activan al 80%, al 95% o si el próximo lote supera el saldo reservado. Revisá tu uso y tu plan en https://resend.com/settings/billing. No se cambia el plan ni se contrata saldo automáticamente.';
        const configured = process.env.EMAIL_FROM || 'onboarding@resend.dev';
        const address = (configured.match(/<([^>]+)>/)?.[1] || configured).trim();
        if (/[\r\n]/.test(configured)) throw Error('Invalid sender');
        const response = await fetch('https://api.resend.com/emails', { method:'POST', headers:{ Authorization:`Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type':'application/json', 'Idempotency-Key':'finix/quota/' + key }, body:JSON.stringify({ from:`Finix <${address}>`,to:[OWNER],subject:(test?'[PRUEBA] ':'')+'Finix | Aviso de cuota de Resend',text,html:'<div style="max-width:760px;margin:auto;padding:28px;font:15px/1.7 Arial;color:#17332a"><h1 style="color:#087747">Finix · Cuota de correo</h1>'+text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/\n/g,'<br>')+'</div>' }), signal:AbortSignal.timeout(15000) });
        if (!response.ok) throw Error('Quota warning was not accepted');
        const result = await response.json();
        if (this.cached) for (const period of ['daily','monthly'] as const) this.cached.usage[period].used++;
        return { id: result.id };
    }
}
