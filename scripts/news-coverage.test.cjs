const { test } = require('node:test');
const assert = require('node:assert/strict');
const { NewsSlotsService } = require('../apps/api/dist/news/news-slots.service');
const { NewsSyncService } = require('../apps/api/dist/news/news-sync.service');
const { DEFAULT_NEWS_CATEGORIES, DEFAULT_NEWS_SOURCES, newsCategoryMatchCount } = require('../apps/api/dist/news/news-catalog');

test('All visible categories have usable configured feeds, including dedicated feeds for sparse topics', () => {
    for (const category of DEFAULT_NEWS_CATEGORIES) assert.ok(DEFAULT_NEWS_SOURCES.some(source => source.rssUrl && source.categories.includes(category.slug)), category.slug);
    for (const slug of ['etfs', 'real-estate', 'fintech', 'startups', 'ai', 'tecnologia']) assert.ok(DEFAULT_NEWS_SOURCES.some(source => source.rssUrl && source.categories.length === 1 && source.categories[0] === slug), slug);
});

test('Classification recognizes Spanish and English financial topics without substring false positives', () => {
    assert.ok(newsCategoryMatchCount('etfs', 'BlackRock ETFs and exchange-traded funds'));
    assert.ok(newsCategoryMatchCount('ai', 'El coste de la IA cae'));
    assert.equal(newsCategoryMatchCount('ai', 'Dubai airport opens'), 0);
    assert.equal(newsCategoryMatchCount('acciones', 'Livestock prices are rising'), 0);
    assert.ok(newsCategoryMatchCount('economia', 'Inflation and unemployment in the economy'));
});

test('Classification honors disabled source policies and keeps daily and weekly scopes separate', () => {
    const service = Object.create(NewsSyncService.prototype);
    const categories = new Map([['etfs', { id: 'etfs', slug: 'etfs' }], ['ai', { id: 'ai', slug: 'ai' }]]);
    const item = { title: 'ETF news from OpenAI', summary: '', content: '' };
    const source = { categoryLinks: [{ categoryId: 'etfs', isActive: false }, { categoryId: 'ai', isActive: true }, { categoryId: 'daily', isActive: true }] };
    assert.equal(service.classify(item, source, categories).id, 'ai');
    assert.equal(service.classify(item, { categoryLinks: [{ categoryId: 'daily' }] }, categories), null);
});

test('A URL saved long ago in another category is reused without violating global uniqueness', async () => {
    const service = Object.create(NewsSyncService.prototype);
    const item = { title: 'A published ETF story', summary: '', content: '', url: 'https://publisher.example/story', imageUrl: 'https://publisher.example/photo.jpg', publishedAt: new Date() };
    let reads = 0, reused;
    service.prisma = {
        newsArticle: {
            findMany: async args => {
                reads++;
                if (reads === 1) return [];
                assert.ok(args.where.OR.some(filter => filter.url?.in.includes(item.url)));
                return [{ id: 'old', url: item.url, title: item.title, categoryId: 'other', relevanceScore: 1 }];
            },
            update: async () => {},
            create: async () => { throw new Error('Duplicate URL insert'); },
        },
        newsArticleSource: { upsert: async args => { reused = args.create.articleId; } },
    };
    service.calculateRelevance = () => 50;
    const category = { id: 'etfs', slug: 'etfs' };
    const result = await service.persistArticles([{ item, source: { id: 'source', name: 'Publisher' }, category }], [category]);
    assert.equal(result.created, 0);
    assert.equal(result.updated, 1);
    assert.equal(reused, 'old');
});

test('Unassigned cards recover distinct published stories while editorial drafts and inactive cards remain intact', async () => {
    const service = new NewsSlotsService({}, {});
    const slots = [
        { id: 'first', articleId: null, isActive: true },
        { id: 'second', articleId: null, isActive: true },
        { id: 'editorial', articleId: 'draft', isActive: true },
        { id: 'disabled', articleId: null, isActive: false },
    ];
    const writes = [], history = [];
    service.prisma = {
        newsSlot: {
            findMany: async () => slots,
            updateMany: async args => { writes.push(args); return { count: 1 }; },
        },
        newsArticle: { findMany: async args => {
            assert.equal(args.where.status, 'PUBLISHED');
            assert.equal(args.where.isPublished, true);
            assert.equal(args.where.isActive, true);
            assert.deepEqual(args.where.id.notIn, ['draft']);
            return [
                { id: 'irrelevant', categoryId: 'other', title: 'Dubai airport opens' },
                { id: 'ai-1', categoryId: 'ai', title: 'La inteligencia artificial' },
                { id: 'ai-2', categoryId: 'technology', title: 'OpenAI announces a new model' },
            ];
        } },
        newsSlotHistory: { create: async args => history.push(args) },
    };
    await service.fillEmptySlots('ai', 'ai');
    assert.deepEqual(writes.map(w => [w.where.id, w.data.articleId]), [['first', 'ai-1'], ['second', 'ai-2']]);
    assert.ok(writes.every(w => w.where.articleId === null && w.where.isActive === true), 'Atomic writes must not replace a concurrent editorial assignment');
    assert.equal(history.length, 2);
});

