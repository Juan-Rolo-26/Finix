export type FinixPlan = 'FREE' | 'PRO' | 'CREATOR';
export type PaidPlan = Exclude<FinixPlan, 'FREE'>;

export const PLAN_NAMES: Record<FinixPlan, string> = { FREE: 'Finix Free', PRO: 'Finix PRO', CREATOR: 'Finix Creador' };

// Subscription identity is separate from temporary or administrator-granted access.
export function subscribedPlan(user: { plan?: string; subscriptionStatus?: string } | null | undefined): FinixPlan {
    if (!['ACTIVE', 'TRIALING'].includes(String(user?.subscriptionStatus).toUpperCase())) return 'FREE';
    const plan = String(user?.plan).toUpperCase();
    if (['CREATOR', 'PRO_CREATOR'].includes(plan)) return 'CREATOR';
    if (['PRO', 'PRO_INVESTOR'].includes(plan)) return 'PRO';
    return 'FREE';
}

export function formatArs(value: number | null | undefined) {
    return value == null ? 'Precio no disponible' : `$${value.toLocaleString('es-AR')} ARS`;
}
