// Run with the web dev server on port 4173. API responses are local fixtures.
// Set FINIX_DESKTOP_PREVIEW_URL to an isolated preview harness, or use the app.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { mkdirSync } = require('node:fs');
const { join } = require('node:path');

const user = { id: 'preview', username: 'inversor', plan: 'PRO', role: 'USER', subscriptionStatus: 'ACTIVE', isProfilePublic: true };
const symbols = ['NASDAQ:AAPL', 'NASDAQ:MSFT', 'NASDAQ:NVDA', 'NASDAQ:AMZN', 'NASDAQ:META', 'NASDAQ:GOOGL', 'NYSE:SYF', 'NASDAQ:INCY', 'BCBA:GGAL', 'NYSE:BABA', 'NASDAQ:TSLA', 'NASDAQ:ADBE'];
const items = symbols.map((symbol, index) => ({ id: String(index), symbol, chartSymbol: symbol, name: ['Apple Inc.', 'Microsoft', 'NVIDIA', 'Amazon', 'Meta', 'Alphabet'][index] || symbol.split(':')[1], currentPrice: 100 + index, changePercent: index < 6 ? 3 - index * 0.4 : -(index - 5) * 0.4, personalStatus: 'RESEARCHING', currency: 'USD', market: symbol.split(':')[0], targetPrice: index < 2 ? 120 : null, targetDirection: 'BELOW', distancePct: index < 2 ? 8 : null, quoteUpdatedAt: '2026-10-05T19:00:00Z' }));
const categories = [
    { id: 'markets', slug: 'mercados', name: 'Mercados', color: '#1679bb', displayOrder: 1 },
    { id: 'economy', slug: 'economia', name: 'Economía', color: '#6366a6', displayOrder: 2 },
    { id: 'companies', slug: 'empresas', name: 'Empresas', color: '#178963', displayOrder: 3 },
];
const titles = ['Las empresas tecnológicas impulsan la jornada del mercado', 'El mercado argentino y los principales índices de la región', 'Resultados trimestrales: las novedades de las compañías', 'Las claves de la economía para seguir esta semana', 'Los inversores siguen los próximos eventos económicos'];
const slots = titles.map((title, index) => ({ id: `slot-${index}`, slotKey: `slot_${index}`, position: index + 1, isActive: true, article: { id: `article-${index}`, title, url: `https://example.com/noticia-${index}`, sourceName: 'Finix Editorial', description: 'El equipo editorial de Finix repasa los movimientos del mercado y la información relevante para los inversores. Seguí las novedades de las empresas y la economía en esta actualización.', publishedAt: '2026-10-05T19:00:00Z', imageUrl: '/news-fallback.jpg' } }));
const portfolio = { id: 'portfolio-test', nombre: 'Mi portafolio', monedaBase: 'USD', nivelRiesgo: 'medio', modoSocial: false, esPrincipal: true, admiteBienesRaices: false, cashBalance: 500, totalValue: 4500, createdAt: '2026-09-01T12:00:00Z', assets: items.slice(0, 4).map((item, index) => ({ id: `asset-${index}`, ticker: item.symbol, name: item.name, tipoActivo: 'ACCION', montoInvertido: 900, ppc: 90, cantidad: 10, precioActual: 100, createdAt: '2026-09-01T12:00:00Z' })) };
const history = Array.from({ length: 25 }, (_, index) => ({ date: new Date(Date.UTC(2026, 8, index + 1)).toISOString(), value: 4100 + index * 16, returnPct: index / 3 }));

