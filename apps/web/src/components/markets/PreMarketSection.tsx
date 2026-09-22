export interface PremarketAsset {
    id: string;
    symbol: string;
    label: string;
    description: string;
    format: 'currency' | 'number' | 'percent';
    currency?: 'ARS' | 'USD';
    price: number | null;
    change: number | null;
    premarketPrice?: number | null;
    premarketChange?: number | null;
    regularPrice?: number | null;
    regularChange?: number | null;
    isPremarketQuote?: boolean;
    updatedAt: string;
    unavailable: boolean;
}

export interface PremarketData {
    updatedAt: string;
    isFrozenPremarket?: boolean;
    session: {
        status: 'pre-market' | 'regular' | 'post-market' | 'closed';
        label: string;
        nextBell: string;
        secondsToOpen: number;
        sentiment: 'bullish' | 'neutral' | 'cautious' | 'bearish';
        sentimentScore: number;
        sentimentSummary: string;
    };
    topGainers?: PremarketAsset[];
    topLosers?: PremarketAsset[];
    indices: PremarketAsset[];
    commodities: PremarketAsset[];
    magnificent7: PremarketAsset[];
    argentina: PremarketAsset[];
    crypto: PremarketAsset[];
}

export { default } from './PremarketBrief';
