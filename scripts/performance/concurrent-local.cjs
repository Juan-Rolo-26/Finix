#!/usr/bin/env node
// Isolated read-only Nest fixture. Throttling bypass is confined to this process.
const fs = require('node:fs'), assert = require('node:assert/strict');
require('reflect-metadata'); require('dotenv').config({ path: 'apps/api/.env', quiet: true });
const url = new URL(process.env.DATABASE_URL);
assert.equal(url.hostname, '127.0.0.1'); assert.equal(url.port, '15432');
process.env.NODE_ENV = 'test'; process.env.FINIX_LOCAL_MODE = 'true'; delete process.env.REDIS_URL;
const nativeFetch = global.fetch;
global.fetch = (input, init) => {
  const target = new URL(typeof input === 'string' ? input : input.url || String(input));
  if (target.hostname !== '127.0.0.1' && target.hostname !== 'localhost') throw new Error('External traffic disabled');
  return nativeFetch(input, init);
};
const { PrismaClient } = require('@prisma/client'), { Test } = require('@nestjs/testing');
const { ThrottlerGuard } = require('@nestjs/throttler');
const { AppModule } = require('../../apps/api/dist/app.module');
const { PrismaService } = require('../../apps/api/dist/prisma.service');
const { MailService } = require('../../apps/api/dist/mail/mail.service');
const { metricsMiddleware } = require('../../apps/api/dist/common/request-metrics');
process.env.FINIX_REQUEST_METRICS = 'true';
const prisma = new PrismaClient({ log: [{ emit: 'event', level: 'query' }] });
let sqlCount = 0; prisma.$on('query', () => sqlCount++);
prisma.$use((params, next) => { if (!/^(find|count|aggregate|groupBy|queryRaw)/.test(params.action)) throw new Error('Writes forbidden in benchmark'); return next(params); });
const connection = new Proxy(prisma, { get(object, key) {
  if (key === 'onModuleInit' || key === 'onModuleDestroy') return undefined;
  const value = object[key]; return typeof value === 'function' ? value.bind(object) : value;
} });
const percentile = (values, p) => values[Math.min(values.length - 1, Math.ceil(values.length * p) - 1)];
(async () => {
  let app;
  try {
    await prisma.$connect();
    const module = await Test.createTestingModule({ imports: [AppModule] }).overrideProvider(PrismaService).useValue(connection)
      .overrideProvider(MailService).useValue({}).overrideGuard(ThrottlerGuard).useValue({ canActivate: () => true }).compile();
    const types = new Set(Object.entries(require.cache).filter(([p]) => p.includes('/apps/api/dist/')).flatMap(([, m]) => Object.values(m.exports || {})));
    for (const imported of module.container.getModules().values()) for (const provider of imported.providers.values()) {
      const instance = provider.instance;
      if (instance instanceof ThrottlerGuard) instance.canActivate = async () => true;
      if (instance && (types.has(instance.constructor) || ['ScheduleExplorer', 'SchedulerOrchestrator'].includes(instance.constructor?.name))) for (const hook of ['onModuleInit', 'onApplicationBootstrap', 'onModuleDestroy', 'onApplicationShutdown']) if (typeof instance[hook] === 'function') instance[hook] = () => {};
    }
    app = module.createNestApplication({ logger: ['error'] }); app.setGlobalPrefix('api'); app.use(metricsMiddleware);
    await app.listen(0, '127.0.0.1'); const base = await app.getUrl();
    const actor = await prisma.user.findFirst({ where: { status: { notIn: ['BANNED', 'SUSPENDED'] } }, select: { id: true } });
    assert.ok(actor, 'Existing active local account required');
    const token = require('jsonwebtoken').sign({ sub: actor.id }, process.env.JWT_SECRET, { issuer: 'finix-api', expiresIn: '5m' });
    const results = [];
    for (const route of ['/api/posts/feed?limit=20', '/api/news?limit=20', '/api/users/ranking/leaderboard']) for (const concurrency of [10, 25, 50, 100]) {
      const times = [], statuses = {}; const count = concurrency * 3; sqlCount = 0;
      const cpu = process.cpuUsage(), memoryBefore = process.memoryUsage().rss, start = performance.now();
      for (let wave = 0; wave < 3; wave++) await Promise.all(Array.from({ length: concurrency }, async () => {
        const at = performance.now(); const response = await fetch(base + route, { signal: AbortSignal.timeout(30000), headers: { Authorization: `Bearer ${token}` } }); await response.arrayBuffer();
        times.push(performance.now() - at); statuses[response.status] = (statuses[response.status] || 0) + 1;
      }));
      times.sort((a, b) => a - b); const elapsedMs = performance.now() - start, used = process.cpuUsage(cpu);
      results.push({ route, concurrency, requests: count, statuses, elapsedMs, rps: count * 1000 / elapsedMs, p50Ms: percentile(times, .5), p95Ms: percentile(times, .95), p99Ms: percentile(times, .99), sqlStatements: sqlCount, cpuUserMs: used.user / 1000, cpuSystemMs: used.system / 1000, rssBeforeMB: memoryBefore / 1048576, rssAfterMB: process.memoryUsage().rss / 1048576 });
      assert.equal(statuses[200], count);
    }
    fs.writeFileSync(process.argv[2] || '/tmp/finix-concurrent-local.json', JSON.stringify({ conditions: 'Read-only isolated Nest process, production rate limits bypassed only in this fixture, no network providers/jobs/emails. Three bounded waves per route/concurrency; not a production capacity guarantee.', results }, null, 2), { mode: 0o600 });
    console.log(JSON.stringify(results));
  } finally { if (app) await app.close(); await prisma.$disconnect(); }
})().catch(error => { console.error(error.code || error.message); process.exitCode = 1; });