async function fixtures(page, { populatedSocial = false } = {}) {
    await page.addInitScript(user => {
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('token', 'desktop-test-token');
        localStorage.setItem('finix_watchlist_onboarding_dismissed', 'true');
        localStorage.setItem('finix_cookie_consent', JSON.stringify({ version: '1', prefs: { necessary: true, analytics: false, marketing: false } }));
        localStorage.setItem('finix_app_preferences_v4', JSON.stringify({ state: { theme: 'light', sidebarCollapsed: false }, version: 0 }));
    }, user);
    await page.route('**/api/**', async route => {
        const url = new URL(route.request().url()), path = url.pathname.replace(/^\/api/, '');
        let data = {};
        if (path === '/auth/me') data = user;
        else if (path === '/mercadopago/config') data = { freeAccessEnabled: false, purchasesPaused: true };
        else if (path === '/watchlist') data = { watchlists: [{ id: 'first', name: 'Mi lista', itemCount: items.length }] };
        else if (path === '/watchlist/first') data = { id: 'first', items };
        else if (path.includes('/watchlist/membership')) data = { lists: [{ id: 'first', name: 'Mi lista', containsSymbol: false }] };
        else if (path === '/market/search') data = [{ symbol: 'NASDAQ:MSFT', name: 'Microsoft', exchange: 'NASDAQ', type: 'stock' }];
        else if (path === '/users/search') data = [{ id: 'another', username: 'otro_inversor' }];
        else if (path === '/news/slots/categories') data = categories;
        else if (path.startsWith('/news/slots/category/')) { const category = categories.find(cat => cat.slug === path.split('/').pop()); data = { category, slots: slots.map(slot => ({ ...slot, article: { ...slot.article, title: `${category.name}: ${slot.article.title}` } })) }; }
        else if (path.includes('unread-count')) data = { count: 2 };
        else if (path === '/posts/feed') data = { posts: populatedSocial ? [{ id: 'post-preview', author: user, content: 'Seguimos los resultados de las empresas y los próximos eventos del mercado. Compartí tu análisis con la comunidad de Finix.', type: 'post', analysisType: 'analysis', media: [], tickers: 'MSFT', likesCount: 4, commentsCount: 2, repostsCount: 0, savesCount: 0, likedByMe: false, repostedByMe: false, savedByMe: false, createdAt: '2026-10-05T19:00:00Z' }] : [], hasMore: false, nextCursor: null };
        else if (path === '/calendar/home' && populatedSocial) data = { events: ['Empleo en servicios (ISM)', 'Índice de optimismo económico (RCM/TIPP)', 'Minutas de la Reserva Federal'].map((title, index) => ({ id: `event-${index}`, type: 'ECONOMIC', title, date: '2026-10-06T14:00:00Z', time: '14:00', dayLabel: 'MAR', importance: 'HIGH', impactScore: 3, consensusValue: '55', previousValue: '47.8' })) };
        else if (path === '/news/slots/headlines' && populatedSocial) data = slots.slice(0, 3).map(slot => ({ ...slot.article, category: 'Mercados', categorySlug: 'mercados', categoryColor: '#178963', slotId: slot.id }));
        else if (path.includes('rankings/top-')) data = { items: populatedSocial ? items.slice(0, 5).map((item, index) => ({ rank: index + 1, ticker: item.symbol.split(':')[1], companyName: item.name, price: item.currentPrice, change: 2, changePercent: path.includes('losers') ? -item.changePercent : item.changePercent, volume: 24000000, logoUrl: '/logo-small.webp' })) : [], isStale: false };
        else if (path === '/market/candles') data = { candles: [] };
        else if (path === '/market/dashboard') { const sectionItems = items.slice(0, 4).map(item => ({ id: item.id, symbol: item.symbol, label: item.name, description: item.symbol, format: 'currency', currency: 'USD', price: item.currentPrice, change: item.changePercent, updatedAt: item.quoteUpdatedAt, unavailable: false })); data = { updatedAt: '2026-10-05T19:00:00Z', pulse: { label: 'Mercado', tone: 'positive', summary: 'Cotizaciones de prueba', advancing: 6, declining: 6, unchanged: 0 }, currencyGap: null, dollars: [], sections: { argentina: [], global: sectionItems, crypto: [], commodities: [], indicators: [] }, leaders: { gainers: sectionItems, losers: [] }, community: [] }; }
        else if (path === '/portfolios') data = [portfolio];
        else if (path === '/portfolios/portfolio-test/metrics') data = { capitalTotal: 4100, capitalInvertido: 3600, cashBalance: 500, assetsValue: 4000, totalValue: 4500, valorActual: 4500, gananciaTotal: 400, variacionPorcentual: 9.76, diversificacionPorClase: { ACCION: 100 }, diversificacionPorActivo: {}, cantidadActivos: 4 };
        else if (path === '/portfolios/portfolio-test/movements') data = { movements: [], hasMore: false, nextCursor: null };
        else if (path === '/portfolios/portfolio-test/benchmarks') data = { performance: { series: history, startDate: history[0].date, insufficientData: false }, benchmarkAvailable: true, series: history.map(point => ({ date: point.date, portfolio: 100 + point.returnPct, sp500: 100 + point.returnPct / 2 })) };
        else if (path === '/messages/conversations') data = [];
        else if (path === '/portfolios/watchlists' || path === '/news/slots/headlines' || path === '/communities' || path === '/posts/leaderboard' || path === '/users/suggestions') data = [];
        return route.fulfill({ json: data });
    });
}

