const { chromium } = require('playwright');
const { readFileSync } = require('node:fs');
const assert = require('node:assert/strict');

const base = process.env.FINIX_BROWSER_TEST_URL || 'http://127.0.0.1:5178';
const photo = readFileSync(require('node:path').join(__dirname, '../apps/web/public/news-fallback.jpg'));
const user = { id: 'news-test', email: 'reader@example.test', username: 'reader', role: 'USER', plan: 'FREE', proAccessOverride: false, onboardingCompleted: true };
const category = { id: 'markets', slug: 'markets', name: 'Mercados', displayOrder: 1 };
const images = ['https://photos.publisher.com/original.jpg', 'https://photos.publisher.com/broken.jpg', undefined, 'javascript:invalid', '//photos.publisher.com/original.jpg'];
const slots = images.map((imageUrl, index) => ({
    id: `slot-${index}`, slotKey: `slot-${index}`, position: index + 1, isActive: true,
    article: { id: `article-${index}`, title: `Noticia ${index + 1} de mercados`, url: `https://publisher.com/news/${index}`, imageUrl, sourceName: 'Publisher', publishedAt: new Date().toISOString() },
}));

(async () => {
    const browser = await chromium.launch({ headless: true });
    try {
        for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
            const page = await browser.newPage({ viewport });
            const errors = [];
            let failedImageRequests = 0;
            page.on('pageerror', error => errors.push(error.message));
            await page.addInitScript(user => {
                localStorage.setItem('token', 'test.' + btoa(JSON.stringify({ iss: 'finix-api' })) + '.signature');
                localStorage.setItem('user', JSON.stringify(user));
            }, user);
            await page.route('**/api/**', async route => {
                const path = new URL(route.request().url()).pathname.replace('/api', '');
                const response = path === '/mercadopago/config' ? { freeAccessEnabled: true, purchasesPaused: true }
                    : path === '/auth/me' ? user
                    : path === '/news/slots/categories' ? [category]
                    : path === '/news/slots/category/markets' ? { category, slots }
                    : path === '/news' ? slots.slice(0, 3).map(slot => ({ ...slot.article, source: { name: 'Publisher' }, category }))
                    : {};
                await route.fulfill({ json: response });
            });
            await page.route('https://photos.publisher.com/**', async route => {
                if (route.request().url().endsWith('/original.jpg')) await route.fulfill({ contentType: 'image/jpeg', body: photo });
                else { failedImageRequests++; await route.fulfill({ status: 404, body: 'Missing photo' }); }
            });
            await page.route('https://images.unsplash.com/**', async route => {
                failedImageRequests++;
                await route.fulfill({ status: 503, body: 'Image provider unavailable' });
            });
            await page.goto(base + '/news');
            const photos = page.locator('a[href^="https://publisher.com/news/"] img');
            await photos.last().waitFor();
            assert.equal(await photos.count(), 5);
            for (const image of await photos.all()) {
                await image.scrollIntoViewIfNeeded();
                await page.waitForFunction(img => img.complete && img.naturalWidth > 0, await image.elementHandle());
            }
            const sources = await photos.evaluateAll(imgs => imgs.map(img => img.src));
            assert.equal(sources.filter(src => src.endsWith('/news-fallback.jpg')).length, 3);
            assert.equal(sources.filter(src => src === 'https://photos.publisher.com/original.jpg').length, 2);
            assert.ok(failedImageRequests >= 2 && failedImageRequests <= 4, 'failed external images should not be retried indefinitely');
            assert.deepEqual(errors, []);
            await page.close();
        }
        console.log('News browser checks passed: all five layouts load a photo on desktop and mobile, including missing/broken images and an unavailable image provider.');
    } finally {
        await browser.close();
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
