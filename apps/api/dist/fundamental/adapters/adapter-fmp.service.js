"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdapterFMPService = void 0;
const common_1 = require("@nestjs/common");
const number_util_1 = require("../utils/number.util");
const http_util_1 = require("../utils/http.util");
const provider_error_util_1 = require("../utils/provider-error.util");
let AdapterFMPService = class AdapterFMPService {
    constructor() {
        this.provider = 'fmp';
        this.apiKey = process.env.FMP_API_KEY || process.env.FINANCIAL_MODELING_PREP_API_KEY || process.env.FMP_KEY || '';
        this.baseUrl = process.env.FMP_BASE_URL || 'https://financialmodelingprep.com/api/v3';
    }
    getDescriptor() {
        const keyConfigured = !!this.apiKey;
        return {
            id: this.provider,
            name: 'Financial Modeling Prep',
            enabled: keyConfigured,
            supportsSearch: false,
            supportsFundamentals: true,
            notes: keyConfigured ? undefined : 'Sin API key configurada.',
        };
    }
    supportsAssetType(assetType) {
        return ['stock', 'etf', 'index', 'cedear'].includes((assetType || '').toLowerCase());
    }
    buildUrl(path, params) {
        const search = new URLSearchParams({ apikey: this.apiKey });
        if (params) {
            Object.entries(params).forEach(([key, value]) => search.set(key, String(value)));
        }
        return `${this.baseUrl.replace(/\/$/, '')}${path}?${search.toString()}`;
    }
    async fetchFundamentals(symbol) {
        if (!this.apiKey) {
            throw new provider_error_util_1.ProviderApiError({
                provider: this.provider,
                message: 'FMP_API_KEY no configurada',
                retryable: false,
            });
        }
        const ticker = symbol.normalizedTicker;
        const [profileRaw, ratiosRaw, keyMetricsRaw, incomeRaw, balanceRaw, cashRaw, earningsRaw] = await Promise.all([
            (0, http_util_1.fetchJsonWithRetry)({ provider: this.provider, url: this.buildUrl(`/profile/${ticker}`), retries: 2 }),
            (0, http_util_1.fetchJsonWithRetry)({ provider: this.provider, url: this.buildUrl(`/ratios/${ticker}`, { limit: 8 }), retries: 2 }),
            (0, http_util_1.fetchJsonWithRetry)({ provider: this.provider, url: this.buildUrl(`/key-metrics/${ticker}`, { limit: 8 }), retries: 2 }),
            (0, http_util_1.fetchJsonWithRetry)({ provider: this.provider, url: this.buildUrl(`/income-statement/${ticker}`, { limit: 8 }), retries: 2 }),
            (0, http_util_1.fetchJsonWithRetry)({ provider: this.provider, url: this.buildUrl(`/balance-sheet-statement/${ticker}`, { limit: 8 }), retries: 2 }),
            (0, http_util_1.fetchJsonWithRetry)({ provider: this.provider, url: this.buildUrl(`/cash-flow-statement/${ticker}`, { limit: 8 }), retries: 2 }),
            (0, http_util_1.fetchJsonWithRetry)({ provider: this.provider, url: this.buildUrl(`/historical/earning_calendar/${ticker}`, { limit: 8 }), retries: 2 }),
        ]);
        const profile = Array.isArray(profileRaw) ? profileRaw[0] || {} : {};
        const ratios = Array.isArray(ratiosRaw) ? ratiosRaw[0] || {} : {};
        const keyMetrics = Array.isArray(keyMetricsRaw) ? keyMetricsRaw[0] || {} : {};
        const incomeArr = Array.isArray(incomeRaw) ? incomeRaw : [];
        const balanceArr = Array.isArray(balanceRaw) ? balanceRaw : [];
        const cashArr = Array.isArray(cashRaw) ? cashRaw : [];
        if (!profile && incomeArr.length === 0 && balanceArr.length === 0 && cashArr.length === 0) {
            throw new provider_error_util_1.ProviderApiError({
                provider: this.provider,
                message: `FMP sin datos para ${ticker}`,
                retryable: false,
            });
        }
        const incomeStatement = incomeArr.map((row) => ({
            date: String(row?.date || ''),
            period: row?.period || null,
            fiscalYear: (0, number_util_1.toNumber)(row?.calendarYear),
            currency: row?.reportedCurrency || null,
            revenue: (0, number_util_1.toNumber)(row?.revenue),
            grossProfit: (0, number_util_1.toNumber)(row?.grossProfit),
            operatingIncome: (0, number_util_1.toNumber)(row?.operatingIncome),
            netIncome: (0, number_util_1.toNumber)(row?.netIncome),
            eps: (0, number_util_1.toNumber)(row?.eps),
            ebitda: (0, number_util_1.toNumber)(row?.ebitda),
        }));
        const balanceSheet = balanceArr.map((row) => ({
            date: String(row?.date || ''),
            period: row?.period || null,
            fiscalYear: (0, number_util_1.toNumber)(row?.calendarYear),
            currency: row?.reportedCurrency || null,
            totalAssets: (0, number_util_1.toNumber)(row?.totalAssets),
            totalLiabilities: (0, number_util_1.toNumber)(row?.totalLiabilities),
            totalEquity: (0, number_util_1.toNumber)(row?.totalStockholdersEquity),
            cashAndEquivalents: (0, number_util_1.toNumber)(row?.cashAndCashEquivalents),
            totalDebt: (0, number_util_1.toNumber)(row?.totalDebt),
        }));
        const cashFlow = cashArr.map((row) => ({
            date: String(row?.date || ''),
            period: row?.period || null,
            fiscalYear: (0, number_util_1.toNumber)(row?.calendarYear),
            currency: row?.reportedCurrency || null,
            operatingCashFlow: (0, number_util_1.toNumber)(row?.operatingCashFlow),
            capex: (0, number_util_1.toNumber)(row?.capitalExpenditure),
            freeCashFlow: (0, number_util_1.toNumber)(row?.freeCashFlow),
        }));
        const earnings = (Array.isArray(earningsRaw) ? earningsRaw : []).map((row) => ({
            date: String(row?.date || row?.fiscalDateEnding || ''),
            actualEps: (0, number_util_1.toNumber)(row?.epsActual || row?.eps),
            estimatedEps: (0, number_util_1.toNumber)(row?.epsEstimated),
            surprisePct: (0, number_util_1.toNumber)(row?.epsDifferencePercent || row?.surprisePercentage),
        }));
        const latestIncome = incomeStatement[0] || null;
        const latestBalance = balanceSheet[0] || null;
        const latestCash = cashFlow[0] || null;
        const enterpriseValue = (0, number_util_1.toNumber)(keyMetrics?.enterpriseValue) || (0, number_util_1.toNumber)(profile?.enterpriseValue);
        const peRatio = (0, number_util_1.toNumber)(ratios?.priceEarningsRatio) ||
            (0, number_util_1.toNumber)(ratios?.priceEarningsToGrowthRatio) ||
            (0, number_util_1.toNumber)(profile?.pe);
        const roe = (0, number_util_1.toNumber)(ratios?.returnOnEquity) || (0, number_util_1.toNumber)(keyMetrics?.roe);
        const roic = (0, number_util_1.toNumber)(ratios?.returnOnInvestedCapital) || (0, number_util_1.toNumber)(keyMetrics?.roic);
        const debtToEquity = (0, number_util_1.toNumber)(ratios?.debtEquityRatio) ||
            (0, number_util_1.safeRatio)(latestBalance?.totalDebt || null, latestBalance?.totalEquity || null);
        const netMargin = (0, number_util_1.toNumber)(ratios?.netProfitMargin) ||
            (0, number_util_1.safeRatio)(latestIncome?.netIncome || null, latestIncome?.revenue || null);
        const freeCashFlow = (0, number_util_1.toNumber)(latestCash?.freeCashFlow) || (0, number_util_1.toNumber)(keyMetrics?.freeCashFlow);
        const incomeChronological = [...incomeStatement].sort((a, b) => (a.date > b.date ? 1 : -1));
        const revenues = incomeChronological.map((row) => row.revenue || null);
        const cagrYears = Math.max(1, revenues.length - 1);
        return {
            instrument: {
                normalizedTicker: ticker,
                tvSymbol: symbol.tvSymbol,
                exchange: (profile?.exchangeShortName || symbol.exchange || '').toUpperCase(),
                assetType: symbol.assetType,
                name: profile?.companyName || symbol.name,
            },
            statements: {
                incomeStatement,
                balanceSheet,
                cashFlow,
                earnings,
            },
            metrics: {
                marketCap: (0, number_util_1.toNumber)(profile?.mktCap) || (0, number_util_1.toNumber)(profile?.marketCap),
                enterpriseValue,
                peRatio,
                roe,
                roic,
                debtToEquity,
                netMargin: netMargin !== null ? netMargin * 100 : null,
                freeCashFlow,
                revenueGrowthCagr: (0, number_util_1.cagrFromSeries)(revenues, cagrYears),
            },
            meta: {
                sector: profile?.sector || null,
                currency: profile?.currency || null,
            },
        };
    }
};
exports.AdapterFMPService = AdapterFMPService;
exports.AdapterFMPService = AdapterFMPService = __decorate([
    (0, common_1.Injectable)()
], AdapterFMPService);
//# sourceMappingURL=adapter-fmp.service.js.map