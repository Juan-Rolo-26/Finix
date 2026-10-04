import { TtlCache } from '../common/ttl-cache';
import {
    Injectable,
    BadRequestException,
    NotFoundException,
    Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { NewsTranslationService } from './news-translation.service';
import * as cheerio from 'cheerio';
import { DEFAULT_NEWS_CATEGORIES, NEWS_CATEGORY_KEYWORDS, newsCategoryMatchCount } from './news-catalog';
import { resolveNewsImage } from './news-image.util';
import { extractHtmlNewsImage, normalizeSourceImage } from './news-source-image.util';

const SLOT_COUNT = 5;

const PRIVATE_IP_PATTERNS = [
    /^127\./,
    /^10\./,
    /^172\.(1[6-9]|2[0-9]|3[01])\./,
    /^192\.168\./,
    /^169\.254\./,
    /^::1$/,
    /^fc00:/,
    /^fe80:/,
];

export interface ScrapedMetadata {
    title?: string;
    description?: string;
    imageUrl?: string;
    sourceName?: string;
    sourceUrl?: string;
    publishedAt?: string;
    author?: string;
    canonical?: string;
    error?: string;
}

export interface AssignArticleDto {
    url: string;
    title?: string;
    description?: string;
    imageUrl?: string;
    sourceName?: string;
    publishedAt?: string;
    author?: string;
    customTitle?: boolean;
    customDescription?: boolean;
    customImage?: boolean;
    isActive?: boolean;
    status?: string;
    categoryId?: string;
}

@Injectable()
export class NewsSlotsService {
    private readonly logger = new Logger(NewsSlotsService.name);
    private readonly repairCache = new TtlCache<void>(50);
    private readonly translations = new Map<string, Promise<any>>();
    private readonly publicCategories = new TtlCache<any>(1);
    private readonly publicSlots = new TtlCache<any>(40);
    private readonly publicHeadlines = new TtlCache<any[]>(20);

    invalidatePublicCache() {
        this.publicCategories.clear();
        this.publicSlots.clear();
        this.publicHeadlines.clear();
    }

    constructor(
        private readonly prisma: PrismaService,
        private readonly translator: NewsTranslationService,
    ) { }
    // NewsSyncService.prepareDefaults owns startup seeding and retries. Avoid
    // starting a second set of category/slot writes in this constructor.

    async getPublicCategories() {
        return this.publicCategories.getOrLoad('categories', 60000, () => this.loadPublicCategories());
    }

    private async loadPublicCategories() {
        return this.prisma.newsCategory.findMany({
            where: { isActive: true },
            orderBy: { displayOrder: 'asc' },
            select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                color: true,
                icon: true,
                image: true,
                displayOrder: true,
            },
        });
    }

    async getPublicHeadlines(limit = 6) {
        limit = Math.min(20, Math.max(1, Math.floor(Number(limit) || 6)));
        return this.publicHeadlines.getOrLoad(String(limit), 15000, () => this.loadPublicHeadlines(limit));
    }

    private async loadPublicHeadlines(limit = 6) {
        limit = Math.min(20, Math.max(1, Math.floor(Number(limit) || 6)));
        const slots = await this.prisma.newsSlot.findMany({
            where: {
                isActive: true,
                article: {
                    isPublished: true,
                    isActive: true,
                    status: 'PUBLISHED',
                },
                category: {
                    isActive: true,
                },
            },
            include: {
                category: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        color: true,
                        icon: true,
                    },
                },
                article: {
                    select: {
                        id: true,
                        url: true,
                        title: true,
                        titleEs: true,
                        description: true,
                        descriptionEs: true,
                        translationAttemptedAt: true,
                        imageUrl: true,
                        sourceName: true,
                        publishedAt: true,
                        author: true,
                        relevanceScore: true,
                        source: { select: { language: true } },
                    },
                },
            },
            orderBy: [
                { article: { relevanceScore: 'desc' } },
                { article: { publishedAt: 'desc' } },
                { updatedAt: 'desc' },
            ],
            take: limit,
        });

        return Promise.all(slots
            .filter((s) => s.article)
            .map(async (s) => {
                const article = await this.toSpanishArticle(s.article);
                return {
                    id: article.id,
                    slotId: s.id,
                    slotKey: s.slotKey,
                    title: article.title,
                    description: article.description,
                    imageUrl: resolveNewsImage(article.title, s.category.slug, article.imageUrl),
                    url: article.url,
                    sourceName: article.sourceName || 'Finix',
                    publishedAt: article.publishedAt,
                    category: s.category.name,
                    categorySlug: s.category.slug,
                    categoryColor: s.category.color || 'hsl(var(--primary))',
                    relevanceScore: article.relevanceScore,
                };
            }));
    }


    async getPublicCategorySlots(slug: string) {
        return this.publicSlots.getOrLoad(slug, 15000, () => this.loadPublicCategorySlots(slug));
    }

    private async loadPublicCategorySlots(slug: string) {
        const category = await this.prisma.newsCategory.findUnique({ where: { slug } });
        if (!category || !category.isActive) {
            throw new NotFoundException(`Categoría "${slug}" no encontrada`);
        }
        const loadSlots = () => this.prisma.newsSlot.findMany({
            where: { categoryId: category.id },
            orderBy: { position: 'asc' },
            include: {
                article: {
                    select: {
                        id: true,
                        url: true,
                        title: true,
                        titleEs: true,
                        description: true,
                        descriptionEs: true,
                        translationAttemptedAt: true,
                        imageUrl: true,
                        sourceName: true,
                        publishedAt: true,
                        author: true,
                        status: true,
                        isPublished: true,
                        isActive: true,
                        source: { select: { language: true } },
                    },
                },
            },
        });

        let slots = await loadSlots();
        // Reads of a populated category do not perform maintenance queries or writes.
        // Sparse categories still recover immediately, with one repair per category.
        if (slots.length < SLOT_COUNT || slots.some(slot => slot.isActive && (!slot.article?.isPublished || !slot.article?.isActive || slot.article.status !== 'PUBLISHED'))) {
            await this.repairCache.getOrLoad(category.id, 0, async () => {
                await this.ensureSlotsExist(category.id, category.slug);
                await this.fillEmptySlots(category.id, category.slug);
            });
            slots = await loadSlots();
        }

        return {
            category: {
                id: category.id,
                name: category.name,
                slug: category.slug,
                color: category.color,
                icon: category.icon,
                image: category.image,
            },
            slots: await Promise.all(slots.map(async (slot) => ({
                id: slot.id,
                slotKey: slot.slotKey,
                position: slot.position,
                isActive: slot.isActive,
                article:
                    slot.isActive && slot.article?.isPublished && slot.article?.isActive && slot.article.status === 'PUBLISHED'
                        ? {
                            ...(await this.toSpanishArticle(slot.article)),
                            imageUrl: resolveNewsImage(slot.article.title, category.slug, slot.article.imageUrl),
                        }
                        : null,
            }))),
        };
    }

    private toSpanishArticle(article: any): Promise<any> {
        if (!article) return Promise.resolve(article);
        const key = JSON.stringify([article.id, article.title, article.description, article.titleEs, article.descriptionEs, article.translationAttemptedAt]);
        const pending = this.translations.get(key);
        if (pending) return pending;
        const result = this.translateArticle(article).finally(() => this.translations.delete(key));
        this.translations.set(key, result);
        return result;
    }

    private async translateArticle(article: any) {
        if (!article) return article;

        const sourceLanguage = article.source?.language || undefined;
        const englishSource = sourceLanguage?.toLowerCase().startsWith('en');
        let titleEs = article.titleEs as string | null;
        let descriptionEs = article.descriptionEs as string | null;
        // A provider can echo its input. That does not make an English field Spanish.
        if (englishSource && titleEs === article.title && !this.translator.isSpanish(article.title)) titleEs = null;
        if (descriptionEs && this.translator.isEnglish(descriptionEs)) descriptionEs = null;
        const invalidCachedTranslation = (article.titleEs && !titleEs) || (article.descriptionEs && !descriptionEs);
        const attemptIsRecent = !invalidCachedTranslation && article.translationAttemptedAt &&
            Date.now() - new Date(article.translationAttemptedAt).getTime() < 4 * 60 * 60 * 1000;
        const titleNeedsTranslation = !titleEs;
        const descriptionNeedsTranslation = Boolean(article.description) && !descriptionEs;

        if ((titleNeedsTranslation || descriptionNeedsTranslation) && !attemptIsRecent) {
            const fields: Array<{ key: 'titleEs' | 'descriptionEs'; text: string }> = [];
            if (titleNeedsTranslation && article.title) fields.push({ key: 'titleEs', text: article.title });
            if (descriptionNeedsTranslation && article.description) fields.push({ key: 'descriptionEs', text: article.description });

            const translated = await this.translator.translateBatch(fields.map((field) => field.text), sourceLanguage);
            const update: { titleEs?: string; descriptionEs?: string; translationAttemptedAt?: Date } = {};
            let everyFieldResolved = fields.length > 0;
            fields.forEach((field, index) => {
                const result = String(translated[index] || '').trim();
                const wasAlreadySpanish = this.translator.isSpanish(field.text) || (sourceLanguage?.toLowerCase().startsWith('es') && !this.translator.isEnglish(field.text));
                const resolved = result && !this.translator.isEnglish(result) && (
                    result !== field.text ||
                    wasAlreadySpanish ||
                    (!englishSource && !this.translator.isEnglish(field.text))
                );
                if (resolved) {
                    update[field.key] = result;
                    if (field.key === 'titleEs') titleEs = result;
                    else descriptionEs = result;
                } else {
                    everyFieldResolved = false;
                }
            });

            // Keep successful fields, but don't suppress retries for a provider
            // outage or an incomplete translation (e.g. title succeeded, summary did not).
            if (everyFieldResolved) update.translationAttemptedAt = new Date();
            if (Object.keys(update).length > 0) {
                await this.prisma.newsArticle.update({ where: { id: article.id }, data: update });
            }
        }

        return {
            ...article,
            title: titleEs || article.title,
            description: descriptionEs || (this.translator.isSpanish(article.description || '') || (sourceLanguage?.toLowerCase().startsWith('es') && !this.translator.isEnglish(article.description || '')) ? article.description : undefined),
        };
    }

    async registerClick(slotId: string) {
        try {
            const slot = await this.prisma.newsSlot.findUnique({
                where: { id: slotId },
                select: { id: true, articleId: true, categoryId: true },
            });
            if (!slot) return { ok: false };
            return { ok: true, slotId, articleId: slot.articleId };
        } catch {
            return { ok: false };
        }
    }

    async getAdminCategories() {
        return this.prisma.newsCategory.findMany({
            orderBy: { displayOrder: 'asc' },
            include: { _count: { select: { slots: true, articles: true } } },
        });
    }

    async createCategory(data: {
        name: string;
        slug: string;
        description?: string;
        color?: string;
        icon?: string;
        image?: string;
        displayOrder?: number;
    }) {
        try { return await this.writeCreateCategory(data); }
        finally { this.invalidatePublicCache(); }
    }

    private async writeCreateCategory(data: {
        name: string;
        slug: string;
        description?: string;
        color?: string;
        icon?: string;
        image?: string;
        displayOrder?: number;
    }) {
        const category = await this.prisma.newsCategory.create({ data });
        await this.ensureSlotsExist(category.id, category.slug);
        return category;
    }

    async updateCategory(id: string, data: any) {
        try { return await this.writeUpdateCategory(id, data); }
        finally { this.invalidatePublicCache(); }
    }

    private async writeUpdateCategory(id: string, data: any) {
        return this.prisma.newsCategory.update({ where: { id }, data });
    }

    async getAdminCategorySlots(slug: string) {
        const category = await this.prisma.newsCategory.findUnique({ where: { slug } });
        if (!category) throw new NotFoundException(`Categoría "${slug}" no encontrada`);
        await this.ensureSlotsExist(category.id, category.slug);

        const slots = await this.prisma.newsSlot.findMany({
            where: { categoryId: category.id },
            orderBy: { position: 'asc' },
            include: {
                article: true,
                history: {
                    orderBy: { changedAt: 'desc' },
                    take: 5,
                    include: {
                        previousArticle: { select: { id: true, title: true, url: true } },
                        newArticle: { select: { id: true, title: true, url: true } },
                    },
                },
            },
        });

        return { category, slots };
    }

    async getSlotHistory(slotId: string) {
        return this.prisma.newsSlotHistory.findMany({
            where: { slotId },
            orderBy: { changedAt: 'desc' },
            take: 20,
            include: {
                previousArticle: { select: { id: true, title: true, url: true } },
                newArticle: { select: { id: true, title: true, url: true } },
            },
        });
    }

    /** Replace the public slots with the best automatic articles for a category. */
    async replaceAutomaticSlots(categoryId: string, articleIds: string[]) {
        try { return await this.writeReplaceAutomaticSlots(categoryId, articleIds); }
        finally { this.invalidatePublicCache(); }
    }

    private async writeReplaceAutomaticSlots(categoryId: string, articleIds: string[]) {
        const category = await this.prisma.newsCategory.findUnique({
            where: { id: categoryId },
            select: { slug: true },
        });
        if (!category) throw new NotFoundException('Categoría no encontrada');

        await this.ensureSlotsExist(categoryId, category.slug);
        const slots = await this.prisma.newsSlot.findMany({
            where: { categoryId },
            orderBy: { position: 'asc' },
            include: { article: true },
        });

        const editorial = (slot: typeof slots[number]) => slot.article && (!slot.article.sourceId || slot.article.customTitle || slot.article.customDescription || slot.article.customImage);
        const reserved = new Set(slots.filter(slot => !slot.isActive || editorial(slot)).map(slot => slot.articleId));
        const previousPublished = slots.filter(slot => slot.isActive && slot.article?.isPublished && slot.article.isActive && slot.article.status === 'PUBLISHED').map(slot => slot.articleId).filter(Boolean) as string[];
        const available = [...new Set([...articleIds, ...previousPublished])].filter(id => !reserved.has(id));
        let next = 0;
        for (const slot of slots) {
            if (!slot.isActive || editorial(slot)) continue;
            const nextArticleId = available[next++];
            // An outage or a short feed must never erase the last published stories.
            if (!nextArticleId) continue;
            if (slot.articleId === nextArticleId) continue;

            await this.prisma.newsSlot.update({
                where: { id: slot.id },
                data: { articleId: nextArticleId },
            });
            await this.prisma.newsSlotHistory.create({
                data: {
                    slotId: slot.id,
                    previousArticleId: slot.articleId || undefined,
                    newArticleId: nextArticleId || undefined,
                },
            });
        }
    }

    /** Restore unassigned cards from published stories, including relevant coverage in other categories. */
    async fillEmptySlots(categoryId: string, slug: string) {
        try { return await this.writeFillEmptySlots(categoryId, slug); }
        finally { this.invalidatePublicCache(); }
    }

    private async writeFillEmptySlots(categoryId: string, slug: string) {
        const slots = await this.prisma.newsSlot.findMany({ where: { categoryId }, orderBy: { position: 'asc' } });
        const empty = slots.filter(slot => slot.isActive && !slot.articleId);
        if (!empty.length) return;
        const used = slots.map(slot => slot.articleId).filter(Boolean) as string[];
        const keywords = NEWS_CATEGORY_KEYWORDS[slug] || [];
        const articles = await this.prisma.newsArticle.findMany({
            where: {
                isPublished: true, isActive: true, status: 'PUBLISHED', id: { notIn: used },
                OR: [
                    { categoryId },
                    { slots: { some: { categoryId, isActive: true } } },
                    ...(keywords.length ? [{
                        source: { isActive: true, categoryLinks: { some: { categoryId, isActive: true } } },
                        OR: keywords.flatMap(keyword => ['title', 'titleEs', 'description', 'descriptionEs'].map(field => ({ [field]: { contains: keyword, mode: 'insensitive' as const } }))),
                    }] : []),
                ],
            },
            orderBy: [{ publishedAt: 'desc' }, { relevanceScore: 'desc' }],
            take: 100,
        });
        const relevant = articles.filter(article => article.categoryId === categoryId || newsCategoryMatchCount(slug, `${article.title} ${article.titleEs || ''} ${article.description || ''} ${article.descriptionEs || ''}`) > 0);
        for (let index = 0; index < Math.min(empty.length, relevant.length); index++) {
            const article = relevant[index];
            const result = await this.prisma.newsSlot.updateMany({
                where: { id: empty[index].id, articleId: null, isActive: true },
                data: { articleId: article.id },
            });
            if (result.count) await this.prisma.newsSlotHistory.create({ data: { slotId: empty[index].id, newArticleId: article.id } });
        }
    }

    async scrapeUrlPreview(url: string): Promise<ScrapedMetadata> {
        this.validateUrl(url);
        try {
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
                    Accept: 'text/html,application/xhtml+xml',
                },
                signal: AbortSignal.timeout(10_000),
                redirect: 'follow',
            });
            if (!response.ok) {
                return { error: `El servidor respondió con código ${response.status}` };
            }
            const html = await response.text();
            return this.extractMetadata(html, response.url || url);
        } catch (err: any) {
            const isTimeout = err?.name === 'TimeoutError' || err?.name === 'AbortError';
            return {
                error: isTimeout
                    ? 'La solicitud tardó demasiado. Completá los datos manualmente.'
                    : `No se pudo obtener la URL: ${err?.message || 'Error desconocido'}`,
            };
        }
    }

    async assignArticleToSlot(slotId: string, data: AssignArticleDto, adminId?: string) {
        try { return await this.writeAssignArticleToSlot(slotId, data, adminId); }
        finally { this.invalidatePublicCache(); }
    }

    private async writeAssignArticleToSlot(slotId: string, data: AssignArticleDto, adminId?: string) {
        this.validateUrl(data.url);

        const slot = await this.prisma.newsSlot.findUnique({
            where: { id: slotId },
            include: { article: true },
        });
        if (!slot) throw new NotFoundException(`Slot "${slotId}" no encontrado`);

        const previousArticleId = slot.articleId;
        const isPublished = data.status === 'PUBLISHED';
        const targetCategoryId = data.categoryId ?? slot.categoryId;
        const customImage = data.customImage ?? slot.article?.customImage ?? false;
        // A replacement must get its own photo, never inherit the previous story's.
        const existingImage = slot.article?.url === data.url ? slot.article.imageUrl : undefined;
        const imageUrl = await this.ensureArticlePhoto(data.url, data.title || slot.article?.title || 'Noticia', data.imageUrl ?? existingImage, targetCategoryId);

        const article = await this.prisma.newsArticle.upsert({
            where: { url: data.url },
            update: {
                title: data.title ?? undefined,
                titleEs: data.title !== undefined ? null : undefined,
                description: data.description ?? undefined,
                descriptionEs: data.description !== undefined ? null : undefined,
                translationAttemptedAt: (data.title !== undefined || data.description !== undefined) ? null : undefined,
                imageUrl,
                sourceName: data.sourceName ?? undefined,
                publishedAt: data.publishedAt ? new Date(data.publishedAt) : undefined,
                author: data.author ?? undefined,
                customTitle: data.customTitle ?? false,
                customDescription: data.customDescription ?? false,
                customImage,
                status: data.status ?? 'DRAFT',
                isPublished,
                isActive: data.isActive ?? true,
                categoryId: targetCategoryId,
            },
            create: {
                url: data.url,
                title: data.title || 'Sin título',
                titleEs: null,
                description: data.description,
                descriptionEs: null,
                imageUrl,
                sourceName: data.sourceName,
                publishedAt: data.publishedAt ? new Date(data.publishedAt) : undefined,
                author: data.author,
                customTitle: data.customTitle ?? false,
                customDescription: data.customDescription ?? false,
                customImage,
                status: data.status ?? 'DRAFT',
                isPublished,
                isActive: data.isActive ?? true,
                categoryId: targetCategoryId,
            },
        });

        const updatedSlot = await this.prisma.newsSlot.update({
            where: { id: slotId },
            data: { articleId: article.id },
            include: { article: true, category: true },
        });

        if (previousArticleId !== article.id) {
            await this.prisma.newsSlotHistory.create({
                data: {
                    slotId,
                    previousArticleId: previousArticleId ?? undefined,
                    newArticleId: article.id,
                    changedBy: adminId,
                },
            });
        }

        return updatedSlot;
    }

    async publishSlot(slotId: string) {
        try { return await this.writePublishSlot(slotId); }
        finally { this.invalidatePublicCache(); }
    }

    private async writePublishSlot(slotId: string) {
        const slot = await this.prisma.newsSlot.findUnique({
            where: { id: slotId },
            include: { article: true },
        });
        if (!slot) throw new NotFoundException('Slot no encontrado');
        if (!slot.article) throw new BadRequestException('El slot no tiene artículo asignado');
        const imageUrl = await this.ensureArticlePhoto(slot.article.url, slot.article.title, slot.article.imageUrl, slot.categoryId);
        await this.prisma.newsArticle.update({
            where: { id: slot.article.id },
            data: { status: 'PUBLISHED', isPublished: true, imageUrl },
        });
        return { ok: true, slotId, articleId: slot.article.id };
    }

    async unpublishSlot(slotId: string) {
        try { return await this.writeUnpublishSlot(slotId); }
        finally { this.invalidatePublicCache(); }
    }

    private async writeUnpublishSlot(slotId: string) {
        const slot = await this.prisma.newsSlot.findUnique({
            where: { id: slotId },
            include: { article: true },
        });
        if (!slot) throw new NotFoundException('Slot no encontrado');
        if (!slot.article) throw new BadRequestException('El slot no tiene artículo asignado');
        await this.prisma.newsArticle.update({
            where: { id: slot.article.id },
            data: { status: 'DRAFT', isPublished: false },
        });
        return { ok: true, slotId, articleId: slot.article.id };
    }

    async toggleSlotActive(slotId: string) {
        try { return await this.writeToggleSlotActive(slotId); }
        finally { this.invalidatePublicCache(); }
    }

    private async writeToggleSlotActive(slotId: string) {
        const slot = await this.prisma.newsSlot.findUnique({ where: { id: slotId } });
        if (!slot) throw new NotFoundException('Slot no encontrado');
        return this.prisma.newsSlot.update({
            where: { id: slotId },
            data: { isActive: !slot.isActive },
        });
    }

    async seedCategoriesAndSlots() {
        try { return await this.writeSeedCategoriesAndSlots(); }
        finally { this.invalidatePublicCache(); }
    }

    private async writeSeedCategoriesAndSlots() {
        for (const cat of DEFAULT_NEWS_CATEGORIES) {
            try {
                const category = await this.prisma.newsCategory.upsert({
                    where: { slug: cat.slug },
                    update: { name: cat.name, displayOrder: cat.displayOrder, color: cat.color, icon: cat.icon },
                    create: {
                        name: cat.name,
                        slug: cat.slug,
                        color: cat.color,
                        icon: cat.icon,
                        displayOrder: cat.displayOrder,
                        isActive: true,
                        updateFrequency: cat.updateFrequency,
                        updateHour: cat.updateHour,
                        updateMinute: cat.updateMinute,
                        updateDayOfWeek: cat.updateDayOfWeek,
                    },
                });
                await this.ensureSlotsExist(category.id, category.slug);
            } catch (err: any) {
                this.logger.warn(`Seed warning for "${cat.slug}": ${err?.message}`);
            }
        }
        this.logger.log('✅ News categories and slots seeded');
    }

    private async ensureSlotsExist(categoryId: string, categorySlug: string) {
        const existing = await this.prisma.newsSlot.count({ where: { categoryId } });
        if (existing >= SLOT_COUNT) return;
        for (let pos = 1; pos <= SLOT_COUNT; pos++) {
            const slotKey = `${categorySlug}_slot_${pos}`;
            await this.prisma.newsSlot.upsert({
                where: { slotKey },
                update: {},
                create: { categoryId, slotKey, position: pos, isActive: true },
            });
        }
    }

    private async ensureArticlePhoto(url: string, title: string, providedImage?: string | null, categoryId?: string): Promise<string> {
        const provided = normalizeSourceImage(providedImage, url);
        if (provided) return provided;
        const metadata = await this.scrapeUrlPreview(url);
        const photo = normalizeSourceImage(metadata.imageUrl, url);
        if (photo) return photo;
        const category = categoryId
            ? await this.prisma.newsCategory.findUnique({ where: { id: categoryId }, select: { slug: true } })
            : null;
        return resolveNewsImage(title || metadata.title || 'Noticia', category?.slug);
    }

    private validateUrl(url: string) {
        let parsed: URL;
        try { parsed = new URL(url); } catch { throw new BadRequestException('URL inválida'); }
        if (!['http:', 'https:'].includes(parsed.protocol)) {
            throw new BadRequestException('Solo se permiten URLs http/https');
        }
        const hostname = parsed.hostname.toLowerCase();
        if (hostname === 'localhost' || hostname === '0.0.0.0') {
            throw new BadRequestException('URL no permitida');
        }
        for (const pattern of PRIVATE_IP_PATTERNS) {
            if (pattern.test(hostname)) {
                throw new BadRequestException('URL no permitida (red privada)');
            }
        }
    }

    private extractMetadata(html: string, baseUrl: string): ScrapedMetadata {
        const $ = cheerio.load(html);
        const base = new URL(baseUrl);

        const getMeta = (selectors: string[]): string | undefined => {
            for (const sel of selectors) {
                const val = $(sel).attr('content')?.trim();
                if (val) return val;
            }
            return undefined;
        };

        const title =
            getMeta(['meta[property="og:title"]', 'meta[name="twitter:title"]']) ||
            $('title').text().trim() ||
            $('h1').first().text().trim() ||
            undefined;

        const description =
            getMeta([
                'meta[property="og:description"]',
                'meta[name="twitter:description"]',
                'meta[name="description"]',
            ]) || undefined;

        const imageUrl = extractHtmlNewsImage(html, baseUrl);

        const canonical =
            getMeta(['meta[property="og:url"]']) ||
            $('link[rel="canonical"]').attr('href') ||
            baseUrl;

        const publishedAt =
            getMeta([
                'meta[property="article:published_time"]',
                'meta[name="article:published_time"]',
                'meta[property="article:modified_time"]',
            ]) || undefined;

        const author =
            getMeta(['meta[name="author"]', 'meta[property="article:author"]']) || undefined;

        const siteName =
            getMeta(['meta[property="og:site_name"]']) || base.hostname.replace('www.', '');

        let jsonLdPublishedAt: string | undefined;
        let jsonLdAuthor: string | undefined;
        $('script[type="application/ld+json"]').each((_, el) => {
            try {
                const data = JSON.parse($(el).html() || '{}');
                const article = Array.isArray(data) ? data[0] : data;
                if (!jsonLdPublishedAt && article?.datePublished) jsonLdPublishedAt = article.datePublished;
                if (!jsonLdAuthor) {
                    const af = article?.author;
                    if (typeof af === 'string') jsonLdAuthor = af;
                    else if (af?.name) jsonLdAuthor = af.name;
                    else if (Array.isArray(af) && af[0]?.name) jsonLdAuthor = af[0].name;
                }
            } catch { /* ignore malformed JSON-LD */ }
        });

        return {
            title,
            description,
            imageUrl,
            sourceName: siteName,
            sourceUrl: base.origin,
            canonical,
            publishedAt: publishedAt || jsonLdPublishedAt,
            author: author || jsonLdAuthor,
        };
    }
}
