// Run with the web development server on port 4173.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { writeFileSync, unlinkSync } = require('node:fs');
const { join } = require('node:path');
async function main() {
    const browser = await chromium.launch({ headless: true });
    const name = `portfolio-summary-${process.pid}.html`;
    const filename = join(__dirname, '../apps/web', name);
    const asset = (id, quantity = 2) => ({ id, ticker: 'NASDAQ:AAPL', tipoActivo: 'STOCK', montoInvertido: quantity * 100, ppc: 100, cantidad: quantity, precioActual: 110 });
    let quantity = 2, fail = false, empty = false, pending = null, revoke = false;
    const requests = [];
    const portfolios = () => [
        { id: 'first', nombre: 'Cartera principal', monedaBase: 'ARS', nivelRiesgo: 'medio', esPrincipal: true, modoSocial: true, assets: [asset('a', quantity)], totalValue: quantity * 110 },
        { id: 'slow', nombre: 'Cartera lenta', monedaBase: 'USD', nivelRiesgo: 'alto', assets: [asset('b')] },
        { id: 'second', nombre: 'Cartera cripto', monedaBase: 'USD', nivelRiesgo: 'alto', assets: [asset('c')] },
    ];
    const metrics = id => ({ capitalTotal: quantity * 100, capitalInvertido: quantity * 100, valorActual: id === 'second' ? 750 : quantity * 110, totalValue: quantity * 110, gananciaTotal: quantity * 10, variacionPorcentual: id === 'second' ? -5 : 10, cantidadActivos: 1,
        diversificacionPorClase: empty ? {} : id === 'second' ? { CRYPTO: 750 } : { STOCK: 120, CEDEAR: 100, CASH: 0, BOND: NaN },
        diversificacionPorActivo: { AAPL: quantity * 110 }, retornosMensuales: empty ? [] : [{ monthKey: '2026-09', label: 'SEPT', value: id === 'second' ? -5 : 8 }, { monthKey: '2026-10', label: 'OCT', value: 0 }],
    });
    try {
        writeFileSync(filename, `<!doctype html><div id="root"></div><script type="module">
            import React from 'react'; import ReactDOM from 'react-dom/client'; import { MemoryRouter } from 'react-router-dom';
            import { ProfilePortfolioSection } from '/src/pages/Profile.tsx'; import PortfolioPage from '/src/pages/Portfolio.tsx';
            import { useAuthStore } from '/src/stores/authStore.ts'; import { notifyPortfolioUpdate } from '/src/lib/portfolioUpdates.ts'; import '/src/index.css';
            useAuthStore.setState({ user: { id: 'portfolio-test', username: 'tester', plan: 'PRO', subscriptionStatus: 'ACTIVE' } });
            const root = ReactDOM.createRoot(document.getElementById('root'));
            window.profileProps = { profileUserId: 'portfolio-test', isOwnProfile: true, showPortfolio: true, totalReturn: 999, showStats: true, showExactReturns: true };
            window.updateProfile = updates => { window.profileProps = { ...window.profileProps, ...updates }; root.render(React.createElement(MemoryRouter, null, React.createElement('main', {style:{maxWidth:1400,margin:'auto',padding:24}}, React.createElement(ProfilePortfolioSection, window.profileProps)))); };
            window.renderPage = () => root.render(React.createElement(MemoryRouter, null, React.createElement(PortfolioPage)));
            window.notify = notifyPortfolioUpdate;
            window.updateProfile({});
        </script>`);
        const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, timezoneId: 'America/Argentina/Buenos_Aires' });
        await page.clock.install({ time: new Date('2026-10-03T18:00:00Z') });
        const errors = []; page.on('pageerror', e => errors.push(e.message));
        await page.addInitScript(() => localStorage.setItem('token', 'portfolio-browser-test'));
        await page.route('**/api/**', async route => {
            const url = new URL(route.request().url()), path = url.pathname.replace(/^\/api/, '');
            requests.push(path);
            if (path === '/market/dolar/rates') return route.fulfill({ json: [{ id: 'ccl', sell: 1000 }, { id: 'mep', sell: 1000 }] });
            if (path === '/portfolios' || path.startsWith('/portfolios/public/portfolio-test')) return route.fulfill(fail ? { status: 503, json: {} } : { json: portfolios() });
            if (revoke && path.startsWith('/portfolios/public/portfolio/')) return route.fulfill({ status: 404, json: {} });
            const id = path.split('/').at(-2);
            if (id === 'slow' && path.endsWith('/metrics')) { pending = route; return; }
            if (path.endsWith('/metrics')) return route.fulfill(fail ? { status: 503, json: {} } : { json: metrics(id) });
            if (path.endsWith('/movements')) return route.fulfill({ json: [{ id: 't1', fecha: '2026-09-20', tipoMovimiento: 'compra', ticker: 'NASDAQ:AAPL', claseActivo: 'STOCK', cantidad: quantity, precio: 100, total: quantity * 100 }] });
            if (path.endsWith('/benchmarks')) return route.fulfill({ json: { benchmarkAvailable: true, series: [{ date: '2026-09-20', portfolio: 100, sp500: 100 }, { date: '2026-10-03', portfolio: 110, sp500: 101 }], performance: { series: [{ date: '2026-09-20', value: quantity * 100, returnPct: 0 }, { date: '2026-10-03', value: quantity * 110, returnPct: 10 }], insufficientData: false } } });
            return route.fulfill({ json: [] });
        });
        await page.goto(`http://127.0.0.1:4173/${name}`);
        const profile = page.locator('[aria-label="Resumen del portafolio del perfil"]');
        await profile.getByText('ARS 220,00', { exact: true }).waitFor();
        assert.equal(await profile.getByText('+999.00%', { exact: true }).count(), 0, 'portfolio-specific return overrides a stale profile total');
        assert.equal(await profile.getByRole('link', { name: /Administrar portafolio/ }).getAttribute('href'), '/portfolio');
        const composition = profile.getByRole('region', { name: 'Composición del portafolio' });
        const stock = composition.getByRole('button', { name: /Acciones y CEDEARs: 100/ });
        await stock.waitFor();
        assert.equal(await composition.getByRole('button').count(), 1, 'equivalent classes combine, zero/invalid allocations are omitted');
        await stock.click();
        assert.equal(await stock.getAttribute('aria-pressed'), 'true');
        assert.ok(await composition.getByText('de la cartera', { exact: true }).count());
        const monthly = profile.getByRole('region', { name: 'Rendimiento mensual', exact: true });
        assert.ok(await monthly.getByText('+8,0%', { exact: true }).count());
        await monthly.getByText('Ver rendimientos por mes', { exact: true }).click();
        assert.ok(await monthly.getByRole('cell', { name: '0,0%', exact: true }).count(), 'genuine zero returns remain visible');
        await page.clock.runFor(300);
        await profile.screenshot({ path: '/tmp/finix-portfolio-profile-desktop.png' });
        const moneySize = await profile.getByText('ARS 220,00', { exact: true }).evaluate(el => parseFloat(getComputedStyle(el).fontSize));
        assert.ok(moneySize >= 30, `larger metric typography (${moneySize}px)`);

        quantity = 3;
        await page.clock.fastForward(60001);
        await profile.getByText('ARS 330,00', { exact: true }).waitFor();
        quantity = 4;
        await page.evaluate(() => window.notify('first'));
        await profile.getByText('ARS 440,00', { exact: true }).waitFor();
        fail = true;
        await page.evaluate(() => window.dispatchEvent(new Event('focus')));
        await profile.getByText(/Se conserva la última medición/).waitFor();
        assert.ok(await profile.getByText('ARS 440,00', { exact: true }).count());
        fail = false;
        await profile.getByRole('button', { name: 'Cartera lenta', exact: true }).click();
        await page.waitForFunction(() => !document.body.innerText.includes('ARS 440,00'));
        await profile.getByRole('button', { name: 'Cartera cripto', exact: true }).click();
        await page.clock.runFor(300);
        await composition.getByRole('button', { name: /Criptomonedas: 100/ }).waitFor();
        if (pending) await pending.fulfill({ json: { ...metrics('slow'), valorActual: 999999 } }).catch(() => {});
        assert.equal(await composition.getByRole('button', { name: /Acciones/ }).count(), 0, 'late metrics cannot replace the new portfolio');
        assert.ok(await monthly.getByText('-5,0%', { exact: true }).count());
        empty = true;
        await profile.getByRole('button', { name: 'Actualizar', exact: true }).click();
        await composition.getByText(/Agregá posiciones o efectivo/).waitFor();
        assert.equal(await composition.getByRole('button').count(), 0, 'no example allocation when real data is missing');
        empty = false;
        await page.evaluate(() => window.dispatchEvent(new Event('online')));
        await composition.getByRole('button', { name: /Criptomonedas: 100/ }).waitFor();

        await page.setViewportSize({ width: 390, height: 844 });
        await page.clock.runFor(300);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'profile fits mobile width');
        await profile.screenshot({ path: '/tmp/finix-portfolio-profile-mobile.png' });
        await profile.getByRole('button', { name: 'Activos', exact: true }).click();
        await page.clock.runFor(300);
        assert.ok(await profile.getByText('NASDAQ:AAPL', { exact: true }).count());
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'asset table scrolls within the mobile panel');
        await profile.getByRole('button', { name: 'Movimientos', exact: true }).click();
        await page.clock.runFor(300);
        assert.ok(await profile.getByText('NASDAQ:AAPL', { exact: true }).count());
        await profile.getByRole('button', { name: 'Resumen', exact: true }).click();
        await page.clock.runFor(300);
        await page.evaluate(() => window.updateProfile({ isOwnProfile: false, showExactReturns: false, returnsVisibilityMode: 'range' }));
        await page.getByText('El titular comparte sus rendimientos por rangos.').waitFor();
        assert.equal(await page.getByText('-5,0%', { exact: true }).count(), 0, 'public return settings protect exact chart values');
        assert.ok(requests.some(p => p.startsWith('/portfolios/public/portfolio/')));
        revoke = true;
        await page.evaluate(() => window.dispatchEvent(new Event('focus')));
        await page.getByText('Este portafolio ya no está disponible.', { exact: true }).waitFor();
        assert.equal(await page.getByRole('region', { name: 'Composición del portafolio' }).count(), 0, 'public revocation removes the saved snapshot');
        revoke = false;

        // Actual Portfolio page: quote/transaction revisions on the same ID
        // refresh the metrics, not just the historical curve.
        quantity = 2;
        await page.clock.resume();
        await page.setViewportSize({ width: 1440, height: 1100 });
        await page.evaluate(() => window.renderPage());
        await page.getByRole('region', { name: 'Composición del portafolio' }).waitFor();
        const before = requests.filter(p => p === '/portfolios/first/metrics').length;
        quantity = 5;
        await page.evaluate(() => window.notify('first'));
        await page.getByText(/ARS\s550/).first().waitFor();
        assert.ok(requests.filter(p => p === '/portfolios/first/metrics').length > before, 'operations refresh metrics without a portfolio ID change');
        await page.waitForTimeout(700);
        await page.screenshot({ path: '/tmp/finix-portfolio-page-desktop.png', fullPage: true });
        await page.setViewportSize({ width: 390, height: 844 });
        await page.waitForTimeout(700);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Portfolio charts fit mobile width');
        await page.screenshot({ path: '/tmp/finix-portfolio-page-mobile.png', fullPage: true });
        await page.evaluate(() => { document.documentElement.classList.remove('light'); document.documentElement.classList.add('dark'); });
        await page.getByRole('region', { name: 'Rendimiento mensual', exact: true }).screenshot({ path: '/tmp/finix-portfolio-chart-dark.png' });
        assert.deepEqual(errors, []);
        console.log('Portfolio summary and page: real allocations, monthly returns, larger typography, privacy, operations, auto refresh, outages, stale requests and mobile widths verified.');
    } finally {
        await browser.close();
        try { unlinkSync(filename); } catch {}
    }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
