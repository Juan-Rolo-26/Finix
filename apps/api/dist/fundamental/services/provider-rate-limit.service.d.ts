import { FundamentalProviderId } from '../types/provider.types';
export declare class ProviderRateLimitService {
    private readonly limits;
    private readonly states;
    private readonly queues;
    private waitForSlot;
    schedule<T>(provider: FundamentalProviderId, task: () => Promise<T>): Promise<T>;
}
