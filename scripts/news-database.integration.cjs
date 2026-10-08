// Exercises real PostgreSQL queries in a transaction that always rolls back.
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
if (process.env.FINIX_NEWS_TEST_DATABASE_ENV) require('dotenv').config({ path: process.env.FINIX_NEWS_TEST_DATABASE_ENV, quiet: true });
const url = new URL(process.env.DATABASE_URL || 'http://missing');
assert.ok(['localhost', '127.0.0.1'].includes(url.hostname), 'Use an isolated local PostgreSQL database');
const { PrismaClient } = require('@prisma/client');
const { NewsSlotsService } = require('../apps/api/dist/news/news-slots.service');
const { NewsTranslationService } = require('../apps/api/dist/news/news-translation.service');
const prisma = new PrismaClient();
const rollback = new Error('FINIX_NEWS_TEST_ROLLBACK');

(async () => {
    try {
        await prisma.$transaction(async tx => {
            const slug = `news-test-${randomUUID()}`;
            const category = await tx.newsCategory.create({ data: { name: 'Prueba editorial', slug, color: '#178963' } });
            const source = await tx.newsSource.create({ data: { name: slug, language: 'en' } });
            const translator = new NewsTranslationService();
            translator.translateBatch = async () => { throw new Error('Localized fixtures must not make external translation requests'); };
            const service = new NewsSlotsService(tx, translator);
            await service.ensureSlotsExist(category.id, slug);
            assert.equal(await tx.newsSlot.count({ where: { categoryId: category.id } }), 10);
            for (let index = 0; index < 10; index++) await tx.newsArticle.create({ data: {
                title: `Las acciones suben tras los resultados de la empresa ${index + 1}`,
                description: 'Los inversores siguen las novedades de la economía y las empresas.',
                url: `https://publisher.example/${slug}/${index}`,
                categoryId: category.id, sourceId: source.id, status: 'PUBLISHED', isPublished: true,
            } });
            await service.fillEmptySlots(category.id, slug);
            let edition = await service.getPublicCategorySlots(slug);
            assert.equal(edition.slots.filter(slot => slot.article).length, 10);
            assert.equal(new Set(edition.slots.map(slot => slot.article.id)).size, 10);
            assert.ok(edition.slots.every(slot => !slot.article.imageUrl && translator.isSpanish(slot.article.title)));
            const bad = await tx.newsArticle.create({ data: {
                title: 'Shares surge after earnings', titleEs: 'AAPL raises revenue guidance',
                description: 'The company reports revenue growth.', translationAttemptedAt: new Date(),
                url: `https://publisher.example/${slug}/bad`, categoryId: category.id, sourceId: source.id,
                isPublished: true, status: 'PUBLISHED',
            } });
            await tx.newsSlot.update({ where: { id: edition.slots[0].id }, data: { articleId: bad.id } });
            service.invalidatePublicCache();
            edition = await service.getPublicCategorySlots(slug);
            assert.equal(edition.slots.filter(slot => slot.article).length, 9);
            // Restore the vacated card using the retained Spanish story, rather
            // than exposing English or clearing the rest of the edition.
            await service.fillEmptySlots(category.id, slug);
            edition = await service.getPublicCategorySlots(slug);
            assert.equal(edition.slots.filter(slot => slot.article).length, 10);
            assert.ok(edition.slots.every(slot => translator.isSpanish(slot.article.title)));
            assert.equal(await tx.newsSlotHistory.count({ where: { slotId: edition.slots[0].id, previousArticleId: bad.id } }), 1);
            throw rollback;
        }, { timeout: 20_000 });
    } catch (error) { if (error !== rollback) throw error; }
    console.log('PostgreSQL news passed: ten distinct optional-photo cards, Spanish publication guard, automatic recovery, atomic assignment and history; transaction rolled back.');
})().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => prisma.$disconnect());
