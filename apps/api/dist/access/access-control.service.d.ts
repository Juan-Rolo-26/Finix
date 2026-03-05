import { PrismaService } from '../prisma.service';
export declare class AccessControlService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    requirePro(userId: string): Promise<{
        id: string;
        role: string;
        plan: string;
        subscriptionStatus: string;
    }>;
    limitFreePortfolio(userId: string): Promise<boolean>;
    requirePaidCommunityAccess(userId: string, communityId: string): Promise<boolean>;
    requireCreator(userId: string): Promise<{
        id: string;
        isCreator: boolean;
    }>;
    requirePlan(userId: string, allowedPlans: string[]): Promise<{
        id: string;
        role: string;
        plan: string;
        subscriptionStatus: string;
    }>;
}
