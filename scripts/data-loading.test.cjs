const { test } = require('node:test');
const assert = require('node:assert/strict');
require('reflect-metadata');
const { normalizeDatabaseUrl } = require('../apps/api/dist/common/database-url');
const { JwtStrategy } = require('../apps/api/dist/auth/jwt.strategy');
const { CalendarService } = require('../apps/api/dist/calendar/calendar.service');
const { CalendarProviderService } = require('../apps/api/dist/calendar/services/calendar-provider.service');
const { MarketImpactScoringService } = require('../apps/api/dist/calendar/services/market-impact-scoring.service');
const { EarningsImpactScoringService } = require('../apps/api/dist/calendar/services/earnings-impact-scoring.service');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

test('persistent Supabase connections reuse statements while configured/transaction modes remain available', () => {
    const input = 'postgresql://test:local@aws-0-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true';
    const session = new URL(normalizeDatabaseUrl(input, 'session'));
    assert.equal(session.port, '5432');
    assert.equal(session.searchParams.has('pgbouncer'), false);
    assert.equal(session.searchParams.get('connection_limit'), '5');
    const transaction = new URL(normalizeDatabaseUrl(input, 'transaction'));
    assert.equal(transaction.port, '6543');
    assert.equal(transaction.searchParams.get('pgbouncer'), 'true');
    assert.equal(transaction.searchParams.get('connection_limit'), '10');
    assert.equal(new URL(normalizeDatabaseUrl(input, 'configured')).port, '6543');
    assert.equal(normalizeDatabaseUrl('postgresql://test:local@127.0.0.1:55440/finance_test'), 'postgresql://test:local@127.0.0.1:55440/finance_test');
    const explicit = new URL(normalizeDatabaseUrl(input + '&connection_limit=3&connect_timeout=7', 'session'));
    assert.equal(explicit.searchParams.get('connection_limit'), '3');
    assert.equal(explicit.searchParams.get('connect_timeout'), '7');
    assert.throws(() => normalizeDatabaseUrl(input, 'invalid'), /POOL_MODE/);
});

test('session joins keep revocation, ownership, expiry, bans and changed plans effective on the next request', async () => {
    process.env.JWT_SECRET = 'data-loading-unit-test-secret';
    const user = { id: 'a', email: 'a@example.invalid', username: 'a', role: 'USER', plan: 'PRO', subscriptionStatus: 'ACTIVE', status: 'ACTIVE' };
    let row = { userId: 'a', revokedAt: null, expiresAt: null, user }, reads = 0;
    const strategy = new JwtStrategy({ userSession: { findUnique: async () => { reads++; return row; } }, user: { findUnique: () => { throw Error('Unexpected second read'); } } });
    const payload = { iss: 'finix-api', sub: 'a', sid: 's' };
    assert.equal((await strategy.validate(payload)).plan, 'PRO');
    assert.equal(reads, 1);
    row.user.plan = 'FREE'; row.user.subscriptionStatus = 'INACTIVE';
    assert.equal((await strategy.validate(payload)).plan, 'FREE');
    for (const patch of [{ revokedAt: new Date() }, { userId: 'b' }, { expiresAt: new Date(0) }, { user: { ...user, status: 'BANNED' } }, { user: { ...user, status: 'SUSPENDED' } }]) {
        row = { userId: 'a', revokedAt: null, expiresAt: null, user: { ...user, status: 'ACTIVE' }, ...patch };
        await assert.rejects(strategy.validate(payload), error => error.getStatus() === 401);
    }
    row = null;
    await assert.rejects(strategy.validate(payload), error => error.getStatus() === 401);
    const legacy = new JwtStrategy({ user: { findUnique: async () => user } });
    assert.equal((await legacy.validate({ iss: 'finix-api', sub: 'a' })).id, 'a');
});

