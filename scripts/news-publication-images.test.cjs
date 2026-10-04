const { test } = require('node:test');
const assert = require('node:assert/strict');
const { NewsSlotsService } = require('../apps/api/dist/news/news-slots.service');
const { NewsSyncService } = require('../apps/api/dist/news/news-sync.service');
const { NewsService } = require('../apps/api/dist/news/news.service');
const { NewsFetcherService } = require('../apps/api/dist/news/news-fetcher.service');
const { isIllustrativeNewsImage, NEWS_ILLUSTRATION_URLS, resolveNewsImage } = require('../apps/api/dist/news/news-image.util');

const articleUrl = 'https://publisher.com/news/earnings';
const photo = 'https://cdn.publisher.com/earnings.jpg';

function slotService(article = null, foundPhoto = undefined) {
    const writes = [];
    const lookedUp = [];
    const slot = { id: 'slot', categoryId: 'markets', articleId: article?.id ?? null, article };
    const service = new NewsSlotsService({}, {});
    service.prisma = {
        newsCategory: { findUnique: async () => ({ slug: 'markets' }) },
        newsSlot: { findUnique: async () => slot, update: async args => { writes.push(args); return args.data; } },
        newsArticle: {
            upsert: async args => { writes.push(args); return { id: 'new-article', ...args.create }; },
            update: async args => { writes.push(args); return args.data; },
        },
        newsSlotHistory: { create: async () => ({}) },
    };
    service.scrapeUrlPreview = async url => { lookedUp.push(url); return { imageUrl: foundPhoto }; };
    return { service, writes, lookedUp };
}

test('publishing a text-only article saves a related photo before it becomes visible', async () => {
    const { service, writes } = slotService({ id: 'old', url: articleUrl, title: 'Bitcoin sube', imageUrl: null });
    await service.publishSlot('slot');
    assert.deepEqual(writes[0].data, { status: 'PUBLISHED', isPublished: true, imageUrl: resolveNewsImage('Bitcoin sube') });
});

test('a missing photo is recovered and saved in the same update that publishes the article', async () => {
    const { service, writes, lookedUp } = slotService({ id: 'old', url: articleUrl, imageUrl: null }, photo);
    await service.publishSlot('slot');
    assert.deepEqual(lookedUp, [articleUrl]);
    assert.deepEqual(writes[0].data, { status: 'PUBLISHED', isPublished: true, imageUrl: photo });
});

test('manual uploads without a photo get one automatically for drafts and immediate publication', async () => {
    for (const status of ['DRAFT', 'PUBLISHED']) {
        const { service, writes } = slotService();
        await service.assignArticleToSlot('slot', { url: articleUrl, title: 'Earnings', status });
        assert.ok(isIllustrativeNewsImage(writes[0].create.imageUrl));
        assert.equal(writes[0].update.imageUrl, writes[0].create.imageUrl);
        assert.equal(writes[0].create.isPublished, status === 'PUBLISHED');
    }
});

test('manual upload persists the original photo rather than relying on a card fallback', async () => {
    const { service, writes } = slotService(null, '/news/photos/earnings.jpg');
    await service.assignArticleToSlot('slot', { url: articleUrl, title: 'Earnings', status: 'PUBLISHED' });
    assert.equal(writes[0].create.imageUrl, 'https://publisher.com/news/photos/earnings.jpg');
    assert.equal(writes[0].update.imageUrl, writes[0].create.imageUrl);
    assert.equal(writes[0].create.isPublished, true);
});

test('replacing a story does not borrow the photo from the previous story', async () => {
    const { service, writes, lookedUp } = slotService({ id: 'previous', url: 'https://publisher.com/other', imageUrl: photo });
    await service.assignArticleToSlot('slot', { url: articleUrl, title: 'New story', status: 'PUBLISHED' });
    assert.deepEqual(lookedUp, [articleUrl]);
    assert.ok(isIllustrativeNewsImage(writes[0].create.imageUrl));
    assert.notEqual(writes[0].create.imageUrl, photo);
});

test('editing the same story preserves an explicitly selected photo without scraping', async () => {
    const { service, writes, lookedUp } = slotService({ id: 'existing', url: articleUrl, imageUrl: photo });
    await service.assignArticleToSlot('slot', { url: articleUrl, title: 'Edited title', status: 'PUBLISHED' });
    assert.equal(writes[0].update.imageUrl, photo);
    assert.deepEqual(lookedUp, []);
});

