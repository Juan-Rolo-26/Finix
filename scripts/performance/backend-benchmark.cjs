// Build the API first. Default: deterministic fixtures, no database writes.
// node scripts/performance/backend-benchmark.cjs 4a1625db /tmp/results.json
// Add --database for optional read-only timing against apps/api/.env.
const fs = require('node:fs'), path = require('node:path'), Module = require('node:module');
const { execFileSync } = require('node:child_process');
const ts = require('typescript');
require('reflect-metadata');
const root = path.resolve(__dirname, '../..');
const revision = process.argv[2] || '4a1625db';
const output = process.argv[3] || '/tmp/finix-backend-benchmark.json';
function loadBaseline(relative, name) {
    const source = execFileSync('git', ['show', `${revision}:apps/api/src/${relative}.ts`], { cwd: root, encoding: 'utf8' });
    const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, experimentalDecorators: true, emitDecoratorMetadata: true } }).outputText;
    const filename = path.join(root, 'apps/api/dist', relative + '.js');
    const module = new Module(filename, moduleForPaths);
    module.filename = filename; module.paths = Module._nodeModulePaths(path.dirname(filename)); module._compile(js, filename);
    return module.exports[name];
}
const moduleForPaths = module;
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function fixtureCommunities(Service) {
    let operations = 0, active = 0;
    const waiting = [];
    async function read(value) {
        operations++;
        if (active >= 4) await new Promise(resolve => waiting.push(resolve));
        active++;
        await delay(5);
        active--;
        waiting.shift()?.();
        return value;
    }
    const communities = Array.from({ length: 20 }, (_, i) => ({ id: 'c' + i, creatorId: 'other' }));
    const actor = { role: 'USER' };
    const memberships = communities.map(c => ({ communityId: c.id, role: 'MEMBER', subscriptionStatus: 'ACTIVE', plan: { tierLevel: 1 } }));
    const prisma = { community: { findMany: () => read(communities), count: () => read(20) }, user: { findUnique: () => read(actor) }, communityMember: { findUnique: args => read(memberships.find(m => m.communityId === args.where.communityId_userId.communityId)), findMany: () => read(memberships) } };
    const permissions = { assertCanViewCommunities: () => read(actor), isPlatformAdmin: u => u?.role === 'ADMIN' };
    const service = new Service(prisma, {}, permissions, {}, {});
    const start = performance.now(); const result = await service.findAll({ limit: 20 }, 'viewer');
    return { dataset: 'fixture-20-communities', prismaOperations: operations, elapsedMs: performance.now() - start, resultCount: result.length };
}
async function fixtureQuotes(Service) {
    const service = new Service({}); let externalCalls = 0;
    service.fetchScannerQuotes = async () => { externalCalls++; await delay(30); return new Map([['NASDAQ:AAPL', { price: 100, change: 0 }], ['AMEX:SPY', { price: 500, change: 0 }]]); };
    const start = performance.now(); await Promise.all(Array.from({ length: 30 }, () => service.getQuotes(['NASDAQ:AAPL', 'AMEX:SPY'])));
    const coldMs = performance.now() - start;
    const warm = performance.now(); await service.getQuotes(['NASDAQ:AAPL', 'AMEX:SPY']);
    return { dataset: 'fixture-30-concurrent-quote-requests', externalCalls, coldMs, warmMs: performance.now() - warm };
}
async function database() {
    require('dotenv').config({ path: path.join(root, 'apps/api/.env'), quiet: true });
    const { PrismaClient } = require('@prisma/client');
    const url = new URL(process.env.DATABASE_URL);
    if (url.hostname.endsWith('.pooler.supabase.com')) { url.port = '6543'; url.searchParams.set('pgbouncer', 'true'); url.searchParams.set('connection_limit', '10'); url.searchParams.set('connect_timeout', '10'); url.searchParams.set('pool_timeout', '15'); }
    const client = new PrismaClient({ datasources: { db: { url: url.href } }, log: [{ emit: 'event', level: 'query' }] });
    let sql = [], operations = [];
    client.$on('query', event => { sql.push({ durationMs: event.duration }); });
    client.$use(async (params, next) => { if (!/^(find|count|aggregate|groupBy|queryRaw)/.test(params.action)) throw new Error('Read-only benchmark: write rejected'); const start = performance.now(); try { return await next(params); } finally { operations.push({ model: params.model, action: params.action, elapsedMs: performance.now() - start }); } });
    const results = [];
    try {
        await client.$connect();
        const actor = await client.user.findFirst({ where: { role: 'ADMIN' }, select: { id: true } });
        for (const phase of ['before', 'after']) {
            const Communities = phase === 'before' ? loadBaseline('communities/communities.service', 'CommunitiesService') : require('../../apps/api/dist/communities/communities.service').CommunitiesService;
            const Posts = phase === 'before' ? loadBaseline('posts/posts.service', 'PostsService') : require('../../apps/api/dist/posts/posts.service').PostsService;
            const { CommunityPermissionsService } = require('../../apps/api/dist/communities/community-permissions.service');
            const News = phase === 'before' ? loadBaseline('news/news-slots.service', 'NewsSlotsService') : require('../../apps/api/dist/news/news-slots.service').NewsSlotsService;
            const news = phase === 'before' ? Object.create(News.prototype) : new News(client, {});
            news.prisma = client;
            // This probe measures only read/cache latency and must never translate
            // or write live articles. Browser/localization tests cover language.
            news.toSpanishArticle = async article => ({ ...article, title: article.titleEs || article.title, description: article.descriptionEs || undefined });
            const actions = [['news-etfs-cold', () => news.getPublicCategorySlots('etfs')], ['news-etfs-warm', () => news.getPublicCategorySlots('etfs')], ['feed-recent-20', () => new Posts(client, {}, {}).getFeed(undefined, { limit: 20, sort: 'recent' })]];
            if (actor) actions.push(['communities-admin-20', () => new Communities(client, {}, new CommunityPermissionsService(client), {}, {}).findAll({ limit: 20 }, actor.id)]);
            for (const [name, run] of actions) {
                sql = []; operations = []; const start = performance.now(); const data = await run();
                results.push({ phase, name, elapsedMs: performance.now() - start, sqlCount: sql.length, sqlDurationMs: sql.reduce((sum, q) => sum + q.durationMs, 0), operations: [...operations], resultCount: Array.isArray(data) ? data.length : data.posts?.length ?? data.slots?.length, payloadBytes: Buffer.byteLength(JSON.stringify(data)) });
            }
        }
    } finally { await client.$disconnect(); }
    return results;
}
(async () => {
    const beforeCommunities = loadBaseline('communities/communities.service', 'CommunitiesService');
    const beforeMarket = loadBaseline('market/market.service', 'MarketService');
    const results = { baselineRevision: revision, conditions: 'Deterministic fixtures: DB-operation delay 5ms, pool size 4; upstream quotes 30ms. Counts are Prisma calls, not SQL statements.', before: { communities: await fixtureCommunities(beforeCommunities), quotes: await fixtureQuotes(beforeMarket) }, after: { communities: await fixtureCommunities(require('../../apps/api/dist/communities/communities.service').CommunitiesService), quotes: await fixtureQuotes(require('../../apps/api/dist/market/market.service').MarketService) } };
    if (process.argv.includes('--database')) results.database = await database();
    fs.writeFileSync(output, JSON.stringify(results, null, 2));
    console.log(JSON.stringify(results));
})().catch(error => { console.error(error.code || error.name); process.exitCode = 1; });
