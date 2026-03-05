"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdapterAlphaVantageService = void 0;
const common_1 = require("@nestjs/common");
const number_util_1 = require("../utils/number.util");
const http_util_1 = require("../utils/http.util");
const provider_error_util_1 = require("../utils/provider-error.util");
let AdapterAlphaVantageService = class AdapterAlphaVantageService {
    constructor() {
        this.provider = 'alphavantage';
        this.apiKey = process.env.ALPHA_VANTAGE_API_KEY || process.env.ALPHAVANTAGE_API_KEY || '';
        this.baseUrl = process.env.ALPHA_VANTAGE_BASE_URL || 'https://www.alphavantage.co/query';
    }
    getDescriptor() {
        return {
            id: this.provider,
            name: 'Alpha Vantage',
            enabled: !!this.apiKey,
            supportsSearch: true,
            supportsFundamentals: true,
            notes: this.apiKey ? undefined : 'Sin API key configurada.',
        };
    }
    supportsAssetType(assetType) {
        return ['stock', 'etf', 'cedear', 'index'].includes((assetType || '').toLowerCase());
    }
    buildUrl(fn, symbol) {
        const query = new URLSearchParams({
            function: fn,
            symbol,
            apikey: this.apiKey,
        });
        return `${this.baseUrl}?${query.toString()}`;
    }
    assertNoRateLimit(payload) {
        const note = typeof payload?.Note === 'string' ? payload.Note : '';
        if (note) {
            throw new provider_error_util_1.ProviderApiError({
                provider: this.provider,
                message: `Alpha Vantage rate limit: ${note.slice(0, 160)}`,
                retryable: true,
                statusCode: 429,
            });
        }
        if (typeof payload?.Information === 'string' && payload.Information) {
            throw new provider_error_util_1.ProviderApiError({
                provider: this.provider,
                message: payload.Information,
                retryable: false,
            });
        }
    }
    async fetchFundamentals(symbol) {
        if (!this.apiKey) {
            throw new provider_error_util_1.ProviderApiError({
                provider: this.provider,
                message: 'ALPHA_VANTAGE_API_KEY no configurada',
                retryable: false,
            });
        }
        const ticker = symbol.normalizedTicker;
        const [overview, incomeRaw, balanceRaw, cashRaw, earningsRaw] = await Promise.all([
            (0, http_util_1.fetchJsonWithRetry)({ provider: this.provider, url: this.buildUrl('OVERVIEW', ticker), retries: 2 }),
            (0, http_util_1.fetchJsonWithRetry)({ provider: this.provider, url: this.buildUrl('INCOME_STATEMENT', ticker), retries: 2 }),
            (0, http_util_1.fetchJsonWithRetry)({ provider: this.provider, url: this.buildUrl('BALANCE_SHEET', ticker), retries: 2 }),
            (0, http_util_1.fetchJsonWithRetry)({ provider: this.provider, url: this.buildUrl('CASH_FLOW', ticker), retries: 2 }),
            (0, http_util_1.fetchJsonWithRetry)({ provider: this.provider, url: this.buildUrl('EARNINGS', ticker), retries: 2 }),
        ]);
        this.assertNoRateLimit(overview);
        this.assertNoRateLimit(incomeRaw);
        this.assertNoRateLimit(balanceRaw);
        this.assertNoRateLimit(cashRaw);
        this.assertNoRateLimit(earningsRaw);
        const incomeReports = Array.isArray(incomeRaw?.annualReports) ? incomeRaw.annualReports : [];
        const balanceReports = Array.isArray(balanceRaw?.annualReports) ? balanceRaw.annualReports : [];
        const cashReports = Array.isArray(cashRaw?.annualReports) ? cashRaw.annualReports : [];
        if (!overview?.Symbol && incomeReports.length === 0 && balanceReports.length === 0 && cashReports.length === 0) {
            throw new provider_error_util_1.ProviderApiError({
                provider: this.provider,
                message: `Alpha Vantage sin datos para ${ticker}`,
                retryable: false,
            });
        }
        const incomeStatement = incomeReports.map((row) => ({
            date: String(row?.fiscalDateEnding || ''),
            period: 'FY',
            fiscalYear: (0, number_util_1.toNumber)(String(row?.fiscalDateEnding || '').slice(0, 4)),
            currency: row?.reportedCurrency || null,
            revenue: (0, number_util_1.toNumber)(row?.totalRevenue),
            grossProfit: (0, number_util_1.toNumber)(row?.grossProfit),
            operatingIncome: (0, number_util_1.toNumber)(row?.operatingIncome),
            netIncome: (0, number_util_1.toNumber)(row?.netIncome),
            eps: (0, number_util_1.toNumber)(row?.reportedEPS),
            ebitda: (0, number_util_1.toNumber)(row?.ebitda),
        }));
        const balanceSheet = balanceReports.map((row) => ({
            date: String(row?.fiscalDateEnding || ''),
            period: 'FY',
            fiscalYear: (0, number_util_1.toNumber)(String(row?.fiscalDateEnding || '').slice(0, 4)),
            currency: row?.reportedCurrency || null,
            totalAssets: (0, number_util_1.toNumber)(row?.totalAssets),
            totalLiabilities: (0, number_util_1.toNumber)(row?.totalLiabilities),
            totalEquity: (0, number_util_1.toNumber)(row?.totalShareholderEquity),
            cashAndEquivalents: (0, number_util_1.toNumber)(row?.cashAndCashEquivalentsAtCarryingValue),
            totalDebt: (0, number_util_1.toNumber)(row?.shortLongTermDebtTotal) ||
                (0, number_util_1.toNumber)(row?.longTermDebt) ||
                (0, number_util_1.toNumber)(row?.shortTermDebt),
        }));
        const cashFlow = cashReports.map((row) => ({
            date: String(row?.fiscalDateEnding || ''),
            period: 'FY',
            fiscalYear: (0, number_util_1.toNumber)(String(row?.fiscalDateEnding || '').slice(0, 4)),
            currency: row?.reportedCurrency || null,
            operatingCashFlow: (0, number_util_1.toNumber)(row?.operatingCashflow),
            capex: (0, number_util_1.toNumber)(row?.capitalExpenditures),
            freeCashFlow: (0, number_util_1.toNumber)(row?.operatingCashflow) !== null && (0, number_util_1.toNumber)(row?.capitalExpenditures) !== null
                ? ((0, number_util_1.toNumber)(row?.operatingCashflow) || 0) - Math.abs((0, number_util_1.toNumber)(row?.capitalExpenditures) || 0)
                : null,
        }));
        const earnings = (Array.isArray(earningsRaw?.annualEarnings) ? earningsRaw.annualEarnings : [])
            .slice(0, 8)
            .map((row) => ({
            date: String(row?.fiscalDateEnding || row?.reportedDate || ''),
            actualEps: (0, number_util_1.toNumber)(row?.reportedEPS),
            estimatedEps: null,
            surprisePct: null,
        }));
        const latestIncome = incomeStatement[0] || null;
        const latestBalance = balanceSheet[0] || null;
        const latestCash = cashFlow[0] || null;
        const orderedIncome = [...incomeStatement].sort((a, b) => (a.date > b.date ? 1 : -1));
        const revenues = orderedIncome.map((row) => row.revenue || null);
        const cagrYears = Math.max(1, revenues.length - 1);
        const debtToEquity = (0, number_util_1.safeRatio)(latestBalance?.totalDebt || null, latestBalance?.totalEquity || null) ||
            (0, number_util_1.toNumber)(overview?.DebtToEquityRatio);
        const netMargin = (0, number_util_1.toNumber)(overview?.ProfitMargin) !== null
            ? ((0, number_util_1.toNumber)(overview?.ProfitMargin) || 0) * 100
            : (0, number_util_1.safeRatio)(latestIncome?.netIncome || null, latestIncome?.revenue || null) !== null
                ? ((0, number_util_1.safeRatio)(latestIncome?.netIncome || null, latestIncome?.revenue || null) || 0) * 100
                : null;
        return {
            instrument: {
                normalizedTicker: ticker,
                tvSymbol: symbol.tvSymbol,
                exchange: String(overview?.Exchange || symbol.exchange || '').toUpperCase(),
                assetType: symbol.assetType,
                name: overview?.Name || symbol.name,
            },
            statements: {
                incomeStatement,
                balanceSheet,
                cashFlow,
                earnings,
            },
            metrics: {
                marketCap: (0, number_util_1.toNumber)(overview?.MarketCapitalization),
                enterpriseValue: (0, number_util_1.toNumber)(overview?.EnterpriseValue),
                peRatio: (0, number_util_1.toNumber)(overview?.PERatio),
                roe: (0, number_util_1.toNumber)(overview?.ReturnOnEquityTTM) !== null ? ((0, number_util_1.toNumber)(overview?.ReturnOnEquityTTM) || 0) * 100 : null,
                roic: null,
                debtToEquity,
                netMargin,
                freeCashFlow: latestCash?.freeCashFlow || null,
                revenueGrowthCagr: (0, number_util_1.cagrFromSeries)(revenues, cagrYears),
            },
            meta: {
                sector: overview?.Sector || null,
                currency: overview?.Currency || null,
            },
        };
    }
};
exports.AdapterAlphaVantageService = AdapterAlphaVantageService;
exports.AdapterAlphaVantageService = AdapterAlphaVantageService = __decorate([
    (0, common_1.Injectable)()
], AdapterAlphaVantageService);
//# sourceMappingURL=adapter-alpha-vantage.service.js.map