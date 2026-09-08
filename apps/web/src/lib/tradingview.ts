/**
 * tradingview.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Centralized utilities to resolve asset metadata (logo, name, exchange, price)
 * from TradingView's public CDN and our backend market proxy.
 *
 * Logo strategy (in order of priority):
 *   1. TradingView S3 CDN — crypto path  (XTVC{TICKER}--big.svg)
 *   2. TradingView S3 CDN — slug map     ({slug}--big.svg)
 *   3. TradingView S3 CDN — generic      ({ticker.toLowerCase()}--big.svg)
 *   4. Clearbit logo API
 *   5. Letter fallback
 */

import { useState, useEffect, useRef } from 'react';
import { apiFetch } from './api';

// ─── Exchange display labels ──────────────────────────────────────────────────

export const EXCHANGE_LABELS: Record<string, string> = {
    NASDAQ: 'NASDAQ',
    NYSE: 'NYSE',
    BCBA: 'BCBA',
    BYMA: 'BYMA',
    BINANCE: 'Binance',
    BINANCEUS: 'Binance US',
    COINBASE: 'Coinbase',
    BITSTAMP: 'Bitstamp',
    KRAKEN: 'Kraken',
    CRYPTO: 'Crypto',
    OANDA: 'OANDA',
    NYMEX: 'NYMEX',
    COMEX: 'COMEX',
    CBOT: 'CBOT',
    INDEX: 'Índice',
    FOREXCOM: 'Forex',
    FX: 'Forex',
    AMEX: 'AMEX',
    LSE: 'LSE',
    TSX: 'TSX',
    RATES: 'Tasas',
    SP: 'S&P',
};

// ─── Well-known asset names ───────────────────────────────────────────────────

