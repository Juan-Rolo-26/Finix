const { test } = require('node:test');
const assert = require('node:assert/strict');
const { TtlCache } = require('../apps/api/dist/common/ttl-cache');
const { CommunitiesService } = require('../apps/api/dist/communities/communities.service');
const { PostsService } = require('../apps/api/dist/posts/posts.service');
const { NotificationsService } = require('../apps/api/dist/notifications/notifications.service');
const { MarketService } = require('../apps/api/dist/market/market.service');
const { PortfolioService } = require('../apps/api/dist/portfolio/portfolio.service');
const { readFileHeader } = require('../apps/api/dist/uploads/read-file-header');

test('cache shares misses, evicts old keys and cannot restore data invalidated during a read', async () => {
    const cache = new TtlCache(2);
    let calls = 0, resolve;
    const load = () => { calls++; return new Promise(done => { resolve = done; }); };
    const first = cache.getOrLoad('x', 10000, load);
    const second = cache.getOrLoad('x', 10000, load);
    await Promise.resolve();
    assert.equal(calls, 1);
    cache.clear();
    resolve('old');
    assert.deepEqual(await Promise.all([first, second]), ['old', 'old']);
    assert.equal(cache.peek('x'), undefined);
    cache.set('a', 1, 10000); cache.set('b', 2, 10000); cache.peek('a'); cache.set('c', 3, 10000);
    assert.equal(cache.peek('b'), undefined);
    await assert.rejects(cache.getOrLoad('failure', 1000, () => Promise.reject(new Error('offline'))));
    assert.equal(await cache.getOrLoad('failure', 1000, async () => 42), 42);
});

test('community query count stays constant while permission and member roles remain correct', async () => {
    for (const length of [1, 20, 50]) {
        let reads = 0, permissionChecks = 0;
        const communities = Array.from({ length }, (_, i) => ({ id: String(i), creatorId: i === 0 ? 'owner' : 'other' }));
        const prisma = {
            community: { findMany: async () => { reads++; return communities; } },
            communityMember: { findMany: async args => { reads++; assert.equal(args.where.userId, 'owner'); return [{ communityId: '1', role: 'MODERATOR', subscriptionStatus: 'ACTIVE', plan: { tierLevel: 2 } }]; } },
            user: { findUnique: () => { throw new Error('Actor must not be read per card'); } },
        };
        const permissions = { assertCanViewCommunities: async () => { permissionChecks++; return { role: 'USER' }; }, isPlatformAdmin: user => user?.role === 'ADMIN' };
        const service = new CommunitiesService(prisma, {}, permissions, {}, {});
        const result = await service.findAll({ limit: length }, 'owner');
        assert.equal(reads, length === 1 ? 1 : 2);
        assert.equal(permissionChecks, 1);
        assert.equal(result[0].isOwner, true);
        assert.equal(result[0].canManage, true);
        if (length > 1) { assert.equal(result[1].canModerate, true); assert.equal(result[1].canManage, false); }
        await assert.rejects(service.findAll({}, undefined));
        permissions.assertCanViewCommunities = async () => { throw new Error('revoked'); };
        await assert.rejects(service.findAll({}, 'owner'), /revoked/);
    }
});

test('feed filters follows in SQL, bounds pages and isolates user caches', async () => {
    const queries = [];
    const prisma = { post: { findMany: async args => { queries.push(args); return Array.from({ length: args.take }, (_, i) => ({ id: String(i), author: { id: 'a' } })); } } };
    const service = new PostsService(prisma, {}, {});
    const first = await service.getFeed('u1', { sort: 'following', limit: 2 });
    assert.equal(first.nextCursor, '1');
    assert.equal(first.posts.length, 2);
    assert.equal(queries[0].where.communityId, null);
    assert.deepEqual(queries[0].where.author, { followedBy: { some: { followerId: 'u1' } } });
    assert.equal(queries[0].include.chartAnalysisVersion.select.chartState, undefined);
    await service.getFeed('u1', { sort: 'following', limit: 2 });
    assert.equal(queries.length, 1);
    await service.getFeed('u2', { sort: 'following', limit: 2 });
    assert.equal(queries.length, 2);
    service.clearFeedCache();
    await service.getFeed('u1', { sort: 'following', limit: -2 });
    assert.equal(queries.at(-1).take, 2);
});

test('notification cursors retain every record over successive pages', async () => {
    const all = Array.from({ length: 7 }, (_, i) => ({ id: String(i), createdAt: new Date(), type: 'SOCIAL_LIKE', title: 'Like' }));
    const service = Object.create(NotificationsService.prototype);
    service.prisma = { notification: { findMany: async args => all.slice(args.cursor ? Number(args.cursor.id) + 1 : 0, (args.cursor ? Number(args.cursor.id) + 1 : 0) + args.take) } };
    const first = await service.getNotifications('u', { limit: 3 });
    const second = await service.getNotifications('u', { limit: 3, cursor: first.nextCursor });
    const third = await service.getNotifications('u', { limit: 3, cursor: second.nextCursor });
    assert.deepEqual([...first.items, ...second.items, ...third.items].map(item => item.id), all.map(item => item.id));
});

