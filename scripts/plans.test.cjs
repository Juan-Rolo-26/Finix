const { test } = require('node:test');
const assert = require('node:assert/strict');
const { BillingService } = require('../apps/api/dist/billing/billing.service');
const { StripeService } = require('../apps/api/dist/stripe/stripe.service');
const { MercadoPagoController } = require('../apps/api/dist/mercadopago/mercadopago.controller');
const { WATCHLIST_CONFIG } = require('../apps/api/dist/watchlist/watchlist.config');

function fixture(overrides = {}, provider = 'mp') {
    const calls = [];
    const user = { id: 'test', plan: 'PRO', role: 'USER', subscriptionStatus: 'ACTIVE' };
    const subscription = { id: 'sub', status: 'ACTIVE', planType: 'PRO', endDate: new Date(Date.now() + 86400000), cancelAtPeriodEnd: false, ...(provider === 'mp' ? { mercadoPagoPreapprovalId: 'preapproval' } : { stripeSubscriptionId: 'stripe-sub' }), ...overrides };
    const prisma = {
        user: { findUnique: async () => user, update: async input => { calls.push(['user', input]); return Object.assign(user, input.data); } },
        subscription: {
            findFirst: async input => input.where.status === 'ACTIVE' ? null : subscription,
            update: async input => { calls.push(['subscription', input]); return Object.assign(subscription, input.data); },
        },
    };
    const mp = { cancelPreapproval: async id => { calls.push(['mp', id]); } };
    const stripe = { cancelSubscription: async (...args) => { calls.push(['stripe', ...args]); } };
    return { service: new BillingService(prisma, {}, stripe, mp), prisma, user, subscription, calls, mp, stripe };
}

for (const provider of ['mp', 'stripe']) {
    test(`${provider}: a provider failure does not cancel the account or report success`, async () => {
        const state = fixture({}, provider);
        state[provider][provider === 'mp' ? 'cancelPreapproval' : 'cancelSubscription'] = async () => { throw new Error('provider unavailable'); };
        await assert.rejects(state.service.cancelProSubscription('test', 'PRO'), /provider unavailable/);
        assert.equal(state.calls.length, 0);
        assert.equal(state.user.plan, 'PRO');
        assert.equal(state.subscription.cancelAtPeriodEnd, false);
    });
    test(`${provider}: successful cancellation preserves the paid period and is idempotent`, async () => {
        const state = fixture({}, provider);
        const result = await state.service.cancelProSubscription('test', 'PRO');
        assert.equal(result.success, true);
        assert.equal(result.user.plan, 'PRO');
        assert.equal(state.subscription.status, 'ACTIVE');
        assert.equal(state.subscription.cancelAtPeriodEnd, true);
        await state.service.cancelProSubscription('test', 'PRO');
        assert.equal(state.calls.filter(call => call[0] === provider).length, 1);
        assert.equal(state.calls.filter(call => call[0] === 'user').length, 0);
    });
}
test('manually granted access is not downgraded when no billable subscription exists', async () => {
    const state = fixture();
    state.prisma.subscription.findFirst = async () => null;
    await assert.rejects(state.service.cancelProSubscription('test', 'PRO'), /No hay una suscripción facturable/);
    assert.equal(state.calls.length, 0);
    assert.equal(state.user.plan, 'PRO');
});
test('canceling an unpaid pending request does not grant access from a future date', async () => {
    const state = fixture({ status: 'PENDING' });
    const result = await state.service.cancelProSubscription('test', 'PRO');
    assert.equal(result.user.plan, 'FREE');
    assert.equal(state.subscription.status, 'CANCELED');
});
test('Stripe cancellation accepts both legacy and canonical plan names', async () => {
    let query, providerCall;
    const stripe = new StripeService({ subscription: {
        findFirst: async input => { query = input; return { id: 'sub', stripeSubscriptionId: 'stripe-sub' }; },
        update: async () => ({ id: 'sub', cancelAtPeriodEnd: true }),
    } }, {});
    stripe.ensureStripeConfigured = () => {};
    stripe.stripe = { subscriptions: { update: async (...args) => { providerCall = args; } } };
    await stripe.cancelSubscription('test', 'sub');
    for (const name of ['PRO', 'pro_investor', 'CREATOR', 'PRO_CREATOR', 'pro_creator']) assert.ok(query.where.planType.in.includes(name));
    assert.deepEqual(providerCall, ['stripe-sub', { cancel_at_period_end: true }]);
});
test('public catalog exposes configured prices and actual watchlist limits', () => {
    const controller = new MercadoPagoController({ isCheckoutReady: () => false, isConfigured: () => true, isProductionCredential: () => true, getProPrice: () => 8500, getCreatorPrice: () => 29900 });
    const catalog = controller.getConfig();
    assert.equal(catalog.proPriceArs, 8500);
    assert.equal(catalog.creatorPriceArs, 29900);
    for (const plan of ['FREE', 'PRO', 'CREATOR']) for (const [key, value] of Object.entries(WATCHLIST_CONFIG[plan])) assert.equal(catalog.planLimits[plan][key], value);
    assert.equal(catalog.planLimits.FREE.maxPortfolios, 1);
    assert.equal(catalog.planLimits.PRO.maxPortfolios, null);
});
test('billing uses the Creator renewal date and never treats pending or canceled records as automatic billing', async () => {
    const creatorEnd = new Date(Date.now() + 2 * 86400000);
    const subscriptions = [
        { id: 'creator', planType: 'CREATOR', status: 'ACTIVE', endDate: creatorEnd, stripeSubscriptionId: 'stripe-creator' },
        { id: 'pro', planType: 'PRO', status: 'PENDING', endDate: new Date(Date.now() + 86400000), mercadoPagoPreapprovalId: 'mp-pro' },
    ];
    const service = new BillingService({
        user: { findUnique: async () => ({ id: 'test', plan: 'CREATOR', subscriptionStatus: 'ACTIVE' }) },
        subscription: { findMany: async () => subscriptions },
        creatorBalance: { findUnique: async () => null },
    }, {}, {}, { getProPrice: () => 8500, getCreatorPrice: () => 29900 });
    service.safeListInvoices = async () => [];
    service.getCommissionRate = async () => 0.1;
    service.getCreatorSummary = async () => null;
    let result = await service.getPaymentOverview('test');
    assert.equal(result.nextBillingDate, creatorEnd);
    assert.equal(result.subscriptions.CREATOR.autoRenew, true);
    assert.equal(result.subscriptions.PRO.autoRenew, false);
    subscriptions[0].cancelAtPeriodEnd = true;
    result = await service.getPaymentOverview('test');
    assert.equal(result.nextBillingDate, null);
    assert.equal(result.subscriptions.CREATOR.autoRenew, false);
});
