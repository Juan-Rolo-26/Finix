"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasActivePaidSubscription = exports.isPaidPlan = exports.normalizePlan = exports.ACTIVE_COMMUNITY_STATUSES = exports.ACTIVE_SUBSCRIPTION_STATUSES = exports.PLAN_PERMISSIONS = void 0;
exports.PLAN_PERMISSIONS = {
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
exports.ACTIVE_SUBSCRIPTION_STATUSES = new Set(['ACTIVE', 'TRIALING']);
exports.ACTIVE_COMMUNITY_STATUSES = new Set(['ACTIVE']);
const normalizePlan = (plan) => {
    const normalized = String(plan || '').trim().toLowerCase();
    if (normalized === 'pro_creator')
        return 'pro_creator';
    if (normalized === 'pro_investor')
        return 'pro_investor';
    return 'free';
};
exports.normalizePlan = normalizePlan;
const isPaidPlan = (plan) => plan !== 'free';
exports.isPaidPlan = isPaidPlan;
const hasActivePaidSubscription = (plan, subscriptionStatus) => {
    if (!(0, exports.isPaidPlan)(plan)) {
        return true;
    }
    const normalizedStatus = String(subscriptionStatus || '').toUpperCase();
    return exports.ACTIVE_SUBSCRIPTION_STATUSES.has(normalizedStatus);
};
exports.hasActivePaidSubscription = hasActivePaidSubscription;
//# sourceMappingURL=plan-permissions.js.map