"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricsEngineService = void 0;
const common_1 = require("@nestjs/common");
const number_util_1 = require("../utils/number.util");
let MetricsEngineService = class MetricsEngineService {
    enrich(response) {
        const dcf = this.calculateSimplifiedDcf(response);
        const score = this.calculateInternalScore(response);
        response.derived.dcfSimple = dcf;
        response.derived.finixFundamentalScore = score;
        if (!response.derived.sectorComparison) {
            response.derived.sectorComparison = {
                sector: null,
                percentile: score !== null ? (0, number_util_1.clamp)(Math.round(score), 1, 99) : null,
                note: score !== null ? 'Percentil estimado interno basado en métricas disponibles.' : null,
            };
        }
        return response;
    }
    calculateSimplifiedDcf(response) {
        const fcf = response.metrics.freeCashFlow;
        const growthPct = response.metrics.revenueGrowthCagr;
        if (fcf === null || fcf <= 0)
            return null;
        const growth = growthPct !== null ? (0, number_util_1.clamp)(growthPct / 100, -0.1, 0.2) : 0.04;
        const discountRate = 0.1;
        const terminalGrowth = 0.025;
        let presentValue = 0;
        let currentFcf = fcf;
        for (let year = 1; year <= 5; year += 1) {
            currentFcf *= 1 + growth;
            presentValue += currentFcf / Math.pow(1 + discountRate, year);
        }
        const terminalValue = (currentFcf * (1 + terminalGrowth)) / (discountRate - terminalGrowth);
        const discountedTerminal = terminalValue / Math.pow(1 + discountRate, 5);
        const total = presentValue + discountedTerminal;
        if (!Number.isFinite(total) || total <= 0)
            return null;
        return Math.round(total);
    }
    calculateInternalScore(response) {
        const { peRatio, roe, roic, debtToEquity, netMargin, revenueGrowthCagr } = response.metrics;
        const components = [];
        if (peRatio !== null) {
            const peScore = peRatio < 15 ? 100 : peRatio < 25 ? 80 : peRatio < 40 ? 60 : peRatio < 60 ? 40 : 20;
            components.push(peScore * 0.2);
        }
        if (roe !== null) {
            const roeScore = roe > 20 ? 100 : roe > 15 ? 90 : roe > 10 ? 70 : roe > 5 ? 50 : 25;
            components.push(roeScore * 0.2);
        }
        if (roic !== null) {
            const roicScore = roic > 15 ? 100 : roic > 10 ? 85 : roic > 5 ? 65 : roic > 0 ? 45 : 20;
            components.push(roicScore * 0.2);
        }
        if (debtToEquity !== null) {
            const leverageScore = debtToEquity < 0.5 ? 100 : debtToEquity < 1 ? 80 : debtToEquity < 2 ? 60 : 30;
            components.push(leverageScore * 0.15);
        }
        if (netMargin !== null) {
            const marginScore = netMargin > 20 ? 100 : netMargin > 12 ? 80 : netMargin > 5 ? 60 : netMargin > 0 ? 40 : 15;
            components.push(marginScore * 0.1);
        }
        if (revenueGrowthCagr !== null) {
            const growthScore = revenueGrowthCagr > 15 ? 100 : revenueGrowthCagr > 8 ? 80 : revenueGrowthCagr > 3 ? 60 : revenueGrowthCagr > 0 ? 45 : 20;
            components.push(growthScore * 0.15);
        }
        if (components.length === 0)
            return null;
        const totalWeight = (peRatio !== null ? 0.2 : 0) +
            (roe !== null ? 0.2 : 0) +
            (roic !== null ? 0.2 : 0) +
            (debtToEquity !== null ? 0.15 : 0) +
            (netMargin !== null ? 0.1 : 0) +
            (revenueGrowthCagr !== null ? 0.15 : 0);
        if (totalWeight <= 0)
            return null;
        const weightedValue = components.reduce((sum, value) => sum + value, 0);
        return Math.round(weightedValue / totalWeight);
    }
};
exports.MetricsEngineService = MetricsEngineService;
exports.MetricsEngineService = MetricsEngineService = __decorate([
    (0, common_1.Injectable)()
], MetricsEngineService);
//# sourceMappingURL=metrics-engine.service.js.map