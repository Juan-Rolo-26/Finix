const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const { StripeService } = require('../apps/api/dist/stripe/stripe.service');
const { StripeController } = require('../apps/api/dist/stripe/stripe.controller');
const previous = process.env.FINIX_FREE_ACCESS_ENABLED;
after(() => { if (previous === undefined) delete process.env.FINIX_FREE_ACCESS_ENABLED; else process.env.FINIX_FREE_ACCESS_ENABLED = previous; });

function service(retrieve) {
    const instance = new StripeService({}, {});
    instance.isConfigured = () => true;
    instance.stripe = { balance: { retrieve } };
    return instance;
}
test('Stripe availability shares concurrent checks and verifies credentials without charging', async () => {
    let calls = 0;
    const stripe = service(async (_, options) => { calls++; assert.equal(options.timeout, 5000); assert.equal(options.maxNetworkRetries, 0); });
    assert.deepEqual(await Promise.all(Array.from({ length: 6 }, () => stripe.isCheckoutReady())), Array(6).fill(true));
    assert.equal(calls, 1);
    assert.equal(await stripe.isCheckoutReady(), true);
    assert.equal(calls, 1);
});
test('Invalid Stripe credentials disable checkout and permit recovery after the short cache expires', async () => {
    let fail = true, calls = 0;
    const stripe = service(async () => { calls++; if (fail) throw new Error('Authentication failed'); });
    assert.equal(await stripe.isCheckoutReady(), false);
    fail = false;
    assert.equal(await stripe.isCheckoutReady(), false);
    assert.equal(calls, 1);
    stripe.readiness.until = 0;
    assert.equal(await stripe.isCheckoutReady(), true);
    assert.equal(calls, 2);
});
test('Paused free access never probes Stripe or offers checkout', async () => {
    process.env.FINIX_FREE_ACCESS_ENABLED = 'true';
    const controller = new StripeController({ isConfigured: () => true, isCheckoutReady: () => { throw new Error('No request expected'); }, getProMonthlyPriceUsd: async () => 4 });
    const config = await controller.getConfig();
    assert.equal(config.configured, false);
    assert.equal(config.purchasesPaused, true);
});
test('Public payment config reports a credential failure without exposing provider errors', async () => {
    process.env.FINIX_FREE_ACCESS_ENABLED = 'false';
    const controller = new StripeController({ isConfigured: () => true, isCheckoutReady: async () => false, getProMonthlyPriceUsd: async () => 4 });
    const config = await controller.getConfig();
    assert.equal(config.configured, false);
    assert.equal(config.credentialsConfigured, true);
});
