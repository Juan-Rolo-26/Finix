import { Injectable } from '@nestjs/common';

interface FinvizBaseNode {
    name: string;
    description?: string;
    value?: number;
    children?: FinvizBaseNode[];
}

interface FinvizPerfResponse {
    nodes?: Record<string, number>;
    subtype?: string;
}

export interface NewsItem {
    title: string;
    link: string;
    publishedAt: string;
    source: string;
    summary: string;
    image?: string;
}

export interface MarketQuote {
    inputSymbol: string;
    symbol: string;
    price: number | null;
    change: number | null;
    updatedAt: string;
    unavailable: boolean;
}

interface ScannerQuote {
    price: number;
    change: number | null;
}

interface FinvizTickerNode {
    name: string;
    description: string;
    industry: string;
    sector: string;
    value: number;
    perf: number;
}

interface FinvizSectorNode {
    name: string;
    value: number;
    perf: number;
    children: FinvizTickerNode[];
}

@Injectable()
export class MarketService {
    private finvizBaseCache: { data: FinvizBaseNode; fetchedAt: number } | null = null;
    private finvizHeatmapCache = new Map<string, { data: unknown; fetchedAt: number }>();
    private readonly finvizBaseTtlMs = 6 * 60 * 60 * 1000;
    private readonly finvizHeatmapTtlMs = 60 * 1000;
    private readonly finvizDefaultBaseScript = '/assets/dist-legacy/map_base_sec.v1.6b264ef1.js';

    private stripHtml(value: string) {
        return value.replace(/\u003c[^\u003e]*\u003e/g, '').trim();
    }

    private mockTickers = [
        { symbol: 'BTC', price: 42000, change: 2.5 },
        { symbol: 'ETH', price: 2200, change: 1.2 },
        { symbol: 'AAPL', price: 175, change: -0.5 },
        { symbol: 'TSLA', price: 210, change: 3.1 },
        { symbol: 'SPY', price: 490, change: 0.8 },
    ];