test('calendar starts DB and providers together, makes no forced second scan and preserves manual entries', async () => {
    let databaseStarted = 0, providersStarted = 0;
    let release; const gate = new Promise(resolve => { release = resolve; });
    const date = '2026-10-05';
    const manual = { id: 'manual', country: 'US', title: 'Decisión de tasas', date, time: '10:00', category: 'CENTRAL_BANK', importance: 'HIGH', marketImpactScore: 100, sourceType: 'MANUAL', isManual: true, isPublished: true, actualValue: '1' };
    const read = async value => { databaseStarted++; await gate; return value; };
    const provider = async (value, options) => { providersStarted++; assert.equal(options?.forceRefresh, undefined); await gate; return value; };
    const service = new CalendarService({ marketCalendarEvent: { findMany: () => read([manual]) }, marketEarningsEvent: { findMany: () => read([]) }, marketDividendEvent: { findMany: () => read([]) } }, {
        getUpcomingEconomicEvents: () => provider([{ ...manual, id: undefined, sourceType: 'AUTOMATIC', actualValue: '2' }]),
        fetchTradingViewSP500Earnings: options => provider([], options),
        fetchTradingViewSP500Dividends: options => provider([], options),
        getEconomicFeedStatus: () => ({ status: 'available' }),
    }, new MarketImpactScoringService(), new EarningsImpactScoringService());
    const pending = service.getWeekEvents({ weekStart: date, category: 'ALL', user: { plan: 'PRO', subscriptionStatus: 'ACTIVE' } });
    await Promise.resolve();
    assert.equal(databaseStarted, 2);
    assert.equal(providersStarted, 3);
    release();
    const result = await pending;
    assert.equal(providersStarted, 3);
    const event = result.days.flatMap(day => day.economicEvents).find(event => event.title === manual.title);
    assert.equal(String(event.actualValue), '1');
});

test('empty home calendar renders live events without waiting for full-week persistence', async () => {
    let persist; const persistence = new Promise(resolve => { persist = resolve; });
    const service = new CalendarService({ marketCalendarEvent: { findMany: async () => [] }, marketEarningsEvent: { findMany: async () => [] } }, {
        getUpcomingEconomicEvents: async () => [{ country: 'US', date: '2026-10-05', title: 'Decisión de tasas', importance: 'HIGH', marketImpactScore: 100, category: 'CENTRAL_BANK', sourceType: 'AUTOMATIC', isPublished: true }],
        fetchTradingViewSP500Earnings: async () => [],
    }, new MarketImpactScoringService(), new EarningsImpactScoringService());
    service.getCurrentWeekBounds = () => ({ mondayStr: '2026-10-05', fridayStr: '2026-10-09' });
    let syncs = 0;
    service.syncWeeklyData = () => { syncs++; return persistence; };
    try {
        const pending = service.getHomeEvents();
        const data = await Promise.race([pending, delay(500).then(() => { throw Error('Home is blocked on persistence'); })]);
        assert.equal(data.events.length, 1);
        assert.equal(syncs, 1);
        service.homeCache.clear();
        await service.getHomeEvents();
        assert.equal(syncs, 1);
    } finally { persist({ success: true }); }
});

test('concurrent earnings readers share one scan while filtering their own date range', async () => {
    const provider = new CalendarProviderService(new MarketImpactScoringService(), new EarningsImpactScoringService(), {});
    let scans = 0;
    provider.loadTradingViewAmericaScan = async () => {
        scans++; await delay(10);
        return [{ s: 'NASDAQ:AAPL', d: ['AAPL', 'Apple', Date.parse('2026-10-05T12:00:00Z') / 1000, 1, 2, 10, 3000000000000, 'apple'] }];
    };
    const [first, second] = await Promise.all([
        provider.fetchTradingViewSP500Earnings({ from: '2026-10-05', to: '2026-10-09' }),
        provider.fetchTradingViewSP500Earnings({ from: '2026-11-01', to: '2026-11-07' }),
    ]);
    assert.equal(scans, 1);
    assert.equal(first.length, 1);
    assert.equal(second.length, 0);
    await provider.fetchTradingViewSP500Earnings({ from: '2026-10-05', to: '2026-10-09' });
    assert.equal(scans, 1);
    await provider.fetchTradingViewSP500Earnings({ forceRefresh: true });
    assert.equal(scans, 2);
});

