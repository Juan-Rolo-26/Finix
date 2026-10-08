// Read-only against apps/api/.env. Build the API first. No tokens or records in output.
// node scripts/performance/data-loading-benchmark.cjs /tmp/data-loading.json
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
require('reflect-metadata');
const root = path.resolve(__dirname, '../..');
require('dotenv').config({ path: path.join(root, 'apps/api/.env'), quiet: true });
const { PrismaClient } = require('@prisma/client');
const { normalizeDatabaseUrl } = require('../../apps/api/dist/common/database-url');
const { PostsService } = require('../../apps/api/dist/posts/posts.service');
const { NewsSlotsService } = require('../../apps/api/dist/news/news-slots.service');
const { PortfolioService } = require('../../apps/api/dist/portfolio/portfolio.service');
const output = process.argv[2] || '/tmp/finix-data-loading.json';
const results = [];
const previous = new Map();
// Normalize only collections with no guaranteed SQL order. Keep feed/cursor order.
function canonical(value, key = '') {
    if (value instanceof Date) return value.toISOString();
    if (Array.isArray(value)) {
        const items = value.map(item => canonical(item));
        return ['holdings', 'cashAccounts', 'transactions', 'media', 'likes', 'saves', 'reposts'].includes(key)
            ? items.sort((a, b) => String(a.id || a.userId || '').localeCompare(String(b.id || b.userId || ''))) : items;
    }
    if (value && typeof value === 'object') {
        if (typeof value.toJSON === 'function') return value.toJSON();
        return Object.fromEntries(Object.keys(value).sort().map(k => [k, canonical(value[k], k)]));
    }
    return value;
}
(async () => {
    for (const phase of ['transaction-query', 'transaction-join', 'session-join']) {
        const client = new PrismaClient({
            datasources: { db: { url: normalizeDatabaseUrl(process.env.DATABASE_URL, phase.startsWith('session') ? 'session' : 'transaction') } },
            log: [{ emit: 'event', level: 'query' }],
        });
        let commands = [], durations = [];
        client.$on('query', event => { commands.push(event.query.trim().split(/\s/)[0]); durations.push(event.duration); });
        client.$use((params, next) => {
            if (!/^(find|count|aggregate|groupBy)$/.test(params.action.replace(/(Unique|First|Many|UniqueOrThrow|FirstOrThrow)$/, ''))) throw new Error('Read-only benchmark: write rejected');
            if (params.action.startsWith('find')) params.args = { relationLoadStrategy: 'query', ...params.args,
                ...(phase === 'transaction-query' ? { relationLoadStrategy: 'query' } : {}) };
            return next(params);
        });
        try {
            await client.$connect();
            const viewer = await client.user.findFirst({ select: { id: true } });
            const portfolio = await client.portfolio.findFirst({ select: { id: true, userId: true } });
            const categories = await client.newsCategory.findMany({ relationLoadStrategy: 'join', where: { isActive: true },
                select: { slug: true, slots: { select: { isActive: true, article: { select: { isActive: true, isPublished: true, status: true } } } } }, orderBy: { slug: 'asc' } });
            const filled = categories.filter(c => c.slots.length >= 5 && !c.slots.some(s => s.isActive &&
                (!s.article?.isActive || !s.article?.isPublished || s.article?.status !== 'PUBLISHED'))).map(c => c.slug);
            console.log(JSON.stringify({ phase, preflight: 'complete', populatedCategories: filled.length }));
            const actions = [
                ['feed-anonymous', () => new PostsService(client, {}, {}).getFeed(undefined, { limit: 20, sort: 'recent' })],
                ...(viewer ? [['feed-authenticated', () => new PostsService(client, {}, {}).getFeed(viewer.id, { limit: 20, sort: 'recent' })],
                    ['feed-following', () => new PostsService(client, {}, {}).getFeed(viewer.id, { limit: 20, sort: 'following' })]] : []),
                ...filled.map(slug => [`news-${slug}`, () => {
                    const service = new NewsSlotsService(client, {});
                    // Translation and repair would write. Reads must never do either.
                    service.toSpanishArticle = async article => ({ ...article, title: article.titleEs || article.title, description: article.descriptionEs || undefined });
                    return service.getPublicCategorySlots(slug);
                }]),
            ];
            if (portfolio) {
                const market = { getQuotes: async symbols => symbols.map(inputSymbol => ({ inputSymbol, price: 100, change: 0, updatedAt: '2026-10-05T00:00:00Z' })),
                    getDolarCcl: async () => ({ venta: 1500, compra: 1490, fecha: '2026-10-05T00:00:00Z' }) };
                actions.push(['portfolio-list', () => new PortfolioService(client, market, {}, {}).getUserPortfolios(portfolio.userId)],
                    ['portfolio-movements', () => new PortfolioService(client, market, {}, {}).getPortfolioMovements(portfolio.id, portfolio.userId, { limit: 12, pagination: true })]);
            }
            for (const [name, run] of actions) {
                commands = []; durations = [];
                const start = performance.now();
                const data = await run();
                const comparable = canonical(data);
                if (phase === 'transaction-query') previous.set(name, comparable);
                else assert.deepEqual(comparable, previous.get(name), `Data changed for ${name}`);
                const result = { phase, name, elapsedMs: Math.round(performance.now() - start),
                    sqlStatements: commands.length, dataStatements: commands.filter(c => c === 'SELECT').length,
                    controlStatements: commands.filter(c => c !== 'SELECT').length,
                    sqlDurationMs: durations.reduce((sum, ms) => sum + ms, 0), payloadBytes: Buffer.byteLength(JSON.stringify(data)),
                    equivalent: phase === 'transaction-query' ? null : true };
                results.push(result);
                console.log(JSON.stringify(result));
                fs.writeFileSync(output, JSON.stringify({ measuredAt: new Date().toISOString(), conditions: 'Read-only remote Supabase from local machine; fixed quote provider, no translation/repair. Includes network/pool and protocol commands. Not VPS/HTTP percentiles.', results }, null, 2));
            }
        } finally { await client.$disconnect(); }
    }
})().catch(error => { console.error(error.name, error.errorCode || error.code || 'benchmark-failed'); process.exitCode = 1; });
