"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AnalysisService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalysisService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
let AnalysisService = AnalysisService_1 = class AnalysisService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(AnalysisService_1.name);
    }
    async getAnalysis(ticker) {
        const cached = await this.prisma.fundamentalData.findUnique({
            where: { ticker },
        });
        if (cached && Date.now() - cached.lastUpdated.getTime() < 24 * 60 * 60 * 1000) {
            return this.parseFundamentalData(cached);
        }
        return this.refreshAnalysis(ticker);
    }
    async refreshAnalysis(ticker) {
        this.logger.log(`Refreshing analysis for ${ticker}`);
        const rawData = await this.fetchFundamentalData(ticker);
        const { score, details } = this.calculateFinixScore(rawData);
        const aiAnalysis = this.generateAIInterpretation(rawData, score, details);
        const saved = await this.prisma.fundamentalData.upsert({
            where: { ticker },
            update: {
                ...rawData,
                finixScore: score,
                scoreDetails: JSON.stringify(details),
                aiSummary: aiAnalysis.summary,
                strengths: JSON.stringify(aiAnalysis.strengths),
                risks: JSON.stringify(aiAnalysis.risks),
                sectorComparison: aiAnalysis.sectorComparison,
                conclusion: aiAnalysis.conclusion,
                lastUpdated: new Date(),
            },
            create: {
                ticker,
                ...rawData,
                finixScore: score,
                scoreDetails: JSON.stringify(details),
                aiSummary: aiAnalysis.summary,
                strengths: JSON.stringify(aiAnalysis.strengths),
                risks: JSON.stringify(aiAnalysis.risks),
                sectorComparison: aiAnalysis.sectorComparison,
                conclusion: aiAnalysis.conclusion,
            },
        });
        return this.parseFundamentalData(saved);
    }
    parseFundamentalData(data) {
        return {
            ...data,
            scoreDetails: data.scoreDetails ? JSON.parse(data.scoreDetails) : {},
            strengths: data.strengths ? JSON.parse(data.strengths) : [],
            risks: data.risks ? JSON.parse(data.risks) : [],
        };
    }
    async fetchFundamentalData(ticker) {
        await new Promise(r => setTimeout(r, 500));
        const hash = ticker.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const rand = (seed) => {
            const x = Math.sin(hash + seed) * 10000;
            return x - Math.floor(x);
        };
        const isTech = ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'AMZN', 'META', 'TSLA', 'AMD'].includes(ticker);
        const isCrypto = ['BTC', 'ETH', 'SOL', 'ADA'].includes(ticker) || ticker.includes('USD');
        if (isCrypto) {
            return {
                pe: null,
                forwardPe: null,
                ps: 5 + rand(1) * 10,
                pb: null,
                evEbitda: null,
                dividendYield: 0,
                roe: null,
                roa: null,
                netMargin: null,
                operatingMargin: null,
                grossMargin: null,
                revenueGrowth3Y: null,
                revenueGrowth5Y: null,
                epsGrowth: null,
                debtEquity: null,
                currentRatio: null,
                quickRatio: null,
                freeCashFlow: null,
                beta: 1.5 + rand(2),
                volatility: 0.6 + rand(3) * 0.4,
                maxDrawdown: -50 - rand(4) * 30,
            };
        }
        return {
            pe: 10 + rand(1) * (isTech ? 50 : 20),
            forwardPe: 8 + rand(2) * (isTech ? 40 : 15),
            ps: 1 + rand(3) * 10,
            pb: 1 + rand(4) * 15,
            evEbitda: 5 + rand(5) * 25,
            dividendYield: rand(6) * (isTech ? 1 : 5),
            roe: 5 + rand(7) * 40,
            roa: 2 + rand(8) * 20,
            netMargin: 5 + rand(9) * 30,
            operatingMargin: 8 + rand(10) * 35,
            grossMargin: 20 + rand(11) * 60,
            revenueGrowth3Y: -5 + rand(12) * 30,
            revenueGrowth5Y: -2 + rand(13) * 25,
            epsGrowth: -5 + rand(14) * 40,
            debtEquity: rand(15) * 2,
            currentRatio: 0.5 + rand(16) * 3,
            quickRatio: 0.3 + rand(17) * 2.5,
            freeCashFlow: rand(18) > 0.3 ? rand(19) * 1000000000 : -rand(19) * 100000000,
            beta: 0.5 + rand(20) * 1.5,
            volatility: 0.1 + rand(21) * 0.4,
            maxDrawdown: -10 - rand(22) * 40,
        };
    }
    calculateFinixScore(data) {
        if (data.pe === null) {
            return { score: 50, details: { note: 'Not enough data for full score' } };
        }
        let score = 0;
        const details = {};
        let valScore = 0;
        if (data.pe < 15)
            valScore = 100;
        else if (data.pe < 25)
            valScore = 80;
        else if (data.pe < 40)
            valScore = 50;
        else if (data.pe < 60)
            valScore = 30;
        else
            valScore = 10;
        details.valuation = valScore * 0.2;
        score += details.valuation;
        let profScore = 0;
        if (data.roe > 20)
            profScore = 100;
        else if (data.roe > 15)
            profScore = 90;
        else if (data.roe > 10)
            profScore = 70;
        else if (data.roe > 5)
            profScore = 50;
        else
            profScore = 20;
        details.profitability = profScore * 0.25;
        score += details.profitability;
        let growthScore = 0;
        if (data.revenueGrowth3Y > 20)
            growthScore = 100;
        else if (data.revenueGrowth3Y > 10)
            growthScore = 80;
        else if (data.revenueGrowth3Y > 5)
            growthScore = 60;
        else if (data.revenueGrowth3Y > 0)
            growthScore = 40;
        else
            growthScore = 0;
        details.growth = growthScore * 0.25;
        score += details.growth;
        let solScore = 0;
        let debtScore = 0;
        if (data.debtEquity < 0.5)
            debtScore = 100;
        else if (data.debtEquity < 1.0)
            debtScore = 70;
        else if (data.debtEquity < 2.0)
            debtScore = 40;
        else
            debtScore = 10;
        let liqScore = 0;
        if (data.currentRatio > 2.0)
            liqScore = 100;
        else if (data.currentRatio > 1.5)
            liqScore = 80;
        else if (data.currentRatio > 1.0)
            liqScore = 60;
        else
            liqScore = 20;
        solScore = (debtScore + liqScore) / 2;
        details.solidity = solScore * 0.20;
        score += details.solidity;
        let riskScore = 0;
        if (data.beta < 0.8)
            riskScore = 100;
        else if (data.beta < 1.1)
            riskScore = 80;
        else if (data.beta < 1.5)
            riskScore = 50;
        else
            riskScore = 20;
        details.risk = riskScore * 0.10;
        score += details.risk;
        return { score: Math.round(score), details };
    }
    generateAIInterpretation(data, score, details) {
        const strengths = [];
        const risks = [];
        let summary = '';
        let sectorComparison = '';
        let conclusion = '';
        if (data.roe > 15)
            strengths.push('High Return on Equity (ROE) indicates efficient capital usage.');
        if (data.netMargin > 15)
            strengths.push('Strong Net Profit Margins suggest pricing power.');
        if (data.revenueGrowth3Y > 10)
            strengths.push('Consistent revenue growth over the last 3 years.');
        if (data.debtEquity < 0.5)
            strengths.push('Very healthy balance sheet with low leverage.');
        if (data.pe < 15 && data.revenueGrowth3Y > 5)
            strengths.push('Attractive valuation relative to growth.');
        if (data.pe > 50)
            risks.push('Trading at a premium valuation multiples.');
        if (data.debtEquity > 1.5)
            risks.push('High debt levels compared to equity.');
        if (data.beta > 1.5)
            risks.push('Stock is significantly more volatile than the market.');
        if (data.revenueGrowth3Y < 0)
            risks.push('Declining revenue trend in recent years.');
        if (score >= 80)
            summary = 'This asset demonstrates **Exceptional** fundamentals, driven by strong profitability and solid growth.';
        else if (score >= 60)
            summary = 'This asset shows **Solid** fundamentals, balancing reasonable valuation with steady performance.';
        else if (score >= 40)
            summary = 'The asset has a **Neutral** outlook, with some strengths offset by visible risks or high valuation.';
        else
            summary = 'Current fundamentals are **Weak**, indicating significant challenges in profitability or financial health.';
        conclusion = `Based on the Finix Score of ${score}, the asset is positioned as ${score >= 60 ? 'fundamentally strong' : (score >= 40 ? 'average' : 'risky')}. Investor attention should focus on ${risks.length > 0 ? risks[0].toLowerCase() : 'monitoring growth metrics'}.`;
        return {
            summary,
            strengths,
            risks,
            sectorComparison: 'Outperforming 65% of peers in the sector.',
            conclusion
        };
    }
};
exports.AnalysisService = AnalysisService;
exports.AnalysisService = AnalysisService = AnalysisService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AnalysisService);
//# sourceMappingURL=analysis.service.js.map