import {
    calculateNextNewsRun,
    normalizeNewsTitle,
    normalizeNewsUrl,
    titleSimilarity,
} from './news-sync.service';

describe('news automation helpers', () => {
    it('normalizes canonical URLs and removes tracking parameters', () => {
        expect(normalizeNewsUrl('HTTPS://Example.com/article/?utm_source=mail#chart')).toBe('https://example.com/article');
    });

    it('normalizes titles with accents and punctuation', () => {
        expect(normalizeNewsTitle('Nvidia: sube después de resultados!')).toBe('nvidia sube despues de resultados');
    });

    it('detects equivalent headlines from different sources', () => {
        expect(titleSimilarity('Nvidia shares rise after earnings', 'Nvidia climbs following earnings results')).toBeGreaterThan(0.35);
    });

    it('calculates the next daily run in Argentina time', () => {
        const from = new Date('2026-09-24T10:00:00.000Z');
        const next = calculateNextNewsRun('DAILY', 8, 0, 0, from);
        expect(next?.toISOString()).toBe('2026-09-24T11:00:00.000Z');
    });

    it('calculates the next Sunday weekly run independently', () => {
        const from = new Date('2026-09-24T10:00:00.000Z');
        const next = calculateNextNewsRun('WEEKLY', 9, 0, 0, from);
        expect(next?.toISOString()).toBe('2026-09-27T12:00:00.000Z');
    });
});