test('overlapping market requests share prices, retain observation times and retry failed history loads', async () => {
    const service = new MarketService({});
    let scans = 0;
    service.loadQuotes = async inputs => { scans++; await new Promise(resolve => setTimeout(resolve, 5)); return inputs.map(inputSymbol => ({ inputSymbol, symbol: inputSymbol, price: 100, change: 0, updatedAt: '2026-10-04T10:00:00Z', unavailable: false })); };
    const results = await Promise.all(Array.from({ length: 30 }, () => service.getQuotes(['AAPL', 'SPY'])));
    assert.equal(scans, 1);
    assert.equal(results[0][0].updatedAt, '2026-10-04T10:00:00Z');
    await service.getQuotes(['SPY']);
    assert.equal(scans, 1);
    let histories = 0;
    service.loadCandles = async () => { histories++; if (histories === 1) return { candles: [] }; return { candles: [{ close: 10 }] }; };
    await service.getCandles('AAPL');
    await Promise.all([service.getCandles('AAPL'), service.getCandles('AAPL')]);
    assert.equal(histories, 2);
});

test('movement pages use a relation predicate and deterministic bounded cursor queries', async () => {
    const service = Object.create(PortfolioService.prototype);
    service.assertPortfolioOwner = async () => {};
    service.toLegacyMovement = row => row;
    const queries = [];
    const rows = Array.from({ length: 13 }, (_, i) => ({ id: String(i) }));
    service.prisma = { transaction: { findMany: async args => { queries.push(args); return rows; } } };
    const page = await service.getPortfolioMovements('p', 'u', { ticker: 'aapl', limit: 12, pagination: true });
    assert.equal(page.movements.length, 12);
    assert.equal(page.nextCursor, '11');
    assert.deepEqual(queries[0].where.asset, { ticker: { contains: 'AAPL' } });
    assert.equal(queries[0].take, 13);
});

test('media validation only reads a file header, including short files', async () => {
    const fs = require('node:fs/promises'), os = require('node:os'), path = require('node:path');
    const folder = await fs.mkdtemp(path.join(os.tmpdir(), 'finix-header-'));
    try { const file = path.join(folder, 'media'); await fs.writeFile(file, Buffer.alloc(1000000, 42)); assert.equal((await readFileHeader(file)).length, 16); await fs.writeFile(file, 'PDF'); assert.equal((await readFileHeader(file)).toString(), 'PDF'); }
    finally { await fs.rm(folder, { recursive: true }); }
});

test('news readers share populated category data and editorial changes invalidate every public view', async () => {
    const { NewsSlotsService } = require('../apps/api/dist/news/news-slots.service');
    let categoryReads = 0, slotReads = 0, published = true;
    const article = { id: 'article', title: 'El mercado argentino', titleEs: 'El mercado argentino', description: 'Informe del mercado', descriptionEs: 'Informe del mercado', source: { language: 'es' }, isActive: true, isPublished: true, status: 'PUBLISHED', translationAttemptedAt: new Date() };
    const rows = Array.from({ length: 5 }, (_, index) => ({ id: String(index), isActive: true, articleId: 'article', article: { ...article } }));
    const prisma = {
        newsCategory: { findUnique: async () => { categoryReads++; return { id: 'cat', slug: 'argentina', isActive: true }; } },
        newsSlot: { findMany: async () => { slotReads++; return rows; }, findUnique: async () => ({ article }), },
        newsArticle: { update: async () => { published = false; rows.forEach(row => { row.article.isPublished = false; row.article.status = 'DRAFT'; }); } },
    };
    const service = new NewsSlotsService(prisma, { isEnglish: () => false, isSpanish: () => true });
    service.ensureSlotsExist = () => { throw new Error('Populated reads must not run maintenance'); };
    service.fillEmptySlots = async () => {};
    await Promise.all(Array.from({ length: 20 }, () => service.getPublicCategorySlots('argentina')));
    assert.equal(categoryReads, 1);
    assert.equal(slotReads, 1);
    await service.unpublishSlot('0');
    service.ensureSlotsExist = async () => {};
    const response = await service.getPublicCategorySlots('argentina');
    assert.equal(published, false);
    assert.ok(response.slots.every(slot => slot.article === null));
    assert.equal(categoryReads, 2);
});

test('calendar home data is shared within a week and manual writes invalidate it', async () => {
    const { CalendarService } = require('../apps/api/dist/calendar/calendar.service');
    const service = new CalendarService({}, {}, {}, {});
    let reads = 0, writes = 0, week = '2026-10-05';
    service.getCurrentWeekBounds = () => ({ mondayStr: week, fridayStr: week });
    service.loadHomeEvents = async () => { reads++; return { events: [], week }; };
    service.writeCreateAdminManualEvent = async () => { writes++; return { id: 'new' }; };
    await Promise.all([service.getHomeEvents(), service.getHomeEvents()]);
    assert.equal(reads, 1);
    await service.createAdminManualEvent({});
    await service.getHomeEvents();
    assert.equal(reads, 2); assert.equal(writes, 1);
    week = '2026-10-12';
    await service.getHomeEvents();
    assert.equal(reads, 3);
});

test('payment provider timeout preserves unknown status and never grants access or retries a mutation', async () => {
    const { MercadoPagoService } = require('../apps/api/dist/mercadopago/mercadopago.service');
    const service = new MercadoPagoService(new Proxy({}, { get() { throw new Error('No access grant or database writes after provider timeout'); } }), {});
    service.isConfigured = () => true;
    const original = global.fetch;
    let calls = 0;
    global.fetch = async (_url, options) => {
        calls++;
        assert.ok(options.signal instanceof AbortSignal, 'Provider calls need a cancellation deadline');
        throw new DOMException('Provider timeout', 'TimeoutError');
    };
    try {
        assert.deepEqual(await service.getStatus('payment', 'owner'), { status: 'unknown' });
        await assert.rejects(service.cancelPreapproval('subscription'), { name: 'TimeoutError' });
        assert.equal(calls, 2, 'Each action makes exactly one provider request');
    } finally { global.fetch = original; }
});
