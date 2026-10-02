import { Injectable } from '@nestjs/common';
import * as Parser from 'rss-parser';
import * as cheerio from 'cheerio';
import { extractHtmlNewsImage, extractRssNewsImage, isNewsArticleUrl, isPublisherArticleUrl, normalizeSourceImage } from './news-source-image.util';
import { isIllustrativeNewsImage, resolveNewsImage } from './news-image.util';

export interface RawNewsItem {
    title: string;
    summary: string;
    content: string;
    url: string;
    imageUrl?: string;
    source: string;
    sourceUrl?: string;
    author?: string;
    publishedAt: Date;
    language?: string;
}

/**
 * Service for fetching news from multiple sources
 * Supports: GNews API (free tier) and RSS feeds with source images
 */
@Injectable()
export class NewsFetcherService {
    // Free API keys (you should get your own)
    private readonly GNEWS_API_KEY = 'YOUR_GNEWS_API_KEY_HERE'; // Get free at https://gnews.io

    // RSS Feeds (free, no API key needed)
    private readonly RSS_FEEDS = [
        // ── Cripto ──────────────────────────────────────────────
        { url: 'https://cointelegraph.com/rss', name: 'CoinTelegraph', country: 'US' },
        { url: 'https://coindesk.com/arc/outboundfeeds/rss/', name: 'CoinDesk', country: 'US' },
        { url: 'https://decrypt.co/feed', name: 'Decrypt', country: 'US' },
        { url: 'https://cryptonews.com/news/feed/', name: 'CryptoNews', country: 'US' },

        // ── Acciones / Mercados ──────────────────────────────────
        { url: 'https://finance.yahoo.com/news/rssindex', name: 'Yahoo Finance', country: 'US' },
        { url: 'https://www.nasdaq.com/feed/rssoutbound?category=Stocks', name: 'NASDAQ', country: 'US' },
        { url: 'https://feeds.marketwatch.com/marketwatch/topstories', name: 'MarketWatch', country: 'US' },
        { url: 'https://www.investing.com/rss/news.rss', name: 'Investing.com', country: 'US' },

        // ── Economía / Global ────────────────────────────────────
        { url: 'https://feeds.reuters.com/reuters/businessNews', name: 'Reuters Business', country: 'US' },
        { url: 'https://feeds.bbci.co.uk/news/business/rss.xml', name: 'BBC Business', country: 'UK' },
        { url: 'https://rss.nytimes.com/services/xml/rss/nyt/Economy.xml', name: 'NYT Economy', country: 'US' },
        { url: 'https://www.ft.com/?format=rss', name: 'Financial Times', country: 'UK' },
        { url: 'https://feeds.a.dj.com/rss/RSSWorldNews.xml', name: 'Wall Street Journal', country: 'US' },

        // ── Argentina ────────────────────────────────────────────
        { url: 'https://www.ambito.com/rss/economia.xml', name: 'Ámbito Financiero', country: 'AR' },
        { url: 'https://www.cronista.com/rss/economia/', name: 'El Cronista', country: 'AR' },
        { url: 'https://www.infobae.com/feeds/rss/', name: 'Infobae', country: 'AR' },
        { url: 'https://feeds.lanacion.com.ar/lanacion/economia', name: 'La Nación', country: 'AR' },
        { url: 'https://www.iprofesional.com/feed', name: 'iProfesional', country: 'AR' },
        { url: 'https://www.ambito.com/rss/finanzas.xml', name: 'Ámbito Finanzas', country: 'AR' },
    ];

    private rssParser = new Parser({
        customFields: {
            item: [
                ['media:content', 'mediaContent', { keepArray: true }],
                ['media:thumbnail', 'mediaThumbnail', { keepArray: true }],
                ['media:group', 'mediaGroup'],
                ['content:encoded', 'contentEncoded'],
                ['description', 'description'],
            ],
        }
    });

