// Run against the Finix dev server on port 4173. All API data is local to this browser.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { mkdirSync } = require('node:fs');
const { join } = require('node:path');
const { fixtures } = require('./desktop-redesign.browser.cjs');

const user = { id: 'preview', username: 'inversor', plan: 'CREATOR', role: 'ADMIN', subscriptionStatus: 'ACTIVE', isCreator: true, isProfilePublic: true, createdAt: '2026-09-01T12:00:00Z', _count: { posts: 0, following: 0, followedBy: 0 }, posts: [] };
const asset = { id: 'msft', symbol: 'NASDAQ:MSFT', label: 'Microsoft', description: 'Microsoft Corporation', format: 'currency', currency: 'USD', price: 410, change: 1.5, premarketPrice: 410, premarketChange: 1.5, regularPrice: 404, regularChange: 1, isPremarketQuote: true, updatedAt: '2026-10-06T11:00:00Z', unavailable: false };
const calendar = {
    economicData: { status: 'READY' }, isProUser: true, weekRange: { from: '2026-10-05', to: '2026-10-11' }, categories: { all: 1, us: 1, ar: 0, earnings: 1, dividends: 1 },
    days: [{ dayName: 'Martes', dayShort: 'MAR', date: '2026-10-06', isToday: true,
        economicEvents: [{ id: 'economic', eventType: 'ECONOMIC', country: 'Estados Unidos', countryCode: 'US', title: 'Empleo en servicios (ISM)', description: 'Actividad y empleo del sector de servicios.', category: 'EMPLOYMENT', importance: 'HIGH', marketImpactScore: 5, date: '2026-10-06', time: '14:00', timestampUtc: '2026-10-06T14:00:00Z', forecastValue: '55', previousValue: '47.8', affectedAssets: ['SPY'] }],
        earningsEvents: [{ id: 'earnings', ticker: 'MSFT', companyName: 'Microsoft', date: '2026-10-06', dateStatus: 'CONFIRMED', epsEstimate: 3.2, revenueEstimate: 65000000000, earningsImpactScore: 5 }],
        dividendEvents: [{ id: 'dividend', ticker: 'MSFT', companyName: 'Microsoft', exDate: '2026-10-06', paymentDate: '2026-10-20', amount: 0.8, frequency: 'Trimestral' }],
    }],
};

async function sectionFixtures(page, options) {
    await fixtures(page, options);
    await page.addInitScript(user => localStorage.setItem('user', JSON.stringify(user)), user);
    await page.route('**/api/**', route => {
        const path = new URL(route.request().url()).pathname.replace(/^\/api/, '');
        let data;
        if (path === '/auth/me' || path === '/users/inversor' || path === '/me/settings') data = user;
        else if (path === '/analysis') data = [];
        else if (path === '/calendar/week') data = calendar;
        else if (path === '/market/premarket') data = { updatedAt: asset.updatedAt, session: { status: 'pre-market', label: 'Pre-market', nextBell: '2026-10-06T13:30:00Z', secondsToOpen: 900, sentiment: 'bullish', sentimentScore: 65, sentimentSummary: 'Sesión de prueba' }, indices: [], commodities: [], magnificent7: [asset], argentina: [], crypto: [] };
        else if (path === '/market/value-creation/sp500') data = { summary: { totalCount: 1, coveredCount: 1, createsValueCount: 1, destroysValueCount: 0, equilibriumCount: 0, medianSpread: 5, updatedAt: asset.updatedAt, stale: false }, methodology: { riskFreeRate: 4, equityRiskPremium: 5, taxRateFallback: 21, description: 'Información de prueba' }, items: [{ symbol: 'NASDAQ:MSFT', ticker: 'MSFT', name: 'Microsoft', sector: 'Tecnología', marketCap: 3000000000000, roic: 15, wacc: 10, spread: 5, beta: 1, costOfEquity: 10, costOfDebt: 5, status: 'CREA_VALOR', alphaSpreadUrl: 'https://example.com/test' }] };
        else if (path === '/billing/overview') data = { subscriptions: [], payments: [] };
        else if (path.startsWith('/users/inversor/')) data = [];
        else if (path === '/personal-finance/snapshot') data = { transactions: [], accounts: [], cards: [], debts: [], goals: [], budgets: [], recurring: [], recurringChanges: [], cardSummary: [], history: [], preferences: { categories: ['Otros'], rules: [], reserves: { ARS: 0, USD: 0, EUR: 0 }, reminderDays: 3, includePortfolio: false, currency: 'ARS' }, summary: { income: 0, expenses: 0, difference: 0, fixed: 0, variable: 0, pendingCount: 0, estimate: { hidden: false, incomplete: true, value: 0, income: 0, paid: 0, commitments: 0, variableBudget: 0, reserve: 0, formula: "Ingresos menos pagos y compromisos" }, accounts: [], budgets: [], categories: [], upcoming: [] } };
        else if (path === '/market/rankings') data = { items: [{ ticker: 'MSFT', companyName: 'Microsoft', price: 410, changePercent: 1.5, volume: 25000000, rank: 1, logoUrl: '/logo-small.webp' }], date: '2026-10-06', isStale: false };
        return data === undefined ? route.fallback() : route.fulfill({ json: data });
    });
}

