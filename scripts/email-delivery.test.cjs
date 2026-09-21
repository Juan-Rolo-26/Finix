// Only runs against the disposable PostgreSQL container documented in EMAIL_ALERTS.md.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { mkdtempSync, writeFileSync, readFileSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { Client } = require('pg');
const { PrismaClient } = require('@prisma/client');

const connection = 'postgresql://postgres:local-test-only@127.0.0.1:55439/finix_test';
process.env.DATABASE_URL = connection;
process.env.DIRECT_URL = connection;
process.env.JWT_SECRET = 'isolated-test-key-not-a-production-secret';
process.env.EMAIL_SEND_ENABLED = 'false';
const prisma = new PrismaClient();
const { EmailMarketingService } = require('../apps/api/dist/admin/email-marketing.service');
const { renderCampaign, queuePublishedAnalysis } = require('../apps/api/dist/admin/email-content');
const { PushService } = require('../apps/api/dist/notifications/push.service');
const deliveries = [];
const service = new EmailMarketingService(prisma, { sendEmail: async data => { deliveries.push(data); return { id: randomUUID() }; } });
let admin, pro, basic, optedOut, analysis;

before(async () => {
    const db = new Client({ connectionString: connection });
    await db.connect();
    await db.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public');
    const dir = mkdtempSync(join(tmpdir(), 'finix-schema-test-'));
    try {
        const oldSchema = execFileSync('git', ['show', 'HEAD:apps/api/prisma/schema.prisma'], { encoding: 'utf8' });
        writeFileSync(join(dir, 'schema.prisma'), oldSchema);
        execFileSync(process.execPath, ['node_modules/prisma/build/index.js', 'db', 'push', '--schema', join(dir, 'schema.prisma'), '--skip-generate'], { env: process.env, stdio: 'pipe' });
        await db.query(readFileSync('apps/api/prisma/migrations/20260921170000_email_delivery_push/migration.sql', 'utf8'));
    } finally { rmSync(dir, { recursive: true }); await db.end(); }
    const user = (name, extra = {}) => prisma.user.create({ data: { email: name + '@example.test', username: name, ...extra } });
    admin = await user('email-test-admin', { role: 'ADMIN' });
    pro = await user('email-test-pro', { plan: 'PRO', subscriptionStatus: 'ACTIVE', emailVerified: true, investmentEmailNotifications: true });
    basic = await user('email-test-basic', { emailVerified: true, investmentEmailNotifications: true });
    optedOut = await user('email-test-optout', { plan: 'PRO', subscriptionStatus: 'ACTIVE', emailVerified: true });
    analysis = await prisma.assetAnalysis.create({ data: { symbol: 'AAPL', ticker: 'AAPL', status: 'PUBLISHED', companyName: 'Apple', executiveSummary: JSON.stringify({ title: 'Tesis', summary: '<script>alert(1)</script>' }), risksData: JSON.stringify([{ title: 'Riesgo', description: 'Margenes' }]) } });
});
after(async () => { await prisma.$disconnect(); });

