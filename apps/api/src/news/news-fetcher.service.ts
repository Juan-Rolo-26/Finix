import { Injectable } from '@nestjs/common';
import * as Parser from 'rss-parser';
import * as cheerio from 'cheerio';

interface RawNewsItem {
    title: string;
    summary: string;
    content: string;
    url: string;
    imageUrl?: string;
    source: string;
    author?: string;
    publishedAt: Date;
    language?: string;
}

/**
 * Service for fetching news from multiple sources
 * Supports: GNews API (free tier), RSS feeds, and fallback mock data
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
                ['media:content', 'mediaContent'],
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

        // If we got no news, use fallback
        if (allNews.length === 0) {
            console.log('[NewsFetcher] No news fetched, using fallback');
            return this.getFallbackNews();
        }

        console.log(`[NewsFetcher] Total news fetched: ${allNews.length}`);
        return allNews;
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
                    let htmlContent = item.contentEncoded || item.content || item.description || '';
                    let cleanSummary = '';
                    let cleanContent = '';
                    let imageUrl = '';

                    if (htmlContent) {
                        try {
                            const $ = cheerio.load(htmlContent);
                            // Extract image
                            const img = $('img').first();
                            if (img.length && img.attr('src')) {
                                imageUrl = img.attr('src') as string;
                            }

                            // Extract pure text
                            const text = $.text().replace(/\s+/g, ' ').trim();
                            cleanSummary = text.substring(0, 300);
                            cleanContent = text;
                        } catch (e) {
                            cleanSummary = htmlContent.replace(/<[^>]+>/g, '').substring(0, 300);
                        }
                    }

                    // Fallback to custom media:content for images
                    if (!imageUrl && item.mediaContent && item.mediaContent['$'] && item.mediaContent['$']['url']) {
                        imageUrl = item.mediaContent['$']['url'];
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

                allNews.push(...items);
                console.log(`[NewsFetcher] Fetched ${items.length} items from ${feed.name}`);

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

            // Remove unnecessary tags
            $('script, style, noscript, iframe, nav, footer, header').remove();

            const title = $('title').text() || $('h1').first().text();

            let ogImage = $('meta[property="og:image"]').attr('content');
            if (!ogImage) ogImage = $('img').first().attr('src');

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

        return allNews;
    }

    /**
     * Fallback mock news when APIs fail
     */
    private getFallbackNews(): RawNewsItem[] {
        return [
            {
                title: 'Apple Unveils Revolutionary AI Features for iPhone',
                summary: 'Apple announced groundbreaking AI integration across its product lineup, sending shares higher in after-hours trading.',
                content: 'Apple Inc. has announced a major update to its iPhone lineup with new AI-powered features...',
                url: 'https://example.com/apple-ai',
                imageUrl: 'https://images.unsplash.com/photo-1611974765270-ca1258634369?w=600',
                source: 'Financial Times',
                publishedAt: new Date(),
                language: 'en',
            },
            {
                title: 'Bitcoin Alcanza Nuevo Máximo Histórico',
                summary: 'El Bitcoin supera los $70,000 impulsado por la creciente adopción institucional.',
                content: 'Bitcoin ha alcanzado un nuevo máximo histórico superando los $70,000...',
                url: 'https://example.com/bitcoin-ath',
                imageUrl: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=600',
                source: 'Ámbito Financiero',
                publishedAt: new Date(Date.now() - 3600000),
                language: 'es',
            },
            {
                title: 'Fed Mantiene Tasas de Interés Estables',
                summary: 'La Reserva Federal mantiene las tasas sin cambios mientras evalúa datos económicos recientes.',
                content: 'La Reserva Federal de Estados Unidos ha decidido mantener las tasas de interés...',
                url: 'https://example.com/fed-rates',
                imageUrl: 'https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=600',
                source: 'El Cronista',
                publishedAt: new Date(Date.now() - 7200000),
                language: 'es',
            },
            {
                title: 'Tesla Expands Production Capacity',
                summary: 'Tesla announces plans to increase global production capacity with new manufacturing facilities.',
                content: 'Tesla Inc. has announced plans to significantly expand its production capacity...',
                url: 'https://example.com/tesla-expansion',
                imageUrl: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=600',
                source: 'Reuters',
                publishedAt: new Date(Date.now() - 10800000),
                language: 'en',
            },
            {
                title: 'Mercado Libre Expande Operaciones Fintech',
                summary: 'La compañía argentina anuncia nuevos servicios financieros digitales.',
                content: 'Mercado Libre continúa su expansión en el sector fintech con nuevos servicios...',
                url: 'https://example.com/meli-fintech',
                imageUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600',
                source: 'iProfesional',
                publishedAt: new Date(Date.now() - 14400000),
                language: 'es',
            },
            {
                title: 'S&P 500 Reaches All-Time High',
                summary: 'Major stock indices hit new records driven by tech and financial sectors.',
                content: 'The S&P 500 index has reached a new all-time high as investor confidence grows...',
                url: 'https://example.com/sp500-high',
                imageUrl: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=600',
                source: 'Bloomberg',
                publishedAt: new Date(Date.now() - 18000000),
                language: 'en',
            },
            {
                title: 'YPF Anuncia Récord de Producción en Vaca Muerta',
                summary: 'La petrolera estatal alcanza niveles históricos de extracción.',
                content: 'YPF ha anunciado récords de producción en la formación Vaca Muerta...',
                url: 'https://example.com/ypf-record',
                imageUrl: 'https://images.unsplash.com/photo-1545670723-196ed0954986?w=600',
                source: 'Ámbito Financiero',
                publishedAt: new Date(Date.now() - 21600000),
                language: 'es',
            },
            {
                title: 'Nvidia Announces Next-Gen AI Chips',
                summary: 'Nvidia unveils powerful new processors for artificial intelligence applications.',
                content: 'Nvidia Corporation has announced a new generation of AI processors...',
                url: 'https://example.com/nvidia-chips',
                imageUrl: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600',
                source: 'CNBC',
                publishedAt: new Date(Date.now() - 25200000),
                language: 'en',
            },
        ];
    }
}
