import { useState } from 'react';

// Maps ticker → clearbit domain for well-known companies
export const DOMAIN_MAP: Record<string, string> = {
    AAPL: 'apple.com', MSFT: 'microsoft.com', TSLA: 'tesla.com',
    GOOGL: 'google.com', GOOG: 'google.com', AMZN: 'amazon.com',
    META: 'meta.com', NVDA: 'nvidia.com', NFLX: 'netflix.com',
    JPM: 'jpmorganchase.com', BAC: 'bankofamerica.com', V: 'visa.com',
    MA: 'mastercard.com', DIS: 'disney.com', KO: 'coca-cola.com',
    PEP: 'pepsico.com', WMT: 'walmart.com', PG: 'pg.com',
    JNJ: 'jnj.com', XOM: 'exxonmobil.com', CVX: 'chevron.com',
    SPX: 'spglobal.com', SPXUSD: 'spglobal.com', NSXUSD: 'nasdaq.com',
};

// TradingView crypto logo paths
export const CRYPTO_TV_MAP: Record<string, string> = {
    BTC: 'bitcoin', ETH: 'ethereum', BNB: 'binance-coin',
    SOL: 'solana', XRP: 'ripple', ADA: 'cardano', AVAX: 'avalanche',
    DOGE: 'dogecoin', DOT: 'polkadot-new', MATIC: 'polygon',
    LINK: 'chainlink', UNI: 'uniswap', LTC: 'litecoin',
};

// TradingView slug map for famous stocks
export const TV_SLUG_MAP: Record<string, string> = {
    AAPL: 'apple', MSFT: 'microsoft', TSLA: 'tesla',
    GOOGL: 'alphabet', GOOG: 'alphabet', AMZN: 'amazon',
    META: 'meta', NVDA: 'nvidia', NFLX: 'netflix',
    JPM: 'jpmorgan-chase', BAC: 'bank-of-america', V: 'visa',
    MA: 'mastercard', DIS: 'walt-disney', KO: 'coca-cola',
    PEP: 'pepsico', WMT: 'walmart', PG: 'procter-and-gamble',
    JNJ: 'johnson-and-johnson', XOM: 'exxon-mobil', CVX: 'chevron',
    SPY: 'sp-global', QQQ: 'invesco', DIA: 'sp-global',
};

export function SymbolLogo({ symbol, size = 32 }: { symbol: string; size?: number }) {
    const clean = symbol.split(':').pop() ?? symbol;
    const normalized = clean.replace(/USD$/, '').replace(/USDT$/, '');
    const upper = normalized.toUpperCase();

    // Build ordered list of logo URLs to try
    const getUrls = (): string[] => {
        const urls: string[] = [];

        // 1. TradingView CDN (works for crypto and exact mapped slugs)
        const cryptoPath = CRYPTO_TV_MAP[upper];
        if (cryptoPath) {
            urls.push(`https://s3-symbol-logo.tradingview.com/crypto/XTVC${upper}--big.svg`);
            urls.push(`https://s3-symbol-logo.tradingview.com/${cryptoPath}--big.svg`);
        } else {
            const tvSlug = TV_SLUG_MAP[upper];
            if (tvSlug) urls.push(`https://s3-symbol-logo.tradingview.com/${tvSlug}--big.svg`);
        }

        // 2. Clearbit & Google Favicons Domains
        const domain = DOMAIN_MAP[upper];
        if (domain) {
            urls.push(`https://logo.clearbit.com/${domain}`);
            urls.push(`https://www.google.com/s2/favicons?domain=${domain}&sz=128`);
        }

        // 3. Fallback generic lowercases
        urls.push(`https://s3-symbol-logo.tradingview.com/${normalized.toLowerCase()}--big.svg`);
        urls.push(`https://logo.clearbit.com/${normalized.toLowerCase()}.com`);
        urls.push(`https://www.google.com/s2/favicons?domain=${normalized.toLowerCase()}.com&sz=128`);

        return urls;
    };

    const urls = getUrls();
    const [idx, setIdx] = useState(0);
    const [failed, setFailed] = useState(false);

    const letter = normalized.slice(0, 1).toUpperCase();

    const handleError = () => {
        if (idx + 1 < urls.length) {
            setIdx(i => i + 1);
        } else {
            setFailed(true);
        }
    };

    if (failed) {
        return (
            <div
                className="flex items-center justify-center font-black rounded-lg flex-shrink-0"
                style={{
                    width: size,
                    height: size,
                    fontSize: size * 0.38,
                    background: 'hsl(var(--primary) / 0.15)',
                    color: 'hsl(var(--primary))',
                }}
            >
                {letter}
            </div>
        );
    }

    return (
        <img
            key={idx}
            src={urls[idx]}
            alt={normalized}
            onError={handleError}
            style={{ width: size, height: size, borderRadius: size * 0.28, objectFit: 'contain', flexShrink: 0, background: 'hsl(var(--card))' }}
        />
    );
}