const routes = [
    { path: '/calendario', title: 'Calendario de mercado' },
    { path: '/market', tab: 'Pre-Market', title: 'Pre-Market' },
    { path: '/market', tab: 'Creación de valor' },
    { path: '/analysis' },
    { path: '/explore', title: 'Explorar' },
    { path: '/settings', title: 'Configuración' },
    { path: '/profile' },
    { path: '/notifications', title: 'Notificaciones' },
    { path: '/messages' },
    { path: '/comunidades', title: 'Comunidades' },
    { path: '/comunidades/crear' },
    { path: '/finanzas', title: 'Finanzas Personales' },
    { path: '/finanzas/movimientos', title: 'Finanzas Personales' },
    { path: '/finanzas/cuentas', title: 'Finanzas Personales' },
    { path: '/finanzas/tarjetas', title: 'Finanzas Personales' },
    { path: '/finanzas/presupuestos', title: 'Finanzas Personales' },
    { path: '/finanzas/objetivos', title: 'Finanzas Personales' },
    { path: '/finanzas/calendario', title: 'Finanzas Personales' },
    { path: '/finanzas/analytics', title: 'Finanzas Personales' },
    { path: '/finanzas/importar', title: 'Finanzas Personales' },
    { path: '/finanzas/configuracion', title: 'Finanzas Personales' },
    { path: '/mercado/mejores-rendimientos' },
    { path: '/settings/plan' },
    { path: '/dashboard' },
    { path: '/market/seguimiento' },
    { path: '/news' },
    { path: '/portfolio' },
    { path: '/about' },
    { path: '/help' },
    { path: '/pro' },
    { path: '/creator' },
    { path: '/terms' },
    { path: '/privacy' },
    { path: '/cookies' },
    { path: '/legal/responsible' },
    { path: '/payment-result' },
];

