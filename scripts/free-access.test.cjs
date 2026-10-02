const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const { createHmac } = require('node:crypto');
const { hasEffectiveProAccess } = require('../apps/api/dist/auth/pro-access');
const { isFreeAccessEnabled, isCommunityMembershipActive } = require('../apps/api/dist/access/free-access');
const { AccessControlService } = require('../apps/api/dist/access/access-control.service');
const { CommunityPermissionsService } = require('../apps/api/dist/communities/community-permissions.service');
const { CommunitiesService } = require('../apps/api/dist/communities/communities.service');
const { MercadoPagoService } = require('../apps/api/dist/mercadopago/mercadopago.service');
const { StripeService } = require('../apps/api/dist/stripe/stripe.service');
const { WatchlistService } = require('../apps/api/dist/watchlist/watchlist.service');

const previous = process.env.FINIX_FREE_ACCESS_ENABLED;
after(() => {
    if (previous === undefined) delete process.env.FINIX_FREE_ACCESS_ENABLED;
    else process.env.FINIX_FREE_ACCESS_ENABLED = previous;
});
const basic = { id: 'basic', role: 'USER', plan: 'FREE', subscriptionStatus: 'INACTIVE', proAccessOverride: false };
const userPrisma = { user: { findUnique: async () => ({ ...basic }) } };

test('launch mode opens all platform features without rewriting accounts', async () => {
    delete process.env.FINIX_FREE_ACCESS_ENABLED;
    assert.equal(isFreeAccessEnabled(), true);
    assert.equal(hasEffectiveProAccess(basic), true);
    assert.equal(hasEffectiveProAccess(null), false);
    const access = new AccessControlService(userPrisma);
    assert.equal((await access.requirePro(basic.id)).plan, 'FREE');
    assert.equal((await access.requireCreator(basic.id)).role, 'USER');
    assert.equal((await access.requirePlan(basic.id, ['PRO', 'CREATOR'])).plan, 'FREE');
    assert.equal(await access.limitFreePortfolio(basic.id), true);
    const watchlist = new WatchlistService(userPrisma, {}, {});
    assert.equal(await watchlist.getUserPlan(basic.id), 'CREATOR');
    await assert.rejects(new AccessControlService({ user: { findUnique: async () => null } }).requireCreator('missing'));
});

test('both providers refuse new purchases before any provider or database call', async () => {
    process.env.FINIX_FREE_ACCESS_ENABLED = 'true';
    const mp = new MercadoPagoService({}, {});
    const stripe = new StripeService({}, {});
    assert.equal(mp.isCheckoutReady(), false);
    for (const purchase of [
        () => mp.createPreference('basic', 'pro'),
        () => mp.createPreference('basic', 'creator', true),
        () => mp.createCommunityPreference('basic', 'community', 'plan'),
        () => stripe.createSubscription('basic', 'pro_investor'),
        () => stripe.createCommunityPayment('basic', 'community', 'plan'),
    ]) await assert.rejects(purchase, /compras están pausadas/);
});

test('launch mode retains signed notifications for payments already in progress', async () => {
    process.env.FINIX_FREE_ACCESS_ENABLED = 'true';
    const previousSecret = process.env.MP_WEBHOOK_SECRET;
    process.env.MP_WEBHOOK_SECRET = 'isolated-webhook-test-secret';
    try {
        const mp = new MercadoPagoService({}, {});
        const processed = [];
        mp.processPayment = async id => { processed.push(id); };
        const query = { 'data.id': '123', type: 'payment' };
        const body = { type: 'payment', data: { id: '123' } };
        const manifest = 'id:123;request-id:request-test;ts:100;';
        const signature = 'ts=100,v1=' + createHmac('sha256', process.env.MP_WEBHOOK_SECRET).update(manifest).digest('hex');
        await mp.handleWebhook(body, query, signature, 'request-test');
        assert.deepEqual(processed, ['123']);
        await assert.rejects(mp.handleWebhook(body, query, undefined, 'request-test'), /Firma/);
    } finally {
        if (previousSecret === undefined) delete process.env.MP_WEBHOOK_SECRET;
        else process.env.MP_WEBHOOK_SECRET = previousSecret;
    }
});

