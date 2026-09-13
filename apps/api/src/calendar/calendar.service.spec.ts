import { MarketImpactScoringService } from './services/market-impact-scoring.service';
import { EarningsImpactScoringService } from './services/earnings-impact-scoring.service';

describe('Calendar Scoring & Business Rules Unit Tests', () => {
    let marketScoring: MarketImpactScoringService;
    let earningsScoring: EarningsImpactScoringService;

    beforeEach(() => {
        marketScoring = new MarketImpactScoringService();
        earningsScoring = new EarningsImpactScoringService();
    });

    describe('MarketImpactScoringService (US & Argentina)', () => {
        it('should assign score 100 to FOMC rate decisions', () => {
            const res = marketScoring.evaluateEvent('FOMC Interest Rate Decision', 'US');
            expect(res.score).toBe(100);
            expect(res.importance).toBe('HIGH');
            expect(res.category).toBe('CENTRAL_BANK');
            expect(res.affectedAssets).toContain('SPY');
            expect(res.affectedAssets).toContain('BTC');
        });

        it('should assign score 95 to US CPI inflation', () => {
            const res = marketScoring.evaluateEvent('Consumer Price Index (CPI) m/m', 'US');
            expect(res.score).toBe(95);
            expect(res.importance).toBe('HIGH');
            expect(res.category).toBe('INFLATION');
        });

        it('should assign score 98 to Argentina IPC inflation', () => {
            const res = marketScoring.evaluateEvent('IPC — Índice de Precios al Consumidor (INDEC)', 'AR');
            expect(res.score).toBe(98);
            expect(res.importance).toBe('HIGH');
            expect(res.category).toBe('INFLATION');
            expect(res.affectedAssets).toContain('AL30');
            expect(res.affectedAssets).toContain('MERVAL');
        });

        it('should assign score 95 to Argentina BCRA interest rate decision', () => {
            const res = marketScoring.evaluateEvent('Decisión de Tasa de Política Monetaria del BCRA', 'AR');
            expect(res.score).toBe(95);
            expect(res.importance).toBe('HIGH');
            expect(res.category).toBe('CENTRAL_BANK');
        });

        it('should detect duplicate events regardless of slight wording differences', () => {
            const eventA = { country: 'US', date: '2026-09-16', title: 'US CPI Consumer Price Index' };
            const eventB = { country: 'US', date: '2026-09-16', title: 'Consumer Price Index (CPI) US' };
            expect(marketScoring.isDuplicateEvent(eventA, eventB)).toBe(true);
        });
    });

    describe('EarningsImpactScoringService', () => {
        it('should score Mega Cap companies >= 90', () => {
            const nvdaScore = earningsScoring.calculateEarningsImpactScore({
                ticker: 'NVDA',
                marketCap: 2800000000000,
                isSP500: true,
                isNasdaq100: true,
            });
            expect(nvdaScore).toBeGreaterThanOrEqual(90);

            const aaplScore = earningsScoring.calculateEarningsImpactScore({
                ticker: 'AAPL',
                marketCap: 3400000000000,
                isSP500: true,
            });
            expect(aaplScore).toBeGreaterThanOrEqual(90);
        });

        it('should score small caps below home threshold (< 65)', () => {
            const smallCapScore = earningsScoring.calculateEarningsImpactScore({
                ticker: 'XYZ',
                marketCap: 50000000, // 50 million
                isSP500: false,
                isNasdaq100: false,
            });
            expect(smallCapScore).toBeLessThan(65);
            expect(earningsScoring.isEligibleForHomePreview(smallCapScore)).toBe(false);
        });

        it('should return canonical TradingView CDN SVG logos', () => {
            const logo = earningsScoring.getTradingViewLogoUrl('NVDA');
            expect(logo).toContain('tradingview.com');
            expect(logo).toContain('nvidia--big.svg');
        });
    });
});
