import { Injectable } from '@nestjs/common';
import { TV_SYMBOL_SLUGS } from '../../market-ranking/services/tv-slugs.const';

@Injectable()
export class EarningsImpactScoringService {
    // High-impact Mega Caps & highly followed retail/institutional stocks
    private readonly MEGA_CAPS = new Set([
        'NVDA', 'AAPL', 'MSFT', 'AMZN', 'GOOGL', 'GOOG', 'META', 'TSLA', 'AVGO', 'BRK.B', 'BRK-B'
    ]);

    private readonly HIGH_INTEREST_STOCKS = new Set([
        'JPM', 'AMD', 'NFLX', 'COST', 'WMT', 'LLY', 'V', 'MA', 'ORCL', 'CRM', 'INTC', 'QCOM',
        'UNH', 'HD', 'BAC', 'DIS', 'PG', 'XOM', 'CVX', 'KO', 'PEP', 'UBER', 'ABNB', 'PLTR', 'BABA'
    ]);

    // High impact sectors
    private readonly HIGH_IMPACT_SECTORS = new Set([
        'Semiconductors', 'Information Technology', 'Mega Banks', 'E-Commerce', 'Artificial Intelligence'
    ]);

    /**
     * Calcula el earningsImpactScore (0 a 100) para un reporte corporativo de resultados.
     */
    calculateEarningsImpactScore(params: {
        ticker: string;
        marketCap?: number;
        volume?: number;
        sector?: string;
        isSP500?: boolean;
        isNasdaq100?: boolean;
    }): number {
        const cleanTicker = params.ticker.toUpperCase().replace(/\./g, '-');
        let score = 0;

        // 1. Mega Caps / Mag 7 automatic top weighting
        if (this.MEGA_CAPS.has(cleanTicker)) {
            score += 45;
        } else if (this.HIGH_INTEREST_STOCKS.has(cleanTicker)) {
            score += 35;
        } else if (params.isSP500) {
            score += 25;
        } else {
            score += 10;
        }

        // 2. Market Cap scoring (up to 35 pts)
        if (params.marketCap && params.marketCap > 0) {
            const capInBillions = params.marketCap > 1e9 ? params.marketCap / 1e9 : params.marketCap;
            if (capInBillions >= 1000) {
                // >= $1 Trillion (NVDA, AAPL, MSFT, etc.)
                score += 35;
            } else if (capInBillions >= 300) {
                // >= $300 Billion
                score += 28;
            } else if (capInBillions >= 100) {
                // Large cap >= $100 Billion
                score += 22;
            } else if (capInBillions >= 20) {
                // Mid-to-large cap >= $20 Billion
                score += 15;
            } else if (capInBillions >= 5) {
                score += 8;
            } else {
                score += 3;
            }
        } else {
            // Fallback market cap proxy if not provided
            if (this.MEGA_CAPS.has(cleanTicker)) score += 35;
            else if (this.HIGH_INTEREST_STOCKS.has(cleanTicker)) score += 25;
            else score += 10;
        }

        // 3. Nasdaq 100 / S&P 500 inclusion
        if (params.isNasdaq100 || ['NVDA', 'AAPL', 'MSFT', 'AMZN', 'GOOGL', 'META', 'TSLA', 'AMD', 'AVGO'].includes(cleanTicker)) {
            score += 12;
        }

        // 4. Sector relevance (AI / Semiconductors / Big Tech / Finance)
        if (params.sector && this.HIGH_IMPACT_SECTORS.has(params.sector)) {
            score += 8;
        } else if (['NVDA', 'AMD', 'TSM', 'AVGO', 'MSFT', 'GOOGL', 'META'].includes(cleanTicker)) {
            score += 8;
        }

        // Normalize between 0 and 100
        return Math.min(100, Math.max(0, Math.round(score)));
    }

    /**
     * Obtiene la URL del logo de TradingView usando la const compartida de Finix.
     */
    getTradingViewLogoUrl(ticker: string): string {
        const cleanTicker = ticker.toUpperCase().replace(/\./g, '-');
        const slug = TV_SYMBOL_SLUGS[cleanTicker] || cleanTicker.toLowerCase();
        return `https://s3-symbol-logo.tradingview.com/${slug}--big.svg`;
    }

    /**
     * Evalúa si califica para el threshold mínimo para candidatos en Inicio.
     */
    isEligibleForHomePreview(score: number): boolean {
        return score >= 65;
    }
}