export const ASSET_NAMES: Record<string, string> = {
    // US Tech
    AAPL: 'Apple Inc.', MSFT: 'Microsoft Corp.', GOOGL: 'Alphabet (Google)', GOOG: 'Alphabet (Google)',
    AMZN: 'Amazon.com', META: 'Meta Platforms', NVDA: 'NVIDIA Corp.', TSLA: 'Tesla Inc.',
    NFLX: 'Netflix Inc.', INTC: 'Intel Corp.', AMD: 'Advanced Micro Devices', ORCL: 'Oracle Corp.',
    UBER: 'Uber Technologies', LYFT: 'Lyft Inc.', SNAP: 'Snap Inc.', TWTR: 'X (Twitter)',
    SPOT: 'Spotify Technology', SHOP: 'Shopify Inc.', SQ: 'Block Inc.', PYPL: 'PayPal Holdings',
    ADBE: 'Adobe Inc.', CRM: 'Salesforce Inc.', NOW: 'ServiceNow Inc.', PANW: 'Palo Alto Networks',
    CRWD: 'CrowdStrike Holdings', ZS: 'Soja (Soybeans)', DDOG: 'Datadog Inc.', SNOW: 'Snowflake Inc.',
    COIN: 'Coinbase Global', MSTR: 'MicroStrategy Inc.',
    // Finance
    JPM: 'JPMorgan Chase', BAC: 'Bank of America', GS: 'Goldman Sachs', MS: 'Morgan Stanley',
    V: 'Visa Inc.', MA: 'Mastercard Inc.', AXP: 'American Express', BRK: 'Berkshire Hathaway',
    // Consumer
    KO: 'Coca-Cola Co.', PEP: 'PepsiCo Inc.', WMT: 'Walmart Inc.', TGT: 'Target Corp.',
    COST: 'Costco Wholesale', MCD: 'McDonald\'s Corp.', SBUX: 'Starbucks Corp.',
    DIS: 'Walt Disney Co.', NKE: 'Nike Inc.', PG: 'Procter & Gamble',
    // Energy & Industrial
    XOM: 'Exxon Mobil', CVX: 'Chevron Corp.', BP: 'BP p.l.c.', GE: 'GE Aerospace',
    CAT: 'Caterpillar Inc.', BA: 'Boeing Co.', LMT: 'Lockheed Martin',
    // Health
    JNJ: 'Johnson & Johnson', PFE: 'Pfizer Inc.', MRNA: 'Moderna Inc.',
    ABBV: 'AbbVie Inc.', UNH: 'UnitedHealth Group',
    // ETFs
    SPY: 'SPDR S&P 500 ETF', QQQ: 'Invesco QQQ ETF', DIA: 'SPDR Dow Jones ETF',
    VTI: 'Vanguard Total Market ETF', IWM: 'iShares Russell 2000 ETF',
    GLD: 'SPDR Gold Shares', SLV: 'iShares Silver Trust',
    // Índices
    SPX: 'S&P 500', SPXUSD: 'S&P 500', NDX: 'NASDAQ 100', NSXUSD: 'NASDAQ 100',
    DJI: 'Dow Jones Industrial', VIX: 'CBOE Volatility Index',
    // Crypto
    BTC: 'Bitcoin', ETH: 'Ethereum', BNB: 'Binance Coin', SOL: 'Solana', XRP: 'Ripple',
    ADA: 'Cardano', AVAX: 'Avalanche', DOGE: 'Dogecoin', DOT: 'Polkadot',
    MATIC: 'Polygon (MATIC)', LINK: 'Chainlink', UNI: 'Uniswap', LTC: 'Litecoin',
    ATOM: 'Cosmos', ALGO: 'Algorand', FIL: 'Filecoin', NEAR: 'NEAR Protocol',
    // Commodities
    XAUUSD: 'Oro (Gold)', XAGUSD: 'Plata (Silver)', CL: 'Petróleo WTI',
    NG: 'Gas Natural', SOYBEANS: 'Soja (Soybeans)', ZW: 'Trigo (Wheat)', ZC: 'Maíz (Corn)',
    HG: 'Cobre (Copper)',
    // Forex
    EURUSD: 'Euro / Dólar', GBPUSD: 'Libra / Dólar', USDJPY: 'Dólar / Yen',
    AUDUSD: 'Dólar AUS / USD', USDCAD: 'Dólar / CAD',
    // Argentine BCBA
    GGAL: 'Grupo Financiero Galicia', YPFD: 'YPF S.A.', PAMP: 'Pampa Energía',
    CEPU: 'Central Puerto', BMA: 'Banco Macro', EDN: 'Edenor', LOMA: 'Loma Negra',
    TGS: 'Transportadora Gas Sur', AL30: 'Bono AL30 (USD)', GD30: 'Bono GD30 (USD)',
    AY24: 'Bono AY24', TX26: 'Bono TX26', MIRG: 'Mirgor S.A.C.I.',
    BYMA: 'BYMA S.A.', TECO2: 'Telecom Argentina', COME: 'Sociedad Comercial del Plata',
};

// ─── TradingView logo slug maps ───────────────────────────────────────────────

const CRYPTO_TV_MAP: Record<string, string> = {
    BTC: 'bitcoin', ETH: 'ethereum', BNB: 'binance-coin', SOL: 'solana',
    XRP: 'ripple', ADA: 'cardano', AVAX: 'avalanche', DOGE: 'dogecoin',
    DOT: 'polkadot-new', MATIC: 'polygon', LINK: 'chainlink', UNI: 'uniswap',
    LTC: 'litecoin', ATOM: 'cosmos', ALGO: 'algorand', FIL: 'filecoin',
    NEAR: 'near-protocol', USDT: 'tether', USDC: 'usd-coin',
};

