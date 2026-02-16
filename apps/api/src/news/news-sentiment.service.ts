import { Injectable } from '@nestjs/common';

/**
 * Service for sentiment analysis of news articles
 * Uses lexicon-based approach for financial news
 */
@Injectable()
export class NewsSentimentService {
    // Positive financial keywords (Spanish and English)
    private positiveKeywords = [
        // Spanish
        'gana', 'ganancia', 'sube', 'crece', 'crecimiento', 'récord', 'éxito',
        'mejora', 'positivo', 'alcista', 'aumenta', 'beneficio', 'avance',
        'fortalece', 'recuperación', 'optimista', 'expansión', 'auge',

        // English
        'gain', 'gains', 'surge', 'surges', 'rise', 'rises', 'growth', 'record',
        'success', 'improve', 'positive', 'bullish', 'increase', 'profit',
        'advance', 'strengthen', 'recovery', 'optimistic', 'expansion', 'boom',
        'outperform', 'beat', 'exceed', 'rally', 'breakthrough',
    ];

    // Negative financial keywords (Spanish and English)
    private negativeKeywords = [
        // Spanish
        'pierde', 'pérdida', 'cae', 'baja', 'crisis', 'problema', 'riesgo',
        'negativo', 'bajista', 'disminuye', 'declive', 'caída', 'recorte',
        'debilita', 'recesión', 'pesimista', 'contracción', 'quiebra',

        // English
        'loss', 'losses', 'fall', 'falls', 'drop', 'drops', 'decline', 'crisis',
        'problem', 'risk', 'negative', 'bearish', 'decrease', 'cut', 'cuts',
        'weaken', 'recession', 'pessimistic', 'contraction', 'bankruptcy',
        'underperform', 'miss', 'plunge', 'crash', 'collapse', 'concern',
    ];

    // Intensity modifiers
    private intensifiers = [
        'muy', 'extremadamente', 'significativamente', 'dramatically',
        'significantly', 'substantially', 'major', 'massive',
    ];

    /**
     * Analyze sentiment of text
     * Returns: { sentiment: 'positive' | 'neutral' | 'negative', score: number }
     */
    analyzeSentiment(text: string): { sentiment: string; score: number } {
        if (!text) {
            return { sentiment: 'neutral', score: 0 };
        }

        const lowerText = text.toLowerCase();

        // Count positive and negative keywords
        let positiveCount = 0;
        let negativeCount = 0;
        let intensifierMultiplier = 1;

        // Check for intensifiers
        for (const intensifier of this.intensifiers) {
            if (lowerText.includes(intensifier)) {
                intensifierMultiplier = 1.5;
                break;
            }
        }

        // Count positive keywords
        for (const keyword of this.positiveKeywords) {
            const regex = new RegExp(`\\b${keyword}\\w*\\b`, 'gi');
            const matches = lowerText.match(regex);
            if (matches) {
                positiveCount += matches.length;
            }
        }

        // Count negative keywords
        for (const negativeKeywords of this.negativeKeywords) {
            const regex = new RegExp(`\\b${negativeKeywords}\\w*\\b`, 'gi');
            const matches = lowerText.match(regex);
            if (matches) {
                negativeCount += matches.length;
            }
        }

        // Apply intensifier
        positiveCount *= intensifierMultiplier;
        negativeCount *= intensifierMultiplier;

        // Calculate score (-1 to 1)
        const total = positiveCount + negativeCount;
        let score = 0;

        if (total > 0) {
            score = (positiveCount - negativeCount) / total;
        }

        // Determine sentiment category
        let sentiment = 'neutral';
        if (score > 0.2) {
            sentiment = 'positive';
        } else if (score < -0.2) {
            sentiment = 'negative';
        }

        return {
            sentiment,
            score: Number(score.toFixed(3)),
        };
    }

    /**
     * Determine impact level based on content
     */
    determineImpactLevel(text: string): string {
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

        // Check for high impact
        for (const keyword of highImpactKeywords) {
            if (lowerText.includes(keyword)) {
                return 'high';
            }
        }

        // Check for medium impact
        for (const keyword of mediumImpactKeywords) {
            if (lowerText.includes(keyword)) {
                return 'medium';
            }
        }

        return 'low';
    }

    /**
     * Extract mentioned tickers from text
     * Looks for common patterns like $AAPL or AAPL
     */
    extractTickers(text: string): string[] {
        if (!text) return [];

        const tickers: Set<string> = new Set();

        // Pattern 1: $TICKER (e.g., $AAPL)
        const dollarPattern = /\$([A-Z]{1,5})\b/g;
        let match;
        while ((match = dollarPattern.exec(text)) !== null) {
            tickers.add(match[1]);
        }

        // Pattern 2: Common company names (basic mapping)
        const companyMap: Record<string, string> = {
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

    /**
     * Analyze full article and return comprehensive analysis
     */
    analyzeArticle(title: string, content: string, summary: string): {
        sentiment: string;
        sentimentScore: number;
        impactLevel: string;
        tickers: string[];
    } {
        // Combine all text for analysis
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
}
