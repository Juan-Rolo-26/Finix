"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewsSentimentService = void 0;
const common_1 = require("@nestjs/common");
let NewsSentimentService = class NewsSentimentService {
    constructor() {
        this.positiveKeywords = [
            'gana', 'ganancia', 'sube', 'crece', 'crecimiento', 'récord', 'éxito',
            'mejora', 'positivo', 'alcista', 'aumenta', 'beneficio', 'avance',
            'fortalece', 'recuperación', 'optimista', 'expansión', 'auge',
            'gain', 'gains', 'surge', 'surges', 'rise', 'rises', 'growth', 'record',
            'success', 'improve', 'positive', 'bullish', 'increase', 'profit',
            'advance', 'strengthen', 'recovery', 'optimistic', 'expansion', 'boom',
            'outperform', 'beat', 'exceed', 'rally', 'breakthrough',
        ];
        this.negativeKeywords = [
            'pierde', 'pérdida', 'cae', 'baja', 'crisis', 'problema', 'riesgo',
            'negativo', 'bajista', 'disminuye', 'declive', 'caída', 'recorte',
            'debilita', 'recesión', 'pesimista', 'contracción', 'quiebra',
            'loss', 'losses', 'fall', 'falls', 'drop', 'drops', 'decline', 'crisis',
            'problem', 'risk', 'negative', 'bearish', 'decrease', 'cut', 'cuts',
            'weaken', 'recession', 'pessimistic', 'contraction', 'bankruptcy',
            'underperform', 'miss', 'plunge', 'crash', 'collapse', 'concern',
        ];
        this.intensifiers = [
            'muy', 'extremadamente', 'significativamente', 'dramatically',
            'significantly', 'substantially', 'major', 'massive',
        ];
    }
    analyzeSentiment(text) {
        if (!text) {
            return { sentiment: 'neutral', score: 0 };
        }
        const lowerText = text.toLowerCase();
        let positiveCount = 0;
        let negativeCount = 0;
        let intensifierMultiplier = 1;
        for (const intensifier of this.intensifiers) {
            if (lowerText.includes(intensifier)) {
                intensifierMultiplier = 1.5;
                break;
            }
        }
        for (const keyword of this.positiveKeywords) {
            const regex = new RegExp(`\\b${keyword}\\w*\\b`, 'gi');
            const matches = lowerText.match(regex);
            if (matches) {
                positiveCount += matches.length;
            }
        }
        for (const negativeKeywords of this.negativeKeywords) {
            const regex = new RegExp(`\\b${negativeKeywords}\\w*\\b`, 'gi');
            const matches = lowerText.match(regex);
            if (matches) {
                negativeCount += matches.length;
            }
        }
        positiveCount *= intensifierMultiplier;
        negativeCount *= intensifierMultiplier;
        const total = positiveCount + negativeCount;
        let score = 0;
        if (total > 0) {
            score = (positiveCount - negativeCount) / total;
        }
        let sentiment = 'neutral';
        if (score > 0.2) {
            sentiment = 'positive';
        }
        else if (score < -0.2) {
            sentiment = 'negative';
        }
        return {
            sentiment,
            score: Number(score.toFixed(3)),
        };
    }
    determineImpactLevel(text) {
        const lowerText = text.toLowerCase();
        const highImpactKeywords = [
            'record', 'récord', 'breakthrough', 'crisis', 'crash',
            'bankruptcy', 'quiebra', 'merger', 'fusión', 'acquisition',
            'adquisición', 'ipo', 'salida a bolsa', 'scandal', 'escándalo',
            'investigation', 'investigación', 'lawsuit', 'demanda',
        ];
        const mediumImpactKeywords = [
            'earnings', 'ganancias', 'revenue', 'ingresos', 'guidance',
            'proyección', 'forecast', 'pronóstico', 'upgrade', 'downgrade',
            'analyst', 'analista', 'rating', 'calificación',
        ];
        for (const keyword of highImpactKeywords) {
            if (lowerText.includes(keyword)) {
                return 'high';
            }
        }
        for (const keyword of mediumImpactKeywords) {
            if (lowerText.includes(keyword)) {
                return 'medium';
            }
        }
        return 'low';
    }
    extractTickers(text) {
        if (!text)
            return [];
        const tickers = new Set();
        const dollarPattern = /\$([A-Z]{1,5})\b/g;
        let match;
        while ((match = dollarPattern.exec(text)) !== null) {
            tickers.add(match[1]);
        }
        const companyMap = {
            'apple': 'AAPL',
            'tesla': 'TSLA',
            'microsoft': 'MSFT',
            'amazon': 'AMZN',
            'google': 'GOOGL',
            'alphabet': 'GOOGL',
            'meta': 'META',
            'facebook': 'META',
            'netflix': 'NFLX',
            'nvidia': 'NVDA',
            'bitcoin': 'BTC',
            'ethereum': 'ETH',
            'ypf': 'YPF',
            'galicia': 'GGAL',
            'mercado libre': 'MELI',
        };
        const lowerText = text.toLowerCase();
        for (const [company, ticker] of Object.entries(companyMap)) {
            if (lowerText.includes(company)) {
                tickers.add(ticker);
            }
        }
        return Array.from(tickers);
    }
    analyzeArticle(title, content, summary) {
        const fullText = `${title} ${summary} ${content}`;
        const { sentiment, score } = this.analyzeSentiment(fullText);
        const impactLevel = this.determineImpactLevel(fullText);
        const tickers = this.extractTickers(fullText);
        return {
            sentiment,
            sentimentScore: score,
            impactLevel,
            tickers,
        };
    }
};
exports.NewsSentimentService = NewsSentimentService;
exports.NewsSentimentService = NewsSentimentService = __decorate([
    (0, common_1.Injectable)()
], NewsSentimentService);
//# sourceMappingURL=news-sentiment.service.js.map