const databaseTarget = process.env.DATA_LOADING_TEST_DATABASE_URL;
test('SQL joins preserve authenticated cursors, financial decimals and live session enforcement', { skip: !databaseTarget }, async () => {
    const url = new URL(databaseTarget);
    assert.ok(['127.0.0.1', 'localhost'].includes(url.hostname) && url.pathname === '/finance_test', 'Only disposable local finance_test is allowed');
    const { PrismaClient } = require('@prisma/client');
    const { randomUUID } = require('node:crypto');
    const { PostsService } = require('../apps/api/dist/posts/posts.service');
    const { PortfolioService } = require('../apps/api/dist/portfolio/portfolio.service');
    const { PortfolioPerformanceService } = require('../apps/api/dist/portfolio/portfolio-performance.service');
    const client = new PrismaClient({ datasources: { db: { url: databaseTarget } }, log: [{ emit: 'event', level: 'query' }] });
    let reads = 0, loading = 'join';
    client.$on('query', event => { if (event.query.startsWith('SELECT')) reads++; });
    client.$use((params, next) => {
        if (params.action.startsWith('find')) params.args = { ...params.args, relationLoadStrategy: loading };
        return next(params);
    });
    const a = randomUUID(), b = randomUUID(), assetId = randomUUID();
    try {
        await client.user.createMany({ data: [a, b].map(id => ({ id, email: id + '@example.invalid', username: id, plan: 'PRO', subscriptionStatus: 'ACTIVE' })) });
        await client.follow.create({ data: { followerId: a, followingId: b } });
        const ids = Array.from({ length: 31 }, randomUUID);
        await client.post.createMany({ data: ids.map((id, i) => ({ id, authorId: i % 2 ? a : b, content: 'Prueba de datos', createdAt: new Date('2026-10-05T00:00:00Z') })) });
        await client.post.update({ where: { id: ids[1] }, data: { quotedPostId: ids[0] } });
        const drawing = await client.chartAnalysis.create({ data: { userId: b, symbol: 'NASDAQ:AAPL', chartState: { drawings: [] },
            versions: { create: { versionNumber: 1, chartState: { drawings: [] } } } }, include: { versions: true } });
        await client.post.update({ where: { id: ids[2] }, data: { type: 'chart', chartAnalysisVersionId: drawing.versions[0].id } });
        await client.like.create({ data: { postId: ids[0], userId: a } });
        await client.save.create({ data: { postId: ids[0], userId: a } });
        await client.repost.create({ data: { postId: ids[0], userId: a } });
        await client.postMedia.createMany({ data: [{ postId: ids[0], url: 'https://example.invalid/a.webp', mediaType: 'image', order: 0 }, { postId: ids[0], url: 'https://example.invalid/b.webp', mediaType: 'image', order: 1 }] });
        for (const sort of ['recent', 'popular', 'following']) {
            loading = 'query'; reads = 0;
            const old = await new PostsService(client, {}, {}).getFeed(a, { limit: 12, sort });
            const before = reads;
            loading = 'join'; reads = 0;
            const current = await new PostsService(client, {}, {}).getFeed(a, { limit: 12, sort });
            assert.deepEqual(current, old);
            assert.equal(reads, 1);
            assert.ok(before > reads);
            const second = await new PostsService(client, {}, {}).getFeed(a, { limit: 12, sort, cursor: current.nextCursor });
            assert.equal(new Set([...current.posts, ...second.posts].map(post => post.id)).size, current.posts.length + second.posts.length);
        }
        await client.asset.create({ data: { id: assetId, ticker: 'TEST-' + assetId, name: 'Activo de prueba', type: 'STOCK' } });
        const portfolio = await client.portfolio.create({ data: { userId: a, nombre: 'Privado', holdings: { create: { assetId, quantity: '1.23456789', averageCost: '42.34567891' } }, cashAccounts: { create: { currency: 'USD', balance: '100.12345678' } }, transactions: { create: { assetId, type: 'BUY', date: new Date('2026-10-01T12:00:00Z'), quantity: '1.23456789', pricePerUnit: '42.34567891', total: '52.27861589' } } } });
        const market = { getQuotes: async symbols => symbols.map(inputSymbol => ({ inputSymbol, price: 50, change: 0 })), getDolarCcl: async () => ({ venta: 1500 }) };
        const service = new PortfolioService(client, market, {}, { getReturns: async () => [] });
        loading = 'query';
        const oldMetrics = await service.getPortfolioMetrics(portfolio.id, a);
        const oldMovements = await service.getPortfolioMovements(portfolio.id, a, { limit: 12, pagination: true });
        loading = 'join';
        assert.deepEqual(await service.getPortfolioMetrics(portfolio.id, a), oldMetrics);
        assert.deepEqual(await service.getPortfolioMovements(portfolio.id, a, { limit: 12, pagination: true }), oldMovements);
        await assert.rejects(service.getPortfolioMetrics(portfolio.id, b), error => error.getStatus() === 404);
        market.getCandles = async () => ({ candles: Array.from({ length: 15 }, (_, i) => ({ time: Date.parse('2026-09-25T00:00:00Z') / 1000 + i * 86400, close: 50 })) });
        const analytics = new PortfolioPerformanceService(client, market);
        loading = 'query';
        const oldSummary = await analytics.getSummary(portfolio.id, a);
        const oldPerformance = await analytics.getPerformance(portfolio.id, a, 'ALL');
        loading = 'join';
        const summary = await analytics.getSummary(portfolio.id, a);
        delete summary.lastUpdated; delete oldSummary.lastUpdated;
        assert.deepEqual(summary, oldSummary);
        assert.deepEqual(await analytics.getPerformance(portfolio.id, a, 'ALL'), oldPerformance);
        const session = await client.userSession.create({ data: { userId: a, refreshTokenHash: randomUUID() } });
        const strategy = new JwtStrategy(client), payload = { iss: 'finix-api', sub: a, sid: session.id };
        reads = 0;
        assert.equal((await strategy.validate(payload)).id, a);
        assert.equal(reads, 1);
        await client.user.update({ where: { id: a }, data: { plan: 'FREE', subscriptionStatus: 'INACTIVE' } });
        assert.equal((await strategy.validate(payload)).plan, 'FREE');
        await client.userSession.update({ where: { id: session.id }, data: { revokedAt: new Date() } });
        await assert.rejects(strategy.validate(payload), error => error.getStatus() === 401);
        await client.userSession.update({ where: { id: session.id }, data: { revokedAt: null } });
        await client.user.update({ where: { id: a }, data: { status: 'BANNED' } });
        await assert.rejects(strategy.validate(payload), error => error.getStatus() === 401);
        process.env.DATABASE_URL = databaseTarget;
        const { PrismaService } = require('../apps/api/dist/prisma.service');
        const appClient = new PrismaService();
        const strategies = [];
        appClient.$use((params, next) => { strategies.push(params.args?.relationLoadStrategy); return next(params); });
        try {
            await appClient.user.findUnique({ where: { id: a }, select: { id: true } });
            await appClient.user.findUnique({ where: { id: a }, select: { notifications: true } });
            await appClient.portfolio.findFirst({ where: { id: portfolio.id }, include: { holdings: true } });
            await appClient.portfolio.findFirst({ relationLoadStrategy: 'join', where: { id: portfolio.id }, include: { holdings: true } });
            assert.deepEqual(strategies, [undefined, 'query', 'query', 'join']);
        } finally { await appClient.$disconnect(); }
    } finally {
        await client.follow.deleteMany({ where: { followerId: { in: [a, b] } } });
        await client.post.deleteMany({ where: { authorId: { in: [a, b] } } });
        await client.user.deleteMany({ where: { id: { in: [a, b] } } });
        await client.asset.deleteMany({ where: { id: assetId } });
        await client.$disconnect();
    }
});