test('free community access keeps private communities and administrative roles protected', async () => {
    process.env.FINIX_FREE_ACCESS_ENABLED = 'true';
    const prisma = {
        ...userPrisma,
        community: { findUnique: async () => ({ id: 'community', creatorId: 'owner', privacyType: 'PRIVATE', plans: [] }) },
        communityMember: { findUnique: async () => null },
    };
    const permissions = new CommunityPermissionsService(prisma);
    assert.equal(permissions.canCreateCommunity(basic), true);
    assert.equal(permissions.canViewCommunities(basic), true);
    assert.equal(permissions.isPlatformAdmin(basic), false);
    await assert.rejects(permissions.assertCanManageCommunity('community', basic.id), /administrativos/);
    const service = new CommunitiesService(prisma, {}, permissions, {}, {});
    await assert.rejects(service.joinFree(basic.id, 'community'), /privada/);
});

test('paid community plans can be joined free, without fabricating a successful payment', async () => {
    process.env.FINIX_FREE_ACCESS_ENABLED = 'true';
    const plan = { id: 'paid-plan', price: 1000, tierLevel: 2 };
    let write;
    const prisma = {
        community: {
            findUnique: async () => ({ id: 'community', privacyType: 'PAID', plans: [plan] }),
            update: async () => ({}),
        },
        communityMember: {
            findUnique: async () => null,
            upsert: async args => { write = args; return args.create; },
        },
    };
    const permissions = { assertCanViewCommunities: async () => {} };
    const provider = { createCommunityPayment: async () => { throw new Error('Must not contact payment provider'); } };
    const service = new CommunitiesService(prisma, {}, permissions, provider, provider);
    const result = await service.createCheckoutSession(basic.id, 'community', plan.id, 'stripe');
    assert.equal(result.freeJoined, true);
    assert.equal(write.create.paymentStatus, 'FREE_ACCESS');
    assert.equal(plan.price, 1000);
    assert.equal(isCommunityMembershipActive(result.member), true);
    process.env.FINIX_FREE_ACCESS_ENABLED = 'false';
    assert.equal(isCommunityMembershipActive(result.member), false);
    assert.equal(isCommunityMembershipActive({ subscriptionStatus: 'ACTIVE', paymentStatus: 'SUCCEEDED' }), true);
});

test('joining during launch preserves existing paid memberships', async () => {
    process.env.FINIX_FREE_ACCESS_ENABLED = 'true';
    const paid = { subscriptionStatus: 'ACTIVE', paymentStatus: 'SUCCEEDED', stripeSubscriptionId: 'existing', planId: 'existing-plan' };
    const prisma = {
        community: { findUnique: async () => ({ privacyType: 'PAID', plans: [{ id: 'existing-plan', price: 1000 }] }) },
        communityMember: { findUnique: async () => paid },
    };
    const service = new CommunitiesService(prisma, {}, { assertCanViewCommunities: async () => {} }, {}, {});
    assert.equal(await service.joinFree(basic.id, 'community'), paid);
});

test('disabling launch mode restores the existing paywalls and saved overrides', async () => {
    process.env.FINIX_FREE_ACCESS_ENABLED = 'false';
    assert.equal(hasEffectiveProAccess(basic), false);
    assert.equal(hasEffectiveProAccess({ ...basic, proAccessOverride: true }), true);
    const access = new AccessControlService(userPrisma);
    await assert.rejects(access.requirePro(basic.id), /PRO activo/);
    await assert.rejects(access.requireCreator(basic.id), /Creator/);
    await assert.rejects(access.requirePlan(basic.id, ['PRO']), /suscripción activa/);
    assert.equal(await new WatchlistService(userPrisma, {}, {}).getUserPlan(basic.id), 'FREE');
    assert.equal(new CommunityPermissionsService(userPrisma).canCreateCommunity(basic), false);
});