const TV_SLUG_MAP: Record<string, string> = {
    AAPL: 'apple', MSFT: 'microsoft', TSLA: 'tesla', GOOGL: 'alphabet', GOOG: 'alphabet',
    AMZN: 'amazon', META: 'meta', NVDA: 'nvidia', NFLX: 'netflix',
    JPM: 'jpmorgan-chase', BAC: 'bank-of-america', V: 'visa', MA: 'mastercard',
    DIS: 'walt-disney', KO: 'coca-cola', PEP: 'pepsico', WMT: 'walmart',
    PG: 'procter-and-gamble', JNJ: 'johnson-and-johnson', XOM: 'exxon-mobil',
    CVX: 'chevron', SPY: 'sp-global', QQQ: 'invesco', INTC: 'intel',
    AMD: 'advanced-micro-devices', ORCL: 'oracle', UBER: 'uber-technologies',
    SPOT: 'spotify-technology', SHOP: 'shopify', PYPL: 'paypal',
    ADBE: 'adobe', CRM: 'salesforce', GS: 'goldman-sachs',
    MCD: 'mcdonalds', SBUX: 'starbucks', NKE: 'nike', BA: 'boeing',
    GE: 'ge-aerospace', CAT: 'caterpillar', PFE: 'pfizer', MRNA: 'moderna',
    ABBV: 'abbvie', UNH: 'unitedhealth-group', COIN: 'coinbase',
    MSTR: 'microstrategy', DDOG: 'datadog', SNOW: 'snowflake', CRWD: 'crowdstrike',
    LAC: 'lithium-americas', MELI: 'mercadolibre',
};

// ─── Logo URL builder ─────────────────────────────────────────────────────────

export function getLogoUrls(symbol: string): string[] {
    // Parse exchange + ticker from "EXCHANGE:TICKER" or plain "TICKER"
    const parts = symbol.split(':');
    const exchange = parts.length > 1 ? parts[0].toUpperCase() : '';
    const ticker = (parts[parts.length - 1] ?? symbol).toUpperCase();

    // Normalize crypto tickers: remove trailing USD/USDT
    const cleanTicker = ticker.replace(/USD(T)?$/, '');

    const urls: string[] = [];
    const isCrypto = exchange === 'CRYPTO' || exchange === 'BINANCE' || exchange === 'COINBASE'
        || exchange === 'BITSTAMP' || exchange === 'KRAKEN' || CRYPTO_TV_MAP[cleanTicker] != null;

    if (isCrypto) {
        // TradingView crypto CDN (most reliable)
        urls.push(`https://s3-symbol-logo.tradingview.com/crypto/XTVC${cleanTicker}--big.svg`);
        const cryptoSlug = CRYPTO_TV_MAP[cleanTicker];
        if (cryptoSlug) {
            urls.push(`https://s3-symbol-logo.tradingview.com/${cryptoSlug}--big.svg`);
        }
    }

    // TradingView slug for well-known stocks
    const tvSlug = TV_SLUG_MAP[ticker] ?? TV_SLUG_MAP[cleanTicker];
    if (tvSlug) {
        urls.push(`https://s3-symbol-logo.tradingview.com/${tvSlug}--big.svg`);
    }

    // Generic TradingView CDN attempt
    if (cleanTicker.length >= 2 && !isCrypto) {
        urls.push(`https://s3-symbol-logo.tradingview.com/${cleanTicker.toLowerCase()}--big.svg`);
    }

    // Clearbit domain lookup for company logos
    const DOMAIN_MAP: Record<string, string> = {
        AAPL: 'apple.com', MSFT: 'microsoft.com', TSLA: 'tesla.com',
        GOOGL: 'google.com', GOOG: 'google.com', AMZN: 'amazon.com',
        META: 'meta.com', NVDA: 'nvidia.com', NFLX: 'netflix.com',
        JPM: 'jpmorganchase.com', BAC: 'bankofamerica.com', V: 'visa.com',
        MA: 'mastercard.com', DIS: 'disney.com', KO: 'coca-cola.com',
        PEP: 'pepsico.com', WMT: 'walmart.com', MCD: 'mcdonalds.com',
        SBUX: 'starbucks.com', INTC: 'intel.com', AMD: 'amd.com', ORCL: 'oracle.com',
        UBER: 'uber.com', SPOT: 'spotify.com', SHOP: 'shopify.com', PYPL: 'paypal.com',
        ADBE: 'adobe.com', CRM: 'salesforce.com', NKE: 'nike.com',
        LAC: 'lithiumamericas.com', GGAL: 'bancogalicia.com',
        YPFD: 'ypf.com', PAMP: 'pampaenergia.com', CEPU: 'centralpuerto.com',
        BMA: 'macro.com.ar', EDN: 'edenor.com', LOMA: 'lomanegra.com',
        TGS: 'tgs.com.ar', MIRG: 'mirgor.com.ar', TECO2: 'telecom.com.ar',
        AL30: 'argentina.gob.ar', GD30: 'argentina.gob.ar',
    };
    const domain = DOMAIN_MAP[ticker];
    if (domain) {
        urls.push(`https://logo.clearbit.com/${domain}`);
    }

    // Country flag fallback for local exchanges
    if (exchange === 'BCBA' || exchange === 'BYMA') {
        urls.push(`https://s3-symbol-logo.tradingview.com/country/AR.svg`);
    }

    return [...new Set(urls)]; // deduplicate
}

