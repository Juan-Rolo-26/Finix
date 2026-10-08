const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { fixtures } = require('./desktop-redesign.browser.cjs');
const { DEFAULT_NEWS_CATEGORIES } = require('../apps/api/dist/news/news-catalog');

(async () => {
    const browser = await chromium.launch({ headless: true });
    try {
        const page = await browser.newPage({ viewport: { width: 1535, height: 864 } });
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await fixtures(page);
        await page.route('**/api/news/slots/**', route => {
            const path = new URL(route.request().url()).pathname;
            if (path.endsWith('/categories')) return route.fulfill({ json: DEFAULT_NEWS_CATEGORIES });
            const category = DEFAULT_NEWS_CATEGORIES.find(cat => cat.slug === path.split('/').pop());
            if (!category) return route.fulfill({ json: { ok: true } });
            return route.fulfill({ json: { category, slots: Array.from({ length: 10 }, (_, index) => ({
                id: `${category.slug}-slot-${index}`, slotKey: `${category.slug}_${index}`, position: index + 1, isActive: true,
                article: { id: `${category.slug}-${index}`, title: `${category.name}: las claves del mercado ${index + 1}`, description: 'Las empresas presentan sus resultados y los inversores siguen los cambios de la economía.', publishedAt: new Date().toISOString(), url: `https://publisher.example/${category.slug}/${index}`, imageUrl: index === 0 ? 'https://publisher.example/broken.jpg' : null, sourceName: 'Fuente financiera' },
            })) } });
        });
        await page.route('https://publisher.example/**', route => route.abort());
        await page.goto(`${process.env.FINIX_BROWSER_TEST_URL || 'http://127.0.0.1:5173'}/news`);
        const edition = page.locator('.desktop-news-edition');
        let previousColor;
        for (const category of DEFAULT_NEWS_CATEGORIES) {
            await page.locator(`.desktop-news-hero button[data-slug="${category.slug}"]`).click();
            await edition.getByRole('link', { name: new RegExp(`${category.name}: las claves del mercado 1\\b`) }).waitFor();
            assert.equal(await edition.locator('a').count(), 10, category.slug);
            assert.equal(await edition.locator('.desktop-news-featured a').count(), 4);
            assert.equal(await edition.locator('.desktop-news-timeline a').count(), 6);
            const hrefs = await edition.locator('a').evaluateAll(cards => cards.map(card => card.href));
            assert.equal(new Set(hrefs).size, 10);
            const color = await edition.locator('.desktop-news-card__cover').first().evaluate(el => getComputedStyle(el).backgroundImage);
            assert.notEqual(color, previousColor, 'Category colors change with selection');
            previousColor = color;
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
        }
        await page.waitForFunction(() => document.querySelectorAll('.desktop-news-edition img').length === 0);
        await page.evaluate(() => document.documentElement.classList.add('dark'));
        assert.equal(await edition.getByRole('link').count(), 10);
        assert.deepEqual(errors, []);
        console.log('Desktop news passed: 15 categories × 10 distinct articles, four featured + six timeline cards, category colors, optional/broken photos, dark mode and no overflow.');
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
