import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma.service';
import { TV_SYMBOL_SLUGS } from '../market-ranking/services/tv-slugs.const';

type ValueCreationStatus = 'CREA_VALOR' | 'DESTRUYE_VALOR' | 'EN_EQUILIBRIO' | 'SIN_COBERTURA';

export interface ValueCreationItem {
    symbol: string;
    ticker: string;
    name: string;
    sector: string;
    marketCap: number | null;
    roic: number | null;
    wacc: number | null;
    spread: number | null;
    beta: number | null;
    costOfEquity: number | null;
    costOfDebt: number | null;
    status: ValueCreationStatus;
    alphaSpreadUrl: string;
}

export interface ValueCreationPayload {
    summary: {
        totalCount: number;
        coveredCount: number;
        createsValueCount: number;
        destroysValueCount: number;
        equilibriumCount: number;
        medianSpread: number | null;
        updatedAt: string;
        stale: boolean;
    };
    methodology: {
        riskFreeRate: number;
        equityRiskPremium: number;
        taxRateFallback: number;
        description: string;
    };
    items: ValueCreationItem[];
}

const CACHE_KEY = 'market:value-creation:sp500:v1';
const FRESH_FOR_MS = 12 * 60 * 60 * 1000;
const STALE_FOR_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Calcula la creación económica de valor de forma transparente: ROIC - WACC.
 * Alpha Spread se enlaza como referencia externa por compañía; los datos se
 * obtienen de proveedores configurados de Finix y no mediante scraping.
 */
@Injectable()
export class ValueCreationService implements OnModuleInit {
    private readonly logger = new Logger(ValueCreationService.name);
    private memoryCache: { data: ValueCreationPayload; fetchedAt: number } | null = null;
    private refreshing: Promise<ValueCreationPayload> | null = null;

    constructor(private readonly prisma: PrismaService) {}

    onModuleInit() {
        // No bloquea el arranque: precarga en segundo plano y conserva caché si el proveedor no responde.
        setTimeout(() => void this.getSP500ValueCreation().catch(() => undefined), 10_000);
    }

    @Cron('0 18 * * 1-5', { timeZone: 'America/New_York' })
    async refreshAfterMarketClose() {
        this.logger.log('Actualizando radar ROIC-WACC posterior al cierre de EE.UU.');
        await this.getSP500ValueCreation(true);
    }

    async getSP500ValueCreation(forceRefresh = false): Promise<ValueCreationPayload> {
        if (!forceRefresh && this.memoryCache && Date.now() - this.memoryCache.fetchedAt < FRESH_FOR_MS) {
            return this.memoryCache.data;
        }

        const persisted = !forceRefresh ? await this.readPersisted() : null;
        if (persisted && Date.now() - new Date(persisted.summary.updatedAt).getTime() < FRESH_FOR_MS) {
            this.memoryCache = { data: persisted, fetchedAt: Date.now() };
            return persisted;
        }

        if (this.refreshing) return this.refreshing;

        this.refreshing = this.refresh().catch(async (error) => {
            this.logger.error(`No se pudo actualizar ROIC-WACC: ${error.message}`);
            const fallback = persisted || await this.readPersisted();
            if (fallback) {
                const stale = {
                    ...fallback,
                    summary: { ...fallback.summary, stale: true },
                };
                this.memoryCache = { data: stale, fetchedAt: Date.now() };
                return stale;
            }
            return this.emptyPayload(true);
        }).finally(() => {
            this.refreshing = null;
        });

        return this.refreshing;
    }

    async getTickerValueCreation(ticker: string) {
        const data = await this.getSP500ValueCreation();
        const clean = (ticker || '').toUpperCase().replace(/\./g, '-');
        return data.items.find((item) => item.ticker === clean || item.ticker.replace(/-/g, '.') === ticker.toUpperCase()) || null;
    }

    private async refresh(): Promise<ValueCreationPayload> {
        const universe = await this.getUniverse();
        const rows = await this.fetchScannerRows(universe.map((asset) => asset.ticker));
        const items = universe.map((asset) => this.toItem(rows.get(asset.ticker), asset));
        const payload = this.buildPayload(items, false);

        this.memoryCache = { data: payload, fetchedAt: Date.now() };
        await this.persist(payload);
        this.logger.log(`Mapa ROIC-WACC actualizado: ${payload.summary.coveredCount}/${payload.summary.totalCount} empresas con cobertura.`);
        return payload;
    }

