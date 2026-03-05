export type PlanType = 'free' | 'pro_investor' | 'pro_creator';
export interface PlanPermissions {
    maxPortfolios: number;
    canUseAI: boolean;
    canJoinPaidCommunities: boolean;
    canCreateCommunities: boolean;
    canMonetize: boolean;
    hasAds: boolean;
}
export declare const PLAN_PERMISSIONS: Record<PlanType, PlanPermissions>;
export declare const ACTIVE_SUBSCRIPTION_STATUSES: Set<string>;
export declare const ACTIVE_COMMUNITY_STATUSES: Set<string>;
export declare const normalizePlan: (plan: string | null | undefined) => PlanType;
export declare const isPaidPlan: (plan: PlanType) => plan is "pro_investor" | "pro_creator";
export declare const hasActivePaidSubscription: (plan: PlanType, subscriptionStatus: string | null | undefined) => boolean;