test('Source outages and partial feeds retain prior stories without duplicates or editorial overrides', async () => {
    for (const incoming of [[], ['c'], ['new', 'c']]) {
        const service = new NewsSlotsService({}, {});
        service.ensureSlotsExist = async () => {};
        const slots = ['a', 'b', 'c'].map(id => ({ id, articleId: id, isActive: true, article: { id, sourceId: 'automatic', isActive: true, isPublished: true, status: 'PUBLISHED' } }));
        slots.push({ id: 'manual', articleId: 'manual', isActive: true, article: { sourceId: null } });
        slots.push({ id: 'disabled', articleId: 'disabled', isActive: false });
        service.prisma = {
            newsCategory: { findUnique: async () => ({ slug: 'etfs' }) },
            newsSlot: { findMany: async () => slots, update: async args => { slots.find(s => s.id === args.where.id).articleId = args.data.articleId; } },
            newsSlotHistory: { create: async () => {} },
        };
        await service.replaceAutomaticSlots('etfs', incoming);
        assert.ok(slots.every(s => s.articleId));
        assert.equal(new Set(slots.map(s => s.articleId)).size, slots.length);
        assert.equal(slots.find(s => s.id === 'manual').articleId, 'manual');
        assert.equal(slots.find(s => s.id === 'disabled').articleId, 'disabled');
        if (incoming.length) assert.equal(slots[0].articleId, incoming[0]);
    }
});

test('A database failure releases the sync lock so subsequent runs can recover', async () => {
    const service = Object.create(NewsSyncService.prototype);
    service.running = false;
    service.defaultsReady = Promise.resolve();
    let attempts = 0;
    service.slotsService = { invalidatePublicCache: () => {} };
    service.performSyncFrequency = async () => { attempts++; throw new Error('Database unavailable'); };
    await assert.rejects(service.syncFrequency('MANUAL'));
    await assert.rejects(service.syncFrequency('MANUAL'));
    assert.equal(attempts, 2);
    assert.equal(service.running, false);
});

test('Source setup retries after a temporary database failure and shares concurrent initialization', async () => {
    const service = Object.create(NewsSyncService.prototype);
    let attempts = 0;
    service.ensureDefaults = async () => { attempts++; if (attempts === 1) throw new Error('Temporary outage'); };
    await assert.rejects(service.prepareDefaults());
    await Promise.all([service.prepareDefaults(), service.prepareDefaults()]);
    assert.equal(attempts, 2);
});

test('An echoed English title is not cached as Spanish and unavailable translations do not expose English descriptions', async () => {
    const service = new NewsSlotsService({}, {});
    const { NewsTranslationService } = require('../apps/api/dist/news/news-translation.service');
    service.translations = new Map();
    service.translator = new NewsTranslationService();
    service.translator.translateBatch = async texts => texts;
    const writes = [];
    service.prisma = { newsArticle: { update: async args => writes.push(args) } };
    const result = await service.toSpanishArticle({
        id: 'story', source: { language: 'en' }, title: 'Monarch acquires HMBradley', titleEs: 'Monarch acquires HMBradley',
        description: 'The company reports revenue and shares in the market.', translationAttemptedAt: new Date(),
    });
    assert.equal(writes.length, 0);
    assert.equal(result.description, undefined);
});

test('Startup and recurring recovery fill stored stories before fetching only incomplete categories', async () => {
    const service = Object.create(NewsSyncService.prototype);
    const repaired = [], runs = [];
    service.defaultsReady = Promise.resolve();
    service.prisma = {
        newsCategory: { findMany: async () => [{ id: 'etfs', slug: 'etfs' }, { id: 'real-estate', slug: 'real-estate' }] },
        newsSlot: { groupBy: async args => args.where.categoryId ? [{ categoryId: 'real-estate', _count: { _all: 5 } }] : [{ categoryId: 'etfs', _count: { _all: 1 } }, { categoryId: 'real-estate', _count: { _all: 5 } }] },
    };
    service.slotsService = { fillEmptySlots: async id => repaired.push(id) };
    service.syncFrequency = async (...args) => runs.push(args);
    await service.recoverCategoryCoverage();
    assert.deepEqual(repaired, ['etfs', 'real-estate']);
    assert.deepEqual(runs, [['MANUAL', ['real-estate']]]);
});
