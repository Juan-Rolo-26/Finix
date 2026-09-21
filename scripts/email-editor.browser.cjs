const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const { renderCampaign } = require('../apps/api/dist/admin/email-content');
const { mkdirSync } = require('node:fs');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    const id = 'e9f5e991-e667-4917-81ae-c0f4c60a50e8';
    const calls = [];
    await page.route('**/api/**', async route => {
        const url = new URL(route.request().url());
        const path = url.pathname.replace('/api', '');
        const data = route.request().method() === 'POST' && route.request().headers()['content-type']?.includes('json') ? route.request().postDataJSON() : null;
        calls.push({ path, data });
        let response = {};
        if (path === '/admin/auth/me') response = { id: 'admin-test', role: 'ADMIN' };
        else if (path.endsWith('/dashboard')) response = { campaigns: [], metrics: { recipientCount: 1, sent: 0, failed: 0 }, sendEnabled: true };
        else if (path === '/admin/analysis') response = [{ id, symbol: 'AAPL', companyName: 'Apple', status: 'PUBLISHED' }];
        else if (path === '/market/candles') response = { candles: Array.from({ length: 80 }, (_, i) => ({ time: 1700000000 + i * 86400, open: 150 + i, high: 153 + i, low: 148 + i, close: 152 + i })) };
        else if (path.endsWith('/preview')) response = { html: renderCampaign(data) };
        else if (path.endsWith('/media')) response = { url: 'https://example.test/chart.png' };
        else if (path.endsWith('/test')) response = { sent: true };
        else if (path.endsWith('/templates')) response = [];
        else return route.fulfill({ status: 404, json: { message: 'Unexpected test request: ' + path } });
        await route.fulfill({ json: response });
    });
    mkdirSync('/tmp/finix-email-ui', { recursive: true });
    try {
        await page.goto('http://localhost:5147/pro-emails');
        await page.getByRole('button', { name: 'Crear email', exact: true }).click();
        await page.getByRole('button', { name: 'Cargar publicados' }).click();
        await page.getByLabel('Analisis', { exact: true }).selectOption(id);
        await page.getByRole('button', { name: 'Adjuntar grafico al email' }).waitFor();
        await page.waitForFunction(() => [...document.querySelectorAll('button')].some(b => b.textContent.includes('Adjuntar grafico al email') && !b.disabled));
        const colors = await page.locator('canvas').first().evaluate(canvas => {
            const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
            const colors = new Set();
            for (let i = 0; i < pixels.length; i += 4) colors.add(pixels[i] + ',' + pixels[i + 1] + ',' + pixels[i + 2]);
            return colors.size;
        });
        assert(colors > 10, 'Chart must render real canvas content');
        await page.getByRole('button', { name: 'Adjuntar grafico al email' }).click();
        await page.getByRole('img', { name: 'Grafico adjunto' }).waitFor();
        await page.getByRole('button', { name: 'Vista previa', exact: true }).click();
        await page.locator('iframe[title="Vista previa del email"]').waitFor();
        await page.getByLabel('Email de prueba').fill('test@example.test');
        await page.getByRole('button', { name: 'Enviar prueba', exact: true }).click();
        await page.getByText('Prueba enviada. No se creo una campana.').waitFor();
        assert(!calls.some(c => c.path.endsWith('/campaigns')), 'Test email must not create a campaign');
        assert(calls.find(c => c.path.endsWith('/preview')).data.chartUrl.endsWith('chart.png'));
        for (const width of [1440, 390]) {
            await page.setViewportSize({ width, height: 1000 });
            for (const dark of [false, true]) {
                await page.evaluate(d => document.documentElement.classList.toggle('dark', d), dark);
                await page.waitForTimeout(250);
                await page.screenshot({ path: '/tmp/finix-email-ui/' + width + '-' + (dark ? 'dark' : 'light') + '.png', fullPage: true });
                assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'No horizontal overflow');
            }
        }
        assert.deepEqual(errors, []);
        console.log('PASS: editor, analysis selection, chart capture/upload, preview, isolated test-send, desktop/mobile light/dark; screenshots /tmp/finix-email-ui');
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
