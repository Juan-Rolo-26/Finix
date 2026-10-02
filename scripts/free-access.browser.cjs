const { chromium } = require('playwright');
const assert = require('node:assert/strict');

const base = process.env.FINIX_BROWSER_TEST_URL || 'http://127.0.0.1:5178';
const basic = { id: 'basic-test', email: 'basic@example.test', username: 'basic-test', role: 'USER', plan: 'FREE', subscriptionStatus: 'INACTIVE', proAccessOverride: false, isCreator: false, onboardingCompleted: true };

(async () => {
    const browser = await chromium.launch({ headless: true });
    try {
        for (const freeAccess of [true, false]) {
            const context = await browser.newContext();
            const page = await context.newPage();
            const errors = [];
            const purchases = [];
            let loggedIn = false;
            page.on('pageerror', error => errors.push(error.message));
            await page.route('**/api/**', async route => {
                const request = route.request();
                const path = new URL(request.url()).pathname.replace('/api', '');
                if (request.method() === 'POST' && path.includes('checkout')) purchases.push(path);
                const response = path === '/mercadopago/config'
                    ? { configured: !freeAccess, credentialsConfigured: true, freeAccessEnabled: freeAccess, purchasesPaused: freeAccess, proPriceArs: 6300, creatorPriceArs: 29900 }
                    : path === '/stripe/config' ? { configured: false }
                    : path === '/auth/me' ? basic
                    : path.includes('/communities') ? [] : {};
                const unauthenticated = !loggedIn && ['/auth/me', '/auth/refresh'].includes(path);
                await route.fulfill({ status: unauthenticated ? 401 : 200, json: unauthenticated ? { message: 'No autenticado' } : response });
            });
            await page.goto(base + '/pro');
            await page.getByText('Incluye', { exact: true }).first().waitFor();
            if (freeAccess) {
                await page.getByText('Finix está gratis para todos.', { exact: true }).waitFor();
                assert.equal(await page.getByText('$0', { exact: true }).count(), 3);
                assert.equal(await page.getByRole('button', { name: 'Iniciar sesión para comprar' }).count(), 0);
                await page.getByRole('button', { name: 'Crear cuenta gratis' }).last().click();
                assert.equal(purchases.length, 0);
            } else {
                assert.equal(await page.getByText('Finix está gratis para todos.', { exact: true }).count(), 0);
                await page.getByText('$6.300', { exact: true }).waitFor();
            }

            // Test an existing basic account, including an explicit PRO denial.
            loggedIn = true;
            await page.addInitScript(user => {
                const token = 'test.' + btoa(JSON.stringify({ iss: 'finix-api' })) + '.signature';
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(user));
            }, basic);
            await page.goto(base + '/creator');
            await page.getByText('Comenzá hoy como Finix Creator', { exact: true }).waitFor();
            if (freeAccess) {
                assert.ok(await page.getByRole('link', { name: /Crear mi comunidad|Crear comunidad|Crear tu comunidad|Crear Comunidad|Crear Mi Comunidad/i }).count() > 0);
                await page.goto(base + '/settings/plan');
                await page.getByRole('button', { name: 'Usar PRO gratis' }).waitFor();
                assert.equal(await page.getByRole('button', { name: 'Mejorar a PRO' }).count(), 0);
            } else {
                assert.equal(await page.getByText('Gratis', { exact: true }).count(), 0);
            }
            assert.equal(purchases.length, 0);
            assert.deepEqual(errors, []);
            await context.close();
        }
        console.log('Browser checks passed: free prices, paused checkout, basic-account access, paid-mode restoration, no runtime errors.');
    } finally {
        await browser.close();
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