    private async getUniverse(): Promise<Array<{ ticker: string; companyName: string; sector: string }>> {
        try {
            const stored = await this.prisma.sP500Asset.findMany({
                where: { isActive: true },
                select: { ticker: true, companyName: true, sector: true },
            });
            if (stored.length >= 400) {
                return stored.map((asset) => ({
                    ticker: asset.ticker.toUpperCase().replace(/\./g, '-'),
                    companyName: asset.companyName,
                    sector: asset.sector || 'Otros',
                }));
            }
        } catch (error: any) {
            this.logger.warn(`Universo S&P 500 no disponible en DB: ${error.message}`);
        }

        return Object.keys(TV_SYMBOL_SLUGS).map((ticker) => ({
            ticker: ticker.replace(/\./g, '-'),
            companyName: ticker,
            sector: 'Otros',
        }));
    }

    private async fetchScannerRows(tickers: string[]): Promise<Map<string, any>> {
        const rows = new Map<string, any>();
        const batchSize = 80;
        const columns = [
            'name', 'description', 'sector', 'market_cap_basic', 'total_debt_fq',
            'cash_n_short_term_invest_fq', 'beta_1_year', 'return_on_invested_capital_fq',
            'interest_expense_ttm', 'income_tax_expense_ttm', 'pretax_income_ttm',
        ];

        for (let index = 0; index < tickers.length; index += batchSize) {
            const batch = tickers.slice(index, index + batchSize);
            const symbols = batch.flatMap((ticker) => [`NASDAQ:${ticker}`, `NYSE:${ticker}`]);
            try {
                const response = await fetch('https://scanner.tradingview.com/america/scan', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'User-Agent': 'Finix-ValueCreation/1.0' },
                    body: JSON.stringify({ symbols: { tickers: symbols }, columns }),
                    signal: AbortSignal.timeout(12_000),
                });
                if (!response.ok) throw new Error(`TradingView HTTP ${response.status}`);
                const json = await response.json() as any;
                for (const row of json?.data || []) {
                    const ticker = String(row?.d?.[0] || row?.s?.split(':').pop() || '').toUpperCase().replace(/\./g, '-');
                    if (ticker && !rows.has(ticker)) rows.set(ticker, row);
                }
            } catch (error: any) {
                this.logger.warn(`Lote ROIC-WACC ${Math.floor(index / batchSize) + 1} no disponible: ${error.message}`);
            }
        }
        return rows;
    }

    private toItem(row: any, fallback: { ticker: string; companyName: string; sector: string }): ValueCreationItem {
        const values = Array.isArray(row?.d) ? row.d : [];
        const value = (index: number): number | null => {
            const raw = values[index];
            return typeof raw === 'number' && Number.isFinite(raw) ? raw : null;
        };
        const ticker = String(values[0] || fallback.ticker).toUpperCase().replace(/\./g, '-');
        const symbol = String(row?.s || `NASDAQ:${ticker}`);
        const marketCap = value(3);
        const totalDebt = Math.max(0, value(4) || 0);
        const betaRaw = value(6);
        const beta = betaRaw !== null && betaRaw >= 0 && betaRaw <= 5 ? betaRaw : 1;
        const roic = this.normalizePercent(value(7));
        const interestExpense = Math.abs(value(8) || 0);
        const incomeTax = Math.abs(value(9) || 0);
        const preTaxIncome = Math.abs(value(10) || 0);
        const taxRate = preTaxIncome > 0 ? this.clamp((incomeTax / preTaxIncome) * 100, 0, 35) : 21;
        const costOfEquity = 4.25 + beta * 4.5;
        const debtToEquity = marketCap && marketCap > 0 ? totalDebt / marketCap : 0;
        const costOfDebt = totalDebt > 0 && interestExpense > 0
            ? this.clamp((interestExpense / totalDebt) * 100, 2, 18)
            : 4.8 + this.clamp(debtToEquity * 1.15, 0, 4);
        const capital = (marketCap || 0) + totalDebt;
        const wacc = capital > 0
            ? ((costOfEquity * (marketCap || 0)) + (costOfDebt * (1 - taxRate / 100) * totalDebt)) / capital
            : null;
        const spread = roic !== null && wacc !== null ? Number((roic - wacc).toFixed(2)) : null;
        const status: ValueCreationStatus = spread === null
            ? 'SIN_COBERTURA'
            : spread > 2 ? 'CREA_VALOR'
            : spread < -2 ? 'DESTRUYE_VALOR'
            : 'EN_EQUILIBRIO';
        const exchange = symbol.split(':')[0]?.toLowerCase() === 'nyse' ? 'nyse' : 'nasdaq';

        return {
            symbol,
            ticker,
            name: String(values[1] || fallback.companyName || ticker),
            sector: String(values[2] || fallback.sector || 'Otros'),
            marketCap,
            roic,
            wacc: wacc === null ? null : Number(wacc.toFixed(2)),
            spread,
            beta: Number(beta.toFixed(2)),
            costOfEquity: Number(costOfEquity.toFixed(2)),
            costOfDebt: Number(costOfDebt.toFixed(2)),
            status,
            alphaSpreadUrl: `https://www.alphaspread.com/security/${exchange}/${ticker.toLowerCase()}/discount-rate`,
        };
    }

    private buildPayload(items: ValueCreationItem[], stale: boolean): ValueCreationPayload {
        const covered = items.filter((item) => item.spread !== null);
        const sortedSpreads = covered.map((item) => item.spread as number).sort((a, b) => a - b);
        const medianSpread = sortedSpreads.length
            ? sortedSpreads[Math.floor(sortedSpreads.length / 2)]
            : null;
        return {
            summary: {
                totalCount: items.length,
                coveredCount: covered.length,
                createsValueCount: covered.filter((item) => item.status === 'CREA_VALOR').length,
                destroysValueCount: covered.filter((item) => item.status === 'DESTRUYE_VALOR').length,
                equilibriumCount: covered.filter((item) => item.status === 'EN_EQUILIBRIO').length,
                medianSpread,
                updatedAt: new Date().toISOString(),
                stale,
            },
            methodology: {
                riskFreeRate: 4.25,
                equityRiskPremium: 4.5,
                taxRateFallback: 21,
                description: 'ROIC menos WACC. WACC estimado mediante CAPM, estructura de capital, coste de deuda e impuesto efectivo; los campos faltantes usan supuestos explícitos y conservadores.',
            },
            items,
        };
    }

    private normalizePercent(value: number | null): number | null {
        if (value === null || !Number.isFinite(value) || Math.abs(value) > 300) return null;
        const percent = Math.abs(value) <= 1.5 ? value * 100 : value;
        return Number(percent.toFixed(2));
    }

    private clamp(value: number, min: number, max: number) {
        return Math.min(max, Math.max(min, value));
    }

    private emptyPayload(stale: boolean): ValueCreationPayload {
        return this.buildPayload([], stale);
    }

    private async readPersisted(): Promise<ValueCreationPayload | null> {
        try {
            const snapshot = await this.prisma.fundamentalSnapshot.findUnique({ where: { cacheKey: CACHE_KEY } });
            if (!snapshot || Date.now() - snapshot.fetchedAt.getTime() > STALE_FOR_MS) return null;
            return JSON.parse(snapshot.payload) as ValueCreationPayload;
        } catch (error: any) {
            this.logger.warn(`No se pudo leer caché ROIC-WACC: ${error.message}`);
            return null;
        }
    }

    private async persist(payload: ValueCreationPayload): Promise<void> {
        try {
            const now = new Date();
            await this.prisma.fundamentalSnapshot.upsert({
                where: { cacheKey: CACHE_KEY },
                create: {
                    cacheKey: CACHE_KEY,
                    ticker: 'SP500-ROIC-WACC',
                    providerRequested: 'finix-value-creation',
                    providerUsed: 'tradingview',
                    payload: JSON.stringify(payload),
                    fetchedAt: now,
                    expiresAt: new Date(now.getTime() + FRESH_FOR_MS),
                    staleAt: new Date(now.getTime() + STALE_FOR_MS),
                },
                update: {
                    payload: JSON.stringify(payload),
                    fetchedAt: now,
                    expiresAt: new Date(now.getTime() + FRESH_FOR_MS),
                    staleAt: new Date(now.getTime() + STALE_FOR_MS),
                    providerUsed: 'tradingview',
                },
            });
        } catch (error: any) {
            this.logger.warn(`No se pudo guardar caché ROIC-WACC: ${error.message}`);
        }
    }
}
