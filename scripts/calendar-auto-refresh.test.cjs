// Run with the web dev server on port 4173: node scripts/calendar-auto-refresh.test.cjs
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { writeFileSync, unlinkSync } = require('node:fs');
const { join } = require('node:path');

async function main() {
    const browser = await chromium.launch({ headless: true });
    const harnessName = `calendar-auto-refresh-test-${process.pid}.html`;
    const harnessPath = join(__dirname, '../apps/web', harnessName);
    try {
        const page = await browser.newPage({ timezoneId: 'America/Argentina/Buenos_Aires' });
        await page.clock.install({ time: new Date('2026-10-05T02:59:00Z') });
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        writeFileSync(harnessPath, `<!doctype html><div id="root"></div>
            <script type="module">
                import React from 'react';
                import ReactDOM from 'react-dom/client';
                import { MemoryRouter } from 'react-router-dom';
                import CalendarPage from '/src/pages/CalendarPage.tsx';
                import AssetFundamentalPanel from '/src/components/markets/AssetFundamentalPanel.tsx';
                import { useAuthStore } from '/src/stores/authStore.ts';
                useAuthStore.setState({ user: { id: 'calendar-test', plan: 'PRO', subscriptionStatus: 'ACTIVE' } });
                window.calendarTestRoot = ReactDOM.createRoot(document.getElementById('root'));
                window.calendarTestRoot.render(React.createElement(MemoryRouter, null, React.createElement(CalendarPage)));
                window.renderFundamentals = symbol => {
                    if (!window.fundamentalTestRoot) window.fundamentalTestRoot = ReactDOM.createRoot(document.getElementById('root'));
                    window.fundamentalTestRoot.render(React.createElement(AssetFundamentalPanel, { symbol }));
                };
            </script>`);
        let requests = 0;
        let fail = false;
        const weeks = [];
        await page.route('**/calendar/week?*', async route => {
            requests++;
            const from = new URL(route.request().url()).searchParams.get('weekStart');
            weeks.push(from);
            if (fail) return route.fulfill({ status: 503, json: { message: 'Temporary outage' } });
            await route.fulfill({ json: {
                economicData: { status: 'READY' }, weekRange: { from, to: from }, isProUser: true,
                categories: { all: 1, us: 1, ar: 0, earnings: 0, dividends: 0 },
                days: [{ date: from, dayName: 'Lunes', economicEvents: [{
                    id: 'event', eventType: 'ECONOMIC', country: 'US', title: `Evento actualizado ${requests}`,
                    category: 'EMPLOYMENT', importance: 'HIGH', marketImpactScore: 90, date: from,
                    time: '12:30', timezone: 'UTC', source: 'Test fixture',
                }], earningsEvents: [
                    { id: 'complete', ticker: 'COMPLETE', companyName: 'Complete Company', date: from, dateStatus: 'CONFIRMED', actualEps: 2, epsEstimate: 1, actualRevenue: 100e9, revenueEstimate: 80e9, epsSurprise: -99, revenueSurprise: -99, marketReaction: 5, sourceType: 'AUTOMATIC', earningsImpactScore: 90 },
                    { id: 'empty', ticker: 'EMPTY', companyName: 'No financial data', date: from, dateStatus: 'ESTIMATED' },
                    { id: 'bad', ticker: 'BAD', companyName: 'Invalid data', date: from, epsEstimate: '', revenueEstimate: 'unknown' },
                    { id: 'zero', ticker: 'ZERO', companyName: 'Zero estimate', date: from, dateStatus: 'ESTIMATED', epsEstimate: 0, earningsImpactScore: 50 },
                    { id: 'partial', ticker: 'PARTIAL', companyName: 'Partial report', date: from, actualEps: 0, epsSurprise: 999, earningsImpactScore: 50 },
                ], dividendEvents: [] }],
            } });
        });
        await page.goto('http://127.0.0.1:4173/' + harnessName);
        await page.getByRole('heading', { name: 'Evento actualizado 1' }).waitFor({ timeout: 10000 }).catch(async error => { console.error({ errors, requests, body: await page.locator('body').innerText() }); throw error; });
        assert.equal(weeks.at(-1), '2026-09-28', 'Sunday must stay in the current Argentina week');
        await page.clock.fastForward(300001);
        await page.getByRole('heading', { name: 'Evento actualizado 2' }).waitFor();
        assert.equal(weeks.at(-1), '2026-10-05', 'An open calendar rolls over automatically on Monday');
        assert.equal(await page.getByText('Cargando eventos de la semana...').count(), 0);

        await page.getByRole('button', { name: 'Semana siguiente' }).click();
        await page.getByRole('heading', { name: 'Evento actualizado 3' }).waitFor();
        assert.equal(weeks.at(-1), '2026-10-12');
        await page.evaluate(() => window.dispatchEvent(new Event('focus')));
        await page.getByRole('heading', { name: 'Evento actualizado 4' }).waitFor();
        assert.equal(weeks.at(-1), '2026-10-12', 'Focus refresh preserves the selected week');

        fail = true;
        await page.evaluate(() => window.dispatchEvent(new Event('online')));
        await page.getByText(/Se conservan los últimos eventos/).waitFor();
        assert.equal(await page.getByRole('heading', { name: 'Evento actualizado 4' }).count(), 1, 'Outages preserve rendered events');
        assert.equal(await page.getByRole('heading', { name: 'No se pudieron cargar los eventos' }).count(), 0);
        fail = false;
        await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
        await page.waitForFunction(() => !document.body.textContent.includes('Se conservan los últimos eventos'));
        assert.equal(weeks.at(-1), '2026-10-12');

        await page.getByRole('button', { name: /Balances/ }).click();
        assert.equal(await page.getByRole('button', { name: /Balances/ }).innerText(), 'Balances\n3');
        await page.getByRole('heading', { name: 'COMPLETE', exact: true }).waitFor();
        assert.equal(await page.getByRole('heading', { name: 'EMPTY', exact: true }).count(), 0);
        assert.equal(await page.getByRole('heading', { name: 'BAD', exact: true }).count(), 0);
        const complete = page.locator('article').filter({ has: page.getByRole('heading', { name: 'COMPLETE', exact: true }) });
        assert.ok((await complete.innerText()).includes('$100.00B'));
        assert.ok((await complete.innerText()).includes('+25.0% vs. est.'));
        assert.equal(await complete.getByText('Reacción', { exact: true }).count(), 0);
        const partial = page.locator('article').filter({ has: page.getByRole('heading', { name: 'PARTIAL', exact: true }) });
        assert.ok((await partial.innerText()).includes('$0.00'));
        assert.equal(await partial.getByText(/Facturación|N\/D|Superó las estimaciones|999/).count(), 0);
        const zero = page.locator('article').filter({ has: page.getByRole('heading', { name: 'ZERO', exact: true }) });
        assert.ok((await zero.innerText()).includes('$0.00'));
        assert.ok((await zero.innerText()).includes('estimado'));

        await page.evaluate(() => window.calendarTestRoot.unmount());
        const countBeforeUnmount = requests;
        await page.clock.fastForward(300001);
        await page.evaluate(() => window.dispatchEvent(new Event('focus')));
        assert.equal(requests, countBeforeUnmount, 'Unmount removes refresh listeners and timers');
        await page.route('**/market/news?*', route => route.fulfill({ json: [] }));
        await page.route('**/market/candles?*', route => route.fulfill({ json: [] }));
        await page.route('**/fundamental/*?*', route => {
            const ticker = new URL(route.request().url()).pathname.split('/').pop();
            return route.fulfill({ json: {
                instrument: { name: ticker, exchange: 'NASDAQ' },
                metrics: ticker === 'AAA' ? { peRatio: 0, marketCap: null } : {},
                statements: ticker === 'AAA' ? { incomeStatement: [{ date: '2026-06-30', currency: 'EUR', revenue: 1000, netIncome: 0, eps: -0.5 }] } : {},
            } });
        });
        await page.evaluate(() => window.renderFundamentals('NASDAQ:AAA'));
        await page.getByText('Estado de resultados', { exact: true }).waitFor();
        assert.equal(await page.getByText('Balance', { exact: true }).count(), 0);
        assert.equal(await page.getByText('Flujo y calidad', { exact: true }).count(), 0);
        assert.equal(await page.getByText('EBITDA', { exact: true }).count(), 0);
        assert.ok((await page.locator('body').innerText()).includes('EUR'));
        assert.equal(await page.getByText('—', { exact: true }).count(), 0);
        await page.evaluate(() => window.renderFundamentals('NASDAQ:BBB'));
        await page.getByText('No hay información financiera disponible para este activo.', { exact: true }).waitFor();
        assert.equal(await page.getByText('Estado de resultados', { exact: true }).count(), 0, 'Switching assets must clear the previous balance');
        await page.evaluate(() => window.fundamentalTestRoot.unmount());
        assert.deepEqual(errors, []);
        console.log('Calendar browser checks passed: timer refresh, Monday rollover, selected week, focus, online, outage recovery, valid earnings, partial reports, statement currency, empty statements and cleanup.');
    } finally {
        await browser.close();
        unlinkSync(harnessPath);
    }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
