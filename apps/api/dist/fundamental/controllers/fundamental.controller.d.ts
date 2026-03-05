import { FundamentalOrchestratorService } from '../services/fundamental-orchestrator.service';
export declare class FundamentalController {
    private readonly orchestrator;
    constructor(orchestrator: FundamentalOrchestratorService);
    getProviders(): import("../types/provider.types").ProviderDescriptor[];
    search(query: any): Promise<import("../types/fundamental.types").FundamentalSearchItem[]>;
    getFundamentals(ticker: string, query: any): Promise<import("../types/fundamental.types").FundamentalResponse>;
    refreshFundamentals(ticker: string, query: any): Promise<import("../types/fundamental.types").FundamentalResponse>;
}
