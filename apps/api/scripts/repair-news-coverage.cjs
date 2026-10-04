// Build the API first. Repairs public cards and imports the verified topic feeds without starting other jobs.
const { join } = require('node:path');
require('dotenv').config({ path: join(__dirname, '../.env'), quiet: true });
const { PrismaService } = require('../dist/prisma.service');
const { Logger } = require('@nestjs/common');
const { NewsSlotsService } = require('../dist/news/news-slots.service');
const { NewsSyncService } = require('../dist/news/news-sync.service');
const { NewsFetcherService } = require('../dist/news/news-fetcher.service');
const { NewsTranslationService } = require('../dist/news/news-translation.service');

async function main() {
    const prisma = new PrismaService();
    try {
        const slots = Object.assign(Object.create(NewsSlotsService.prototype), {
            prisma, translator: new NewsTranslationService(), logger: new Logger('NewsCoverageRepair'),
        });
        const sync = Object.assign(Object.create(NewsSyncService.prototype), {
            prisma, slotsService: slots, fetcher: new NewsFetcherService(), logger: new Logger('NewsCoverageRepair'),
            running: false, circuit: new Map(), defaultsReady: Promise.resolve(),
        });
        await sync.ensureDefaults();
        console.log('Fuentes y categorías preparadas');
        const categories = await prisma.newsCategory.findMany({ where: { isActive: true }, orderBy: { displayOrder: 'asc' } });
        for (const category of categories) {
            await slots.fillEmptySlots(category.id, category.slug);
            console.log(`Tarjetas recuperadas: ${category.slug}`);
        }
        const missingSlots = await prisma.newsSlot.findMany({ where: { isActive: true, articleId: null, category: { isActive: true } }, select: { categoryId: true } });
        const incompleteIds = new Set(missingSlots.map(slot => slot.categoryId));
        const names = ['ETF Trends', 'Brainsre', 'Finextra', 'Finance Magnates Fintech', 'Emprendedores', 'Xataka IA', 'Xataka Componentes', 'Kiplinger', 'NerdWallet'];
        const sources = await prisma.newsSource.findMany({
            where: { name: { in: names }, isActive: true },
            include: { categoryLinks: { where: { isActive: true } } },
        });
        const pendingSources = sources.filter(source => !source.lastSuccessfulSync || Date.now() - source.lastSuccessfulSync.getTime() > 3_600_000 || source.categoryLinks.some(link => incompleteIds.has(link.categoryId)));
        const collected = [];
        const categoryMap = new Map(categories.map(category => [category.id, category]));
        let next = 0;
        await Promise.all(Array.from({ length: 3 }, async () => {
            while (next < pendingSources.length) {
                const source = pendingSources[next++];
                try {
                    const items = await sync.fetcher.fetchConfiguredSource(source);
                    for (const item of items.slice(0, 8)) {
                        const category = sync.classify(item, source, categoryMap);
                        if (category) collected.push({ item, source, category });
                    }
                    await prisma.newsSource.update({ where: { id: source.id }, data: { lastSuccessfulSync: new Date(), lastError: null } });
                    console.log(`${source.name}: ${items.length} noticias recuperadas`);
                } catch (error) {
                    await prisma.newsSource.update({ where: { id: source.id }, data: { lastError: String(error.message).slice(0, 500) } });
                    console.log(`${source.name}: fuente no disponible`);
                }
            }
        }));
        const result = await sync.persistArticles(collected, categories);
        console.log({ created: result.created, updated: result.updated, duplicates: result.duplicates });
        let incomplete = false;
        for (const category of categories) {
            const latest = await sync.findArticlesWithPhotos(category.id);
            await slots.replaceAutomaticSlots(category.id, latest.map(article => article.id));
            await slots.fillEmptySlots(category.id, category.slug);
            const assigned = await prisma.newsSlot.findMany({ where: { categoryId: category.id, isActive: true }, include: { article: true } });
            const articles = assigned.filter(slot => slot.article?.isActive && slot.article.isPublished && slot.article.status === 'PUBLISHED');
            const active = assigned.length;
            console.log(`${category.slug}: ${articles.length}/${active} tarjetas con noticias`);
            if (articles.length < active) incomplete = true;
        }
        if (incomplete) process.exitCode = 1;
    } finally {
        await prisma.$disconnect();
    }
}
main().catch(error => { console.error({ name: error.name, code: error.code || 'REPAIR_FAILED' }); process.exitCode = 1; });
