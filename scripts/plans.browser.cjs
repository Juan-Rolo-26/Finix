// All billing requests are intercepted. No real payment or cancellation occurs.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { mkdirSync } = require('node:fs');
const { fixtures } = require('./desktop-redesign.browser.cjs');
const BASE = process.env.FINIX_BROWSER_TEST_URL || 'http://127.0.0.1:4173';
const limits = {
    FREE: { maxPortfolios: 1, maxWatchlists: 1, maxItemsPerList: 5, maxNotesPerItem: 3 },
    PRO: { maxPortfolios: null, maxWatchlists: 25, maxItemsPerList: 100, maxNotesPerItem: 50 },
    CREATOR: { maxPortfolios: null, maxWatchlists: 50, maxItemsPerList: 200, maxNotesPerItem: 100 },
};
const basic = { id: 'plans-user', username: 'inversor', plan: 'FREE', role: 'USER', subscriptionStatus: 'INACTIVE', isCreator: false, createdAt: '2026-09-01T12:00:00Z' };

async function setup(browser, options = {}) {
    const page = await browser.newPage({ viewport: { width: 1536, height: 1000 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await fixtures(page);
    const user = options.guest ? null : { ...basic, ...options.user };
    await page.addInitScript(user => {
        if (user) localStorage.setItem('user', JSON.stringify(user));
        else { localStorage.removeItem('user'); localStorage.removeItem('token'); localStorage.removeItem('accessToken'); }
    }, user);
    const posts = [];
    let failConfig = options.failConfig;
    let resultStatus = options.resultStatus || 'pending';
    await page.route('**/api/**', route => {
        const request = route.request(), path = new URL(request.url()).pathname.replace(/^\/api/, '');
        if (request.method() === 'POST' && (path.includes('checkout') || path === '/billing/subscription/cancel')) {
            posts.push({ path, body: request.postDataJSON() });
            return route.fulfill({ status: 503, json: { message: 'La pasarela no está disponible. Tu plan no cambió.' } });
        }
        if (path === '/auth/me' || path === '/me/settings') return route.fulfill(user ? { json: user } : { status: 401, json: { message: 'Sesión requerida' } });
        if (path === '/mercadopago/config') return route.fulfill(failConfig ? { status: 503, json: {} } : { json: { freeAccessEnabled: options.free === true, purchasesPaused: options.free === true || options.paused === true, configured: options.mp !== false, checkoutReady: options.mp !== false, proPriceArs: options.proPrice || 8500, creatorPriceArs: 29900, planLimits: limits } });
        if (path === '/stripe/config') return route.fulfill({ json: { configured: options.stripe === true, proPriceUsd: 4, purchasesPaused: options.free === true } });
        if (path === '/billing/overview') return route.fulfill({ json: { currentPlan: user?.plan, subscriptions: options.subscriptions || {}, proPriceArs: 8500, creatorPriceArs: 29900, invoices: [] } });
        if (/\/(status\/\d+|subscription-status|checkout\/.*\/status)/.test(path)) return route.fulfill({ json: { status: resultStatus } });
        return route.fallback();
    });
    return { page, posts, errors, recoverConfig: () => { failConfig = false; }, setResult: value => { resultStatus = value; } };
}

async function main() {
    const browser = await chromium.launch({ headless: true });
    mkdirSync('/tmp/finix-plans', { recursive: true });
    let checks = 0;
    try {
        for (const guest of [true, false]) {
            const test = await setup(browser, { guest, free: true });
            const { page } = test;
            await page.goto(`${BASE}/pricing`);
            await page.locator('.pricing-notice--free').waitFor();
            assert.match(await page.locator('[data-plan=PRO]').innerText(), /8\.500/);
            assert.match(await page.locator('[data-plan=CREATOR]').innerText(), /29\.900/);
            assert.equal(await page.locator('.pricing-plan').count(), 3);
            assert.equal(await page.locator('.pricing-comparison tbody tr').count(), 9);
            for (const theme of ['light', 'dark']) for (const width of [1024, 1280, 1536, 1920, 2560]) {
                await page.setViewportSize({ width, height: 1000 });
                await page.evaluate(theme => document.documentElement.className = theme, theme);
                await page.evaluate(async () => { await document.fonts.ready; await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))); });
                const metrics = await page.evaluate(() => {
                    const box = document.querySelector('.desktop-header__inner').getBoundingClientRect();
                    return { center: (box.left + box.right) / 2, width: innerWidth, overflow: document.documentElement.scrollWidth > innerWidth, innerOverflow: document.querySelector('.desktop-header__inner').scrollWidth > box.width + 1 };
                });
                assert.ok(Math.abs(metrics.center - width / 2) <= 1, `Header centered ${width}`);
                assert.equal(metrics.overflow, false);
                assert.equal(metrics.innerOverflow, false);
                const planBounds = await page.locator('.pricing-plans').boundingBox();
                assert.ok(Math.abs(planBounds.x + planBounds.width / 2 - width / 2) <= 1, 'Plan cards are centered');
                assert.ok(planBounds.width >= width * .88, 'Plan cards use the desktop content width');
                checks++;
            }
            await page.setViewportSize({ width: 1536, height: 1000 });
            await page.evaluate(() => document.documentElement.className = 'light');
            await page.screenshot({ path: `/tmp/finix-plans/pricing-${guest ? 'guest' : 'user'}.png`, fullPage: true });
            await page.locator('[data-plan=PRO] button').click();
            await page.waitForURL(url => url.pathname === (guest ? '/auth' : '/market'));
            assert.equal(test.posts.length, 0, 'Free stage never initiates checkout');
            assert.deepEqual(test.errors, []);
            await page.close();
        }
        const guest = await setup(browser, { guest: true });
        await guest.page.goto(`${BASE}/pricing`);
        await guest.page.locator('[data-plan=CREATOR] button').click();
        await guest.page.waitForURL(url => url.pathname === '/auth');
        assert.equal(new URL(guest.page.url()).searchParams.get('redirect'), '/pricing?plan=CREATOR#planes');
        await guest.page.close();

        const paid = await setup(browser, { stripe: true });
        await paid.page.goto(`${BASE}/pricing`);
        await paid.page.locator('[data-plan=PRO] button').click();
        await paid.page.getByRole('dialog').waitFor();
        await paid.page.getByRole('button', { name: 'Continuar a Mercado Pago' }).click();
        await paid.page.getByRole('alert').filter({ hasText: 'La pasarela no está disponible' }).waitFor();
        assert.deepEqual(paid.posts[0], { path: '/mercadopago/checkout/pro', body: { autoRenew: false } });
        await paid.page.getByRole('button', { name: 'Renovar y cobrar automáticamente cada mes' }).click();
        await paid.page.getByRole('button', { name: 'Continuar a Mercado Pago' }).click();
        await paid.page.waitForTimeout(100);
        assert.deepEqual(paid.posts[1].body, { autoRenew: true });
        assert.match(await paid.page.getByRole('dialog').innerText(), /US\$4/);
        await paid.page.getByRole('button', { name: 'Pagar con tarjeta mediante Stripe' }).click();
        await paid.page.waitForTimeout(100);
        assert.equal(paid.posts[2].path, '/stripe/subscriptions/pro/checkout');
        await paid.page.keyboard.press('Escape');
        assert.equal(await paid.page.getByRole('dialog').count(), 0);
        await paid.page.locator('[data-plan=CREATOR] button').click();
        await paid.page.getByRole('button', { name: 'Continuar a Mercado Pago' }).click();
        await paid.page.waitForTimeout(100);
        assert.equal(paid.posts[3].path, '/mercadopago/checkout/creator');
        await paid.page.close();

        const active = await setup(browser, { user: { plan: 'CREATOR', subscriptionStatus: 'ACTIVE', isCreator: true } });
        await active.page.goto(`${BASE}/pricing`);
        await active.page.locator('.pricing-user-status').getByText('Finix Creador', { exact: true }).waitFor();
        await active.page.locator('[data-plan=PRO] button').click();
        await active.page.waitForURL(url => url.pathname === '/settings' && url.search.includes('tab=suscripcion'));
        await active.page.getByRole('tab', { name: 'Planes PRO y Creador' }).waitFor();
        assert.equal(await active.page.getByRole('tab', { name: 'Planes PRO y Creador' }).getAttribute('aria-selected'), 'true');
        assert.equal(active.posts.length, 0);
        await active.page.close();

        const cancellation = await setup(browser, {
            user: { plan: 'PRO', subscriptionStatus: 'ACTIVE' },
            subscriptions: { PRO: { status: 'ACTIVE', autoRenew: true, provider: 'Mercado Pago', endDate: '2026-11-06T12:00:00Z' } },
        });
        await cancellation.page.goto(`${BASE}/settings?tab=suscripcion`);
        await cancellation.page.getByRole('button', { name: 'Dar de baja Finix PRO', exact: true }).click();
        await cancellation.page.getByRole('button', { name: 'Confirmar baja del plan' }).click();
        await cancellation.page.getByText('La pasarela no está disponible. Tu plan no cambió.', { exact: true }).waitFor();
        assert.equal(cancellation.posts[0].path, '/billing/subscription/cancel');
        assert.deepEqual(cancellation.posts[0].body, { planType: 'PRO' });
        assert.equal(await cancellation.page.evaluate(() => JSON.parse(localStorage.getItem('user')).plan), 'PRO');
        assert.equal(await cancellation.page.getByRole('button', { name: 'Confirmar baja del plan' }).isVisible(), true, 'Failure keeps the cancellation dialog available for retry');
        await cancellation.page.close();

        for (const options of [{ paused: true }, { mp: false }, { failConfig: true }]) {
            const test = await setup(browser, options);
            await test.page.goto(`${BASE}/pricing`);
            if (options.failConfig) {
                await test.page.getByRole('alert').waitFor();
                assert.equal(await test.page.locator('[data-plan=FREE] button').isDisabled(), false);
                assert.doesNotMatch(await test.page.locator('[data-plan=PRO]').innerText(), /6\.300|8\.500/);
                test.recoverConfig();
                await test.page.getByRole('button', { name: 'Reintentar' }).click();
                await test.page.locator('[data-plan=PRO] button:not([disabled])').waitFor();
            } else assert.equal(await test.page.locator('[data-plan=PRO] button').isDisabled(), true);
            assert.equal(test.posts.length, 0);
            await test.page.close();
        }
        const stripeOnly = await setup(browser, { mp: false, stripe: true });
        await stripeOnly.page.goto(`${BASE}/creator`);
        await stripeOnly.page.getByRole('button', { name: /Empezar a monetizar/ }).click();
        await stripeOnly.page.getByRole('dialog').waitFor();
        assert.equal(await stripeOnly.page.getByRole('button', { name: 'Pagar un mes, sin renovación' }).count(), 0);
        await stripeOnly.page.getByRole('button', { name: 'Pagar con tarjeta mediante Stripe' }).click();
        await stripeOnly.page.waitForTimeout(100);
        assert.equal(stripeOnly.posts[0].path, '/stripe/subscriptions/creator/checkout');
        await stripeOnly.page.close();

        const customPrice = await setup(browser, { proPrice: 12345 });
        await customPrice.page.goto(`${BASE}/settings/plan`);
        await customPrice.page.getByText('$12.345 ARS', { exact: false }).first().waitFor();
        await customPrice.page.getByRole('button', { name: 'Mejorar a PRO' }).click();
        await customPrice.page.getByRole('dialog').waitFor();
        assert.match(await customPrice.page.getByRole('dialog').innerText(), /12\.345/);
        await customPrice.page.close();

        const result = await setup(browser);
        await result.page.goto(`${BASE}/pricing?status=approved`);
        await result.page.getByRole('heading', { name: 'Falta la referencia del pago' }).waitFor();
        assert.doesNotMatch(await result.page.locator('main').innerText(), /Pago confirmado|membresía activada/);
        await result.page.goto(`${BASE}/payment-result?payment_id=123&status=approved`);
        await result.page.getByRole('heading', { name: 'Pago pendiente de confirmación' }).waitFor();
        result.setResult('approved');
        await result.page.getByRole('button', { name: 'Consultar estado' }).click();
        await result.page.getByRole('heading', { name: 'Pago confirmado' }).waitFor();
        assert.equal(await result.page.getByRole('link', { name: 'Ver mi suscripción' }).getAttribute('href'), '/settings?tab=suscripcion');
        await result.page.close();

        const mobile = await setup(browser, { free: true });
        await mobile.page.setViewportSize({ width: 390, height: 844 });
        await mobile.page.goto(`${BASE}/pricing`);
        await mobile.page.locator('.pricing-notice--free').waitFor();
        assert.equal(await mobile.page.locator('.desktop-header').isVisible(), false);
        assert.equal(await mobile.page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
        await mobile.page.close();
        console.log(JSON.stringify({ centeredHeaderChecks: checks, realServerPrices: true, freeAccessWithoutPurchase: true, providerErrorsAndRetry: true, bothRenewalModes: true, stripeAndCreator: true, verifiedPaymentReturn: true, subscriptionManagement: true, mobileNoOverflow: true }));
    } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
