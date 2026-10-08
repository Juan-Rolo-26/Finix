// Local API fixtures only. Verify the desktop feed and surrounding panels.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { sectionFixtures } = require('./desktop-sections.browser.cjs');
const BASE = process.env.FINIX_BROWSER_TEST_URL || 'http://127.0.0.1:4173';

async function main() {
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1536, height: 864 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(`${page.url()}: ${error.stack}`));
    // Layout verification must not depend on live third-party widget bundles.
    await page.route(url => /(^|\.)tradingview(?:-widget)?\.com$/.test(url.hostname), route => route.abort());
    await sectionFixtures(page, { populatedSocial: true });
    const open = async () => {
        await page.goto(`${BASE}/dashboard`);
        await page.getByText('Seguimos los resultados de las empresas', { exact: false }).waitFor();
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(600);
    };
    const dimensions = async () => page.evaluate(() => {
        const bounds = node => { const r = node.getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width }; };
        const grid = document.querySelector('.desktop-social-grid');
        const feed = document.querySelector('.desktop-social-feed');
        const left = document.querySelector('.desktop-social-sidebar--left');
        const right = document.querySelector('.desktop-social-sidebar--right');
        return {
            grid: bounds(grid), feed: bounds(feed), left: bounds(left), right: bounds(right),
            panels: [...document.querySelectorAll('.desktop-social-sidebar > div')].map(bounds),
            links: [...document.querySelectorAll('.dashboard-footer a')].map(bounds),
            sidebarOverflow: [left, right].some(node => node.scrollHeight > node.clientHeight + 1),
            previewsOverflow: [...document.querySelectorAll('.calendar-preview-card > div:last-child, .dashboard-headlines-card > div:last-child')].some(node => node.scrollHeight > node.clientHeight + 1),
            horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
        };
    });
    try {
        await open();
        for (const theme of ['light', 'dark']) {
            await page.evaluate(theme => document.documentElement.className = theme, theme);
            for (const [width, height] of [[1920,1080], [1536,864], [1536,650], [1366,768], [1280,720], [1024,768]]) {
                await page.setViewportSize({ width, height });
                await page.evaluate(() => { scrollTo(0,0); });
                await page.waitForTimeout(100);
                const layout = await dimensions();
                assert.ok(Math.abs(layout.feed.left - layout.grid.left) < 1, `Feed starts on the left at ${width}`);
                assert.ok(layout.feed.right < layout.left.left && layout.left.right < layout.right.left, 'Feed followed by both right columns');
                assert.ok(layout.feed.width > layout.left.width && layout.feed.width > layout.right.width, 'Feed remains the widest column');
                assert.ok(layout.panels.every(panel => panel.top >= 68 && panel.bottom <= height), `All panels in view: ${JSON.stringify(layout)}`);
                assert.ok(layout.links.every(link => link.top >= 68 && link.bottom <= height), 'All legal/social links in view');
                assert.equal(layout.sidebarOverflow, false, 'Sidebars do not require scrolling');
                assert.equal(layout.previewsOverflow, false, `Calendar and headlines previews do not require scrolling at ${width}x${height}`);
                assert.equal(layout.horizontalOverflow, false, 'No horizontal page overflow');
                assert.equal(await page.locator('.desktop-social-sidebar--left .market-ranking-card button.group').count(), 5);
                assert.equal(await page.locator('.desktop-social-sidebar--right .market-ranking-card button.group').count(), 5);
                if (width === 1536) await page.screenshot({ path: `/tmp/finix-centered-feed-${theme}-${height}.png`, animations: 'disabled' });
                await page.evaluate(() => scrollTo(0, 500));
                await page.waitForTimeout(100);
                const scrolled = await dimensions();
                assert.ok(scrolled.links.every(link => link.top >= 68 && link.bottom <= height), 'Legal links stay visible while scrolling feed');
                assert.ok(scrolled.panels.every(panel => panel.top >= 67 && panel.bottom <= height + 1), `Panels stay visible while scrolling feed at ${width}x${height}: ${JSON.stringify(scrolled)}`);
            }
        }
        await page.setViewportSize({ width: 1536, height: 864 });
        await page.evaluate(() => scrollTo(0, 0));
        await page.locator('.calendar-preview-card').getByRole('button', { name: 'Ver todos', exact: true }).click();
        await page.waitForURL('**/calendario');
        await open();
        await page.locator('.dashboard-footer').getByRole('link', { name: 'Términos', exact: true }).click();
        await page.waitForURL('**/terms');
        await open();
        await page.locator('.dashboard-headlines-card').getByText('Las empresas tecnológicas impulsan la jornada del mercado', { exact: true }).click();
        await page.waitForURL('**/news?category=mercados');
        await page.setViewportSize({ width: 390, height: 844 });
        await open();
        assert.equal(await page.locator('.desktop-social-sidebar--left').isVisible(), false);
        assert.equal(await page.locator('.desktop-social-sidebar--right').isVisible(), false);
        const mobileStyles = () => page.locator('.desktop-social-feed, .desktop-social-feed textarea, .desktop-social-feed button').evaluateAll(nodes => nodes.filter(node => node.getBoundingClientRect().width > 0).map(node => { const r = node.getBoundingClientRect(), s = getComputedStyle(node); return [r.x,r.y,r.width,r.height,s.fontSize,s.color,s.backgroundColor]; }));
        const mobile = await mobileStyles();
        await page.evaluate(() => { for (const sheet of document.styleSheets) if (sheet.ownerNode?.getAttribute('data-vite-dev-id')?.endsWith('/desktop-social.css')) sheet.disabled = true; });
        assert.deepEqual(await mobileStyles(), mobile, 'Mobile styling unchanged');
        assert.deepEqual(errors, [], 'No runtime errors');
        console.log(JSON.stringify({ leftFeed: true, gainersOnRight: true, visiblePanelsAndLegalLinks: true, stickySidebars: true, desktopSizes: 6, themes: 2, existingNavigation: true, mobileUnchanged: true, runtimeErrors: errors }));
    } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
