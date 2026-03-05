import { MarketService } from '../../market/market.service';
import { FundamentalSearchItem, ResolvedSymbol } from '../types/fundamental.types';
export declare class SymbolResolverService {
    private readonly marketService;
    constructor(marketService: MarketService);
    search(query: string, limit?: number): Promise<FundamentalSearchItem[]>;
    resolve(input: string, explicitTvSymbol?: string): Promise<ResolvedSymbol>;
}
