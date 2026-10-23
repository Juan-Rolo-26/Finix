const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
require('reflect-metadata');
const { MercadoPagoService } = require('../apps/api/dist/mercadopago/mercadopago.service');
const { StripeService } = require('../apps/api/dist/stripe/stripe.service');
const saved = { ...process.env }, realFetch = global.fetch;
afterEach(() => {
    global.fetch = realFetch;
    for (const key of ['MP_ACCESS_TOKEN','MP_PUBLIC_KEY','MP_WEBHOOK_SECRET','MP_ENVIRONMENT','NODE_ENV','FINIX_FREE_ACCESS_ENABLED','STRIPE_SECRET_KEY','STRIPE_WEBHOOK_SECRET','STRIPE_CHECKOUT_ENABLED']) {
        if (saved[key] === undefined) delete process.env[key]; else process.env[key] = saved[key];
    }
});
function mpFixture(seller = {}, environment = 'production') {
    Object.assign(process.env, { NODE_ENV:'production', MP_ENVIRONMENT:environment, MP_ACCESS_TOKEN:'APP_USR-isolated-credential-for-unit-testing', MP_PUBLIC_KEY:'APP_USR-isolated-public-key-for-unit-testing', MP_WEBHOOK_SECRET:'test-secret', FINIX_FREE_ACCESS_ENABLED:'false' });
    let calls = 0;
    global.fetch = async (url, options) => { calls++; assert.equal(url, 'https://api.mercadopago.com/users/me'); assert.ok(options.signal); return { ok:true, json:async () => ({ id:123,site_id:'MLA',tags:['normal'],email:'seller@example.com',status:{site_status:'active'},...seller }) }; };
    return { service:new MercadoPagoService({}, {}), calls:()=>calls };
}
test('APP_USR test-seller credentials never enable real Pro, Creator or community purchases', async () => {
    const { service, calls } = mpFixture({ tags:['test_user','normal'] });
    assert.equal(service.isConfigured(),true);
    assert.equal(await service.isCheckoutReady(),false);
    for (const purchase of [()=>service.createPreference('user','pro'),()=>service.createPreference('user','creator'),()=>service.createCommunityPreference('user','community','plan')]) await assert.rejects(purchase,/no está disponible/);
    assert.equal(calls(),1);
});
test('a real active Argentine seller shares concurrent checks and enables checkout', async () => {
    const { service,calls } = mpFixture();
    assert.deepEqual(await Promise.all(Array.from({length:6},()=>service.isCheckoutReady())),Array(6).fill(true));
    assert.equal(calls(),1);
});
test('sandbox recognizes test sellers with APP_USR credentials and subscription init_point', async () => {
    const { service }=mpFixture({tags:['test_user']},'sandbox');
    assert.equal(await service.isCheckoutReady(),true);
    assert.equal(service.checkoutUrl({init_point:'https://www.mercadopago.com.ar/subscriptions/checkout?id=test'}),'https://www.mercadopago.com.ar/subscriptions/checkout?id=test');
});
test('sandbox refuses real sellers; production refuses inactive and foreign sellers', async () => {
    for (const [seller,env] of [[{},'sandbox'],[{site_id:'MLB'},'production'],[{status:{site_status:'deactivated'}},'production'],[{email:'test@testuser.com'},'production']]) assert.equal(await mpFixture(seller,env).service.isCheckoutReady(),false);
});
test('provider failures disable checkout briefly and recover without creating orders', async () => {
    const { service }=mpFixture();
    global.fetch=async()=>({ok:false});
    assert.equal(await service.isCheckoutReady(),false);
    let calls=0;global.fetch=async()=>{calls++;return {ok:true,json:async()=>({id:1,site_id:'MLA',tags:['normal'],status:{site_status:'active'}})};};
    assert.equal(await service.isCheckoutReady(),false);assert.equal(calls,0);
    service.readiness.until=0;
    assert.equal(await service.isCheckoutReady(),true);assert.equal(calls,1);
});
test('missing production webhook secret prevents a checkout probe or purchase', async () => {
    const {service,calls}=mpFixture();delete process.env.MP_WEBHOOK_SECRET;
    assert.equal(await service.isCheckoutReady(),false);assert.equal(calls(),0);
});
test('Stripe production requires a live key, signed webhook and charges-enabled account', async () => {
    Object.assign(process.env,{NODE_ENV:'production',STRIPE_SECRET_KEY:'sk_test_isolated',STRIPE_WEBHOOK_SECRET:'whsec_isolated'});
    assert.equal(new StripeService({},{}).isConfigured(),false);
    process.env.STRIPE_SECRET_KEY='sk_live_isolated';
    const service=new StripeService({},{});let enabled=false;
    service.stripe={balance:{retrieve:async()=>({})},accounts:{retrieve:async()=>({charges_enabled:enabled})}};
    assert.equal(await service.isCheckoutReady(),false);
    enabled=true;service.readiness.until=0;
    assert.equal(await service.isCheckoutReady(),true);
    delete process.env.STRIPE_WEBHOOK_SECRET;
    assert.equal(await service.isCheckoutReady(),false);
});
function stripeTrial(overrides={}) {
    const service=new StripeService({},{});service.ensureStripeConfigured=()=>{};
    const session={status:'complete',payment_status:'no_payment_required',metadata:{userId:'user',type:'plan_subscription'},subscription:'sub',...overrides.session};
    const subscription={id:'sub',status:'trialing',trial_end:Math.floor(Date.now()/1000)+86400,metadata:{userId:'user',type:'plan_subscription'},...overrides.subscription};
    service.stripe={checkout:{sessions:{retrieve:async()=>session}},subscriptions:{retrieve:async()=>subscription}};
    let activated=0;service.handleCustomerSubscriptionEvent=async()=>{activated++;};
    return {service,activated:()=>activated};
}
test('verified complete Stripe trial activates access without waiting for a paid invoice',async()=>{
    const state=stripeTrial();assert.deepEqual(await state.service.checkoutStatus('user','session'),{status:'approved'});assert.equal(state.activated(),1);
});
test('incomplete, expired or nontrial sessions do not grant access',async()=>{
    for(const overrides of [{session:{status:'open'}},{subscription:{status:'incomplete'}},{subscription:{trial_end:1}},{session:{metadata:{userId:'user',type:'community_subscription'}}}]){
        const state=stripeTrial(overrides);assert.deepEqual(await state.service.checkoutStatus('user','session'),{status:'pending'});assert.equal(state.activated(),0);
    }
});
test('Stripe trials cannot activate another account subscription',async()=>{
    const state=stripeTrial({subscription:{metadata:{userId:'other',type:'plan_subscription'}}});
    await assert.rejects(state.service.checkoutStatus('user','session'),/Pago no encontrado/);assert.equal(state.activated(),0);
});

test('explicit Mercado Pago-only configuration disables new Stripe purchases without probing or database writes',async()=>{
    process.env.STRIPE_CHECKOUT_ENABLED='false';process.env.FINIX_FREE_ACCESS_ENABLED='false';
    const service=new StripeService({},{});service.isConfigured=()=>true;service.stripe={};
    assert.equal(await service.isCheckoutReady(),false);
    await assert.rejects(service.createSubscription('user','pro_investor'),/no está disponible/);
    await assert.rejects(service.createCommunityPayment('user','community','plan'),/no está disponible/);
});
