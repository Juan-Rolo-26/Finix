import { ServiceUnavailableException } from '@nestjs/common';

/** Temporary launch mode. Paid plans and provider credentials remain intact. */
export function isFreeAccessEnabled(): boolean {
    return (process.env.FINIX_FREE_ACCESS_ENABLED ?? 'true').trim().toLowerCase() === 'true';
}

export function assertPurchasesEnabled(): void {
    if (isFreeAccessEnabled()) {
        throw new ServiceUnavailableException('Finix está en una etapa gratuita. Las compras están pausadas y no necesitás pagar para acceder.');
    }
}

export function getAccessMode() {
    const freeAccessEnabled = isFreeAccessEnabled();
    return { freeAccessEnabled, purchasesPaused: freeAccessEnabled };
}

/** Temporary memberships must stop granting paid access when launch mode ends. */
export function isCommunityMembershipActive(member: any): boolean {
    return Boolean(member && member.subscriptionStatus === 'ACTIVE'
        && (member.paymentStatus !== 'FREE_ACCESS' || isFreeAccessEnabled()));
}
