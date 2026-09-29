import { resolveNewsImage } from './news-image.util';

describe('news image resolver', () => {
    it('keeps a valid image supplied by the news source', () => {
        expect(resolveNewsImage('Bitcoin sube', 'cripto', 'https://cdn.example.com/bitcoin.jpg'))
            .toBe('https://cdn.example.com/bitcoin.jpg');
    });

    it('selects a topic-specific fallback when the source has no image', () => {
        expect(resolveNewsImage('Bitcoin alcanza un nuevo máximo', 'mercados'))
            .toContain('1518546305927-5a555bb7020d');
    });

    it('always returns an image for an uncategorized article', () => {
        expect(resolveNewsImage('Una noticia financiera')).toMatch(/^https:\/\//);
    });
});
