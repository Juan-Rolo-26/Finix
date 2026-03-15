"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewsFetcherService = void 0;
const common_1 = require("@nestjs/common");
let NewsFetcherService = class NewsFetcherService {
    constructor() {
        this.GNEWS_API_KEY = 'YOUR_GNEWS_API_KEY_HERE';
        this.RSS_FEEDS = [
            { url: 'https://cointelegraph.com/rss', name: 'CoinTelegraph', country: 'US' },
            { url: 'https://coindesk.com/arc/outboundfeeds/rss/', name: 'CoinDesk', country: 'US' },
            { url: 'https://decrypt.co/feed', name: 'Decrypt', country: 'US' },
            { url: 'https://cryptonews.com/news/feed/', name: 'CryptoNews', country: 'US' },
            { url: 'https://finance.yahoo.com/news/rssindex', name: 'Yahoo Finance', country: 'US' },
            { url: 'https://www.nasdaq.com/feed/rssoutbound?category=Stocks', name: 'NASDAQ', country: 'US' },
            { url: 'https://feeds.marketwatch.com/marketwatch/topstories', name: 'MarketWatch', country: 'US' },
            { url: 'https://www.investing.com/rss/news.rss', name: 'Investing.com', country: 'US' },
            { url: 'https://feeds.reuters.com/reuters/businessNews', name: 'Reuters Business', country: 'US' },
            { url: 'https://feeds.bbci.co.uk/news/business/rss.xml', name: 'BBC Business', country: 'UK' },
            { url: 'https://rss.nytimes.com/services/xml/rss/nyt/Economy.xml', name: 'NYT Economy', country: 'US' },
            { url: 'https://www.ft.com/?format=rss', name: 'Financial Times', country: 'UK' },
            { url: 'https://feeds.a.dj.com/rss/RSSWorldNews.xml', name: 'Wall Street Journal', country: 'US' },
            { url: 'https://www.ambito.com/rss/economia.xml', name: 'Ámbito Financiero', country: 'AR' },
            { url: 'https://www.cronista.com/rss/economia/', name: 'El Cronista', country: 'AR' },
            { url: 'https://www.infobae.com/feeds/rss/', name: 'Infobae', country: 'AR' },
            { url: 'https://feeds.lanacion.com.ar/lanacion/economia', name: 'La Nación', country: 'AR' },
            { url: 'https://www.iprofesional.com/feed', name: 'iProfesional', country: 'AR' },
            { url: 'https://www.ambito.com/rss/finanzas.xml', name: 'Ámbito Finanzas', country: 'AR' },
        ];
    }
    async fetchAllNews() {
        const allNews = [];
        try {
            const rssNews = await this.fetchFromRSSFeeds();
            allNews.push(...rssNews);
        }
        catch (error) {
            console.error('[NewsFetcher] RSS fetch failed:', error.message);
        }
        try {
            if (this.GNEWS_API_KEY && this.GNEWS_API_KEY !== 'YOUR_GNEWS_API_KEY_HERE') {
                const gNewsItems = await this.fetchFromGNews();
                allNews.push(...gNewsItems);
            }
        }
        catch (error) {
            console.error('[NewsFetcher] GNews fetch failed:', error.message);
        }
        if (allNews.length === 0) {
            console.log('[NewsFetcher] No news fetched, using fallback');
            return this.getFallbackNews();
        }
        console.log(`[NewsFetcher] Total news fetched: ${allNews.length}`);
        return allNews;
    }
    async fetchFromRSSFeeds() {
        const allNews = [];
        for (const feed of this.RSS_FEEDS) {
            try {
                const response = await fetch(feed.url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    },
                    signal: AbortSignal.timeout(10000),
                });
                if (!response.ok) {
                    console.warn(`[NewsFetcher] RSS feed ${feed.name} returned ${response.status}`);
                    continue;
                }
                const xml = await response.text();
                const items = this.parseRSS(xml, feed.name);
                allNews.push(...items);
                console.log(`[NewsFetcher] Fetched ${items.length} items from ${feed.name}`);
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            catch (error) {
                console.error(`[NewsFetcher] Error fetching ${feed.name}:`, error.message);
            }
        }
        return allNews;
    }
    parseRSS(xml, sourceName) {
        const items = [];
        const itemRegex = /<item>([\s\S]*?)<\/item>/g;
        let match;
        while ((match = itemRegex.exec(xml)) !== null) {
            const itemContent = match[1];
            const getTag = (tag) => {
                const regex = new RegExp(`<${tag}.*?>([\\s\\S]*?)<\\/${tag}>`);
                const complexMatch = itemContent.match(regex);
                if (complexMatch) {
                    return complexMatch[1]
                        .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
                        .trim();
                }
                return '';
            };
            const title = getTag('title');
            const link = getTag('link');
            const pubDate = getTag('pubDate');
            const description = getTag('description');
            const content = getTag('content:encoded') || description;
            let imageUrl = '';
            const mediaRegex = /<media:content[^>]*url="([^"]*)"/i;
            const mediaMatch = itemContent.match(mediaRegex);
            if (mediaMatch) {
                imageUrl = mediaMatch[1];
            }
            else {
                const imgRegex = /<img[^>]+src="([^"]+)"/i;
                const imgMatch = description.match(imgRegex);
                if (imgMatch)
                    imageUrl = imgMatch[1];
            }
            const cleanSummary = description
                .replace(/<[^>]+>/g, '')
                .substring(0, 300);
            if (title && link) {
                items.push({
                    title,
                    summary: cleanSummary,
                    content: content.replace(/<[^>]+>/g, ''),
                    url: link,
                    imageUrl: imageUrl || undefined,
                    source: sourceName,
                    publishedAt: pubDate ? new Date(pubDate) : new Date(),
                    language: ['Ámbito Financiero', 'Ámbito Finanzas', 'El Cronista', 'Infobae', 'La Nación', 'iProfesional'].includes(sourceName) ? 'es' : 'en',
                });
            }
        }
        return items;
    }
    async fetchFromGNews() {
        const allNews = [];
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
                const response = await fetch(`https://gnews.io/api/v4/search?${params.toString()}`, {
                    signal: AbortSignal.timeout(10000),
                });
                if (!response.ok) {
                    console.warn(`[NewsFetcher] GNews returned ${response.status}`);
                    continue;
                }
                const data = await response.json();
                if (data.articles && Array.isArray(data.articles)) {
                    const items = data.articles.map((article) => ({
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
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
            catch (error) {
                console.error(`[NewsFetcher] GNews query "${query}" failed:`, error.message);
            }
        }
        return allNews;
    }
    getFallbackNews() {
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
};
exports.NewsFetcherService = NewsFetcherService;
exports.NewsFetcherService = NewsFetcherService = __decorate([
    (0, common_1.Injectable)()
], NewsFetcherService);
//# sourceMappingURL=news-fetcher.service.js.map