    // Expanded catalog with more assets
    private symbolCatalog = [
        // US Stocks - Tech
        { symbol: 'NASDAQ:AAPL', name: 'Apple Inc', type: 'stock', exchange: 'NASDAQ' },
        { symbol: 'NASDAQ:TSLA', name: 'Tesla Inc', type: 'stock', exchange: 'NASDAQ' },
        { symbol: 'NASDAQ:NVDA', name: 'NVIDIA Corp', type: 'stock', exchange: 'NASDAQ' },
        { symbol: 'NASDAQ:MSFT', name: 'Microsoft Corp', type: 'stock', exchange: 'NASDAQ' },
        { symbol: 'NASDAQ:GOOGL', name: 'Alphabet Inc', type: 'stock', exchange: 'NASDAQ' },
        { symbol: 'NASDAQ:META', name: 'Meta Platforms Inc', type: 'stock', exchange: 'NASDAQ' },
        { symbol: 'NASDAQ:AMZN', name: 'Amazon.com Inc', type: 'stock', exchange: 'NASDAQ' },
        { symbol: 'NASDAQ:NFLX', name: 'Netflix Inc', type: 'stock', exchange: 'NASDAQ' },
        { symbol: 'NASDAQ:AMD', name: 'Advanced Micro Devices', type: 'stock', exchange: 'NASDAQ' },
        { symbol: 'NASDAQ:INTC', name: 'Intel Corporation', type: 'stock', exchange: 'NASDAQ' },

        // US Stocks - Finance
        { symbol: 'NYSE:JPM', name: 'JPMorgan Chase & Co', type: 'stock', exchange: 'NYSE' },
        { symbol: 'NYSE:BAC', name: 'Bank of America Corp', type: 'stock', exchange: 'NYSE' },
        { symbol: 'NYSE:WFC', name: 'Wells Fargo & Company', type: 'stock', exchange: 'NYSE' },
        { symbol: 'NYSE:V', name: 'Visa Inc', type: 'stock', exchange: 'NYSE' },
        { symbol: 'NYSE:MA', name: 'Mastercard Inc', type: 'stock', exchange: 'NYSE' },

        // ETFs
        { symbol: 'NYSE:SPY', name: 'SPDR S&P 500 ETF', type: 'etf', exchange: 'NYSE' },
        { symbol: 'NASDAQ:QQQ', name: 'Invesco QQQ Trust', type: 'etf', exchange: 'NASDAQ' },
        { symbol: 'NYSE:VNQ', name: 'Vanguard Real Estate ETF', type: 'etf', exchange: 'NYSE' },
        { symbol: 'NYSE:GLD', name: 'SPDR Gold Trust', type: 'etf', exchange: 'NYSE' },
        { symbol: 'NYSE:VTI', name: 'Vanguard Total Stock Market ETF', type: 'etf', exchange: 'NYSE' },

        // Cryptocurrencies
        { symbol: 'BINANCE:BTCUSDT', name: 'Bitcoin / Tether', type: 'crypto', exchange: 'BINANCE' },
        { symbol: 'BINANCE:ETHUSDT', name: 'Ethereum / Tether', type: 'crypto', exchange: 'BINANCE' },
        { symbol: 'BINANCE:BNBUSDT', name: 'Binance Coin / Tether', type: 'crypto', exchange: 'BINANCE' },
        { symbol: 'BINANCE:SOLUSDT', name: 'Solana / Tether', type: 'crypto', exchange: 'BINANCE' },
        { symbol: 'BINANCE:ADAUSDT', name: 'Cardano / Tether', type: 'crypto', exchange: 'BINANCE' },
        { symbol: 'BINANCE:XRPUSDT', name: 'Ripple / Tether', type: 'crypto', exchange: 'BINANCE' },
        { symbol: 'CRYPTO:BTCUSD', name: 'Bitcoin / USD', type: 'crypto', exchange: 'CRYPTO' },
        { symbol: 'CRYPTO:ETHUSD', name: 'Ethereum / USD', type: 'crypto', exchange: 'CRYPTO' },

        // Forex
        { symbol: 'FX:EURUSD', name: 'Euro / US Dollar', type: 'forex', exchange: 'FX' },
        { symbol: 'FX:GBPUSD', name: 'British Pound / US Dollar', type: 'forex', exchange: 'FX' },
        { symbol: 'FX:USDJPY', name: 'US Dollar / Japanese Yen', type: 'forex', exchange: 'FX' },
        { symbol: 'FX:AUDUSD', name: 'Australian Dollar / US Dollar', type: 'forex', exchange: 'FX' },
        { symbol: 'FX:USDCAD', name: 'US Dollar / Canadian Dollar', type: 'forex', exchange: 'FX' },

        // Commodities
        { symbol: 'OANDA:XAUUSD', name: 'Gold / US Dollar', type: 'commodity', exchange: 'OANDA' },
        { symbol: 'OANDA:XAGUSD', name: 'Silver / US Dollar', type: 'commodity', exchange: 'OANDA' },
        { symbol: 'TVC:USOIL', name: 'WTI Crude Oil', type: 'commodity', exchange: 'TVC' },
        { symbol: 'TVC:UKOIL', name: 'Brent Crude Oil', type: 'commodity', exchange: 'TVC' },

        // Energy
        { symbol: 'NYSE:XOM', name: 'Exxon Mobil Corp', type: 'stock', exchange: 'NYSE' },
        { symbol: 'NYSE:CVX', name: 'Chevron Corporation', type: 'stock', exchange: 'NYSE' },
    ];

    async getTickers() {
        const defaultTickers = ['NASDAQ:TSLA', 'CRYPTO:BTCUSD', 'AMEX:SPY', 'NASDAQ:NVDA', 'NASDAQ:AAPL'];
        const quotes = await this.getQuotes(defaultTickers);

        return quotes.map((q, i) => {
            const mockFallback = this.mockTickers[i % this.mockTickers.length];
            // Extraer el símbolo corto (ej: TSLA en lugar de NASDAQ:TSLA)
            const shortSymbol = q.inputSymbol.split(':')[1] || q.inputSymbol;

            return {
                symbol: shortSymbol === 'BTCUSD' ? 'BTC' : shortSymbol,
                price: q.price ?? mockFallback.price,
                change: q.change ?? mockFallback.change,
                volume: Math.floor(Math.random() * 50000) + 10000 // Simulation for volume as real volume might be missing
            };
        });
    }

