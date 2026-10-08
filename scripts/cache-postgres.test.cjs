const { test } = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), { randomUUID } = require('node:crypto');
require('reflect-metadata');
require('dotenv').config({ path: 'apps/api/.env', quiet: true });
const config = new URL(process.env.DATABASE_URL);
assert.equal(config.hostname, '127.0.0.1'); assert.equal(config.port, '15432');
process.env.FINIX_CACHE_PREFIX = `finix:test:${randomUUID()}`;
const { ReadCacheService } = require('../apps/api/dist/cache/read-cache.service');
const { PrismaService } = require('../apps/api/dist/prisma.service');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

test('Cache: concurrent read coalescing, expiry, errors, transaction bypass', async () => {
  const cache = new ReadCacheService(); let reads = 0;
  const loader = async () => { reads++; await delay(5); return { value: reads }; };
  const values = await Promise.all(Array.from({ length: 50 }, () => cache.remember('key', 30, loader)));
  assert.equal(reads, 1); assert.ok(values.every(v => v.value === 1));
  await delay(40); await cache.remember('key', 30, loader); assert.equal(reads, 2);
  await cache.transaction.run({ mutated: false }, async () => { await cache.remember('key', 30, loader); await cache.remember('key', 30, loader); });
  assert.equal(reads, 4);
  let errors = 0; const fail = async () => { errors++; throw new Error('expected'); };
  await assert.rejects(cache.remember('fail', 30, fail)); await assert.rejects(cache.remember('fail', 30, fail)); assert.equal(errors, 2);
});

test('Real Redis: cross-client reads/invalidation and PostgreSQL commit/rollback', async () => {
  const a = new ReadCacheService(), b = new ReadCacheService();
  const prisma = new PrismaService(a);
  const { createClient } = require('redis'); const probe = createClient({ url: process.env.REDIS_URL });
  probe.on('error', () => {});
  const id = randomUUID();
  try {
    await a.onModuleInit(); await b.onModuleInit(); await probe.connect();
    for (let i = 0; i < 50 && !(await a.isReady() && await b.isReady()); i++) await delay(20);
    assert.equal(await a.isReady(), true); assert.equal(await b.isReady(), true);
    assert.deepEqual(await a.remember('shared', 5000, async () => ({ value: 1 })), { value: 1 });
    assert.deepEqual(await b.remember('shared', 5000, async () => { throw new Error('must read Redis'); }), { value: 1 });
    await a.invalidate(); assert.deepEqual(await b.remember('shared', 5000, async () => ({ value: 2 })), { value: 2 });
    await prisma.onModuleInit();
    const key = process.env.FINIX_CACHE_PREFIX + ':generation';
    const before = await probe.get(key);
    await assert.rejects(prisma.$transaction(async tx => { await tx.user.create({ data: { id, username: `audit-${id}`, email: `${id}@example.invalid`, password: 'unusable-test-fixture' } }); throw new Error('rollback expected'); }));
    assert.equal(await probe.get(key), before); assert.equal(await prisma.user.findUnique({ where: { id } }), null);
    await prisma.$transaction(async tx => { await tx.user.create({ data: { id, username: `audit-${id}`, email: `${id}@example.invalid`, password: 'unusable-test-fixture' } }); });
    assert.equal(Number(await probe.get(key)), Number(before) + 1);
    const prior = Number(await probe.get(key));
    await prisma.$transaction([prisma.user.update({ where: { id }, data: { showStats: false } })]);
    assert.equal(Number(await probe.get(key)), prior + 1);
  } finally {
    await prisma.user.deleteMany({ where: { id } }).catch(() => {});
    await prisma.onModuleDestroy(); await a.onModuleDestroy(); await b.onModuleDestroy();
    if (probe.isReady) for await (const keys of probe.scanIterator({ MATCH: process.env.FINIX_CACHE_PREFIX + ':*' })) if (keys.length) await probe.del(keys);
    if (probe.isOpen) probe.destroy();
  }
});

test('Redis unavailable: bounded read-through fallback and failed readiness', async () => {
  const original = process.env.REDIS_URL; process.env.REDIS_URL = 'redis://127.0.0.1:16559';
  const cache = new ReadCacheService();
  try { await cache.onModuleInit(); assert.equal(await cache.isReady(), false); assert.equal(await cache.remember('fallback', 50, async () => 42), 42); }
  finally { await cache.onModuleDestroy(); process.env.REDIS_URL = original; }
});

test('Ranking rereads privacy settings instead of returning an old process cache', async () => {
  const { UserService } = require('../apps/api/dist/user/user.service');
  let visible = true, calls = 0;
  const prisma = { user: { findMany: async args => {
    calls++; assert.equal(args.take, 10); assert.equal(args.where.isProfilePublic, true); assert.equal(args.where.showStats, true);
    return visible ? [{ id: 'public-fixture', avatarUrl: null }] : [];
  } } };
  const service = new UserService(prisma, {}, {});
  assert.equal((await service.getTopTraders()).length, 1); visible = false;
  assert.deepEqual(await service.getTopTraders(), []); assert.equal(calls, 2);
});
