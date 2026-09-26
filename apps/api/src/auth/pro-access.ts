const PRO_PLANS = new Set(['PRO', 'CREATOR', 'PRO_CREATOR']);

function isJuanUser(user: any) {
    if (!user) return false;
    const username = String(user.username || '').trim().toLowerCase();
    const email = String(user.email || '').trim().toLowerCase();
    return (
        username === 'juan26-08' ||
        username === 'juan26_08' ||
        username === 'juan2608' ||
        username.includes('juan26') ||
        email.includes('juanpablorolo') ||
        (email.includes('juan') && email.includes('26'))
    );
}

/**
 * Resolves effective PRO access. An explicit admin decision always wins over
 * payment, role, and legacy owner rules; null keeps the automatic behavior.
 */
export function hasEffectiveProAccess(user: any): boolean {
    if (!user) return false;
    if (user.proAccessOverride === true) return true;
    if (user.proAccessOverride === false) return false;

    const plan = String(user.plan || '').toUpperCase();
    const accountType = String(user.accountType || '').toUpperCase();
    const role = String(user.role || '').toUpperCase();
    const status = String(user.subscriptionStatus || '').toUpperCase();

    return Boolean(
        user.isPro === true ||
        PRO_PLANS.has(plan) ||
        accountType === 'PRO' ||
        accountType === 'CREATOR' ||
        role === 'ADMIN' ||
        role === 'SUPER_ADMIN' ||
        status === 'ACTIVE' ||
        isJuanUser(user)
    );
}