    async searchSymbols(query: string) {
        console.log(`[MarketService] Searching for: ${query}`);
        const q = query.trim().toUpperCase();
        if (!q) {
            return this.symbolCatalog.slice(0, 20);
        }

        const normalizedFromInput = q.replace(/\s+/g, '');
        const explicitTvSymbolMatch = normalizedFromInput.match(/^([A-Z0-9._-]+):([A-Z0-9._/\-]+)$/);
        const explicitTvSymbol = explicitTvSymbolMatch
            ? `${explicitTvSymbolMatch[1]}:${explicitTvSymbolMatch[2]}`
            : null;

        const directSymbolResult = explicitTvSymbol
            ? [{
                symbol: explicitTvSymbol,
                exchange: explicitTvSymbol.split(':')[0],
                name: explicitTvSymbol.split(':')[1],
                type: 'other',
            }]
            : [];

        // Search in local catalog first
        const qLower = q.toLowerCase();
        const localResults = this.symbolCatalog.filter((item) =>
            item.symbol.toLowerCase().includes(qLower) ||
            item.name.toLowerCase().includes(qLower)
        );

        // Try TradingView as backup (with timeout and error handling)
        let tvResults: any[] = [];
        try {
            console.log('[MarketService] Trying TradingView search...');
            const exchange = explicitTvSymbolMatch?.[1] || '';
            const text = explicitTvSymbolMatch?.[2] || q;

            const params = new URLSearchParams({
                text,
                hl: '0',
                lang: 'en',
                exchange,
                type: '',
                domain: 'production',
            });

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);

            const response = await fetch(`https://symbol-search.tradingview.com/symbol_search/?${params.toString()}`, {
                headers: {
                    'Accept': 'application/json,text/plain,*/*',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Referer': 'https://www.tradingview.com/',
                    'Origin': 'https://www.tradingview.com',
                },
                signal: controller.signal,
            });
            clearTimeout(timeoutId);

            console.log(`[MarketService] TradingView Response Status: ${response.status}`);

            if (response.ok) {
                const data = await response.json();
                const items = Array.isArray(data) ? data : (Array.isArray(data?.symbols) ? data.symbols : []);
                tvResults = items
                    .map((item: any) => {
                        const rawExchange = item.exchange || item.exchange_name || '';
                        const rawSymbol = item.symbol || item.ticker || '';
                        const rawName = item.description || item.full_name || item.name || rawSymbol;
                        const exchange = this.stripHtml(String(rawExchange || ''));
                        const symbol = this.stripHtml(String(rawSymbol || ''));
                        const name = this.stripHtml(String(rawName || symbol));
                        const type = item.type || item.contract || 'stock';
                        const tvSymbol = exchange && symbol
                            ? `${exchange}:${symbol}`
                            : this.stripHtml(String(item.full_name || symbol));
                        return {
                            symbol: tvSymbol,
                            exchange,
                            name,
                            type,
                        };
                    })
                    .filter((item: any) => item.symbol);
            }
        } catch (error) {
            console.error('[MarketService] TradingView search failed:', error);
        }

        const merged = [...directSymbolResult, ...localResults, ...tvResults];
        const deduped = merged.filter((item, idx, arr) => arr.findIndex((x) => x.symbol === item.symbol) === idx);

        if (deduped.length > 0) {
            console.log(`[MarketService] Returning ${deduped.length} symbol results`);
            return deduped.slice(0, 30);
        }