test('renders analysis and image with escaped content, rejects script URLs', () => {
    const html = renderCampaign({ title: '<script>x</script>', message: 'Hello', chartUrl: 'https://example.test/chart.png' }, analysis);
    assert.match(html, /&lt;script&gt;/);
    assert.match(html, /chart.png/);
    assert.match(html, /Margenes/);
    assert.doesNotMatch(html, /<script>/);
    assert.throws(() => renderCampaign({ title: 'x', message: 'x', ctaUrl: 'javascript:alert(1)' }));
});
test('publication enqueues once, skips drafts and rolls back with transaction', async () => {
    await Promise.all([1, 2].map(() => prisma.$transaction(tx => queuePublishedAnalysis(tx, analysis, admin.id))));
    assert.equal(await prisma.proEmailCampaign.count({ where: { sourceKey: 'analysis:' + analysis.id } }), 1);
    const draft = await prisma.assetAnalysis.create({ data: { symbol: 'DRAFT', status: 'DRAFT' } });
    await prisma.$transaction(tx => queuePublishedAnalysis(tx, draft, admin.id));
    assert.equal(await prisma.proEmailCampaign.count({ where: { sourceKey: 'analysis:' + draft.id } }), 0);
    await assert.rejects(prisma.$transaction(async tx => {
        const a = await tx.assetAnalysis.create({ data: { symbol: 'ROLLBACK', status: 'PUBLISHED' } });
        await queuePublishedAnalysis(tx, a, admin.id);
        throw new Error('Simulated transaction failure');
    }));
    assert.equal(await prisma.assetAnalysis.count({ where: { symbol: 'ROLLBACK' } }), 0);
});
test('disabled sends, audience filtering, concurrent workers and idempotency', async () => {
    const campaign = await service.createCampaign(admin.id, { subject: 'Test', title: 'Analysis', message: 'Body', analysisId: analysis.id });
    await service.processBatch(campaign.id);
    assert.equal(deliveries.length, 0);
    process.env.EMAIL_SEND_ENABLED = 'true';
    await service.processBatch(campaign.id);
    const rows = await prisma.emailCampaignRecipient.findMany({ where: { campaignId: campaign.id } });
    assert.deepEqual(rows.map(r => r.userId), [pro.id]);
    await Promise.all([service.processBatch(campaign.id), service.processBatch(campaign.id)]);
    assert.equal(deliveries.length, 1);
    assert.equal(deliveries[0].idempotencyKey, 'campaign/' + rows[0].id);
    const url = new URL(deliveries[0].html.match(/https[^"]+unsubscribe[^"]+/)[0].replaceAll('&amp;', '&'));
    await assert.rejects(service.unsubscribe(pro.id, 'bad-token'));
    await service.unsubscribe(pro.id, url.searchParams.get('token'));
    assert.equal((await prisma.user.findUnique({ where: { id: pro.id } })).investmentEmailNotifications, false);
    await service.processBatch(campaign.id);
    assert.equal(deliveries.length, 1);
});
test('test email never creates campaigns and future scheduling does not send', async () => {
    const count = await prisma.proEmailCampaign.count();
    await service.test({ subject: 'Test only', title: 'Title', message: 'Body' }, 'preview@example.test');
    assert.equal(await prisma.proEmailCampaign.count(), count);
    const beforeSend = deliveries.length;
    const future = await prisma.proEmailCampaign.create({ data: { subject: 'Future', title: 'Title', message: 'Body', createdById: admin.id, status: 'SCHEDULED', scheduledAt: new Date(Date.now() + 3600000) } });
    await service.processBatch(future.id);
    assert.equal(deliveries.length, beforeSend);
});
test('push rejects local endpoints and prevents subscription takeover', async () => {
    process.env.VAPID_PUBLIC_KEY = 'test';
    process.env.VAPID_PRIVATE_KEY = 'test';
    process.env.VAPID_SUBJECT = 'mailto:test@example.test';
    const push = new PushService(prisma);
    const keys = { p256dh: 'a'.repeat(87), auth: 'b'.repeat(22) };
    await assert.rejects(push.subscribe(pro.id, { endpoint: 'https://127.0.0.1/private', keys }));
    const endpoint = 'https://fcm.googleapis.com/fcm/send/test';
    await push.subscribe(pro.id, { endpoint, keys });
    await assert.rejects(push.subscribe(basic.id, { endpoint, keys }));
    await push.remove(basic.id, endpoint);
    assert.equal((await push.status(pro.id, endpoint)).subscribed, true);
    await push.remove(pro.id, endpoint);
    assert.equal((await push.status(pro.id, endpoint)).subscribed, false);
});

test('push worker delivers persistent notifications and removes expired devices', async () => {
    const webpush = require('web-push');
    const original = webpush.sendNotification;
    const sent = [];
    const push = new PushService(prisma);
    const endpoint = 'https://fcm.googleapis.com/fcm/send/worker-test';
    await push.subscribe(pro.id, { endpoint, keys: { p256dh: 'a'.repeat(87), auth: 'b'.repeat(22) } });
    await push.test(pro.id);
    try {
        webpush.sendNotification = async (subscription, payload) => { sent.push(JSON.parse(payload)); return {}; };
        await push.deliver();
        assert.equal(sent.length, 1);
        assert.equal(sent[0].url, '/notifications');
        await prisma.pushSubscription.update({ where: { endpoint }, data: { nextAttemptAt: new Date(0) } });
        await push.deliver();
        assert.equal(sent.length, 1);
        await push.test(pro.id);
        await prisma.pushSubscription.update({ where: { endpoint }, data: { nextAttemptAt: new Date(0) } });
        webpush.sendNotification = async () => { throw { statusCode: 410 }; };
        await push.deliver();
        assert.equal(await prisma.pushSubscription.count({ where: { endpoint } }), 0);
    } finally { webpush.sendNotification = original; }
});

test('image decoder rejects executable uploads and reencodes PNG', async () => {
    await assert.rejects(service.upload(admin.id, Buffer.from('<svg><script>alert(1)</script></svg>')));
    const sharp = require('sharp');
    const bytes = await sharp({ create: { width: 32, height: 32, channels: 3, background: '#008855' } }).png().toBuffer();
    const media = await service.upload(admin.id, bytes);
    assert.equal(media.mimeType, 'image/png');
    const name = new URL(media.url).pathname.split('/').pop();
    rmSync(join('apps/api/uploads/email', name));
});