async function main() {
    const browser = await chromium.launch({ headless: true });
    const directory = process.env.FINIX_DESKTOP_SCREENSHOTS || '/tmp/finix-desktop-redesign';
    mkdirSync(directory, { recursive: true });
    const preview = process.env.FINIX_DESKTOP_PREVIEW_URL;
    const errors = [];
    const page = await browser.newPage({ viewport: { width: 1536, height: 1000 }, reducedMotion: 'reduce' });
    page.on('pageerror', error => errors.push(error.message));
    await fixtures(page, { populatedSocial: true });
    const open = async (path, baseline = false) => {
        await page.goto(preview ? `${preview}?route=${encodeURIComponent(path)}&baseline=${baseline}` : `http://127.0.0.1:4173${path}`);
        await page.evaluate(async () => { await document.fonts.ready; });
    };
    const navigate = async path => {
        if (preview) await page.evaluate(path => window.testNavigate(path), path);
        else await page.goto(`http://127.0.0.1:4173${path}`);
    };
    const pathIs = async path => preview ? page.waitForFunction(path => window.testPath === path, path) : page.waitForURL(url => url.pathname === path);
    try {
        if (process.env.FINIX_DESKTOP_CAPTURE_ONLY) {
            for (const route of ['/market/seguimiento', '/news', '/portfolio', '/dashboard', '/market', '/messages']) {
                await open(route, process.env.FINIX_DESKTOP_BASELINE === 'true');
                await page.waitForTimeout(1500);
                await page.screenshot({ path: join(directory, `${route.replaceAll('/', '-') || 'home'}-${page.viewportSize().width}.png`), fullPage: true, animations: 'disabled' });
            }
            console.log(JSON.stringify({ errors }));
            return;
        }

        await open('/market/seguimiento');
        await page.getByRole('heading', { name: 'Top Gainers', exact: true }).waitFor();
        for (const theme of ['light', 'dark']) {
            if (preview) await page.evaluate(theme => window.setTestTheme(theme), theme);
            else await page.evaluate(theme => document.documentElement.className = theme, theme);
            for (const width of [2560, 1920, 1536, 1280, 1024]) {
                await page.setViewportSize({ width, height: 1000 });
                await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
                assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `No overflow at ${width} (${theme})`);
                const rectangles = await page.locator('.watchlist-insight').evaluateAll(cards => cards.map(card => card.getBoundingClientRect().top));
                assert.ok(rectangles.every(top => Math.abs(top - rectangles[0]) < 1), 'Three insight panels share one desktop row');
                const violations = await page.locator('.watchlist-movers').evaluateAll(cards => cards.flatMap(card => {
                    const bounds = card.getBoundingClientRect(), header = card.querySelector('.watchlist-insight__header').getBoundingClientRect();
                    return [...card.querySelectorAll('.watchlist-movers__asset')].flatMap(asset => {
                        const box = asset.getBoundingClientRect();
                        return box.top < header.bottom || box.bottom > bounds.bottom || box.left < bounds.left || box.right > bounds.right ? ['overlap'] : [];
                    });
                }));
                assert.deepEqual(violations, [], `Charts stay within cards at ${width} (${theme})`);
                const desktopStyle = await page.evaluate(() => {
                    const root = getComputedStyle(document.documentElement), shell = getComputedStyle(document.querySelector('.finix-desktop-shell'));
                    const nav = document.querySelector('.desktop-header__inner').getBoundingClientRect();
                    const content = document.querySelector('.watchlist-shell').getBoundingClientRect();
                    return { rootPrimary: root.getPropertyValue('--primary'), shellPrimary: shell.getPropertyValue('--primary'), rootBackground: root.getPropertyValue('--background'), shellBackground: shell.getPropertyValue('--background'), rootCard: root.getPropertyValue('--card'), shellCard: shell.getPropertyValue('--card'), navbarFont: parseFloat(getComputedStyle(document.querySelector('.desktop-primary-nav a')).fontSize), navWidth: nav.width, contentWidth: content.width, gutter: parseFloat(getComputedStyle(document.querySelector('.watchlist-shell')).paddingLeft) };
                });
                assert.equal(desktopStyle.shellPrimary, desktopStyle.rootPrimary, 'Desktop uses the original Finix green');
                assert.equal(desktopStyle.shellBackground, desktopStyle.rootBackground, 'Desktop preserves Finix background in each theme');
                assert.equal(desktopStyle.shellCard, desktopStyle.rootCard, 'Desktop preserves Finix card colors in each theme');
                assert.ok(desktopStyle.navbarFont >= 15, 'Navbar text is larger');
                assert.equal(desktopStyle.navWidth, width, 'Navbar uses the full width');
                assert.equal(desktopStyle.contentWidth, width, 'Watchlist uses the full width');
                assert.ok(Math.abs(desktopStyle.gutter - width * 0.046) < 0.1, 'Desktop margins match the reference proportion');
                const header = await page.locator('.desktop-header').boundingBox();
                const account = await page.getByRole('button', { name: 'Mi cuenta', exact: true }).boundingBox();
                assert.ok(account.x + account.width <= width && account.y >= header.y, 'Account remains inside navbar');
                if (width === 1536) await page.screenshot({ path: join(directory, `seguimiento-${theme}.png`), fullPage: true, animations: 'disabled' });
            }
        }
        await page.setViewportSize({ width: 1536, height: 1000 });
        await page.getByRole('button', { name: 'Herramientas', exact: true }).click();
        await page.getByRole('menuitem', { name: /Calendario económico/ }).waitFor();
        await page.screenshot({ path: join(directory, 'herramientas.png'), animations: 'disabled' });
        await page.keyboard.press('Escape');
        await page.getByRole('menu').waitFor({ state: 'hidden' });
        await page.getByRole('button', { name: 'Mi cuenta', exact: true }).click();
        await page.getByRole('menuitem', { name: 'Mi perfil', exact: true }).click();
        await pathIs('/profile');
        await navigate('/market/seguimiento');
        await page.getByRole('button', { name: 'Buscar en Finix', exact: true }).click();
        const search = page.getByPlaceholder('Buscar en Finix o pedir a la IA...');
        await search.fill('MSFT');
        await page.getByRole('dialog', { name: 'Buscar en Finix', exact: true }).getByRole('button', { name: /Microsoft/ }).click();
        await pathIs('/market');
        await page.keyboard.press('Escape');
        await page.keyboard.press('Control+k');
        await search.waitFor();
        await page.keyboard.press('Escape');
        assert.equal(await search.count(), 0);
        await navigate('/dashboard');
        await page.getByText('Seguimos los resultados de las empresas', { exact: false }).waitFor();
        for (const theme of ['light', 'dark']) {
            if (preview) await page.evaluate(theme => window.setTestTheme(theme), theme);
            else await page.evaluate(theme => document.documentElement.className = theme, theme);
            for (const width of [2560, 1920, 1536, 1280, 1024]) {
                await page.setViewportSize({ width, height: 1000 });
                await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
                const layout = await page.locator('.desktop-social-grid').evaluate(grid => {
                    const bounds = grid.getBoundingClientRect();
                    const children = [...grid.children].filter(child => getComputedStyle(child).display !== 'none').map(child => child.getBoundingClientRect());
                    return { left: bounds.left, right: bounds.right, last: children.at(-1).right, feedWidth: children[0].width, overflowing: [...grid.querySelectorAll('button, h3, a')].filter(element => element.getBoundingClientRect().width > 0).some(element => element.getBoundingClientRect().right > bounds.right + 1) };
                });
                assert.ok(Math.abs(layout.left - width * 0.046) < 0.1 && Math.abs(width - layout.right - width * 0.046) < 0.1, `Dashboard matches reference margins at ${width}: ${JSON.stringify(layout)}`);
                assert.ok(Math.abs(layout.last - layout.right) < 1, 'All desktop columns fill their grid');
                assert.ok(layout.feedWidth >= 380, 'Centered feed keeps readable text between both sidebars');
                assert.equal(layout.overflowing, false, `Social cards fit at ${width} (${theme})`);
                if (width === 1536) await page.screenshot({ path: join(directory, `inicio-${theme}.png`), animations: 'disabled' });
            }
        }
        await page.setViewportSize({ width: 1536, height: 1000 });
        await navigate('/portfolio');
        await page.getByRole('heading', { name: 'Mi portafolio', exact: true }).waitFor();
        await page.locator('button[title="Ocultar saldos"]').click();
        await page.locator('button[title="Mostrar saldos"]').waitFor();
        await page.locator('button[title="Mostrar saldos"]').click();
        await page.getByPlaceholder('Buscar por ticker...').fill('MSFT');
        await page.getByText('Microsoft Corp.', { exact: true }).first().waitFor();
        await page.getByPlaceholder('Buscar por ticker...').fill('');
        await page.evaluate(() => scrollTo(0, 0));
        await page.screenshot({ path: join(directory, 'portafolio.png'), fullPage: true, animations: 'disabled' });
        await navigate('/news');
        await page.locator('.desktop-news-featured .desktop-news-card').first().waitFor();
        assert.equal(await page.locator('.desktop-news-featured .desktop-news-card').count(), 4);
        assert.equal(await page.locator('.desktop-news-timeline .desktop-news-card').count(), 5);
        assert.equal(await page.locator('.desktop-news-featured .desktop-news-card').first().getAttribute('href'), 'https://example.com/noticia-0');
        await page.locator('.desktop-news-filters').getByRole('button', { name: 'Economía', exact: true }).click();
        await page.locator('.desktop-news-featured').getByRole('heading', { name: /Economía:/ }).first().waitFor();
        await page.locator('.desktop-news-filters').getByRole('button', { name: 'Actualizar noticias' }).click();
        await page.locator('.desktop-news-filters').getByRole('button', { name: 'Actualizar noticias' }).waitFor({ state: 'visible' });
        await page.evaluate(() => scrollTo(0, 0));
        await page.screenshot({ path: join(directory, 'noticias-dark.png'), fullPage: true, animations: 'disabled' });
        if (preview) await page.evaluate(() => window.setTestTheme('light'));
        else await page.evaluate(() => document.documentElement.className = 'light');
        await page.screenshot({ path: join(directory, 'noticias-light.png'), fullPage: true, animations: 'disabled' });
        for (const width of [1536, 1280, 1024, 768, 390, 320]) {
            await page.setViewportSize({ width, height: 1000 });
            assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `News has no overflow at ${width}`);
            assert.equal(await page.locator('.desktop-header').isVisible(), width >= 1024);
            assert.equal(await page.locator('.desktop-news-edition').isVisible(), width >= 1024);
            assert.equal(await page.locator('.news-mobile-mosaic').isVisible(), width < 1024);
        }
        if (preview) {
            for (const route of ['/market/seguimiento', '/news']) {
                await page.setViewportSize({ width: 390, height: 844 });
                const readMobile = async baseline => {
                    await open(route, baseline);
                    await page.getByRole('heading', { name: route === '/news' ? 'Noticias' : 'Seguimiento', exact: true }).waitFor();
                    if (route === '/news') await page.locator('.news-mobile-mosaic a, a.group').first().waitFor();
                    else await page.getByRole('heading', { name: 'Top Gainers', exact: true }).waitFor();
                    await page.waitForTimeout(500);
                    const styles = await page.locator(route === '/news' ? 'h1, a.group, button[data-slug], nav.lg\\:hidden' : 'h1, .watchlist-hero, .watchlist-insight, .watchlist-movers__asset, nav.lg\\:hidden').evaluateAll(elements => elements.filter(element => element.getBoundingClientRect().width > 0).map(element => {
                        const style = getComputedStyle(element), rect = element.getBoundingClientRect();
                        return { text: element.textContent.trim(), x: rect.x, y: rect.y, width: rect.width, height: rect.height, font: style.fontFamily, fontSize: style.fontSize, color: style.color, background: style.backgroundColor, radius: style.borderRadius };
                    }));
                    await page.screenshot({ path: join(directory, `mobile-${route === '/news' ? 'noticias' : 'seguimiento'}-${baseline ? 'before' : 'after'}.png`), fullPage: true, animations: 'disabled' });
                    return styles;
                };
                const before = await readMobile(true), after = await readMobile(false);
                assert.deepEqual(after, before, `${route}: mobile layout and visual styles remain unchanged`);
            }
            await page.setViewportSize({ width: 1536, height: 1000 });
            await open('/market/seguimiento');
            await page.evaluate(() => window.setTestPlan('FREE'));
            await page.locator('.desktop-plan').getByText('Plan Free', { exact: true }).waitFor();
            await page.getByRole('heading', { name: 'Dale más espacio a tus ideas' }).waitFor();
            await page.evaluate(() => window.setTestFree(true));
            await page.locator('.desktop-plan').getByText('Acceso gratuito', { exact: true }).waitFor();
        }
        assert.deepEqual(errors, [], 'No page runtime errors');
        console.log(JSON.stringify({ desktopNavigation: true, functionalSearch: true, toolsAndProfile: true, newsCategories: true, editorialSlotsPreserved: true, chartsWithinCards: true, responsive: true, fullWidth: true, finixColorsPreserved: true, largerTypography: true, mobileUnchanged: Boolean(preview), runtimeErrors: errors }));
    } finally { await browser.close(); }
}
if (require.main === module) main().catch(error => { console.error(error); process.exitCode = 1; });
module.exports = { fixtures };
