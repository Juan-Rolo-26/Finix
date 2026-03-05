import { PrismaService } from '../../prisma.service';
import { FundamentalProviderId } from '../types/provider.types';
export declare class ProviderHealthService {
    private readonly prisma;
    private readonly logger;
    private readonly states;
    constructor(prisma: PrismaService);
    private isMissingStorage;
    private getState;
    isOpen(provider: FundamentalProviderId): Promise<boolean>;
    recordSuccess(provider: FundamentalProviderId): Promise<void>;
    recordFailure(params: {
        provider: FundamentalProviderId;
        message: string;
        statusCode?: number;
    }): Promise<void>;
    private persist;
}
