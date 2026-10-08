// All API requests use fixtures. No real accounts, trades or providers are changed.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright');
const { fixtures } = require('./desktop-redesign.browser.cjs');
const base = process.env.FINIX_BROWSER_TEST_URL || 'http://127.0.0.1:5173';

async function main() {
    const browser = await chromium.launch({ headless: true });
    const errors = [];
    fs.mkdirSync('/tmp/finix-portfolio-check', { recursive: true });
    async function setup(mode) {
        const page = await browser.newPage({ viewport: { width: 1536, height: 900 }, reducedMotion: 'reduce' });
        page.on('pageerror', error => errors.push(error.message));
        await fixtures(page);
        let calls = 0;
        const state = { mode, page, calls: () => calls };
        await page.route('**/api/portfolios', route => {
            calls++;
            if (state.mode === 'failed' || (state.mode === 'transient' && calls === 1)) {
                return route.fulfill({ status: 503, json: { message: 'Internal server error' } });
            }
            if (state.mode === 'empty') return route.fulfill({ json: [] });
            if (state.mode === 'invalid') return route.fulfill({ json: { unexpected: true } });
            return route.fallback();
        });
        await page.goto(base + '/portfolio');
        return state;
    }
    try {
        const failed = await setup('failed');
        await failed.page.getByRole('alert').getByText('No pudimos cargar tu portafolio.', { exact: false }).waitFor();
        assert.equal(failed.calls(), 2);
        assert.equal(await failed.page.getByText('Creá tu portfolio', { exact: true }).count(), 0);
        assert.equal(await failed.page.getByRole('button', { name: 'Crear Portfolio', exact: true }).count(), 0);
        assert.match(await failed.page.getByTestId('portfolio-total-value').innerText(), /—/);
        const navLink = failed.page.locator('.desktop-primary-nav').getByRole('link', { name: 'Portafolio', exact: true });
        assert.equal(await navLink.getAttribute('aria-current'), 'page');
        await failed.page.screenshot({ path: '/tmp/finix-portfolio-check/error.png' });
        failed.mode = 'healthy';
        await failed.page.getByRole('button', { name: 'Reintentar', exact: true }).click();
        await failed.page.getByRole('button', { name: 'Agregar transacción', exact: true }).waitFor();
        await failed.page.getByRole('alert').waitFor({ state: 'hidden' });
        assert.equal(await failed.page.getByRole('alert').count(), 0);
        assert.equal(await failed.page.getByText('Creá tu portfolio', { exact: true }).count(), 0);
        const desktopBar = await failed.page.locator('.desktop-header__inner').boundingBox();
        assert(Math.abs(desktopBar.x + desktopBar.width / 2 - 768) < 2, 'Desktop navigation stays centered');
        await failed.page.screenshot({ path: '/tmp/finix-portfolio-check/loaded.png' });
        await failed.page.setViewportSize({ width: 1024, height: 900 });
        const compactBar = await failed.page.locator('.desktop-header__inner').boundingBox();
        assert(compactBar.x >= 0 && compactBar.x + compactBar.width <= 1025, 'Desktop navigation fits a small laptop');
        const compactAccount = await failed.page.locator('.desktop-account-trigger').boundingBox();
        assert(compactAccount.x + compactAccount.width <= 1025, 'Account controls remain visible');
        await failed.page.setViewportSize({ width: 390, height: 844 });
        assert.equal(await failed.page.locator('.desktop-header').isVisible(), false);
        await failed.page.setViewportSize({ width: 1536, height: 900 });
        // A failed refresh preserves already loaded portfolio data.
        failed.mode = 'failed';
        await failed.page.getByRole('button', { name: 'Actualizar', exact: true }).click();
        await failed.page.getByRole('alert').waitFor();
        assert.equal(await failed.page.getByRole('button', { name: 'Agregar transacción', exact: true }).count(), 1);
        assert.doesNotMatch(await failed.page.getByTestId('portfolio-total-value').innerText(), /—/);
        await failed.page.close();

        const transient = await setup('transient');
        await transient.page.getByRole('button', { name: 'Agregar transacción', exact: true }).waitFor();
        assert.equal(transient.calls(), 2);
        assert.equal(await transient.page.getByRole('alert').count(), 0);
        await transient.page.close();

        const empty = await setup('empty');
        await empty.page.getByText('Creá tu portfolio', { exact: true }).waitFor();
        assert.equal(empty.calls(), 1);
        assert.equal(await empty.page.getByRole('button', { name: 'Crear perfil de inversión', exact: true }).count(), 1);
        await empty.page.close();

        const invalid = await setup('invalid');
        await invalid.page.getByRole('alert').getByText('Respuesta inválida del servidor', { exact: true }).waitFor();
        assert.equal(await invalid.page.getByText('Creá tu portfolio', { exact: true }).count(), 0);
        await invalid.page.close();
        assert.deepEqual(errors, []);
        console.log(JSON.stringify({ desktopPortfolioLink: true, automaticRecovery: true, manualRecovery: true, failedRefreshPreservesData: true, emptyAccountDistinctFromError: true, invalidResponseRejected: true, runtimeErrors: errors }));
    } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
