export type PlanType = 'free' | 'pro_investor' | 'pro_creator';

export interface PlanPermissions {
    maxPortfolios: number;
    canUseAI: boolean;
    canJoinPaidCommunities: boolean;
    canCreateCommunities: boolean;
    canMonetize: boolean;
    hasAds: boolean;
}

export const PLAN_PERMISSIONS: Record<PlanType, PlanPermissions> = {
    free: {
        maxPortfolios: 1,
        canUseAI: false,
        canJoinPaidCommunities: true,
        canCreateCommunities: false,
        canMonetize: false,
        hasAds: true,
    },
    pro_investor: {
        maxPortfolios: Number.POSITIVE_INFINITY,
        canUseAI: true,
        canJoinPaidCommunities: true,
        canCreateCommunities: false,
        canMonetize: false,
        hasAds: false,
    },
    pro_creator: {
        maxPortfolios: Number.POSITIVE_INFINITY,
        canUseAI: true,
        canJoinPaidCommunities: true,
        canCreateCommunities: true,
        canMonetize: true,
        hasAds: false,
    },
};

export const ACTIVE_SUBSCRIPTION_STATUSES = new Set(['ACTIVE', 'TRIALING']);
export const ACTIVE_COMMUNITY_STATUSES = new Set(['ACTIVE']);

export const normalizePlan = (plan: string | null | undefined): PlanType => {
    const normalized = String(plan || '').trim().toLowerCase();
    if (normalized === 'pro_creator') return 'pro_creator';
    if (normalized === 'pro_investor') return 'pro_investor';
    return 'free';
};

export const isPaidPlan = (plan: PlanType) => plan !== 'free';

export const hasActivePaidSubscription = (plan: PlanType, subscriptionStatus: string | null | undefined) => {
    if (!isPaidPlan(plan)) {
        return true;
    }

    const normalizedStatus = String(subscriptionStatus || '').toUpperCase();
    return ACTIVE_SUBSCRIPTION_STATUSES.has(normalizedStatus);
};