        console.log('[MarketService] Returning empty results');
        return directSymbolResult;
    }

    private normalizeQuoteInputSymbol(symbol: string) {
        return (symbol || '').trim().toUpperCase();
    }

    private buildSymbolCandidates(rawSymbol: string) {
        const cleaned = this.normalizeQuoteInputSymbol(rawSymbol);
        if (!cleaned) return [];
        if (cleaned.includes(':')) return [cleaned];

        const cryptoAliases: Record<string, string[]> = {
            BTC: ['BINANCE:BTCUSDT', 'CRYPTO:BTCUSD'],
            BTCUSD: ['BINANCE:BTCUSDT', 'CRYPTO:BTCUSD'],
            ETH: ['BINANCE:ETHUSDT', 'CRYPTO:ETHUSD'],
            ETHUSD: ['BINANCE:ETHUSDT', 'CRYPTO:ETHUSD'],
            BNB: ['BINANCE:BNBUSDT'],
            SOL: ['BINANCE:SOLUSDT'],
            ADA: ['BINANCE:ADAUSDT'],
            XRP: ['BINANCE:XRPUSDT'],
        };

        if (cryptoAliases[cleaned]) {
            return cryptoAliases[cleaned];
        }

        if (/^[A-Z0-9._-]+USDT$/.test(cleaned)) {
            return [`BINANCE:${cleaned}`];
        }

        return [`NASDAQ:${cleaned}`, `NYSE:${cleaned}`, `AMEX:${cleaned}`];
    }

    private async fetchScannerQuotes(tickers: string[]) {
        const dedupedTickers = Array.from(new Set(tickers.filter(Boolean)));
        const quoteMap = new Map<string, ScannerQuote>();

        if (dedupedTickers.length === 0) {
            return quoteMap;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        try {
            const response = await fetch('https://scanner.tradingview.com/global/scan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json,text/plain,*/*',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Referer': 'https://www.tradingview.com/',
                    'Origin': 'https://www.tradingview.com',
                },
                body: JSON.stringify({
                    symbols: {
                        tickers: dedupedTickers,
                        query: { types: [] },
                    },
                    columns: ['close', 'change', 'change_abs', 'volume', 'Recommend.All'],
                }),
                signal: controller.signal,
            });

            console.log(`[MarketService] Scanner response status: ${response.status}`);

            if (!response.ok) {
                return quoteMap;
            }

            const payload = await response.json();
            const rows = Array.isArray(payload?.data) ? payload.data : [];

            rows.forEach((item: any, index: number) => {
                const symbol = String(item?.s || dedupedTickers[index] || '').toUpperCase();
                const values = item?.d;
                if (!symbol || !Array.isArray(values)) return;

                const price = typeof values[0] === 'number' && Number.isFinite(values[0]) ? values[0] : null;
                const change = typeof values[1] === 'number' && Number.isFinite(values[1]) ? values[1] : null;
                if (price === null) return;

                quoteMap.set(symbol, { price, change });
            });
        } catch (error) {
            console.error('[MarketService] Scanner quote fetch failed:', error);
        } finally {
            clearTimeout(timeoutId);
        }

        return quoteMap;
    }

    async getQuotes(symbols: string[]): Promise<MarketQuote[]> {
        const normalizedInputs = symbols
            .map((symbol) => this.normalizeQuoteInputSymbol(symbol))
            .filter(Boolean);

        if (normalizedInputs.length === 0) {
            return [];
        }

        const candidatesByInput = new Map<string, string[]>();
        const allCandidates: string[] = [];

        for (const inputSymbol of normalizedInputs) {
            const candidates = this.buildSymbolCandidates(inputSymbol);
            candidatesByInput.set(inputSymbol, candidates);
            allCandidates.push(...candidates);
        }

        const scannerQuotes = await this.fetchScannerQuotes(allCandidates);
        const updatedAt = new Date().toISOString();

        return normalizedInputs.map((inputSymbol) => {
            const candidates = candidatesByInput.get(inputSymbol) || [];
            const matchedSymbol = candidates.find((candidate) => scannerQuotes.has(candidate)) || candidates[0] || inputSymbol;
            const match = scannerQuotes.get(matchedSymbol);

            return {
                inputSymbol,
                symbol: matchedSymbol,
                price: match?.price ?? null,
                change: match?.change ?? null,
                updatedAt,
                unavailable: !match,
            };
        });
    }

    async getQuote(symbol: string): Promise<MarketQuote> {
        console.log(`[MarketService] Getting quote for: ${symbol}`);
        const normalizedInput = this.normalizeQuoteInputSymbol(symbol);

        if (!normalizedInput) {
            return {
                inputSymbol: '',
                symbol: '',
                price: null,
                change: null,
                updatedAt: new Date().toISOString(),
                unavailable: true,
            };
        }

        const [quote] = await this.getQuotes([normalizedInput]);
        if (quote) return quote;

        return {
            inputSymbol: normalizedInput,
            symbol: normalizedInput,
            price: null,
            change: null,
            updatedAt: new Date().toISOString(),
            unavailable: true,
        };
    }

    private normalizeFinvizSubtype(rawSubtype: string) {
        const normalized = (rawSubtype || '').trim().toLowerCase();
        const allowed: Record<string, string> = {
            day: 'd1',
            d1: 'd1',
            week: 'w1',
            w1: 'w1',
            ytd: 'ytd',
        };
        return allowed[normalized] || 'd1';
    }

    private extractBalancedObjectLiteral(input: string, startIndex: number) {
        let depth = 0;
        let inString = false;
        let quoteChar = '';
        let isEscaped = false;

        for (let i = startIndex; i < input.length; i++) {
            const ch = input[i];

            if (inString) {
                if (isEscaped) {
                    isEscaped = false;
                    continue;
                }
                if (ch === '\\') {
                    isEscaped = true;
                    continue;
                }
                if (ch === quoteChar) {
                    inString = false;
                    quoteChar = '';
                }
                continue;
            }

            if (ch === '"' || ch === "'") {
                inString = true;
                quoteChar = ch;
                continue;
            }

            if (ch === '{') {
                depth += 1;
            } else if (ch === '}') {
                depth -= 1;
                if (depth === 0) {
                    return input.slice(startIndex, i + 1);
                }
            }
        }

        throw new Error('Could not parse Finviz base object literal');
    }

    private quoteUnquotedObjectKeys(input: string) {
        return input.replace(/([{,]\s*)([A-Za-z_][A-Za-z0-9_]*)(\s*:)/g, '$1"$2"$3');
    }

    private parseFinvizBaseScript(scriptBody: string): FinvizBaseNode {
        const marker = 'e.exports=';
        const markerIndex = scriptBody.indexOf(marker);
        if (markerIndex === -1) {
            throw new Error('Finviz base marker not found');
        }

        const objectStart = markerIndex + marker.length;
        const objectLiteral = this.extractBalancedObjectLiteral(scriptBody, objectStart);
        const jsonLikeObject = this.quoteUnquotedObjectKeys(objectLiteral);
        const parsed = JSON.parse(jsonLikeObject) as FinvizBaseNode;

        if (!parsed || parsed.name !== 'Root' || !Array.isArray(parsed.children)) {
            throw new Error('Finviz base payload has unexpected shape');
        }

        return parsed;
    }

    private async discoverFinvizBaseScriptPath() {
        try {
            const response = await fetch('https://finviz.com/map.ashx?t=sec', {
                headers: {
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                },
            });

            if (!response.ok) {
                return this.finvizDefaultBaseScript;
            }

            const html = await response.text();
            const match = html.match(/href="(\/assets\/dist-legacy\/map_base_sec[^"]+\.js)"/i);
            return match?.[1] || this.finvizDefaultBaseScript;
        } catch {
            return this.finvizDefaultBaseScript;
        }
    }

    private async getFinvizBaseTree() {
        const now = Date.now();
        if (this.finvizBaseCache && now - this.finvizBaseCache.fetchedAt < this.finvizBaseTtlMs) {
            return this.finvizBaseCache.data;
        }

        const scriptPath = await this.discoverFinvizBaseScriptPath();
        const baseScriptUrl = `https://finviz.com${scriptPath}`;
        const response = await fetch(baseScriptUrl, {
            headers: {
                'Accept': 'application/javascript,text/javascript,*/*',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://finviz.com/map.ashx?t=sec',
            },
        });

        if (!response.ok) {
            throw new Error(`Finviz base script failed with ${response.status}`);
        }

        const scriptBody = await response.text();
        const parsedTree = this.parseFinvizBaseScript(scriptBody);
        this.finvizBaseCache = { data: parsedTree, fetchedAt: now };
        return parsedTree;
    }

    private collectSectorTickers(
        node: FinvizBaseNode,
        sectorName: string,
        industryName: string,
        perfByTicker: Record<string, number>,
        output: FinvizTickerNode[]
    ) {
        if (Array.isArray(node.children) && node.children.length > 0) {
            for (const child of node.children) {
                this.collectSectorTickers(child, sectorName, node.name || industryName, perfByTicker, output);
            }
            return;
        }

        const ticker = (node.name || '').trim();
        if (!ticker) return;

        const marketCap = typeof node.value === 'number' && Number.isFinite(node.value) ? node.value : 0;
        const perf = typeof perfByTicker[ticker] === 'number' ? perfByTicker[ticker] : 0;

        output.push({
            name: ticker,
            description: node.description || ticker,
            industry: industryName || 'Other',
            sector: sectorName || 'Other',
            value: marketCap,
            perf,
        });
    }

    private buildFinvizSectors(baseRoot: FinvizBaseNode, perfByTicker: Record<string, number>) {
        const sectors: FinvizSectorNode[] = [];
        const sectorNodes = Array.isArray(baseRoot.children) ? baseRoot.children : [];

        for (const sectorNode of sectorNodes) {
            const sectorName = sectorNode.name || 'Other';
            const sectorTickers: FinvizTickerNode[] = [];
            const industries = Array.isArray(sectorNode.children) ? sectorNode.children : [];

            for (const industryNode of industries) {
                this.collectSectorTickers(industryNode, sectorName, industryNode.name || 'Other', perfByTicker, sectorTickers);
            }

            if (sectorTickers.length === 0) continue;

            sectorTickers.sort((a, b) => b.value - a.value);
            const sectorValue = sectorTickers.reduce((sum, ticker) => sum + ticker.value, 0);
            const weightedPerf = sectorValue > 0
                ? sectorTickers.reduce((sum, ticker) => sum + (ticker.perf * ticker.value), 0) / sectorValue
                : 0;

            sectors.push({
                name: sectorName,
                value: sectorValue,
                perf: Number(weightedPerf.toFixed(3)),
                children: sectorTickers,
            });
        }

        sectors.sort((a, b) => b.value - a.value);
        return sectors;
    }

    private getFinvizStats(sectors: FinvizSectorNode[]) {
        const allTickers = sectors.flatMap((sector) => sector.children);
        const upCount = allTickers.filter((ticker) => ticker.perf > 0).length;
        const downCount = allTickers.filter((ticker) => ticker.perf < 0).length;
        const unchangedCount = allTickers.length - upCount - downCount;

        const gainers = [...allTickers]
            .sort((a, b) => b.perf - a.perf)
            .slice(0, 8);
        const losers = [...allTickers]
            .sort((a, b) => a.perf - b.perf)
            .slice(0, 8);

        return {
            tickerCount: allTickers.length,
            totalMarketCap: Math.round(allTickers.reduce((sum, ticker) => sum + ticker.value, 0)),
            upCount,
            downCount,
            unchangedCount,
            topMovers: {
                gainers,
                losers,
            },
        };
    }

    async getFinvizHeatmap(subtype = 'd1') {
        const normalizedSubtype = this.normalizeFinvizSubtype(subtype);
        const now = Date.now();
        const cached = this.finvizHeatmapCache.get(normalizedSubtype);
        if (cached && now - cached.fetchedAt < this.finvizHeatmapTtlMs) {
            return cached.data;
        }

        try {
            const baseRoot = await this.getFinvizBaseTree();
            const perfResponse = await fetch(
                `https://finviz.com/api/map_perf.ashx?t=sec&st=${encodeURIComponent(normalizedSubtype)}`,
                {
                    headers: {
                        'Accept': 'application/json,text/plain,*/*',
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Referer': 'https://finviz.com/map.ashx?t=sec',
                    },
                }
            );

            if (!perfResponse.ok) {
                throw new Error(`Finviz perf request failed with ${perfResponse.status}`);
            }

            const perfData = await perfResponse.json() as FinvizPerfResponse;
            const perfByTicker = perfData?.nodes || {};
            const sectors = this.buildFinvizSectors(baseRoot, perfByTicker);
            const stats = this.getFinvizStats(sectors);

            const payload = {
                source: 'finviz',
                subtype: perfData?.subtype || normalizedSubtype,
                updatedAt: new Date().toISOString(),
                sectors,
                stats,
            };

            this.finvizHeatmapCache.set(normalizedSubtype, { data: payload, fetchedAt: now });
            return payload;
        } catch (error) {
            console.error('[MarketService] Finviz heatmap failed:', error);

            if (cached) {
                return cached.data;
            }

            return {
                source: 'finviz',
                subtype: normalizedSubtype,
                updatedAt: new Date().toISOString(),
                sectors: [],
                stats: {
                    tickerCount: 0,
                    totalMarketCap: 0,
                    upCount: 0,
                    downCount: 0,
                    unchangedCount: 0,
                    topMovers: {
                        gainers: [],
                        losers: [],
                    },
                },
            };
        }
    }

    async getDolarMep() {
        // Fetch from public Argentine API
        try {
            const res = await fetch('https://dolarapi.com/v1/dolares/bolsa');
            if (res.ok) {
                const data = await res.json();
                return {
                    compra: data.compra || 0,
                    venta: data.venta || 0,
                    fecha: data.fechaActualizacion || new Date().toISOString(),
                };
            }
        } catch (error) {
            console.error('Error fetching dolar MEP:', error);
        }

        // Fallback
        return {
            compra: 1000 + Math.random() * 50,
            venta: 1020 + Math.random() * 50,
            fecha: new Date().toISOString(),
        };
    }

    private parseRSS(xml: string): NewsItem[] {
        const items: NewsItem[] = [];
        const itemRegex = /<item>([\s\S]*?)<\/item>/g;
        let match;

        while ((match = itemRegex.exec(xml)) !== null) {
            const itemContent = match[1];

            const getTag = (tag: string) => {
                const regex = new RegExp(`<${tag}.*?>([\\s\\S]*?)<\\/${tag}>`);
                const complexMatch = itemContent.match(regex);
                if (complexMatch) return complexMatch[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim();
                return '';
            };

            const title = getTag('title');
            const link = getTag('link');
            const pubDate = getTag('pubDate');
            const description = getTag('description');

            // Try to extract image from media:content or description
            let image = '';
            const mediaRegex = /<media:content[^>]*url="([^"]*)"/i;
            const mediaMatch = itemContent.match(mediaRegex);
            if (mediaMatch) {
                image = mediaMatch[1];
            } else {
                // Try extracting from description if it contains HTML image
                const imgRegex = /<img[^>]+src="([^"]+)"/i;
                const imgMatch = description.match(imgRegex);
                if (imgMatch) image = imgMatch[1];
            }

            // Clean description (remove HTML tags for summary)
            const cleanSummary = description.replace(/<[^>]+>/g, '').substring(0, 200) + (description.length > 200 ? '...' : '');

            if (title && link) {
                items.push({
                    title,
                    link,
                    publishedAt: pubDate || new Date().toISOString(),
                    source: 'Yahoo Finance',
                    summary: cleanSummary,
                    image: image || undefined
                });
            }
        }
        return items;
    }

    async getNews(symbol?: string) {
        try {
            const url = symbol
                ? `https://finance.yahoo.com/rss/headline?s=${symbol}`
                : 'https://finance.yahoo.com/news/rssindex';

            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                }
            });

            if (!response.ok) throw new Error(`RSS fetch failed: ${response.status}`);

            const xml = await response.text();
            const news = this.parseRSS(xml);

            // Sort by date desc
            return news.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

        } catch (error) {
            console.error('[MarketService] Failed to fetch news:', error);

            // Expanded fallback mock news with various categories
            const mockNews = [
                // Companies
                {
                    title: symbol ? `${symbol} Reports Strong Earnings Beat Expectations` : 'Apple Unveils Revolutionary AI Features for iPhone',
                    link: '#',
                    publishedAt: new Date().toISOString(),
                    source: 'Financial Times',
                    summary: symbol ? `${symbol} exceeded analyst estimates with strong revenue growth and positive guidance for the next quarter.` : 'Apple announced groundbreaking AI integration across its product lineup, sending shares higher in after-hours trading.',
                    image: 'https://images.unsplash.com/photo-1611974765270-ca1258634369?q=80&w=600&auto=format&fit=crop'
                },
                {
                    title: 'Tesla Expands Production Capacity in New Gigafactory',
                    link: '#',
                    publishedAt: new Date(Date.now() - 1800000).toISOString(),
                    source: 'Bloomberg',
                    summary: 'Tesla announces plans to increase global production capacity with new manufacturing facilities in strategic locations.',
                    image: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?q=80&w=600&auto=format&fit=crop'
                },
                {
                    title: 'Microsoft y Google Intensifican Competencia en IA',
                    link: '#',
                    publishedAt: new Date(Date.now() - 3600000).toISOString(),
                    source: 'Reuters',
                    summary: 'Las gigantes tecnológicas anuncian nuevas inversiones millonarias en inteligencia artificial y servicios cloud.',
                    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=600&auto=format&fit=crop'
                },
                // Crypto
                {
                    title: 'Bitcoin Alcanza Nuevo Máximo Histórico por Adopción Institucional',
                    link: '#',
                    publishedAt: new Date(Date.now() - 5400000).toISOString(),
                    source: 'CoinDesk',
                    summary: 'El Bitcoin supera los $70,000 impulsado por la creciente adopción de fondos institucionales y ETFs aprobados.',
                    image: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?q=80&w=600&auto=format&fit=crop'
                },
                {
                    title: 'Ethereum Completa Exitosa Actualización de Red',
                    link: '#',
                    publishedAt: new Date(Date.now() - 7200000).toISOString(),
                    source: 'CoinTelegraph',
                    summary: 'La actualización mejora significativamente la escalabilidad y reduce las tarifas de transacción en la red Ethereum.',
                    image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=600&auto=format&fit=crop'
                },
                // Economy
                {
                    title: 'Fed Mantiene Tasas de Interés Estables',
                    link: '#',
                    publishedAt: new Date(Date.now() - 9000000).toISOString(),
                    source: 'Wall Street Journal',
                    summary: 'La Reserva Federal mantiene las tasas sin cambios mientras evalúa datos económicos recientes y la inflación.',
                    image: 'https://images.unsplash.com/photo-1518186285589-2f7649de83e0?q=80&w=600&auto=format&fit=crop'
                },
                {
                    title: 'Informe de Empleos de EE.UU. Supera Expectativas',
                    link: '#',
                    publishedAt: new Date(Date.now() - 10800000).toISOString(),
                    source: 'CNBC',
                    summary: 'Los datos de empleo no agrícola muestran una economía resiliente con bajo desempleo y crecimiento salarial.',
                    image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=600&auto=format&fit=crop'
                },
                // Argentina
                {
                    title: 'Banco Central de Argentina Interviene en Mercado Cambiario',
                    link: '#',
                    publishedAt: new Date(Date.now() - 12600000).toISOString(),
                    source: 'Ámbito Financiero',
                    summary: 'El BCRA implementa nuevas medidas para estabilizar el tipo de cambio y controlar la inflación.',
                    image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=600&auto=format&fit=crop'
                },
                {
                    title: 'YPF Anuncia Récord de Producción en Vaca Muerta',
                    link: '#',
                    publishedAt: new Date(Date.now() - 14400000).toISOString(),
                    source: 'Cronista',
                    summary: 'La petrolera estatal alcanza niveles históricos de extracción en la formación de shale más grande de Latinoamérica.',
                    image: 'https://images.unsplash.com/photo-1545670723-196ed0954986?q=80&w=600&auto=format&fit=crop'
                },
                {
                    title: 'Mercado Libre Expande Operaciones Fintech en Latinoamérica',
                    link: '#',
                    publishedAt: new Date(Date.now() - 16200000).toISOString(),
                    source: 'iProfesional',
                    summary: 'La compañía argentina anuncia nuevos servicios financieros digitales para competir con bancos tradicionales.',
                    image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=600&auto=format&fit=crop'
                },
                // Markets
                {
                    title: 'S&P 500 Cierra en Máximos Históricos',
                    link: '#',
                    publishedAt: new Date(Date.now() - 18000000).toISOString(),
                    source: 'MarketWatch',
                    summary: 'Los principales índices de Wall Street alcanzan nuevos récords impulsados por sector tecnológico y financiero.',
                    image: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?q=80&w=600&auto=format&fit=crop'
                },
                {
                    title: 'Commodities en Alza por Tensiones Geopolíticas',
                    link: '#',
                    publishedAt: new Date(Date.now() - 19800000).toISOString(),
                    source: 'Bloomberg',
                    summary: 'Oro y petróleo registran ganancias significativas ante incertidumbre en mercados globales.',
                    image: 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?q=80&w=600&auto=format&fit=crop'
                },
                {
                    title: 'Sector Inmobiliario Muestra Señales de Recuperación',
                    link: '#',
                    publishedAt: new Date(Date.now() - 21600000).toISOString(),
                    source: 'Financial Times',
                    summary: 'Los REITs y empresas de desarrollo inmobiliario recuperan terreno tras meses de ajustes por tasas altas.',
                    image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=600&auto=format&fit=crop'
                },
                {
                    title: 'Inversores Institucionales Aumentan Posiciones en Mercados Emergentes',
                    link: '#',
                    publishedAt: new Date(Date.now() - 23400000).toISOString(),
                    source: 'Reuters',
                    summary: 'Fondos de inversión globales ven oportunidades de crecimiento en economías en desarrollo.',
                    image: 'https://images.unsplash.com/photo-1559526324-593bc073d938?q=80&w=600&auto=format&fit=crop'
                },
                {
                    title: 'Fusiones y Adquisiciones Tecnológicas Alcanzan Récord',
                    link: '#',
                    publishedAt: new Date(Date.now() - 25200000).toISOString(),
                    source: 'Wall Street Journal',
                    summary: 'La actividad de M&A en el sector tech alcanza niveles no vistos desde 2021, señalando confianza del mercado.',
                    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=600&auto=format&fit=crop'
                }
            ];

            return mockNews;
        }
    }
}
