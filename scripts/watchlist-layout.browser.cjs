// Regression for the overlapping mover charts and the watchlist search flow.
// Requires the web dev server at http://127.0.0.1:4173.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { writeFileSync, unlinkSync, mkdirSync } = require('node:fs');
const { join } = require('node:path');

async function main() {
    const browser = await chromium.launch({ headless: true });
    const filename = join(__dirname, `../apps/web/watchlist-layout-${process.pid}.html`);
    const symbols = ['NASDAQ:AAPL', 'NASDAQ:MSFT', 'NASDAQ:NVDA', 'NASDAQ:AMZN', 'NASDAQ:META', 'NASDAQ:GOOGL', 'NYSE:SYF', 'NASDAQ:INCY', 'BCBA:GGAL', 'NYSE:BABA', 'NASDAQ:TSLA', 'NASDAQ:ADBE'];
    const items = symbols.map((symbol, index) => ({ id: String(index), symbol, chartSymbol: symbol, name: symbol.split(':')[1], currentPrice: 100 + index, changePercent: index < 6 ? 3 - index * 0.4 : -(index - 5) * 0.4, personalStatus: 'RESEARCHING', currency: 'USD', market: symbol.split(':')[0], targetPrice: index === 0 ? 100 : null, targetDirection: 'BELOW', distancePct: index === 0 ? 0 : null, quoteUpdatedAt: new Date().toISOString() }));
    items.push({ id: 'neutral', symbol: 'NYSE:JNJ', currentPrice: 100, changePercent: 0, name: 'Sin cambios', personalStatus: 'RESEARCHING' });
    items.push({ id: 'missing', symbol: 'NASDAQ:MISSING', currentPrice: null, changePercent: null, name: 'Sin datos', isUnavailable: true, personalStatus: 'RESEARCHING' });
    const lists = [{ id: 'first', name: 'Mi lista', itemCount: items.length }];
    let savedAsset = null, pendingSearch = null;
    const errors = [];
    try {
        writeFileSync(filename, `<!doctype html><div id="root"></div><style>@media(min-width:1024px){#root{margin-left:276px}}</style><script type="module">
            import React from 'react'; import ReactDOM from 'react-dom/client'; import { BrowserRouter } from 'react-router-dom';
            import WatchlistPage from '/src/pages/WatchlistPage.tsx'; import { useAuthStore } from '/src/stores/authStore.ts'; import '/src/index.css';
            useAuthStore.setState({user:{id:'test',plan:'PRO'}});
            window.setTestPlan=plan=>useAuthStore.setState({user:{id:'test',plan}});
            ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(BrowserRouter,null,React.createElement(WatchlistPage)));
        </script>`);
        const page = await browser.newPage({ viewport: { width: 1536, height: 1000 } });
        page.on('pageerror', error => errors.push(error.message));
        await page.addInitScript(() => localStorage.setItem('finix_watchlist_onboarding_dismissed', 'true'));
        await page.route('**/api/**', async route => {
            const request = route.request(), url = new URL(request.url()), path = url.pathname.replace(/^\/api/, '');
            if (path === '/watchlist') return route.fulfill({ json: { watchlists: lists } });
            if (path === '/watchlist/first') return route.fulfill({ json: { id: 'first', items } });
            if (path === '/market/candles') return route.fulfill({ json: { candles: [] } });
            if (path === '/market/search') {
                if (url.searchParams.get('query') === 'A') { pendingSearch = route; return; }
                if (url.searchParams.get('query') === 'error') return route.fulfill({ status: 503, json: {} });
                return route.fulfill({ json: [{ symbol: 'NASDAQ:MSFT', name: 'Microsoft', exchange: 'NASDAQ' }] });
            }
            if (path.startsWith('/watchlist/membership/')) return route.fulfill({ json: { lists: [{ id: 'first', name: 'Mi lista', containsSymbol: false }] } });
            if (path === '/watchlist/first/items' && request.method() === 'POST') { savedAsset = request.postDataJSON(); return route.fulfill({ json: { id: 'new' } }); }
            return route.fulfill({ json: {} });
        });
        await page.goto(`http://127.0.0.1:4173/${filename.split('/').pop()}`);
        await page.getByRole('heading', { name: 'Top Gainers', exact: true }).waitFor();
        assert.equal(await page.locator('.watchlist-movers__asset').count(), 12, 'six gainers and six losers are displayed');
        assert.equal(await page.locator('.watchlist-stats__negative strong').textContent(), '6', 'unchanged/unavailable quotes must not count as losers');
        assert.equal(await page.locator('.watchlist-opportunities').getByText('NASDAQ:AAPL', { exact: true }).count(), 1, 'equality must satisfy the target');

        for (const theme of ['light', 'dark']) {
            await page.evaluate(theme => document.documentElement.className = theme, theme);
            for (const width of [1536, 1280, 1024, 768, 620, 390, 320]) {
                await page.setViewportSize({ width, height: 1000 });
                // Wait for layout/fonts rather than assuming a fixed delay.
                await page.evaluate(async () => { await document.fonts.ready; await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))); });
                const violations = await page.locator('.watchlist-movers').evaluateAll(cards => cards.flatMap(card => {
                    const bounds = card.getBoundingClientRect(), header = card.querySelector('.watchlist-insight__header').getBoundingClientRect();
                    return Array.from(card.querySelectorAll('.watchlist-movers__asset')).flatMap(asset => {
                        const rect = asset.getBoundingClientRect();
                        return rect.top < header.bottom || rect.bottom > bounds.bottom || rect.left < bounds.left || rect.right > bounds.right ? [asset.getAttribute('aria-label')] : [];
                    });
                }));
                assert.deepEqual(violations, [], `charts must stay below titles and inside cards at ${width}px (${theme})`);
                assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `no page overflow at ${width}px (${theme})`);
                assert.ok(await page.locator('.watchlist-movers__asset').first().isVisible());
                if (process.env.FINIX_WATCHLIST_SCREENSHOTS && [1536, 390].includes(width)) {
                    mkdirSync(process.env.FINIX_WATCHLIST_SCREENSHOTS, { recursive: true });
                    await page.locator('.watchlist-page').screenshot({ path: join(process.env.FINIX_WATCHLIST_SCREENSHOTS, `seguimiento-${theme}-${width}.png`) });
                }
            }
        }

        await page.setViewportSize({ width: 1280, height: 1000 });
        const search = page.getByRole('combobox', { name: 'Buscar activos para seguir' });
        const oldRequest = page.waitForRequest(request => new URL(request.url()).searchParams.get('query') === 'A');
        await search.fill('A'); await oldRequest;
        await search.fill('MSFT');
        await page.getByRole('option', { name: /Microsoft/ }).waitFor();
        if (pendingSearch) await pendingSearch.fulfill({ json: [{ symbol: 'NYSE:WRONG', name: 'Wrong result' }] }).catch(() => {});
        assert.equal(await page.getByRole('option', { name: /Wrong result/ }).count(), 0, 'late search results must be ignored');
        await search.press('Enter');
        await page.getByRole('dialog').getByRole('button', { name: 'Mi lista', exact: true }).click();
        await page.getByText('Agregado a "Mi lista"', { exact: true }).waitFor();
        assert.equal(savedAsset.symbol, 'NASDAQ:MSFT'); assert.equal(savedAsset.name, 'Microsoft');
        await page.keyboard.press('Escape');
        await search.fill('error');
        await page.getByText('No se pudo buscar. Volvé a intentarlo.', { exact: true }).waitFor();
        await search.fill('MSFT'); await page.getByRole('option', { name: /Microsoft/ }).waitFor();
        await search.press('Escape'); assert.equal(await page.getByRole('listbox').count(), 0);
        await page.getByRole('tab', { name: 'Lista de seguimiento', exact: true }).click();
        await page.getByPlaceholder('Buscar por ticker, nombre o tag...').fill('NVDA');
        assert.equal(await page.locator('#watchlist-content tbody tr').count(), 1);
        await page.getByRole('tab', { name: 'Dashboard', exact: true }).click();
        await page.getByRole('tab', { name: 'Dashboard', exact: true }).press('ArrowRight');
        assert.equal(await page.getByRole('tab', { name: 'Lista de seguimiento', exact: true }).getAttribute('aria-selected'), 'true');
        await page.getByRole('tab', { name: 'Lista de seguimiento', exact: true }).press('Home');
        assert.equal(await page.getByRole('tab', { name: 'Dashboard', exact: true }).getAttribute('aria-selected'), 'true');
        await page.evaluate(() => window.setTestPlan('FREE'));
        await page.getByRole('heading', { name: 'Dale más espacio a tus ideas' }).waitFor();
        items.splice(0, items.length,
            { ...items[0], targetPrice: null, distancePct: null, name: 'Apple Inc.', changePercent: 1.6 },
            { ...items[6], targetPrice: null, name: 'Synchrony Financial', changePercent: 0.4 },
            { ...items[7], targetPrice: null, name: 'Incyte Corporation', changePercent: -1.6 });
        lists[0].itemCount = items.length;
        await page.getByRole('button', { name: 'Actualizar cotizaciones', exact: true }).click();
        await page.getByRole('heading', { name: 'Resumen de tu Lista' }).locator('..').getByText('3 activos', { exact: true }).waitFor();
        const singleLoser = page.getByRole('region', { name: 'Mayores bajas' }).locator('.watchlist-movers__asset');
        assert.equal(await singleLoser.count(), 1);
        assert.ok((await singleLoser.boundingBox()).width <= 72, 'a single bar must not stretch across its card');
        if (process.env.FINIX_WATCHLIST_SCREENSHOTS) {
            await page.getByRole('button', { name: 'Limpiar búsqueda de activos' }).click();
            await page.evaluate(() => window.setTestPlan('PRO'));
            await page.getByRole('heading', { name: 'Tu estrategia empieza acá' }).waitFor();
            await page.setViewportSize({ width: 1536, height: 1000 });
            await page.evaluate(() => document.documentElement.className = 'light');
            await page.screenshot({ path: join(process.env.FINIX_WATCHLIST_SCREENSHOTS, 'seguimiento-preview.png'), animations: 'disabled', clip: { x: 276, y: 0, width: 1260, height: 1000 } });
        }
        assert.deepEqual(errors, []);
        console.log(JSON.stringify({ noChartOverlap: true, responsiveWithSidebar: true, lightAndDark: true, twelveMovers: true, correctLoserCount: true, targetEquality: true, searchAddAsset: true, staleSearchIgnored: true, searchRecovery: true, listFilters: true, freePlan: true }));
    } finally {
        await browser.close();
        try { unlinkSync(filename); } catch {}
    }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