async function main() {
    const selectedRoutes = process.env.FINIX_SECTION_PATHS
        ? routes.filter(route => process.env.FINIX_SECTION_PATHS.split(',').includes(route.path))
        : routes;
    const browser = await chromium.launch({ headless: true });
    const directory = '/tmp/finix-unified-sections';
    mkdirSync(directory, { recursive: true });
    const page = await browser.newPage({ viewport: { width: 1536, height: 1000 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await sectionFixtures(page);
    const open = async route => {
        await page.goto(`http://127.0.0.1:4173${route.path}`);
        if (route.tab) await page.getByRole('tab', { name: route.tab, exact: true }).click();
        if (route.title) await page.getByRole('heading', { name: route.title, exact: true }).waitFor();
        else await page.waitForFunction(() => {
            const frame = document.querySelector('.desktop-page-frame');
            return frame ? Boolean(frame.firstElementChild && !frame.querySelector(':scope > [aria-label="Cargando sección"]')) : Boolean(document.querySelector('.desktop-info-main')?.firstElementChild);
        });
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(500);
    };
    const mobileStyles = async baseline => {
        // Let delayed profile/card entrance animations finish before comparing geometry.
        await page.waitForTimeout(1200);
        if (baseline) await page.evaluate(() => {
            for (const sheet of document.styleSheets) {
                if (sheet.ownerNode?.getAttribute('data-vite-dev-id')?.endsWith('/desktop-sections.css')) sheet.disabled = true;
            }
            const frame = document.querySelector('.desktop-page-frame');
            if (frame) frame.replaceWith(...frame.childNodes);
            const infoMain = document.querySelector('.desktop-info-main');
            if (infoMain) infoMain.replaceWith(...infoMain.childNodes);
            const infoShell = document.querySelector('.desktop-info-shell');
            if (infoShell) infoShell.replaceWith(...infoShell.childNodes);
        });
        return page.locator('main h1, main h2, main h3, main input, main select, main [role="tab"], .calendar-tabs, .calendar-filters, .market-header, .premarket-header').evaluateAll(nodes => nodes.filter(node => node.getBoundingClientRect().width > 0).map(node => {
            const rect = node.getBoundingClientRect(), style = getComputedStyle(node);
            return { text: node.textContent.trim(), x: rect.x, y: rect.y, width: rect.width, height: rect.height, font: style.fontFamily, size: style.fontSize, color: style.color, background: style.backgroundColor, radius: style.borderRadius };
        }));
    };
    try {
        for (const [index, route] of selectedRoutes.entries()) {
            await page.setViewportSize({ width: 1536, height: 1000 });
            await open(route);
            if (route.title) assert.ok(await page.getByRole('heading', { name: route.title, exact: true }).count(), `${route.path} renders its title`);
            for (const theme of ['light', 'dark']) {
                await page.evaluate(theme => document.documentElement.className = theme, theme);
                for (const width of [1536, 1280, 1024]) {
                    await page.setViewportSize({ width, height: 1000 });
                    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
                    const styles = await page.locator('main h1').evaluateAll(nodes => nodes.filter(node => node.getBoundingClientRect().width > 0).map(node => ({ size: getComputedStyle(node).fontSize, family: getComputedStyle(node).fontFamily })));
                    assert.ok(styles.every(style => style.size === (route.path === '/news' ? '54px' : '34px') && style.family.startsWith('Inter')), `${route.path} uses shared title typography: ${JSON.stringify(styles)}`);
                    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${route.path} fits ${width} (${theme})`);
                    if (width === 1536 && index < 12) await page.screenshot({ path: join(directory, `${index}-${theme}.png`), animations: 'disabled' });
                }
            }
            if (route.path === '/calendario') {
                await page.getByRole('button', { name: /^Balances/ }).click();
                await page.getByRole('heading', { name: 'MSFT', exact: true }).waitFor();
                await page.getByRole('button', { name: /^Dividendos/ }).click();
                await page.getByRole('heading', { name: 'MSFT', exact: true }).waitFor();
                await page.getByRole('button', { name: 'Semana siguiente', exact: true }).click();
                await page.getByText('+1 sem.', { exact: true }).waitFor();
                await page.getByRole('button', { name: 'Semana anterior', exact: true }).click();
                await page.getByText('Semana actual', { exact: true }).waitFor();
            }
            if (route.tab === 'Pre-Market') {
                const search = page.getByPlaceholder('Buscar activo o símbolo...');
                await search.fill('MSFT');
                await page.getByRole('button', { name: 'Ver gráfico de Microsoft (MSFT)', exact: true }).waitFor();
                await search.fill('sin-resultados');
                assert.equal(await page.locator('.premarket-grid .market-quote-card').count(), 0);
                await search.fill('');
            }
            if (route.path === '/settings') {
                await page.getByRole('tab', { name: 'Preferencias', exact: true }).click();
                assert.equal(await page.getByRole('tab', { name: 'Preferencias', exact: true }).getAttribute('data-state'), 'active');
            }
            if (route.path === '/profile' || route.path === '/notifications') {
                const tab = page.getByRole('button', { name: route.path === '/profile' ? 'Guardados' : 'No leídas', exact: true });
                await tab.click();
                assert.equal(await tab.getAttribute('aria-pressed'), 'true');
                assert.equal(await tab.evaluate(node => getComputedStyle(node).fontSize), '16px');
                assert.equal(await tab.evaluate(node => getComputedStyle(node).borderRadius), '4px');
            }
            if (route.path === '/explore') {
                await page.getByRole('button', { name: 'Guardados', exact: true }).click();
                await page.getByRole('button', { name: 'Volver a la actividad', exact: true }).waitFor();
            }
            if (route.path === '/help') {
                await page.getByRole('button', { name: 'Buscar en Finix', exact: true }).click();
                await page.getByRole('dialog', { name: 'Buscar en Finix', exact: true }).waitFor();
                await page.keyboard.press('Escape');
            }
            await page.setViewportSize({ width: 390, height: 844 });
            await open(route);
            const baseline = await mobileStyles(true);
            await open(route);
            assert.deepEqual(await mobileStyles(false), baseline, `${route.path}: mobile styles remain unchanged`);
            if ((index + 1) % 12 === 0) console.log(`Verified ${index + 1}/${selectedRoutes.length} sections`);
        }
        assert.deepEqual(errors, [], 'No runtime errors across sections');
        console.log(JSON.stringify({ sections: selectedRoutes.length, titleTypographyUnified: true, lightAndDark: true, responsiveDesktop: true, mobileUnchanged: true, runtimeErrors: errors }));
    } finally { await browser.close(); }
}
if (require.main === module) main().catch(error => { console.error(error); process.exitCode = 1; });
module.exports = { sectionFixtures };
