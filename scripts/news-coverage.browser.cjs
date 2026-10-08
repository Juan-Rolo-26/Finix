// Run with the web dev server on port 4173.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { writeFileSync, unlinkSync } = require('node:fs');
const { join } = require('node:path');
const { DEFAULT_NEWS_CATEGORIES } = require('../apps/api/dist/news/news-catalog');

async function main() {
    const browser = await chromium.launch({ headless: true });
    const harnessName = `news-coverage-${process.pid}.html`;
    const harnessPath = join(__dirname, '../apps/web', harnessName);
    try {
        writeFileSync(harnessPath, `<!doctype html><div id="root"></div><script type="module">
            import React from 'react';
            import ReactDOM from 'react-dom/client';
            import { MemoryRouter } from 'react-router-dom';
            import NewsPage from '/src/pages/News.tsx';
            import { useAuthStore } from '/src/stores/authStore.ts';
            import '/src/index.css';
            import '/src/layouts/desktop.css';
            useAuthStore.setState({ user: { id: 'news-test', plan: 'PRO', subscriptionStatus: 'ACTIVE' } });
            window.newsTestRoot = ReactDOM.createRoot(document.getElementById('root'));
            window.newsTestRoot.render(React.createElement(MemoryRouter, null, React.createElement(NewsPage)));
        </script>`);
        const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
        await page.clock.install({ time: new Date('2026-10-03T15:00:00Z') });
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.route('**/news/slots/categories', route => route.fulfill({ json: DEFAULT_NEWS_CATEGORIES }));
        await page.route('**/images.unsplash.com/**', route => route.abort());
        let fail = false, empty = false, slowSlug = null;
        const requests = [];
        const counts = new Map();
        await page.route('**/news/slots/category/*', async route => {
            const slug = new URL(route.request().url()).pathname.split('/').pop();
            requests.push(slug);
            counts.set(slug, (counts.get(slug) || 0) + 1);
            const version = counts.get(slug);
            if (slug === slowSlug) await new Promise(resolve => setTimeout(resolve, 350));
            if (fail) return route.fulfill({ status: 503, json: {} });
            const category = DEFAULT_NEWS_CATEGORIES.find(c => c.slug === slug);
            const slots = Array.from({ length: 10 }, (_, i) => ({
                id: `${slug}-${i}`, slotKey: `${slug}_${i}`, position: i + 1, isActive: true,
                article: empty ? null : { id: `${slug}-article-${i}`, title: `${category.name}: noticia ${i + 1} · actualización ${version}`, description: `Información de ${category.name}`, sourceName: 'Fuente verificada', url: `https://publisher.example/${slug}/${i}`, publishedAt: '2026-10-03T12:00:00Z', imageUrl: '/news-fallback.jpg' },
            }));
            await route.fulfill({ json: { category, slots } }).catch(() => {});
        });
        await page.goto(`${process.env.FINIX_BROWSER_TEST_URL || 'http://127.0.0.1:4173'}/${harnessName}`);
        await page.locator('.news-mobile-mosaic').getByRole('link', { name: /Argentina: noticia 1\b/ }).waitFor();
        for (const category of DEFAULT_NEWS_CATEGORIES) {
            await page.locator(`.news-mobile-content button[data-slug="${category.slug}"]`).click();
            await page.locator('.news-mobile-mosaic').getByRole('link', { name: new RegExp(`${category.name}: noticia 1\\b`) }).waitFor();
            assert.equal(await page.locator('.news-mobile-mosaic a[href^="https://publisher.example/"]').count(), 10, category.slug);
            assert.equal(await page.getByText(/No hay noticias publicadas/).count(), 0);
        }
        slowSlug = 'etfs';
        await page.locator('.news-mobile-content button[data-slug="etfs"]').click();
        await page.waitForFunction(() => document.querySelector('button[data-slug="etfs"]').textContent.includes('ETFs'));
        await page.locator('.news-mobile-content button[data-slug="ai"]').click();
        await page.locator('.news-mobile-mosaic').getByRole('link', { name: /Inteligencia Artificial: noticia 1\b/ }).waitFor();
        await page.waitForTimeout(450);
        assert.equal(await page.locator('.news-mobile-mosaic').getByRole('link', { name: /ETFs: noticia/ }).count(), 0, 'Stale category responses must not replace the active category');
        slowSlug = null;
        const beforeRefresh = counts.get('ai');
        await page.clock.fastForward(300001);
        await page.locator('.news-mobile-mosaic').getByRole('link', { name: new RegExp(`Inteligencia Artificial: noticia 1 · actualización ${beforeRefresh + 1}`) }).waitFor();
        fail = true;
        await page.evaluate(() => window.dispatchEvent(new Event('online')));
        await page.getByText(/Se conservan las últimas noticias/).waitFor();
        assert.equal(await page.locator('.news-mobile-mosaic a[href^="https://publisher.example/ai/"]').count(), 10);
        fail = false;
        await page.evaluate(() => window.dispatchEvent(new Event('focus')));
        await page.waitForFunction(() => !document.body.textContent.includes('Se conservan las últimas noticias'));
        assert.equal(requests.at(-1), 'ai');
        empty = true;
        await Promise.all([page.waitForResponse('**/news/slots/category/fintech'), page.locator('.news-mobile-content button[data-slug="fintech"]').click()]);
        await page.clock.runFor(500);
        await page.getByText('No hay noticias publicadas en Fintech').waitFor({ timeout: 5000 }).catch(async error => { console.error({ body: await page.locator('body').innerText(), lastRequests: requests.slice(-5), errors }); throw error; });
        empty = false;
        await page.clock.fastForward(30001);
        await page.locator('.news-mobile-mosaic').getByRole('link', { name: /Fintech: noticia 1\b/ }).waitFor();
        await page.setViewportSize({ width: 390, height: 844 });
        assert.equal(await page.locator('.news-mobile-mosaic a[href^="https://publisher.example/fintech/"]').count(), 10);
        await page.evaluate(() => window.newsTestRoot.unmount());
        const beforeUnmount = requests.length;
        await page.clock.fastForward(300001);
        await page.evaluate(() => window.dispatchEvent(new Event('focus')));
        assert.equal(requests.length, beforeUnmount, 'Unmount cancels timers and refresh listeners');
        assert.deepEqual(errors, []);
        console.log('News browser checks passed: all 15 categories, 10 cards each, race protection, automatic refresh, outage retention, focus/online, empty recovery, mobile and cleanup.');
    } finally {
        await browser.close();
        unlinkSync(harnessPath);
    }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
