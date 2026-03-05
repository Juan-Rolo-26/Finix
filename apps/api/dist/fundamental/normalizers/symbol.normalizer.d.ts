import { FundamentalSearchItem, ResolvedSymbol } from '../types/fundamental.types';
export declare function fromSearchResult(input: {
    input: string;
    symbol: string;
    exchange?: string;
    type?: string;
    name?: string;
}): FundamentalSearchItem;
export declare function fromDirectTicker(ticker: string): ResolvedSymbol;
