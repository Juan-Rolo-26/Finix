import {
    BadRequestException,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma.service';
import { NewsFetcherService, RawNewsItem } from './news-fetcher.service';
import { NewsSlotsService } from './news-slots.service';
import {
    DEFAULT_NEWS_CATEGORIES,
    DEFAULT_NEWS_SOURCES,
    NEWS_CATEGORY_KEYWORDS,
    NEWS_TIME_ZONE,
    NewsUpdateFrequency,
} from './news-catalog';

const SOURCE_RETRIES = 2;
const SOURCE_TIMEOUT_WINDOW_MS = 60_000;
const SOURCE_RATE_LIMIT_DELAY_MS = 350;
const DEDUP_WINDOW_MS = 72 * 60 * 60 * 1000;

export interface ManualSyncRequest {
    scope: 'ALL' | 'DAILY' | 'WEEKLY' | 'CATEGORY' | 'SOURCE';
    categoryId?: string;
    sourceId?: string;
}

export function normalizeNewsUrl(rawUrl: string): string {
    try {
        const url = new URL(rawUrl.trim());
        url.hash = '';
        for (const key of [...url.searchParams.keys()]) {
            if (/^(utm_|fbclid|gclid|mc_)/i.test(key)) url.searchParams.delete(key);
        }
        url.hostname = url.hostname.toLowerCase();
        url.pathname = url.pathname.replace(/\/+$/, '') || '/';
        return url.toString();
    } catch {
        return rawUrl.trim().toLowerCase();
    }
}

export function normalizeNewsTitle(title: string): string {
    return title
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

export function titleSimilarity(first: string, second: string): number {
    const a = new Set(normalizeNewsTitle(first).split(' ').filter((word) => word.length > 2));
    const b = new Set(normalizeNewsTitle(second).split(' ').filter((word) => word.length > 2));
    if (!a.size || !b.size) return 0;
    const intersection = [...a].filter((word) => b.has(word)).length;
    return (2 * intersection) / (a.size + b.size);
}

function sameNewsEvent(firstTitle: string, secondTitle: string) {
    const first = normalizeNewsTitle(firstTitle);
    const second = normalizeNewsTitle(secondTitle);
    const entities = ['nvidia', 'apple', 'microsoft', 'tesla', 'amazon', 'alphabet', 'meta', 'bitcoin', 'ethereum', 'fed', 'banco central'];
    const events = ['earnings', 'resultados', 'results', 'quarterly', 'trimestral', 'acquisition', 'adquisicion', 'rates', 'tasas', 'dividend'];
    return entities.some((entity) => first.includes(entity) && second.includes(entity)) &&
        events.some((event) => first.includes(event) && second.includes(event));
}

function eventFingerprint(title: string, tickers: string[]): string {
    const words = normalizeNewsTitle(title)
        .split(' ')
        .filter((word) => word.length > 3)
        .slice(0, 12)
        .sort();
    return createHash('sha256')
        .update(`${words.join('-')}|${tickers.sort().join(',')}`)
        .digest('hex')
        .slice(0, 48);
}

function clamp(value: number, min = 0, max = 100) {
    return Math.max(min, Math.min(max, Math.round(value)));
}

function parseJsonList(value: string | null | undefined): string[] {
    try {
        const parsed = JSON.parse(value || '[]');
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

type LocalDateParts = {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second: number;
};

const localDateFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: NEWS_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
});

function zonedParts(date: Date): LocalDateParts {
    const values = Object.fromEntries(
        localDateFormatter.formatToParts(date).map((part) => [part.type, part.value]),
    );
    return {
        year: Number(values.year),
        month: Number(values.month),
        day: Number(values.day),
        hour: Number(values.hour),
        minute: Number(values.minute),
        second: Number(values.second),
    };
}

function zonedDateToUtc(parts: LocalDateParts): Date {
    const utcGuess = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
    const atGuess = zonedParts(new Date(utcGuess));
    const representedAsUtc = Date.UTC(atGuess.year, atGuess.month - 1, atGuess.day, atGuess.hour, atGuess.minute, atGuess.second);
    return new Date(utcGuess - (representedAsUtc - utcGuess));
}

export function calculateNextNewsRun(
    frequency: NewsUpdateFrequency,
    hour: number,
    minute: number,
    dayOfWeek = 0,
    from = new Date(),
): Date | null {
    if (frequency === 'MANUAL') return null;
    const current = zonedParts(from);
    for (let dayOffset = 0; dayOffset <= 8; dayOffset += 1) {
        const date = new Date(Date.UTC(current.year, current.month - 1, current.day + dayOffset));
        if (frequency === 'WEEKLY' && date.getUTCDay() !== dayOfWeek) continue;
        const candidate = zonedDateToUtc({
            year: date.getUTCFullYear(),
            month: date.getUTCMonth() + 1,
            day: date.getUTCDate(),
            hour,
            minute,
            second: 0,
        });
        if (candidate.getTime() > from.getTime() + 1_000) return candidate;
    }
    return null;
}

@Injectable()
export class NewsSyncService {
    private readonly logger = new Logger(NewsSyncService.name);
    private running = false;
    private readonly circuit = new Map<string, { failures: number; openUntil: number }>();

    constructor(
        private readonly prisma: PrismaService,
        private readonly fetcher: NewsFetcherService,
        private readonly slotsService: NewsSlotsService,
    ) {
        this.ensureDefaults().catch((error) =>
            this.logger.warn(`No se pudieron preparar los defaults de Noticias: ${error?.message}`),
        );
    }

    /** Independent daily job. The minute tick makes its hour editable in Admin. */
    @Cron('* * * * *', {
        name: 'news-daily-sync',
        timeZone: NEWS_TIME_ZONE,
    })
    async dispatchDailyUpdates() {
        await this.dispatchFrequencyIfDue('DAILY');
    }

    /** Independent weekly job. It never replaces or delays the daily group. */
    @Cron('* * * * *', {
        name: 'news-weekly-sync',
        timeZone: NEWS_TIME_ZONE,
    })
    async dispatchWeeklyUpdates() {
        await this.dispatchFrequencyIfDue('WEEKLY');
    }

    private async dispatchFrequencyIfDue(frequency: 'DAILY' | 'WEEKLY') {
        if (this.running) return;
        const due = await this.prisma.newsCategory.findMany({
            where: {
                isActive: true,
                updateFrequency: frequency,
                nextUpdateAt: { lte: new Date() },
            },
            orderBy: { nextUpdateAt: 'asc' },
        });
        if (!due.length) return;

        // A due frequency always processes the complete frequency group. This
        // prevents the old "one category per day" behavior.
        await this.syncFrequency(frequency);
    }

    async runManual(request: ManualSyncRequest) {
        switch (request.scope) {
            case 'ALL': {
                const daily = await this.syncFrequency('DAILY');
                const weekly = await this.syncFrequency('WEEKLY');
                return { scope: 'ALL', runs: [daily, weekly] };
            }
            case 'DAILY':
                return this.syncFrequency('DAILY');
            case 'WEEKLY':
                return this.syncFrequency('WEEKLY');
            case 'CATEGORY': {
                if (!request.categoryId) throw new BadRequestException('Falta categoryId');
                const category = await this.prisma.newsCategory.findUnique({ where: { id: request.categoryId } });
                if (!category) throw new NotFoundException('Categoría no encontrada');
                return this.syncFrequency(category.updateFrequency as NewsUpdateFrequency, [category.id]);
            }
            case 'SOURCE': {
                if (!request.sourceId) throw new BadRequestException('Falta sourceId');
                const source = await this.prisma.newsSource.findUnique({
                    where: { id: request.sourceId },
                    include: { categoryLinks: { where: { isActive: true }, select: { categoryId: true } } },
                });
                if (!source) throw new NotFoundException('Fuente no encontrada');
                const ids = source.categoryLinks.map((link) => link.categoryId);
                return this.syncFrequency('MANUAL', ids, request.sourceId);
            }
            default:
                throw new BadRequestException('Alcance de actualización inválido');
        }
    }

    async syncFrequency(
        frequency: NewsUpdateFrequency,
        categoryIds?: string[],
        sourceId?: string,
    ) {
        if (this.running) return { status: 'SKIPPED', reason: 'Ya hay una sincronización en curso' };
        this.running = true;
        const categories = await this.prisma.newsCategory.findMany({
            where: {
                isActive: true,
                ...(categoryIds?.length ? { id: { in: categoryIds } } : {}),
                ...(frequency === 'DAILY' || frequency === 'WEEKLY' ? { updateFrequency: frequency } : {}),
            },
            include: { sourceLinks: { include: { source: true } } },
            orderBy: { displayOrder: 'asc' },
        });
        const sources = sourceId
            ? await this.prisma.newsSource.findMany({
                where: { id: sourceId, isActive: true },
                include: { categoryLinks: { where: { isActive: true }, include: { category: true } } },
            })
            : await this.prisma.newsSource.findMany({
                where: {
                    isActive: true,
                    categoryLinks: { some: { categoryId: { in: categories.map((category) => category.id) } } },
                },
                include: { categoryLinks: { where: { isActive: true }, include: { category: true } } },
            });
        const log = await this.prisma.newsSyncLog.create({
            data: {
                frequency,
                categoriesProcessed: JSON.stringify(categories.map((category) => category.slug)),
                sourcesProcessed: JSON.stringify(sources.map((source) => source.name)),
            },
        });

        const failedSources: string[] = [];
        let articlesFound = 0;
        let articlesCreated = 0;
        let articlesUpdated = 0;
        let duplicatesDetected = 0;
        const collected: Array<{ item: RawNewsItem; source: any; category: any }> = [];
        const categoryMap = new Map(categories.map((category) => [category.id, category]));

        try {
            for (const source of sources) {
                if (this.isCircuitOpen(source.id)) {
                    failedSources.push(`${source.name}: circuito abierto`);
                    continue;
                }
                try {
                    const items = await this.fetchWithRetry(source);
                    articlesFound += items.length;
                    this.circuit.delete(source.id);
                    await this.prisma.newsSource.update({
                        where: { id: source.id },
                        data: { lastSuccessfulSync: new Date(), lastError: null },
                    });
                    for (const item of items) {
                        const category = this.classify(item, source, categoryMap);
                        if (category) collected.push({ item, source, category });
                    }
                } catch (error: any) {
                    const message = error?.message || 'Error de fuente';
                    failedSources.push(`${source.name}: ${message}`);
                    this.registerSourceFailure(source.id);
                    await this.prisma.newsSource.update({
                        where: { id: source.id },
                        data: { lastError: message.slice(0, 500) },
                    }).catch(() => undefined);
                }
                // Small global pacing prevents bursts against RSS providers.
                await new Promise((resolve) => setTimeout(resolve, SOURCE_RATE_LIMIT_DELAY_MS));
            }

            const result = await this.persistArticles(collected, categories);
            articlesCreated = result.created;
            articlesUpdated = result.updated;
            duplicatesDetected = result.duplicates;

            for (const category of categories) {
                const topArticles = await this.prisma.newsArticle.findMany({
                    where: {
                        categoryId: category.id,
                        isActive: true,
                        isPublished: true,
                        status: 'PUBLISHED',
                    },
                    orderBy: [
                        { relevanceScore: 'desc' },
                        { publishedAt: 'desc' },
                    ],
                    take: 5,
                    select: { id: true },
                });
                await this.slotsService.replaceAutomaticSlots(category.id, topArticles.map((article) => article.id));
                await this.prisma.newsCategory.update({
                    where: { id: category.id },
                    data: {
                        lastUpdatedAt: new Date(),
                        nextUpdateAt: calculateNextNewsRun(
                            category.updateFrequency as NewsUpdateFrequency,
                            category.updateHour,
                            category.updateMinute,
                            category.updateDayOfWeek,
                            new Date(),
                        ),
                    },
                });
            }

            const status = failedSources.length
                ? (articlesFound || articlesCreated ? 'PARTIAL_SUCCESS' : 'FAILED')
                : 'SUCCESS';
            await this.prisma.newsSyncLog.update({
                where: { id: log.id },
                data: {
                    finishedAt: new Date(),
                    articlesFound,
                    articlesCreated,
                    articlesUpdated,
                    duplicatesDetected,
                    failedSources: JSON.stringify(failedSources),
                    status,
                },
            });
            return { id: log.id, status, articlesFound, articlesCreated, articlesUpdated, duplicatesDetected, failedSources };
        } catch (error: any) {
            const message = error?.message || 'Error inesperado durante la sincronización';
            await this.prisma.newsSyncLog.update({
                where: { id: log.id },
                data: {
                    finishedAt: new Date(),
                    articlesFound,
                    articlesCreated,
                    articlesUpdated,
                    duplicatesDetected,
                    failedSources: JSON.stringify(failedSources),
                    status: 'FAILED',
                    errorMessage: message.slice(0, 1000),
                },
            }).catch(() => undefined);
            this.logger.error(`Sincronización ${frequency} fallida: ${message}`);
            return { id: log.id, status: 'FAILED', errorMessage: message, failedSources };
        } finally {
            this.running = false;
        }
    }

    async getOverview() {
        await this.ensureDefaults();
        const [categories, sources, logs] = await Promise.all([
            this.prisma.newsCategory.findMany({ orderBy: { displayOrder: 'asc' } }),
            this.prisma.newsSource.findMany({
                orderBy: [{ isActive: 'desc' }, { priority: 'desc' }, { name: 'asc' }],
                include: { categoryLinks: { include: { category: { select: { name: true, slug: true } } } } },
            }),
            this.prisma.newsSyncLog.findMany({ orderBy: { startedAt: 'desc' }, take: 30 }),
        ]);
        const formatLog = (log: any) => ({
            ...log,
            categoriesProcessed: parseJsonList(log.categoriesProcessed),
            sourcesProcessed: parseJsonList(log.sourcesProcessed),
            failedSources: parseJsonList(log.failedSources),
        });
        const formattedLogs = logs.map(formatLog);
        const summarize = (frequency: string) => {
            const matching = formattedLogs.find((log) => log.frequency === frequency);
            const group = categories.filter((category) => category.updateFrequency === frequency && category.isActive);
            return {
                frequency,
                status: matching?.status || 'PENDING',
                lastExecutionAt: matching?.finishedAt || matching?.startedAt || null,
                nextExecutionAt: group.map((category) => category.nextUpdateAt).filter(Boolean).sort()[0] || null,
            };
        };
        return {
            timeZone: NEWS_TIME_ZONE,
            daily: summarize('DAILY'),
            weekly: summarize('WEEKLY'),
            categories,
            sources,
            logs: formattedLogs,
        };
    }

    async updateCategorySchedule(id: string, data: any) {
        const category = await this.prisma.newsCategory.findUnique({ where: { id } });
        if (!category) throw new NotFoundException('Categoría no encontrada');
        const frequency = String(data.updateFrequency || category.updateFrequency).toUpperCase() as NewsUpdateFrequency;
        if (!['DAILY', 'WEEKLY', 'MANUAL'].includes(frequency)) {
            throw new BadRequestException('Frecuencia inválida');
        }
        const hour = Number(data.updateHour ?? category.updateHour);
        const minute = Number(data.updateMinute ?? category.updateMinute);
        const dayOfWeek = Number(data.updateDayOfWeek ?? category.updateDayOfWeek);
        if (!Number.isInteger(hour) || hour < 0 || hour > 23 || !Number.isInteger(minute) || minute < 0 || minute > 59) {
            throw new BadRequestException('Horario inválido');
        }
        if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
            throw new BadRequestException('Día semanal inválido');
        }
        return this.prisma.newsCategory.update({
            where: { id },
            data: {
                updateFrequency: frequency,
                updateHour: hour,
                updateMinute: minute,
                updateDayOfWeek: dayOfWeek,
                isActive: data.isActive === undefined ? category.isActive : Boolean(data.isActive),
                nextUpdateAt: calculateNextNewsRun(frequency, hour, minute, dayOfWeek),
            },
        });
    }

    async getSources() {
        return this.prisma.newsSource.findMany({
            orderBy: [{ isActive: 'desc' }, { priority: 'desc' }, { name: 'asc' }],
            include: { categoryLinks: { include: { category: { select: { id: true, name: true, slug: true } } } } },
        });
    }

    async updateSource(id: string, data: any) {
        const source = await this.prisma.newsSource.findUnique({ where: { id } });
        if (!source) throw new NotFoundException('Fuente no encontrada');
        const baseUrl = data.baseUrl === undefined ? source.baseUrl : data.baseUrl;
        const rssUrl = data.rssUrl === undefined ? source.rssUrl : data.rssUrl;
        const apiUrl = data.apiUrl === undefined ? source.apiUrl : data.apiUrl;
        this.validateOptionalHttpUrl(baseUrl, 'baseUrl');
        this.validateOptionalHttpUrl(rssUrl, 'rssUrl');
        this.validateOptionalHttpUrl(apiUrl, 'apiUrl');
        return this.prisma.newsSource.update({
            where: { id },
            data: {
                baseUrl,
                apiUrl,
                url: data.url ?? undefined,
                rssUrl,
                apiType: data.apiType ?? undefined,
                priority: data.priority === undefined ? undefined : Math.max(0, Number(data.priority)),
                reliabilityScore: data.reliabilityScore === undefined ? undefined : clamp(Number(data.reliabilityScore)),
                isActive: data.isActive === undefined ? undefined : Boolean(data.isActive),
                country: data.country ?? undefined,
                language: data.language ?? undefined,
            },
        });
    }

    async createSource(data: any) {
        const name = String(data.name || '').trim();
        const baseUrl = String(data.baseUrl || '').trim();
        const rssUrl = data.rssUrl ? String(data.rssUrl).trim() : undefined;
        const apiUrl = data.apiUrl ? String(data.apiUrl).trim() : undefined;
        if (!name || !baseUrl) throw new BadRequestException('Nombre y baseUrl son obligatorios');
        this.validateOptionalHttpUrl(baseUrl, 'baseUrl');
        this.validateOptionalHttpUrl(rssUrl, 'rssUrl');
        this.validateOptionalHttpUrl(apiUrl, 'apiUrl');
        if (!rssUrl && !apiUrl && data.apiType !== 'scraper') {
            throw new BadRequestException('La fuente debe tener RSS, API o apiType scraper');
        }
        const categoryIds = Array.isArray(data.categoryIds) ? data.categoryIds.filter(Boolean) : [];
        const categories = await this.prisma.newsCategory.findMany({ where: { id: { in: categoryIds } }, select: { id: true } });
        return this.prisma.newsSource.create({
            data: {
                name,
                apiType: data.apiType || (rssUrl ? 'rss' : 'api'),
                baseUrl,
                apiUrl,
                url: data.url || baseUrl,
                rssUrl,
                country: data.country || 'GLOBAL',
                language: data.language || 'es',
                priority: Math.max(0, Number(data.priority || 0)),
                reliabilityScore: clamp(Number(data.reliabilityScore ?? 50)),
                isActive: data.isActive !== false,
                categoryLinks: {
                    create: categories.map((category) => ({
                        categoryId: category.id,
                        priority: Number(data.categoryPolicies?.[category.id]?.priority ?? data.priority ?? 0),
                        reliabilityScore: clamp(Number(data.categoryPolicies?.[category.id]?.reliabilityScore ?? data.reliabilityScore ?? 50)),
                    })),
                },
            },
            include: { categoryLinks: true },
        });
    }

    async updateSourceCategoryPolicy(sourceId: string, categoryId: string, data: any) {
        const [source, category] = await Promise.all([
            this.prisma.newsSource.findUnique({ where: { id: sourceId }, select: { id: true } }),
            this.prisma.newsCategory.findUnique({ where: { id: categoryId }, select: { id: true } }),
        ]);
        if (!source || !category) throw new NotFoundException('Fuente o categoría no encontrada');
        return this.prisma.newsSourceCategory.upsert({
            where: { sourceId_categoryId: { sourceId, categoryId } },
            update: {
                priority: data.priority === undefined ? undefined : Math.max(0, Number(data.priority)),
                reliabilityScore: data.reliabilityScore === undefined ? undefined : clamp(Number(data.reliabilityScore)),
                isActive: data.isActive === undefined ? undefined : Boolean(data.isActive),
            },
            create: {
                sourceId,
                categoryId,
                priority: Math.max(0, Number(data.priority ?? 0)),
                reliabilityScore: clamp(Number(data.reliabilityScore ?? 50)),
                isActive: data.isActive !== false,
            },
        });
    }

    private validateOptionalHttpUrl(value: unknown, field: string) {
        if (!value) return;
        try {
            const parsed = new URL(String(value));
            if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error();
        } catch {
            throw new BadRequestException(`${field} inválida`);
        }
    }

    private async ensureDefaults() {
        await this.slotsService.seedCategoriesAndSlots();
        const categories = new Map<string, any>();
        for (const definition of DEFAULT_NEWS_CATEGORIES) {
            const category = await this.prisma.newsCategory.upsert({
                where: { slug: definition.slug },
                update: {
                    name: definition.name,
                    color: definition.color,
                    icon: definition.icon,
                    displayOrder: definition.displayOrder,
                },
                create: {
                    name: definition.name,
                    slug: definition.slug,
                    color: definition.color,
                    icon: definition.icon,
                    displayOrder: definition.displayOrder,
                    isActive: true,
                    updateFrequency: definition.updateFrequency,
                    updateHour: definition.updateHour,
                    updateMinute: definition.updateMinute,
                    updateDayOfWeek: definition.updateDayOfWeek,
                    nextUpdateAt: calculateNextNewsRun(definition.updateFrequency, definition.updateHour, definition.updateMinute, definition.updateDayOfWeek),
                },
            });
            categories.set(definition.slug, category);
            if (!category.nextUpdateAt && category.updateFrequency !== 'MANUAL') {
                await this.prisma.newsCategory.update({
                    where: { id: category.id },
                    data: {
                        updateFrequency: definition.updateFrequency,
                        updateHour: definition.updateHour,
                        updateMinute: definition.updateMinute,
                        updateDayOfWeek: definition.updateDayOfWeek,
                        nextUpdateAt: calculateNextNewsRun(
                            definition.updateFrequency,
                            definition.updateHour,
                            definition.updateMinute,
                            definition.updateDayOfWeek,
                        ),
                    },
                });
            }
        }

        for (const definition of DEFAULT_NEWS_SOURCES) {
            const existing = await this.prisma.newsSource.findUnique({ where: { name: definition.name } }) ||
                (definition.legacyNames?.length
                    ? await this.prisma.newsSource.findFirst({ where: { name: { in: definition.legacyNames } } })
                    : null);
            const source = existing
                ? await this.prisma.newsSource.update({
                    where: { id: existing.id },
                    // Existing values are administrator-owned. Defaults only fill
                    // the fields missing on legacy sources.
                    data: {
                        name: existing.name === definition.name ? undefined : definition.name,
                        apiType: existing.apiType || 'rss',
                        baseUrl: existing.baseUrl || definition.baseUrl,
                        apiUrl: existing.apiUrl || definition.apiUrl,
                        url: existing.url || definition.baseUrl,
                        rssUrl: existing.rssUrl || definition.rssUrl,
                    },
                })
                : await this.prisma.newsSource.create({
                    data: {
                        name: definition.name,
                        apiType: 'rss',
                        baseUrl: definition.baseUrl,
                        apiUrl: definition.apiUrl,
                        url: definition.baseUrl,
                        rssUrl: definition.rssUrl,
                        country: definition.country,
                        language: definition.language,
                        priority: definition.priority,
                        reliabilityScore: definition.reliabilityScore,
                        isActive: true,
                    },
                });
            for (const slug of definition.categories) {
                const category = categories.get(slug);
                if (!category) continue;
                const policy = definition.categoryPolicies[slug] || {
                    priority: definition.priority,
                    reliabilityScore: definition.reliabilityScore,
                    isActive: true,
                };
                const existingLink = await this.prisma.newsSourceCategory.findUnique({
                    where: { sourceId_categoryId: { sourceId: source.id, categoryId: category.id } },
                });
                if (!existingLink) {
                    await this.prisma.newsSourceCategory.create({
                        data: {
                            sourceId: source.id,
                            categoryId: category.id,
                            priority: policy.priority,
                            reliabilityScore: policy.reliabilityScore,
                            isActive: policy.isActive,
                        },
                    });
                }
            }
        }
    }

    private async fetchWithRetry(source: any): Promise<RawNewsItem[]> {
        let lastError: unknown;
        for (let attempt = 0; attempt <= SOURCE_RETRIES; attempt += 1) {
            try {
                return await this.fetcher.fetchConfiguredSource(source);
            } catch (error) {
                lastError = error;
                if (attempt < SOURCE_RETRIES) await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
            }
        }
        throw lastError || new Error('No se pudo consultar la fuente');
    }

    private isCircuitOpen(sourceId: string) {
        const state = this.circuit.get(sourceId);
        return Boolean(state && state.openUntil > Date.now());
    }

    private registerSourceFailure(sourceId: string) {
        const state = this.circuit.get(sourceId) || { failures: 0, openUntil: 0 };
        state.failures += 1;
        if (state.failures >= 3) state.openUntil = Date.now() + SOURCE_TIMEOUT_WINDOW_MS;
        this.circuit.set(sourceId, state);
    }

    private sourceCategoryPolicy(source: any, categoryId: string) {
        const link = (source.categoryLinks || []).find((item: any) => item.categoryId === categoryId);
        return {
            priority: Number(link?.priority ?? source.priority ?? 0),
            reliabilityScore: Number(link?.reliabilityScore ?? source.reliabilityScore ?? 50),
        };
    }

    private classify(item: RawNewsItem, source: any, categoryMap: Map<string, any>) {
        const links = (source.categoryLinks || [])
            // Only classify into categories participating in this run. This
            // keeps DAILY and WEEKLY completely independent even when a source
            // feeds both groups.
            .map((link: any) => categoryMap.get(link.categoryId))
            .filter(Boolean);
        if (!links.length) return null;
        const text = normalizeNewsTitle(`${item.title} ${item.summary} ${item.content}`);
        const scored = links.map((category: any) => ({
            category,
            score: (NEWS_CATEGORY_KEYWORDS[category.slug] || []).reduce(
                (total, keyword) => total + (text.includes(normalizeNewsTitle(keyword)) ? 1 : 0),
                0,
            ),
        })).sort((a: any, b: any) => b.score - a.score);
        return scored[0]?.category || links[0];
    }

    private async persistArticles(
        collected: Array<{ item: RawNewsItem; source: any; category: any }>,
        categories: any[],
    ) {
        let created = 0;
        let updated = 0;
        let duplicates = 0;
        const categoryIds = categories.map((category) => category.id);
        const recent = await this.prisma.newsArticle.findMany({
            where: {
                categoryId: { in: categoryIds },
                OR: [
                    { publishedAt: { gte: new Date(Date.now() - DEDUP_WINDOW_MS) } },
                    { createdAt: { gte: new Date(Date.now() - DEDUP_WINDOW_MS) } },
                ],
            },
            select: { id: true, url: true, canonicalUrl: true, title: true, normalizedTitle: true, eventFingerprint: true, categoryId: true, relevanceScore: true, publishedAt: true },
            take: 1500,
        });
        const candidates = [...recent];

        const ordered = [...collected].sort((first, second) =>
            (this.sourceCategoryPolicy(second.source, second.category.id).priority + this.sourceCategoryPolicy(second.source, second.category.id).reliabilityScore) -
            (this.sourceCategoryPolicy(first.source, first.category.id).priority + this.sourceCategoryPolicy(first.source, first.category.id).reliabilityScore),
        );

        for (const record of ordered) {
            const item = record.item;
            const normalizedUrl = normalizeNewsUrl(item.url);
            const normalizedTitle = normalizeNewsTitle(item.title);
            const tickers = this.extractTickers(`${item.title} ${item.summary} ${item.content}`);
            const fingerprint = eventFingerprint(item.title, tickers);
            const relevance = this.calculateRelevance(item, record.source, tickers, collected, record.category.id);
            const existing = candidates.find((article: any) =>
                (article.canonicalUrl === normalizedUrl || article.url === item.url || article.normalizedTitle === normalizedTitle ||
                    (article.eventFingerprint === fingerprint && titleSimilarity(article.title, item.title) >= 0.35) ||
                    sameNewsEvent(article.title, item.title) ||
                    titleSimilarity(article.title, item.title) >= 0.78),
            );

            if (existing) {
                duplicates += 1;
                const nextScore = Math.max(existing.relevanceScore || 0, relevance);
                await this.prisma.newsArticle.update({
                    where: { id: existing.id },
                    data: { relevanceScore: nextScore },
                });
                await this.prisma.newsArticleSource.upsert({
                    where: { articleId_url: { articleId: existing.id, url: item.url } },
                    update: { sourceName: record.source.name, sourceId: record.source.id },
                    create: { articleId: existing.id, sourceId: record.source.id, sourceName: record.source.name, url: item.url, isPrimary: false },
                });
                updated += 1;
                continue;
            }

            const publishedAt = this.safePublishedAt(item.publishedAt);
            const article = await this.prisma.newsArticle.create({
                data: {
                    url: item.url,
                    canonicalUrl: normalizedUrl,
                    normalizedTitle,
                    eventFingerprint: fingerprint,
                    relevanceScore: relevance,
                    title: item.title.slice(0, 500),
                    description: (item.summary || item.content || '').slice(0, 2000),
                    imageUrl: item.imageUrl,
                    sourceName: record.source.name,
                    sourceUrl: record.source.baseUrl || record.source.url,
                    publishedAt,
                    author: item.author,
                    status: 'PUBLISHED',
                    isPublished: true,
                    isActive: true,
                    categoryId: record.category.id,
                    sourceId: record.source.id,
                },
            });
            await this.prisma.newsArticleSource.create({
                data: { articleId: article.id, sourceId: record.source.id, sourceName: record.source.name, url: item.url, isPrimary: true },
            });
            candidates.push({ ...article, categoryId: record.category.id });
            created += 1;
        }
        return { created, updated, duplicates };
    }

    private safePublishedAt(value: Date) {
        if (!(value instanceof Date) || Number.isNaN(value.getTime())) return new Date();
        if (value.getTime() > Date.now() + 60 * 60 * 1000) return new Date();
        return value;
    }

    private extractTickers(text: string) {
        return [...new Set((text.match(/\b[A-Z]{2,5}\b/g) || []).filter((value) => !['THE', 'AND', 'FOR', 'USD', 'CEO', 'ETF'].includes(value)))].slice(0, 10);
    }

    private calculateRelevance(item: RawNewsItem, source: any, tickers: string[], allItems: Array<{ item: RawNewsItem; source: any; category: any }>, categoryId: string) {
        const ageHours = Math.max(0, (Date.now() - this.safePublishedAt(item.publishedAt).getTime()) / 3_600_000);
        const freshness = Math.max(0, 20 - ageHours);
        const text = normalizeNewsTitle(`${item.title} ${item.summary}`);
        const impactWords = ['fed', 'tasa', 'inflacion', 'inflación', 'earnings', 'resultado', 'quiebra', 'guerra', 'bitcoin', 'etf', 'pib', 'rate', 'acquisition', 'adquisicion'];
        const impact = impactWords.some((word) => text.includes(normalizeNewsTitle(word))) ? 30 : 15;
        const marketLeaderWords = ['apple', 'microsoft', 'nvidia', 'amazon', 'tesla', 'alphabet', 'meta', 'bitcoin', 'federal reserve', 'banco central europeo'];
        const marketLeaderBonus = marketLeaderWords.some((word) => text.includes(normalizeNewsTitle(word))) ? 12 : 0;
        const categoryPolicy = this.sourceCategoryPolicy(source, categoryId);
        const sourceWeight = (categoryPolicy.priority * 0.15) + (categoryPolicy.reliabilityScore * 0.15);
        const repetition = allItems.filter((other) => titleSimilarity(other.item.title, item.title) >= 0.45).length > 1 ? 10 : 0;
        return clamp(20 + sourceWeight + freshness + impact + marketLeaderBonus + Math.min(10, tickers.length * 2) + repetition);
    }
}
