"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdapterFinnhubService = void 0;
const common_1 = require("@nestjs/common");
const number_util_1 = require("../utils/number.util");
const http_util_1 = require("../utils/http.util");
const provider_error_util_1 = require("../utils/provider-error.util");
let AdapterFinnhubService = class AdapterFinnhubService {
    constructor() {
        this.provider = 'finnhub';
        this.apiToken = process.env.FINNHUB_API_KEY || process.env.FINNHUB_TOKEN || '';
        this.baseUrl = process.env.FINNHUB_BASE_URL || 'https://finnhub.io/api/v1';
    }
    getDescriptor() {
        return {
            id: this.provider,
            name: 'Finnhub',
            enabled: !!this.apiToken,
            supportsSearch: true,
            supportsFundamentals: true,
            notes: this.apiToken ? undefined : 'Sin API key configurada.',
        };
    }
    supportsAssetType(assetType) {
        return ['stock', 'etf', 'index', 'cedear'].includes((assetType || '').toLowerCase());
    }
    buildUrl(path, params) {
        const query = new URLSearchParams({ token: this.apiToken });
        if (params) {
            Object.entries(params).forEach(([key, value]) => query.set(key, String(value)));
        }
        return `${this.baseUrl.replace(/\/$/, '')}${path}?${query.toString()}`;
    }
    valueFromConcepts(concepts, candidates) {
        if (!Array.isArray(concepts))
            return null;
        const lowerCandidates = candidates.map((item) => item.toLowerCase());
        const exact = concepts.find((item) => lowerCandidates.includes(String(item?.concept || '').toLowerCase()));
        if (exact)
            return (0, number_util_1.toNumber)(exact.value);
        const partial = concepts.find((item) => {
            const concept = String(item?.concept || '').toLowerCase();
            return lowerCandidates.some((candidate) => concept.includes(candidate));
        });
        return partial ? (0, number_util_1.toNumber)(partial.value) : null;
    }
    async fetchFundamentals(symbol) {
        if (!this.apiToken) {
            throw new provider_error_util_1.ProviderApiError({
                provider: this.provider,
                message: 'FINNHUB_API_KEY no configurada',
                retryable: false,
            });
        }
        const ticker = symbol.normalizedTicker;
        const [profileRaw, metricsRaw, financialsRaw, earningsRaw] = await Promise.all([
            (0, http_util_1.fetchJsonWithRetry)({ provider: this.provider, url: this.buildUrl('/stock/profile2', { symbol: ticker }), retries: 2 }),
            (0, http_util_1.fetchJsonWithRetry)({ provider: this.provider, url: this.buildUrl('/stock/metric', { symbol: ticker, metric: 'all' }), retries: 2 }),
            (0, http_util_1.fetchJsonWithRetry)({ provider: this.provider, url: this.buildUrl('/stock/financials-reported', { symbol: ticker, freq: 'annual' }), retries: 2 }),
            (0, http_util_1.fetchJsonWithRetry)({ provider: this.provider, url: this.buildUrl('/stock/earnings', { symbol: ticker, limit: 8 }), retries: 2 }),
        ]);
        const metric = metricsRaw?.metric || {};
        const reports = Array.isArray(financialsRaw?.data) ? financialsRaw.data : [];
        if (!profileRaw && reports.length === 0 && !metricsRaw) {
            throw new provider_error_util_1.ProviderApiError({
                provider: this.provider,
                message: `Finnhub sin datos para ${ticker}`,
                retryable: false,
            });
        }
        const incomeStatement = reports.map((report) => {
            const ic = report.report?.ic || [];
            const revenue = this.valueFromConcepts(ic, ['Revenue', 'Revenues', 'RevenueFromContractWithCustomerExcludingAssessedTax']);
            const netIncome = this.valueFromConcepts(ic, ['NetIncomeLoss', 'NetIncome']);
            const operatingIncome = this.valueFromConcepts(ic, ['OperatingIncomeLoss', 'OperatingIncome']);
            const grossProfit = this.valueFromConcepts(ic, ['GrossProfit']);
            const ebitda = this.valueFromConcepts(ic, ['OperatingIncomeLoss', 'EarningsBeforeInterestTaxesDepreciationAmortization']);
            return {
                date: `${report.year || ''}-12-31`,
                period: 'FY',
                fiscalYear: report.year || null,
                revenue,
                netIncome,
                operatingIncome,
                grossProfit,
                ebitda,
                eps: (0, number_util_1.toNumber)(metric?.epsAnnual),
            };
        });
        const balanceSheet = reports.map((report) => {
            const bs = report.report?.bs || [];
            return {
                date: `${report.year || ''}-12-31`,
                period: 'FY',
                fiscalYear: report.year || null,
                totalAssets: this.valueFromConcepts(bs, ['Assets']),
                totalLiabilities: this.valueFromConcepts(bs, ['Liabilities']),
                totalEquity: this.valueFromConcepts(bs, ['StockholdersEquity', 'StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest']),
                cashAndEquivalents: this.valueFromConcepts(bs, ['CashAndCashEquivalentsAtCarryingValue', 'CashAndCashEquivalents']),
                totalDebt: this.valueFromConcepts(bs, ['Debt', 'LongTermDebtAndCapitalLeaseObligations', 'LongTermDebtNoncurrent']),
            };
        });
        const cashFlow = reports.map((report) => {
            const cf = report.report?.cf || [];
            const operatingCashFlow = this.valueFromConcepts(cf, ['NetCashProvidedByUsedInOperatingActivities']);
            const capex = this.valueFromConcepts(cf, ['PaymentsToAcquirePropertyPlantAndEquipment', 'CapitalExpenditures']);
            const freeCashFlow = operatingCashFlow !== null && capex !== null
                ? operatingCashFlow - Math.abs(capex)
                : (0, number_util_1.toNumber)(metric?.freeCashFlowTTM);
            return {
                date: `${report.year || ''}-12-31`,
                period: 'FY',
                fiscalYear: report.year || null,
                operatingCashFlow,
                capex,
                freeCashFlow,
            };
        });
        const earnings = (Array.isArray(earningsRaw) ? earningsRaw : []).map((row) => ({
            date: String(row?.period || row?.date || ''),
            actualEps: (0, number_util_1.toNumber)(row?.actual),
            estimatedEps: (0, number_util_1.toNumber)(row?.estimate),
            surprisePct: (0, number_util_1.toNumber)(row?.surprisePercent),
        }));
        const latestIncome = incomeStatement[0] || null;
        const latestBalance = balanceSheet[0] || null;
        const latestCash = cashFlow[0] || null;
        const orderedIncome = [...incomeStatement].sort((a, b) => (a.date > b.date ? 1 : -1));
        const revenues = orderedIncome.map((row) => row.revenue || null);
        const cagrYears = Math.max(1, revenues.length - 1);
        const marketCap = (0, number_util_1.toNumber)(metric?.marketCapitalization) || (0, number_util_1.toNumber)(profileRaw?.marketCapitalization);
        return {
            instrument: {
                normalizedTicker: ticker,
                tvSymbol: symbol.tvSymbol,
                exchange: String(profileRaw?.exchange || symbol.exchange || '').toUpperCase(),
                assetType: symbol.assetType,
                name: profileRaw?.name || symbol.name,
            },
            statements: {
                incomeStatement,
                balanceSheet,
                cashFlow,
                earnings,
            },
            metrics: {
                marketCap: marketCap !== null ? marketCap * 1_000_000 : null,
                enterpriseValue: (0, number_util_1.toNumber)(metric?.enterpriseValue) || (0, number_util_1.toNumber)(metric?.enterpriseValueTTM),
                peRatio: (0, number_util_1.toNumber)(metric?.peTTM) || (0, number_util_1.toNumber)(metric?.peBasicExclExtraTTM),
                roe: (0, number_util_1.toNumber)(metric?.roeTTM),
                roic: (0, number_util_1.toNumber)(metric?.roicTTM) || (0, number_util_1.toNumber)(metric?.roiTTM),
                debtToEquity: (0, number_util_1.toNumber)(metric?.totalDebtToEquityQuarterly) ||
                    (0, number_util_1.safeRatio)(latestBalance?.totalDebt || null, latestBalance?.totalEquity || null),
                netMargin: (0, number_util_1.toNumber)(metric?.netMarginTTM) ||
                    ((0, number_util_1.safeRatio)(latestIncome?.netIncome || null, latestIncome?.revenue || null) ?? null),
                freeCashFlow: (0, number_util_1.toNumber)(metric?.freeCashFlowTTM) || latestCash?.freeCashFlow || null,
                revenueGrowthCagr: (0, number_util_1.cagrFromSeries)(revenues, cagrYears),
            },
            meta: {
                sector: profileRaw?.finnhubIndustry || null,
                currency: profileRaw?.currency || null,
            },
        };
    }
};
exports.AdapterFinnhubService = AdapterFinnhubService;
exports.AdapterFinnhubService = AdapterFinnhubService = __decorate([
    (0, common_1.Injectable)()
], AdapterFinnhubService);
//# sourceMappingURL=adapter-finnhub.service.js.map