function syncService(existing = []) {
    const service = Object.create(NewsSyncService.prototype);
    const writes = [];
    service.prisma = {
        newsArticle: {
            findMany: async () => existing,
            create: async args => { writes.push(args); return { id: 'new', ...args.data }; },
            update: async args => { writes.push(args); return args.data; },
        },
        newsArticleSource: { create: async () => ({}), upsert: async () => ({}) },
    };
    service.sourceCategoryPolicy = () => ({ priority: 50, reliabilityScore: 50 });
    service.calculateRelevance = () => 50;
    return { service, writes };
}

const category = { id: 'crypto', slug: 'cripto' };
const record = imageUrl => ({
        item: { url: articleUrl, title: 'Earnings report', summary: 'Earnings details', content: '', imageUrl, publishedAt: new Date() },
        source: { id: 'source', name: 'Publisher', baseUrl: 'https://publisher.com' }, category,
});

test('automatic persistence always saves a photo and uses the category when the title is unspecific', async () => {
    for (const image of [undefined, 'javascript:invalid', resolveNewsImage('Generic story'), photo]) {
        const { service, writes } = syncService();
        const result = await service.persistArticles([record(image)], [category]);
        assert.equal(result.created, 1);
        assert.equal(writes.length, 1);
        assert.equal(writes[0].data.imageUrl, image === photo ? photo : resolveNewsImage('Earnings report', 'cripto'));
    }
});

test('updating duplicate news retains its original photo when the new source lacks a photo', async () => {
    const { service, writes } = syncService([{ id: 'existing', url: articleUrl, imageUrl: photo, title: 'Earnings report', categoryId: category.id }]);
    await service.persistArticles([record(undefined)], [category]);
    assert.equal(writes[0].data.imageUrl, photo);
});

test('an original source photo replaces an illustration while custom photos remain unchanged', async () => {
    for (const customImage of [true, false]) {
        const oldImage = customImage ? 'https://cdn.publisher.com/custom.jpg' : resolveNewsImage('Earnings report', 'cripto');
        const { service, writes } = syncService([{ id: 'existing', url: articleUrl, imageUrl: oldImage, customImage, title: 'Earnings report', categoryId: category.id }]);
        await service.persistArticles([record(photo)], [category]);
        assert.equal(writes[0].data.imageUrl, customImage ? oldImage : photo);
    }
});

test('the legacy manual import adds a related photo before creating a text-only article', async () => {
    const service = Object.create(NewsService.prototype);
    let saved;
    service.newsFetcher = { scrapeWebsitePage: async () => ({ title: 'Bitcoin sube', text: 'Article content without an image.' }) };
    service.sentimentAnalyzer = { analyzeArticle: () => ({ tickers: [] }) };
    service.categorizeNews = async () => category;
    service.getOrCreateSource = async () => ({ id: 'source' });
    service.prisma = { news: { upsert: async args => { saved = args; return args.create; } } };
    service.queryCache = new Map();
    await service.addManualNews(articleUrl);
    assert.equal(saved.create.imageUrl, resolveNewsImage('Bitcoin sube', 'cripto'));
});

test('category selection chooses other news with original photos and fills remaining spaces with illustrated news', async () => {
    for (const originalCount of [0, 2, 5]) {
        const service = Object.create(NewsSyncService.prototype);
        const rows = [
            ...Array.from({ length: originalCount }, (_, i) => ({ id: `original-${i}`, imageUrl: photo + `?${i}`, score: 10 - i })),
            ...Array.from({ length: 5 }, (_, i) => ({ id: `illustrated-${i}`, imageUrl: NEWS_ILLUSTRATION_URLS[i], score: 100 - i })),
            { id: 'missing-photo', imageUrl: null, score: 1000 },
        ];
        let requests = 0;
        service.prisma = { newsArticle: { findMany: async args => {
            requests++;
            return rows.filter(row => row.imageUrl && (args.where.imageUrl.notIn
                ? !args.where.imageUrl.notIn.includes(row.imageUrl)
                : args.where.imageUrl.in.includes(row.imageUrl)))
                .sort((a, b) => b.score - a.score).slice(0, args.take).map(row => ({ id: row.id }));
        } } };
        const selected = await service.findArticlesWithPhotos(category.id);
        assert.equal(selected.length, 5);
        assert.deepEqual(selected.slice(0, originalCount).map(row => row.id), Array.from({ length: originalCount }, (_, i) => `original-${i}`));
        assert.ok(selected.slice(originalCount).every(row => row.id.startsWith('illustrated-')));
        assert.equal(requests, originalCount === 5 ? 1 : 2);
    }
});

test('a source outage does not create mock articles with generic stock photos', async () => {
    const fetcher = new NewsFetcherService();
    fetcher.fetchFromRSSFeeds = async () => [];
    assert.deepEqual(await fetcher.fetchAllNews(), []);
});
