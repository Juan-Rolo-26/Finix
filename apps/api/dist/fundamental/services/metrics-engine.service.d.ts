import { FundamentalResponse } from '../types/fundamental.types';
export declare class MetricsEngineService {
    enrich(response: FundamentalResponse): FundamentalResponse;
    private calculateSimplifiedDcf;
    private calculateInternalScore;
}
