// Requires the web dev server at http://127.0.0.1:4173.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { writeFileSync, unlinkSync } = require('node:fs');
const { join } = require('node:path');
async function main() {
    const browser = await chromium.launch({ headless: true });
    const name = `portfolio-benchmark-test-${process.pid}.html`;
    const path = join(__dirname, '../apps/web', name);
    try {
        writeFileSync(path, `<!doctype html><div id="root"></div><script type="module">
            import React from 'react';
            import ReactDOM from 'react-dom/client';
            import '/src/index.css';
            import { PortfolioDashboard } from '/src/components/portfolio/dashboard/PortfolioDashboard.tsx';
            import { buildBenchmarkComparisonSeries } from '/src/components/portfolio/dashboard/benchmarkUtils.ts';
            const root = ReactDOM.createRoot(document.getElementById('root'));
            window.props = { portfolioId: 'first', assets: [{ ticker: 'MSFT', tipoActivo: 'STOCK', cantidad: 10, ppc: 100, montoInvertido: 1000 }], movements: [{ fecha: '2026-09-20', total: 1000, tipoMovimiento: 'compra' }] };
            window.renderPortfolio = updates => { window.props = { ...window.props, ...updates }; root.render(React.createElement(PortfolioDashboard, window.props)); };
            window.buildComparison = buildBenchmarkComparisonSeries;
            window.renderPortfolio({});
        </script>`);
        const page = await browser.newPage({ viewport: { width: 1400, height: 1000 }, timezoneId: 'America/Argentina/Buenos_Aires' });
        await page.clock.install({ time: new Date('2026-10-03T18:00:00Z') });
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        const requests = [];
        let value = 110;
        let fail = false;
        let missing = false;
        let zero = false;
        let pending = null;
        await page.route('**/portfolios/*/benchmarks?*', async route => {
            const url = new URL(route.request().url());
            const id = url.pathname.split('/').at(-2);
            requests.push({ id, range: url.searchParams.get('range'), currency: url.searchParams.get('currency') });
            if (id === 'slow') { pending = route; return; }
            if (fail) return route.fulfill({ status: 503, json: { message: 'Temporary outage' } });
            const dates = ['2026-10-01T18:00:00Z', '2026-10-03T18:00:00Z'];
            await route.fulfill({ json: {
                benchmarkAvailable: !missing,
                series: missing ? [] : [{ date: dates[0], portfolio: 100, sp500: 100 }, { date: dates[1], portfolio: zero ? 0 : value, sp500: 101 }],
                performance: { series: missing ? [] : [{ date: dates[0], value: 1000, returnPct: 0 }, { date: dates[1], value: zero ? 0 : value * 10, returnPct: zero ? -100 : value - 100 }],
                    startDate: dates[0], insufficientData: missing, message: missing ? 'No hay precios históricos suficientes para calcular un rendimiento fiable en este período.' : undefined },
            } });
        });
        await page.goto(`http://127.0.0.1:4173/${name}`);
        const chart = page.getByRole('region', { name: 'Comparación del portafolio con S&P 500' });
        await chart.getByText('+10.0%', { exact: true }).waitFor();
        assert.equal(requests.length, 1, 'one shared calculation supplies both charts');
        assert.ok(await chart.getByText('+9.0 pts', { exact: true }).count());

        value = 112;
        await page.clock.fastForward(60001);
        await chart.getByText('+12.0%', { exact: true }).waitFor();
        assert.equal(requests.length, 2, 'automatically refresh every minute');

        value = 113;
        await page.evaluate(() => window.dispatchEvent(new Event('focus')));
        await chart.getByText('+13.0%', { exact: true }).waitFor();
        const count = requests.length;
        await page.evaluate(() => window.renderPortfolio({ assets: [{ ...window.props.assets[0], cantidad: 20 }], movements: [...window.props.movements, { fecha: '2026-10-03', total: 1000, tipoMovimiento: 'compra' }] }));
        await page.waitForFunction(() => document.querySelector('[aria-label="Comparación del portafolio con S&P 500"]').getAttribute('aria-busy') === 'false');
        assert.equal(requests.length, count + 1, 'new purchase refreshes even when the number of assets stays the same');

        await chart.getByRole('button', { name: '1M', exact: true }).click();
        await chart.getByText('+13.0%', { exact: true }).waitFor();
        assert.equal(requests.at(-1).range, '1M');

        fail = true;
        await page.evaluate(() => window.dispatchEvent(new Event('online')));
        await page.getByText(/Se conserva la última medición/).waitFor();
        assert.ok(await chart.getByText('+13.0%', { exact: true }).count());
        fail = false;
        value = 114;
        await page.evaluate(() => window.dispatchEvent(new Event('focus')));
        await chart.getByText('+14.0%', { exact: true }).waitFor();

        await page.evaluate(() => window.renderPortfolio({ portfolioId: 'slow' }));
        await page.waitForFunction(() => document.querySelector('[aria-label="Comparación del portafolio con S&P 500"]').getAttribute('aria-busy') === 'true');
        assert.equal(await chart.getByText('+14.0%', { exact: true }).count(), 0, 'different portfolios never share old chart data');
        await page.waitForTimeout(100);
        value = 105;
        await page.evaluate(() => window.renderPortfolio({ portfolioId: 'second', currency: 'ARS' }));
        await chart.getByText('+5.0%', { exact: true }).waitFor();
        if (pending) await pending.fulfill({ json: { series: [{ date: '2026-10-03', portfolio: 999 }], performance: { series: [{ date: '2026-10-03', value: 999, returnPct: 899 }] } } }).catch(() => {});
        assert.equal(requests.at(-1).currency, 'ARS');
        assert.equal(await chart.getByText('+899.0%', { exact: true }).count(), 0, 'late responses cannot overwrite the selected portfolio');

        await page.evaluate(() => window.renderPortfolio({ assets: [] }));
        await chart.getByText('+5.0%', { exact: true }).waitFor();
        assert.equal(await chart.getByText('Sin posiciones', { exact: true }).count(), 0, 'closed positions retain their return history');

        missing = true;
        await page.evaluate(() => window.dispatchEvent(new Event('focus')));
        await page.getByText(/No hay precios históricos suficientes/).waitFor();
        assert.equal(await chart.getByText('+5.0%', { exact: true }).count(), 0);
        assert.equal(await chart.getByText('0.0%', { exact: true }).count(), 0, 'missing measurements do not display a false zero return');

        missing = false;
        zero = true;
        await page.evaluate(() => window.dispatchEvent(new Event('focus')));
        await chart.getByText('-100.0%', { exact: true }).waitFor();
        assert.deepEqual(await page.evaluate(() => window.buildComparison({ apiSeries: [{ date: 'a', value: 1000 }, { date: 'b', value: 3760 }] })), [], 'raw capital growth must never become a fallback return');
        assert.deepEqual(await page.evaluate(() => window.buildComparison({ apiSeries: [{ date: 'a', returnPct: 0 }, { date: 'b', returnPct: -100 }] }).map(point => point.portfolio)), [100, 0]);
        assert.deepEqual(errors, []);
        console.log('Portfolio benchmark: ranges, refresh, operations, cash-only history, failure recovery, zero return index and stale responses verified.');
    } finally {
        await browser.close();
        try { unlinkSync(path); } catch {}
    }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
