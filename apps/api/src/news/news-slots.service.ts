import {
    Injectable,
    BadRequestException,
    NotFoundException,
    Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as cheerio from 'cheerio';

const SLOT_COUNT = 5;

const INITIAL_CATEGORIES = [
    { name: 'Economía', slug: 'economia', color: '#10b981', icon: 'TrendingUp', displayOrder: 1 },
    { name: 'Mercados', slug: 'mercados', color: '#ef4444', icon: 'BarChart3', displayOrder: 2 },
    { name: 'Argentina', slug: 'argentina', color: '#3b82f6', icon: 'DollarSign', displayOrder: 3 },
    { name: 'Global', slug: 'global', color: '#06b6d4', icon: 'Globe', displayOrder: 4 },
    { name: 'Acciones', slug: 'acciones', color: '#a855f7', icon: 'BarChart2', displayOrder: 5 },
    { name: 'Criptomonedas', slug: 'cripto', color: '#f59e0b', icon: 'Bitcoin', displayOrder: 6 },
    { name: 'ETFs', slug: 'etfs', color: '#6366f1', icon: 'PieChart', displayOrder: 7 },
    { name: 'Real Estate', slug: 'real-estate', color: '#10b981', icon: 'Home', displayOrder: 8 },
    { name: 'Finanzas Personales', slug: 'finanzas-personales', color: '#14b8a6', icon: 'Wallet', displayOrder: 9 },
    { name: 'Commodities', slug: 'commodities', color: '#eab308', icon: 'TrendingUp', displayOrder: 10 },
    { name: 'Inteligencia Artificial', slug: 'ai', color: '#ec4899', icon: 'Cpu', displayOrder: 11 },
];

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

    constructor(private readonly prisma: PrismaService) {
        this.seedCategoriesAndSlots().catch((err) =>
            this.logger.warn('Seed warning: ' + err?.message),
        );
    }

    async getPublicCategories() {
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
                        description: true,
                        imageUrl: true,
                        sourceName: true,
                        publishedAt: true,
                        author: true,
                    },
                },
            },
            orderBy: [
                { article: { publishedAt: 'desc' } },
                { updatedAt: 'desc' },
            ],
            take: limit,
        });

        return slots
            .filter((s) => s.article)
            .map((s) => ({
                id: s.article!.id,
                slotId: s.id,
                slotKey: s.slotKey,
                title: s.article!.title,
                description: s.article!.description,
                imageUrl: s.article!.imageUrl,
                url: s.article!.url,
                sourceName: s.article!.sourceName || 'Finix',
                publishedAt: s.article!.publishedAt,
                category: s.category.name,
                categorySlug: s.category.slug,
                categoryColor: s.category.color || 'hsl(var(--primary))',
            }));
    }


    async getPublicCategorySlots(slug: string) {
        const category = await this.prisma.newsCategory.findUnique({ where: { slug } });
        if (!category || !category.isActive) {
            throw new NotFoundException(`Categoría "${slug}" no encontrada`);
        }
        await this.ensureSlotsExist(category.id, category.slug);

        const slots = await this.prisma.newsSlot.findMany({
            where: { categoryId: category.id },
            orderBy: { position: 'asc' },
            include: {
                article: {
                    select: {
                        id: true,
                        url: true,
                        title: true,
                        description: true,
                        imageUrl: true,
                        sourceName: true,
                        publishedAt: true,
                        author: true,
                        status: true,
                        isPublished: true,
                        isActive: true,
                    },
                },
            },
        });

        return {
            category: {
                id: category.id,
                name: category.name,
                slug: category.slug,
                color: category.color,
                icon: category.icon,
                image: category.image,
            },
            slots: slots.map((slot) => ({
                id: slot.id,
                slotKey: slot.slotKey,
                position: slot.position,
                isActive: slot.isActive,
                article:
                    slot.isActive && slot.article?.isPublished && slot.article?.isActive
                        ? slot.article
                        : null,
            })),
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
        const category = await this.prisma.newsCategory.create({ data });
        await this.ensureSlotsExist(category.id, category.slug);
        return category;
    }

    async updateCategory(id: string, data: any) {
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
            return this.extractMetadata(html, url);
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
        this.validateUrl(data.url);

        const slot = await this.prisma.newsSlot.findUnique({
            where: { id: slotId },
            include: { article: true },
        });
        if (!slot) throw new NotFoundException(`Slot "${slotId}" no encontrado`);

        const previousArticleId = slot.articleId;
        const isPublished = data.status === 'PUBLISHED';

        const article = await this.prisma.newsArticle.upsert({
            where: { url: data.url },
            update: {
                title: data.title ?? undefined,
                description: data.description ?? undefined,
                imageUrl: data.imageUrl ?? undefined,
                sourceName: data.sourceName ?? undefined,
                publishedAt: data.publishedAt ? new Date(data.publishedAt) : undefined,
                author: data.author ?? undefined,
                customTitle: data.customTitle ?? false,
                customDescription: data.customDescription ?? false,
                customImage: data.customImage ?? false,
                status: data.status ?? 'DRAFT',
                isPublished,
                isActive: data.isActive ?? true,
                categoryId: data.categoryId ?? slot.categoryId,
            },
            create: {
                url: data.url,
                title: data.title || 'Sin título',
                description: data.description,
                imageUrl: data.imageUrl,
                sourceName: data.sourceName,
                publishedAt: data.publishedAt ? new Date(data.publishedAt) : undefined,
                author: data.author,
                customTitle: data.customTitle ?? false,
                customDescription: data.customDescription ?? false,
                customImage: data.customImage ?? false,
                status: data.status ?? 'DRAFT',
                isPublished,
                isActive: data.isActive ?? true,
                categoryId: data.categoryId ?? slot.categoryId,
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
        const slot = await this.prisma.newsSlot.findUnique({
            where: { id: slotId },
            include: { article: true },
        });
        if (!slot) throw new NotFoundException('Slot no encontrado');
        if (!slot.article) throw new BadRequestException('El slot no tiene artículo asignado');
        await this.prisma.newsArticle.update({
            where: { id: slot.article.id },
            data: { status: 'PUBLISHED', isPublished: true },
        });
        return { ok: true, slotId, articleId: slot.article.id };
    }

    async unpublishSlot(slotId: string) {
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
        const slot = await this.prisma.newsSlot.findUnique({ where: { id: slotId } });
        if (!slot) throw new NotFoundException('Slot no encontrado');
        return this.prisma.newsSlot.update({
            where: { id: slotId },
            data: { isActive: !slot.isActive },
        });
    }

    async seedCategoriesAndSlots() {
        for (const cat of INITIAL_CATEGORIES) {
            try {
                const category = await this.prisma.newsCategory.upsert({
                    where: { slug: cat.slug },
                    update: { displayOrder: cat.displayOrder, color: cat.color, icon: cat.icon },
                    create: {
                        name: cat.name,
                        slug: cat.slug,
                        color: cat.color,
                        icon: cat.icon,
                        displayOrder: cat.displayOrder,
                        isActive: true,
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

        let imageUrl =
            getMeta([
                'meta[property="og:image"]',
                'meta[property="og:image:url"]',
                'meta[name="twitter:image"]',
                'meta[name="twitter:image:src"]',
            ]) || undefined;

        if (imageUrl && !imageUrl.startsWith('http')) {
            try { imageUrl = new URL(imageUrl, base.origin).toString(); } catch { imageUrl = undefined; }
        }

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
