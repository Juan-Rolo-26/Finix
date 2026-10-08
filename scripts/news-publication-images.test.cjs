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

test('publishing text-only news does not require or invent a photo', async () => {
    const { service, writes } = slotService({ id: 'old', url: articleUrl, title: 'Bitcoin sube', imageUrl: null });
    await service.publishSlot('slot');
    assert.deepEqual(writes[0].data, { status: 'PUBLISHED', isPublished: true, imageUrl: null });
});

test('publishing text-only news does not fetch a photograph', async () => {
    const { service, writes, lookedUp } = slotService({ id: 'old', url: articleUrl, imageUrl: null }, photo);
    await service.publishSlot('slot');
    assert.deepEqual(lookedUp, []);
    assert.deepEqual(writes[0].data, { status: 'PUBLISHED', isPublished: true, imageUrl: null });
});

test('manual uploads allow missing photos in drafts and immediate publication', async () => {
    for (const status of ['DRAFT', 'PUBLISHED']) {
        const { service, writes } = slotService();
        await service.assignArticleToSlot('slot', { url: articleUrl, title: 'Earnings', status });
        assert.equal(writes[0].create.imageUrl, null);
        assert.equal(writes[0].update.imageUrl, writes[0].create.imageUrl);
        assert.equal(writes[0].create.isPublished, status === 'PUBLISHED');
    }
});

test('manual upload persists the original photo rather than relying on a card fallback', async () => {
    const { service, writes } = slotService();
    await service.assignArticleToSlot('slot', { url: articleUrl, title: 'Earnings', status: 'PUBLISHED', imageUrl: '/news/photos/earnings.jpg' });
    assert.equal(writes[0].create.imageUrl, 'https://publisher.com/news/photos/earnings.jpg');
    assert.equal(writes[0].update.imageUrl, writes[0].create.imageUrl);
    assert.equal(writes[0].create.isPublished, true);
});

test('replacing a story does not borrow the photo from the previous story', async () => {
    const { service, writes, lookedUp } = slotService({ id: 'previous', url: 'https://publisher.com/other', imageUrl: photo });
    await service.assignArticleToSlot('slot', { url: articleUrl, title: 'New story', status: 'PUBLISHED' });
    assert.deepEqual(lookedUp, []);
    assert.equal(writes[0].create.imageUrl, null);
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

test('automatic persistence accepts photo-less news and preserves actual source photographs', async () => {
    for (const image of [undefined, 'javascript:invalid', resolveNewsImage('Generic story'), photo]) {
        const { service, writes } = syncService();
        const result = await service.persistArticles([record(image)], [category]);
        assert.equal(result.created, 1);
        assert.equal(writes.length, 1);
        assert.equal(writes[0].data.imageUrl, image === photo ? photo : null);
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

test('selection ranks ten localized stories by relevance and freshness regardless of photos', async () => {
    const service = Object.create(NewsSyncService.prototype);
    const rows = Array.from({ length: 16 }, (_, index) => ({ id: String(index), title: 'Las acciones suben', publishedAt: new Date(), relevanceScore: index, imageUrl: index % 2 ? photo : null }));
    service.prisma = { newsArticle: { findMany: async args => { assert.equal(args.where.imageUrl, undefined); return rows; } } };
    service.slotsService = { toSpanishArticle: async article => article.id === '15' ? null : article };
    const selected = await service.findBestArticles(category.id);
    assert.equal(selected.length, 10);
    assert.deepEqual(selected.map(article => article.id), Array.from({ length: 10 }, (_, index) => String(14 - index)));
});

test('a source outage does not create mock articles with generic stock photos', async () => {
    const fetcher = new NewsFetcherService();
    fetcher.fetchFromRSSFeeds = async () => [];
    assert.deepEqual(await fetcher.fetchAllNews(), []);
});
