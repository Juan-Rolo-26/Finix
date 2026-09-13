import { Injectable, Logger } from '@nestjs/common';
import { IMarketDataProvider, MarketQuoteResult, SP500Constituent } from '../interfaces/market-data-provider.interface';

@Injectable()
export class MarketDataProviderService implements IMarketDataProvider {
    readonly providerName = 'FinancialDataProvider';
    private readonly logger = new Logger(MarketDataProviderService.name);

    private readonly SP500_CSV_URL = 'https://raw.githubusercontent.com/datasets/s-and-p-500-companies/master/data/constituents.csv';

    /**
     * Obtiene los componentes actuales del S&P 500 de manera dinámica.
     */
    async getSP500Constituents(): Promise<SP500Constituent[]> {
        this.logger.log('Fetching S&P 500 constituents from verified dataset...');
        try {
            const res = await fetch(this.SP500_CSV_URL, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (FinixMarketBot/1.0)',
                    'Accept': 'text/csv,text/plain,*/*',
                },
                signal: AbortSignal.timeout(12000),
            });

            if (!res.ok) {
                throw new Error(`Failed to fetch S&P 500 CSV: HTTP ${res.status}`);
            }

            const csvText = await res.text();
            const lines = csvText.split('\n');
            if (lines.length <= 1) {
                throw new Error('Empty or invalid S&P 500 CSV');
            }

            const constituents: SP500Constituent[] = [];
            // Parse CSV lines: Symbol,Security,GICS Sector,GICS Sub-Industry,Headquarters Location,Date added,CIK,Founded
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;

                // Simple robust regex CSV line parser
                const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
                const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
                if (cols.length >= 2) {
                    const rawTicker = cols[0].trim();
                    const companyName = cols[1].trim();
                    const sector = cols[2] ? cols[2].trim() : undefined;
                    const subIndustry = cols[3] ? cols[3].trim() : undefined;

                    if (rawTicker && companyName) {
                        // Normalize ticker (e.g. BRK.B -> BRK-B)
                        const ticker = rawTicker.replace(/\./g, '-').toUpperCase();
                        constituents.push({
                            ticker,
                            companyName,
                            sector,
                            industry: subIndustry,
                            exchange: 'US'
                        });
                    }
                }
            }

            this.logger.log(`Successfully obtained ${constituents.length} S&P 500 constituents.`);
            return constituents;
        } catch (error: any) {
            this.logger.error(`Error getting S&P 500 constituents: ${error.message}`);
            throw error;
        }
    }

    /**
     * Obtiene cotizaciones de mercado en batches para un conjunto de tickers.
     * Implementa concurrencia con pool de hilos para procesar todos los símbolos eficientemente.
     */
    async getBatchQuotes(tickers: string[]): Promise<Map<string, MarketQuoteResult>> {
        const quoteMap = new Map<string, MarketQuoteResult>();
        if (!tickers || tickers.length === 0) return quoteMap;

        const CONCURRENCY = 15;
        const total = tickers.length;
        let index = 0;

        const worker = async () => {
            while (index < total) {
                const currentTicker = tickers[index++];
                try {
                    const quote = await this.fetchSingleQuote(currentTicker);
                    if (quote) {
                        quoteMap.set(currentTicker, quote);
                    }
                } catch (err) {
                    // Ignorar fallas individuales de un ticker para no interrumpir el ranking
                }
            }
        };

        const workers = Array.from({ length: Math.min(CONCURRENCY, total) }, () => worker());
        await Promise.all(workers);

        this.logger.log(`Fetched quotes for ${quoteMap.size}/${tickers.length} tickers.`);
        return quoteMap;
    }

    private async fetchSingleQuote(ticker: string): Promise<MarketQuoteResult | null> {
        try {
            const clean = ticker.replace(/\./g, '-').toUpperCase();
            const url = `https://query1.finance.yahoo.com/v8/finance/chart/${clean}?interval=1d&range=1d`;
            const res = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'application/json',
                },
                signal: AbortSignal.timeout(6000),
            });

            if (!res.ok) return null;
            const data = await res.json();
            const meta = data?.chart?.result?.[0]?.meta;
            if (!meta) return null;

            const price = Number(meta.regularMarketPrice);
            const previousClose = Number(meta.chartPreviousClose);
            const volume = Number(meta.regularMarketVolume ?? 0);
            const timestamp = Number(meta.regularMarketTime ?? Math.floor(Date.now() / 1000));

            // Validación estricta
            if (!Number.isFinite(price) || price <= 0) return null;
            if (!Number.isFinite(previousClose) || previousClose <= 0) return null;
            if (!Number.isFinite(volume) || volume <= 0) return null;

            const change = Number((price - previousClose).toFixed(4));
            const changePercent = Number((((price - previousClose) / previousClose) * 100).toFixed(4));

            return {
                ticker: clean,
                price,
                previousClose,
                change,
                changePercent,
                volume,
                timestamp,
                exchange: meta.exchangeName || 'US'
            };
        } catch {
            return null;
        }
    }
}