    /**
     * Fetch news from all sources
     */
    async fetchAllNews(): Promise<RawNewsItem[]> {
        const allNews: RawNewsItem[] = [];

        try {
            // Fetch from RSS feeds (free, reliable)
            const rssNews = await this.fetchFromRSSFeeds();
            allNews.push(...rssNews);
        } catch (error) {
            console.error('[NewsFetcher] RSS fetch failed:', error.message);
        }

        try {
            // Fetch from GNews (if API key configured)
            if (this.GNEWS_API_KEY && this.GNEWS_API_KEY !== 'YOUR_GNEWS_API_KEY_HERE') {
                const gNewsItems = await this.fetchFromGNews();
                allNews.push(...gNewsItems);
            }
        } catch (error) {
            console.error('[NewsFetcher] GNews fetch failed:', error.message);
        }

        // Keep the published news when sources fail; do not manufacture new stories.
        if (allNews.length === 0) {
            console.log('[NewsFetcher] No se encontraron noticias con foto');
            return [];
        }

        console.log(`[NewsFetcher] Total news fetched: ${allNews.length}`);
        return allNews;
    }

    private readonly imageCache = new Map<string, { image?: string; expiresAt: number }>();

    private async fetchArticleImage(url: string, publisherUrls: string[]): Promise<string | undefined> {
        if (!isPublisherArticleUrl(url, publisherUrls)) return undefined;
        const cached = this.imageCache.get(url);
        if (cached && cached.expiresAt > Date.now()) return cached.image;
        let image: string | undefined;
        try {
            const signal = AbortSignal.timeout(4_000);
            let target = url;
            for (let redirects = 0; redirects <= 3; redirects++) {
                if (!isPublisherArticleUrl(target, publisherUrls)) break;
                const response = await fetch(target, {
                    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FinixNewsBot/1.0; +https://finixarg.com)', Accept: 'text/html' },
                    redirect: 'manual',
                    signal,
                });
                if ([301, 302, 303, 307, 308].includes(response.status)) {
                    const location = response.headers.get('location');
                    await response.body?.cancel();
                    if (!location) break;
                    target = new URL(location, target).toString();
                    continue;
                }
                if (!response.ok || !response.headers.get('content-type')?.includes('text/html')) {
                    await response.body?.cancel();
                    break;
                }
                // Bound page downloads: metadata normally lives at the start of the HTML.
                const reader = response.body?.getReader();
                if (!reader) break;
                const decoder = new TextDecoder();
                let html = '';
                let size = 0;
                try {
                    while (size < 512_000) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        const chunk = value.subarray(0, 512_000 - size);
                        size += chunk.byteLength;
                        html += decoder.decode(chunk, { stream: true });
                    }
                    html += decoder.decode();
                } finally {
                    await reader.cancel();
                }
                image = extractHtmlNewsImage(html, target);
                break;
            }
        } catch {
            // A blocked or unavailable article must not stop the other news sources.
        }
        if (this.imageCache.size >= 500) this.imageCache.delete(this.imageCache.keys().next().value);
        this.imageCache.set(url, { image, expiresAt: Date.now() + (image ? 3_600_000 : 300_000) });
        return image;
    }

    private async ensureNewsImages(items: RawNewsItem[], publisherUrls: string[]): Promise<RawNewsItem[]> {
        items = items.filter(item => isNewsArticleUrl(item.url));
        const deadline = Date.now() + 15_000;
        let next = 0;
        await Promise.all(Array.from({ length: Math.min(4, items.length) }, async () => {
            while (next < items.length) {
                const item = items[next++];
                item.imageUrl = normalizeSourceImage(item.imageUrl, item.url);
                if (!item.imageUrl && Date.now() < deadline) {
                    item.imageUrl = await this.fetchArticleImage(item.url, publisherUrls);
                }
            }
        }));
        let addedPhotos = 0;
        for (const item of items) {
            if (!item.imageUrl) {
                item.imageUrl = resolveNewsImage(item.title);
                addedPhotos++;
            }
        }
        if (addedPhotos) console.log(`[NewsFetcher] Se agregaron fotos relacionadas a ${addedPhotos} noticias`);
        return items.sort((a, b) => Number(isIllustrativeNewsImage(a.imageUrl)) - Number(isIllustrativeNewsImage(b.imageUrl)));
    }

    /**
     * Fetches one source configured in the database. Keeping this method
     * separate from the legacy aggregate fetch allows the scheduler to
     * isolate failures and continue with the remaining sources.
     */
    async fetchConfiguredSource(source: {
        name: string;
        apiType?: string | null;
        baseUrl?: string | null;
        url?: string | null;
        rssUrl?: string | null;
        apiUrl?: string | null;
        country?: string | null;
        language?: string | null;
    }): Promise<RawNewsItem[]> {
        if (source.rssUrl) {
            return this.ensureNewsImages(await this.fetchConfiguredRssSource(source), [source.baseUrl, source.url, source.rssUrl].filter(Boolean));
        }
        if (source.apiUrl) return this.ensureNewsImages(await this.fetchConfiguredApiSource(source), [source.baseUrl, source.url, source.apiUrl].filter(Boolean));
        if (source.apiType === 'scraper' && source.baseUrl) return this.ensureNewsImages(await this.fetchConfiguredScraperSource(source), [source.baseUrl]);
        throw new Error(`La fuente ${source.name} no tiene RSS, API ni scraping habilitado`);
    }

    private async fetchConfiguredRssSource(source: {
        name: string;
        baseUrl?: string | null;
        url?: string | null;
        rssUrl?: string | null;
        country?: string | null;
        language?: string | null;
    }): Promise<RawNewsItem[]> {

        const response = await fetch(source.rssUrl, {
            headers: {
                'User-Agent': 'FinixNewsBot/1.0 (+https://finixarg.com)',
                Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml',
            },
            signal: AbortSignal.timeout(15_000),
        });

        if (!response.ok) {
            throw new Error(`RSS ${source.name} respondió HTTP ${response.status}`);
        }

        const xml = await response.text();
        const parsed = await this.rssParser.parseString(xml);
        const items: RawNewsItem[] = [];

        for (const item of parsed.items) {
            if (!item.title || !item.link) continue;

            const htmlContent = item.contentEncoded || item.content || item.description || '';
            let cleanSummary = '';
            let cleanContent = '';
            const imageUrl = extractRssNewsImage(item, item.link);

            if (htmlContent) {
                const $ = cheerio.load(htmlContent);
                const text = $.text().replace(/\s+/g, ' ').trim();
                cleanSummary = text.substring(0, 400);
                cleanContent = text;
            }

            const publishedAt = item.isoDate || item.pubDate
                ? new Date(item.isoDate || item.pubDate as string)
                : new Date();

            items.push({
                title: String(item.title).trim(),
                summary: cleanSummary || String(item.description || '').replace(/<[^>]+>/g, '').trim().substring(0, 400),
                content: cleanContent || cleanSummary,
                url: String(item.link).trim(),
                imageUrl: imageUrl || undefined,
                source: source.name,
                sourceUrl: source.baseUrl || source.url || undefined,
                author: item.creator || source.name,
                publishedAt: Number.isNaN(publishedAt.getTime()) ? new Date() : publishedAt,
                language: source.language || (source.country === 'AR' ? 'es' : 'en'),
            });

            if (items.length >= 40) break;
        }

        return items;
    }

    private async fetchConfiguredApiSource(source: {
        name: string;
        baseUrl?: string | null;
        apiUrl?: string | null;
        country?: string | null;
        language?: string | null;
    }): Promise<RawNewsItem[]> {
        if (!source.apiUrl) throw new Error(`La fuente ${source.name} no tiene apiUrl configurada`);
        const response = await fetch(source.apiUrl, {
            headers: { 'User-Agent': 'FinixNewsBot/1.0 (+https://finixarg.com)', Accept: 'application/json' },
            signal: AbortSignal.timeout(15_000),
        });
        if (!response.ok) throw new Error(`API ${source.name} respondió HTTP ${response.status}`);
        const payload: any = await response.json();
        const records = Array.isArray(payload) ? payload : payload.articles || payload.results || payload.data || [];
        if (!Array.isArray(records)) throw new Error(`API ${source.name} no devolvió una lista de noticias`);
        return records.slice(0, 40).map((article: any) => ({
            title: String(article.title || article.headline || '').trim(),
            summary: String(article.description || article.summary || '').trim(),
            content: String(article.content || article.description || article.summary || '').trim(),
            url: String(article.url || article.link || article.webUrl || '').trim(),
            imageUrl: article.image || article.imageUrl || article.urlToImage || undefined,
            source: source.name,
            sourceUrl: source.baseUrl || undefined,
            author: article.author || source.name,
            publishedAt: new Date(article.publishedAt || article.published_at || article.date || Date.now()),
            language: source.language || (source.country === 'AR' ? 'es' : 'en'),
        })).filter((article: RawNewsItem) => article.title && article.url);
    }

    private async fetchConfiguredScraperSource(source: {
        name: string;
        baseUrl?: string | null;
        country?: string | null;
        language?: string | null;
    }): Promise<RawNewsItem[]> {
        if (!source.baseUrl) throw new Error(`La fuente ${source.name} no tiene baseUrl configurada`);
        const robotsUrl = new URL('/robots.txt', source.baseUrl).toString();
        const robotsResponse = await fetch(robotsUrl, {
            headers: { 'User-Agent': 'FinixNewsBot/1.0 (+https://finixarg.com)' },
            signal: AbortSignal.timeout(8_000),
        });
        if (!robotsResponse.ok) throw new Error(`No se pudo verificar robots.txt de ${source.name}`);
        const robots = await robotsResponse.text();
        if (/^\s*Disallow:\s*\/\s*$/im.test(robots)) throw new Error(`Scraping bloqueado por robots.txt en ${source.name}`);

        const scraped = await this.scrapeWebsitePage(source.baseUrl);
        if (!scraped.title || !scraped.text) throw new Error(`Scraping sin contenido utilizable en ${source.name}`);
        return [{
            title: scraped.title,
            summary: scraped.text.slice(0, 400),
            content: scraped.text,
            url: source.baseUrl,
            imageUrl: scraped.image,
            source: source.name,
            sourceUrl: source.baseUrl,
            author: source.name,
            publishedAt: new Date(),
            language: source.language || (source.country === 'AR' ? 'es' : 'en'),
        }];
    }

    /**
     * Fetch news from RSS feeds using rss-parser
     */
    private async fetchFromRSSFeeds(): Promise<RawNewsItem[]> {
        const allNews: RawNewsItem[] = [];

        for (const feed of this.RSS_FEEDS) {
            try {
                // Fetch directly with standard JS fetch to control headers/timeout easily, 
                // then parse the raw XML string using rss-parser.
                const response = await fetch(feed.url, {
                    headers: { 'User-Agent': 'Mozilla/5.0' },
                    signal: AbortSignal.timeout(10000),
                });

                if (!response.ok) {
                    console.warn(`[NewsFetcher] RSS feed ${feed.name} returned ${response.status}`);
                    continue;
                }

                const xml = await response.text();
                const feedParsed = await this.rssParser.parseString(xml);
                const items: RawNewsItem[] = [];

                for (const item of feedParsed.items) {
                    if (!item.title || !item.link) continue;

                    // 1. Extract content safely using Cheerio if HTML exists
                    const htmlContent = item.contentEncoded || item.content || item.description || '';
                    let cleanSummary = '';
                    let cleanContent = '';
                    const imageUrl = extractRssNewsImage(item, item.link);

                    if (htmlContent) {
                        try {
                            const $ = cheerio.load(htmlContent);
                            // Extract pure text
                            const text = $.text().replace(/\s+/g, ' ').trim();
                            cleanSummary = text.substring(0, 300);
                            cleanContent = text;
                        } catch (e) {
                            cleanSummary = htmlContent.replace(/<[^>]+>/g, '').substring(0, 300);
                        }
                    }

                    items.push({
                        title: item.title,
                        summary: cleanSummary,
                        content: cleanContent || cleanSummary,
                        url: item.link,
                        imageUrl: imageUrl || undefined,
                        source: feed.name,
                        author: item.creator || feed.name,
                        publishedAt: item.isoDate ? new Date(item.isoDate) : new Date(item.pubDate || Date.now()),
                        language: ['Ámbito Financiero', 'Ámbito Finanzas', 'El Cronista', 'Infobae', 'La Nación', 'iProfesional'].includes(feed.name) ? 'es' : 'en',
                    });

                    // Cap per feed to avoid overflowing the DB too fast
                    if (items.length >= 20) break;
                }

                const illustrated = await this.ensureNewsImages(items, [feed.url]);
                allNews.push(...illustrated);
                console.log(`[NewsFetcher] Fetched ${illustrated.length} illustrated items from ${feed.name}`);

                await new Promise(resolve => setTimeout(resolve, 800));

            } catch (error: any) {
                console.error(`[NewsFetcher] Error fetching ${feed.name}:`, error.message);
            }
        }

        return allNews;
    }

    /**
     * Tool for robust HTML Scrapping (Web Scraping general)
     * Useful for extracting full article text if RSS only provides a small summary
     */
    async scrapeWebsitePage(url: string): Promise<{ text: string; image?: string; title?: string }> {
        try {
            const res = await fetch(url, {
                headers: { 'User-Agent': 'Mozilla/5.0' },
                signal: AbortSignal.timeout(15000),
            });
            if (!res.ok) throw new Error('Bad response');
            const html = await res.text();

            const $ = cheerio.load(html);

            const ogImage = extractHtmlNewsImage(html, res.url || url);

            // Remove unnecessary tags
            $('script, style, noscript, iframe, nav, footer, header').remove();

            const title = $('title').text() || $('h1').first().text();

            // Focus on paragraphs for article text
            const paragraphs: string[] = [];
            $('p').each((_, el) => {
                const text = $(el).text().trim();
                if (text.length > 20) paragraphs.push(text);
            });

            return {
                title: title.trim(),
                text: paragraphs.join('\n\n'),
                image: ogImage,
            };
        } catch (error: any) {
            console.error(`[Scraper] Failed to scrape ${url}:`, error.message);
            return { text: '' };
        }
    }

    /**
     * Fetch news from GNews API
     * Free tier: 100 requests/day
     */
    private async fetchFromGNews(): Promise<RawNewsItem[]> {
        const allNews: RawNewsItem[] = [];

        const queries = [
            'finance',
            'stock market',
            'cryptocurrency',
            'economia argentina',
        ];

        for (const query of queries) {
            try {
                const params = new URLSearchParams({
                    q: query,
                    lang: 'en',
                    country: 'us',
                    max: '10',
                    apikey: this.GNEWS_API_KEY,
                });

                const response = await fetch(
                    `https://gnews.io/api/v4/search?${params.toString()}`,
                    {
                        signal: AbortSignal.timeout(10000),
                    }
                );

                if (!response.ok) {
                    console.warn(`[NewsFetcher] GNews returned ${response.status}`);
                    continue;
                }

                const data = await response.json();

                if (data.articles && Array.isArray(data.articles)) {
                    const items: RawNewsItem[] = data.articles.map((article: any) => ({
                        title: article.title,
                        summary: article.description || '',
                        content: article.content || article.description || '',
                        url: article.url,
                        imageUrl: article.image,
                        source: article.source?.name || 'GNews',
                        author: article.source?.name,
                        publishedAt: new Date(article.publishedAt),
                        language: 'en',
                    }));

                    allNews.push(...items);
                }

                // Rate limiting (important for free tier)
                await new Promise(resolve => setTimeout(resolve, 2000));

            } catch (error) {
                console.error(`[NewsFetcher] GNews query "${query}" failed:`, error.message);
            }
        }

        return this.ensureNewsImages(allNews, []);
    }

}
