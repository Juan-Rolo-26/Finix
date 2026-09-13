import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { TV_SYMBOL_SLUGS } from './tv-slugs.const';

@Injectable()
export class AssetLogoService {
    private readonly logger = new Logger(AssetLogoService.name);
    private logoCache = new Map<string, string>();

    constructor(private prisma: PrismaService) {
        // Precargar caché con los 500+ slugs de TradingView
        for (const [ticker, slug] of Object.entries(TV_SYMBOL_SLUGS)) {
            if (slug) {
                const url = `https://s3-symbol-logo.tradingview.com/${slug}--big.svg`;
                this.logoCache.set(ticker.toUpperCase(), url);
            }
        }
    }

    /**
     * Devuelve la URL del logo de TradingView para el ticker solicitado.
     * Si no se encuentra en el mapa local, realiza una consulta al scanner de TradingView
     * para obtener el logoid exacto y guardarlo en caché.
     */
    async resolveTradingViewLogo(ticker: string): Promise<string> {
        const cleanTicker = (ticker || '').trim().toUpperCase().replace(/^[A-Z0-9]+:/, '');
        if (!cleanTicker) return '';

        if (this.logoCache.has(cleanTicker)) {
            return this.logoCache.get(cleanTicker)!;
        }

        const knownSlug = TV_SYMBOL_SLUGS[cleanTicker] || TV_SYMBOL_SLUGS[cleanTicker.replace('.', '')];
        if (knownSlug) {
            const url = `https://s3-symbol-logo.tradingview.com/${knownSlug}--big.svg`;
            this.logoCache.set(cleanTicker, url);
            return url;
        }

        // Consulta dinámica a TradingView scanner para obtener logoid
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3500);

            const res = await fetch('https://scanner.tradingview.com/america/scan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                },
                body: JSON.stringify({
                    symbols: { tickers: [`NASDAQ:${cleanTicker}`, `NYSE:${cleanTicker}`] },
                    columns: ['name', 'logoid']
                }),
                signal: controller.signal,
            });
            clearTimeout(timeoutId);

            if (res.ok) {
                const json: any = await res.json();
                const found = json?.data?.find((d: any) => d?.d?.[1]);
                if (found && found.d[1]) {
                    const tvUrl = `https://s3-symbol-logo.tradingview.com/${found.d[1]}--big.svg`;
                    this.logoCache.set(cleanTicker, tvUrl);
                    return tvUrl;
                }
            }
        } catch (err: any) {
            this.logger.debug(`Could not resolve dynamic TradingView logo for ${cleanTicker}: ${err.message}`);
        }

        // Fallback TradingView slug directo
        const fallbackTvUrl = `https://s3-symbol-logo.tradingview.com/${cleanTicker.toLowerCase()}--big.svg`;
        this.logoCache.set(cleanTicker, fallbackTvUrl);
        return fallbackTvUrl;
    }

    /**
     * Devuelve una URL canónica y consistente basada en TradingView para el activo.
     */
    getCanonicalLogoUrl(ticker: string): string {
        const cleanTicker = (ticker || '').trim().toUpperCase().replace(/^[A-Z0-9]+:/, '');
        if (!cleanTicker) return '';

        if (this.logoCache.has(cleanTicker)) {
            return this.logoCache.get(cleanTicker)!;
        }

        const slug = TV_SYMBOL_SLUGS[cleanTicker] || TV_SYMBOL_SLUGS[cleanTicker.replace('.', '')];
        if (slug) {
            const url = `https://s3-symbol-logo.tradingview.com/${slug}--big.svg`;
            this.logoCache.set(cleanTicker, url);
            return url;
        }

        // Fallback TradingView SVG o CDN
        const url = `https://s3-symbol-logo.tradingview.com/${cleanTicker.toLowerCase()}--big.svg`;
        this.logoCache.set(cleanTicker, url);
        return url;
    }
}