// ─── Asset info resolver ──────────────────────────────────────────────────────

export interface AssetInfo {
    ticker: string;       // Just the ticker without exchange (e.g. "AAPL")
    exchange: string;     // Exchange prefix (e.g. "NASDAQ")
    displayName: string;  // Full human name (e.g. "Apple Inc.")
    logoUrls: string[];   // Ordered array of logo URL candidates to try
}

export function resolveAssetInfo(symbol: string): AssetInfo {
    const parts = (symbol || '').trim().toUpperCase().split(':');
    const exchange = parts.length > 1 ? parts[0] : '';
    const ticker = parts[parts.length - 1] ?? symbol.toUpperCase();
    const cleanTicker = ticker.replace(/USD(T)?$/, '');

    const displayName =
        ASSET_NAMES[ticker] ??
        ASSET_NAMES[cleanTicker] ??
        ticker;

    return {
        ticker,
        exchange,
        displayName,
        logoUrls: getLogoUrls(symbol),
    };
}

// ─── Exchange display label ───────────────────────────────────────────────────

export function getExchangeLabel(exchange: string): string {
    const upper = (exchange || '').toUpperCase();
    return EXCHANGE_LABELS[upper] ?? upper;
}

// ─── Real-time price hook (via backend market proxy) ─────────────────────────

interface LivePrice {
    price: number | null;
    change: number | null;    // percent
    loading: boolean;
}

const priceCache = new Map<string, { price: number; change: number; ts: number }>();
const CACHE_TTL = 30_000; // 30s

export function useLivePrice(symbol: string): LivePrice {
    const [state, setState] = useState<LivePrice>({ price: null, change: null, loading: !!symbol });
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (!symbol) { setState({ price: null, change: null, loading: false }); return; }

        let cancelled = false;

        const fetch_ = async () => {
            // Check cache
            const cached = priceCache.get(symbol);
            if (cached && Date.now() - cached.ts < CACHE_TTL) {
                if (!cancelled) setState({ price: cached.price, change: cached.change, loading: false });
                return;
            }

            setState(s => ({ ...s, loading: true }));
            try {
                const res = await apiFetch(`/market/quote?symbol=${encodeURIComponent(symbol)}`);
                if (!res.ok) throw new Error('quote failed');
                const data = await res.json();
                const price = typeof data.price === 'number' ? data.price : null;
                const change = typeof data.change === 'number' ? data.change : null;
                if (price !== null) priceCache.set(symbol, { price, change: change ?? 0, ts: Date.now() });
                if (!cancelled) setState({ price, change, loading: false });
            } catch {
                if (!cancelled) setState(s => ({ ...s, loading: false }));
            }
        };

        fetch_();
        timerRef.current = setInterval(fetch_, CACHE_TTL);

        return () => {
            cancelled = true;
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [symbol]);

    return state;
}
