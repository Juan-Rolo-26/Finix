import { deepenLesson, lessonReadTime, LESSON_REVISION } from './lesson-depth';
import { LESSON_DEPTH } from './lesson-depth.data';
import { TECHNICAL_IMAGES } from './technical-images.data';
import { Injectable, Logger, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateArticleDto, UpdateArticleDto } from './dto/article.dto';
import { CreateCategoryDto, CreateSubcategoryDto } from './dto/category.dto';
import { SEED_CATEGORIES, SEED_ARTICLES, SEED_LEARNING_PATHS } from './education-seed.data';
import { EDUCATION_BASELINE_ARTICLES } from './education-baseline.data';

const canonical = (v: any): any =>
    Array.isArray(v)
        ? v.map(canonical)
        : v && typeof v === 'object' && !(v instanceof Date)
        ? Object.fromEntries(Object.keys(v).sort().map(k => [k, canonical(v[k])]))
        : v;

// Extract the first safe Markdown image without sending article bodies in lists.
const withCoverImage = <T extends { content?: string }>(article: T) => {
    const { content, ...summary } = article;
    const image = content?.match(/!\[([^\]]*)\]\((\/images\/education\/[^\s)]+)\)/);
    return { ...summary, coverImage: image ? { src: image[2], alt: image[1] } : undefined };
};

const COMPARE_FIELDS = [
    'title', 'summary', 'content', 'level', 'isFeatured', 'readTimeMinutes',
    'order', 'formula', 'interactiveWidget', 'keyTakeaways', 'commonMistakes',
    'prosCons', 'practicalExample', 'sources'
];

@Injectable()
export class EducationService implements OnModuleInit {
    private readonly logger = new Logger(EducationService.name);

    constructor(private readonly prisma: PrismaService) {}

    async onModuleInit() {
        await this.seedDefaultsIfEmpty();
    }

    /**
     * Pre-populates the database with initial educational content if none exists.
     */
    async seedDefaultsIfEmpty() {
        try {
            this.logger.log('Sincronizando contenido educativo base en Finix...');

            // 1. Categories and Subcategories
            const categoryMap = new Map<string, string>();
            const subcategoryMap = new Map<string, string>();

            for (const cat of SEED_CATEGORIES) {
                const createdCat = await this.prisma.educationCategory.upsert({
                    where: { slug: cat.slug },
                    update: {},
                    create: {
                        name: cat.name,
                        slug: cat.slug,
                        description: cat.description,
                        icon: cat.icon,
                        order: cat.order,
                        isActive: true,
                    },
                });
                categoryMap.set(cat.slug, createdCat.id);

                for (const sub of cat.subcategories) {
                    const createdSub = await this.prisma.educationSubcategory.upsert({
                        where: { slug: sub.slug },
                        update: {},
                        create: {
                            categoryId: createdCat.id,
                            name: sub.name,
                            slug: sub.slug,
                            description: sub.description,
                            order: sub.order,
                            isActive: true,
                        },
                    });
                    subcategoryMap.set(sub.slug, createdSub.id);
                }
            }

            // 2. Articles
            const articleMap = new Map<string, string>();
            for (const art of SEED_ARTICLES) {
                const categoryId = categoryMap.get(art.categorySlug);
                if (!categoryId) continue;
                const subcategoryId = art.subcategorySlug ? subcategoryMap.get(art.subcategorySlug) : null;

                const existing = await this.prisma.educationArticle.findUnique({
                    where: { slug: art.slug },
                });

                let articleId: string;
                if (!existing) {
                    const created = await this.prisma.educationArticle.create({
                        data: {
                            title: art.title,
                            slug: art.slug,
                            summary: art.summary,
                            content: art.content,
                            categoryId,
                            subcategoryId,
                            level: art.level as any,
                            status: 'PUBLISHED',
                            isFeatured: art.isFeatured,
                            readTimeMinutes: art.readTimeMinutes,
                            order: art.order,
                            formula: art.formula,
                            interactiveWidget: art.interactiveWidget,
                            keyTakeaways: art.keyTakeaways as any,
                            commonMistakes: art.commonMistakes as any,
                            prosCons: art.prosCons as any,
                            practicalExample: art.practicalExample,
                            sources: art.sources as any,
                        },
                    });
                    articleId = created.id;
                } else {
                    articleId = existing.id;
                    // PRESERVAR ESTRICTAMENTE EDICIONES Y STATUS DEL TITULAR/ADMIN:
                    // 1. Si el artículo NO está en PUBLISHED (ej: DRAFT o ARCHIVED), no tocar.
                    if (existing.status === 'PUBLISHED') {
                        const illustration = TECHNICAL_IMAGES[art.slug];
                        // Add the missing illustration without replacing an editor's own text.
                        if (illustration && !existing.content.includes('![')) {
                            await this.prisma.educationArticle.update({ where: { id: existing.id }, data: { content: illustration + existing.content } });
                        }
                        const baselineArt = (EDUCATION_BASELINE_ARTICLES as any[]).find(b => b.slug === art.slug);
                        if (baselineArt) {
                            const dataToUpdate: Record<string, any> = {};
                            for (const field of COMPARE_FIELDS) {
                                const dbVal = canonical((existing as any)[field] ?? null);
                                const baseVal = canonical(baselineArt[field] ?? null);
                                const newVal = canonical((art as any)[field] ?? null);

                                const dbStr = JSON.stringify(dbVal);
                                const baseStr = JSON.stringify(baseVal);
                                const newStr = JSON.stringify(newVal);

                                // Si el campo en DB coincide con el baseline original (intacto, no modificado por admin)
                                // y el nuevo valor del seed es diferente, actualizar ese campo específico.
                                if (dbStr === baseStr && dbStr !== newStr) {
                                    dataToUpdate[field] = (art as any)[field];
                                }
                            }

                            if (Object.keys(dataToUpdate).length > 0) {
                                await this.prisma.educationArticle.update({
                                    where: { id: existing.id },
                                    data: dataToUpdate,
                                }).catch((err) => {
                                    this.logger.warn(`No se pudo actualizar artículo ${art.slug}: ${err.message}`);
                                });
                            }
                        }
                    }
                }
                articleMap.set(art.slug, articleId);
            }

            // Add a reviewed worked example once, retaining editor text and all unpublished records.
            for (const lesson of LESSON_DEPTH) {
                try {
                    await this.prisma.$transaction(async tx => {
                        const key = LESSON_REVISION + lesson.slug;
                        if (await tx.platformSetting.findUnique({ where: { key } })) return;
                        const article = await tx.educationArticle.findUnique({ where: { slug: lesson.slug } });
                        if (!article || article.status !== 'PUBLISHED') return;
                        const content = deepenLesson(lesson.slug, article.content);
                        await tx.educationArticle.updateMany({ where: { id: article.id, status: 'PUBLISHED', updatedAt: article.updatedAt },
                            data: { content, readTimeMinutes: lessonReadTime(content) } }).then(result => { if (!result.count) throw new Error('Article edited during enrichment'); });
                        await tx.platformSetting.create({ data: { key, value: JSON.stringify({ articleId: article.id, appliedAt: new Date().toISOString() }), description: 'Ejemplo didáctico añadido sin sustituir el texto del editor.' } });
                    });
                } catch (error) { this.logger.warn('Ejemplo educativo pendiente de sincronización: ' + lesson.slug); }
            }

            // 3. Learning Paths
            for (const path of SEED_LEARNING_PATHS) {
                const createdPath = await this.prisma.educationLearningPath.upsert({
                    where: { slug: path.slug },
                    update: {},
                    create: {
                        title: path.title,
                        slug: path.slug,
                        description: path.description,
                        level: path.level as any,
                        icon: path.icon,
                        order: path.order,
                        isActive: true,
                    },
                });

                for (let i = 0; i < path.articleSlugs.length; i++) {
                    const artSlug = path.articleSlugs[i];
                    const articleId = articleMap.get(artSlug);
                    if (!articleId) continue;

                    await this.prisma.educationLearningPathItem.upsert({
                        where: {
                            pathId_articleId: {
                                pathId: createdPath.id,
                                articleId,
                            },
                        },
                        update: {},
                        create: {
                            pathId: createdPath.id,
                            articleId,
                            order: i + 1,
                        },
                    });
                }
            }

            this.logger.log('Base de datos educativa poblada con éxito.');
        } catch (error) {
            this.logger.error('Error al inicializar contenido educativo:', error);
        }
    }

    // ─── CONSULTAS PÚBLICAS ──────────────────────────────────────────────────

    async getCategories() {
        return this.prisma.educationCategory.findMany({
            where: { isActive: true },
            orderBy: { order: 'asc' },
            include: {
                subcategories: {
                    where: { isActive: true },
                    orderBy: { order: 'asc' },
                    select: { id: true, slug: true, name: true, description: true, _count: { select: { articles: { where: { status: 'PUBLISHED' } } } } },
                },
                _count: {
                    select: { articles: { where: { status: 'PUBLISHED' } } },
                },
            },
        });
    }

    async getCategoryBySlug(slug: string) {
        const category = await this.prisma.educationCategory.findUnique({
            where: { slug },
            include: {
                subcategories: {
                    where: { isActive: true },
                    orderBy: { order: 'asc' },
                    include: {
                        articles: {
                            where: { status: 'PUBLISHED' },
                            orderBy: { order: 'asc' },
                            select: {
                                id: true,
                                slug: true,
                                title: true,
                                summary: true,
                        content: true,
                                level: true,
                                readTimeMinutes: true,
                                interactiveWidget: true,
                                isFeatured: true,
                            },
                        },
                    },
                },
                articles: {
                    where: { status: 'PUBLISHED' },
                    orderBy: [{ isFeatured: 'desc' }, { order: 'asc' }],
                    select: {
                        id: true,
                        slug: true,
                        title: true,
                        summary: true,
                        content: true,
                        level: true,
                        readTimeMinutes: true,
                        interactiveWidget: true,
                        isFeatured: true,
                        subcategory: { select: { id: true, name: true, slug: true } },
                    },
                },
            },
        });

        if (!category) throw new NotFoundException('Categoría no encontrada');
        return {
            ...category,
            articles: category.articles.map(withCoverImage),
            subcategories: category.subcategories.map(sub => ({
                ...sub, articles: sub.articles.map(withCoverImage),
            })),
        };
    }

    async getArticles(query: {
        search?: string;
        category?: string;
        subcategory?: string;
        level?: string;
        featured?: boolean;
        limit?: number;
        page?: number;
    }) {
        const page = Math.max(1, Number(query.page) || 1);
        const limit = Math.min(200, Math.max(1, Number(query.limit) || 100));
        const skip = (page - 1) * limit;

        const where: any = {
            status: 'PUBLISHED',
        };

        if (query.category) {
            where.category = { slug: query.category };
        }
        if (query.subcategory) {
            where.subcategory = { slug: query.subcategory };
        }
        if (query.level) {
            where.level = query.level;
        }
        if (query.featured) {
            where.isFeatured = true;
        }
        if (query.search?.trim()) {
            const rawTerm = query.search.trim();
            const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            const normalizedTerm = normalize(rawTerm);
            const terms = new Set<string>([rawTerm, normalizedTerm]);
            const lowerNorm = normalizedTerm.toLowerCase();

            if (lowerNorm === 'pe' || lowerNorm === 'p-e' || lowerNorm === 'p/e' || lowerNorm === 'per') {
                terms.add('PER');
                terms.add('P/E');
                terms.add('Price to Earnings');
                terms.add('precio beneficio');
            }
            if (lowerNorm.includes('media movil') || lowerNorm.includes('sma') || lowerNorm.includes('ema') || lowerNorm.includes('200') || lowerNorm.includes('20')) {
                terms.add('Medias Móviles');
                terms.add('SMA');
                terms.add('EMA');
                terms.add('media móvil');
                terms.add('media movil');
            }
            if (lowerNorm === 'rsi') {
                terms.add('RSI');
                terms.add('Fuerza Relativa');
                terms.add('Wilder');
            }
            if (lowerNorm === 'macd') {
                terms.add('MACD');
                terms.add('Convergencia/Divergencia');
            }
            if (lowerNorm === 'dcf') {
                terms.add('DCF');
                terms.add('Descuento de Flujos');
                terms.add('Fair Value');
            }
            if (lowerNorm === 'roic') {
                terms.add('ROIC');
                terms.add('Capital Invertido');
            }
            if (lowerNorm === 'cedear' || lowerNorm === 'cedears') {
                terms.add('CEDEAR');
                terms.add('CEDEARs');
                terms.add('ratio de conversión');
            }
            if (lowerNorm === 'mep' || lowerNorm === 'ccl') {
                terms.add('MEP');
                terms.add('CCL');
                terms.add('Dólar');
            }
            if (lowerNorm === 'bonos' || lowerNorm === 'tir' || lowerNorm === 'duration') {
                terms.add('Bonos');
                terms.add('TIR');
                terms.add('Duration');
            }

            const conditions: any[] = [];
            for (const t of terms) {
                conditions.push({ title: { contains: t, mode: 'insensitive' } });
                conditions.push({ summary: { contains: t, mode: 'insensitive' } });
                conditions.push({ content: { contains: t, mode: 'insensitive' } });
            }
            where.OR = conditions;
        }

        const [items, total] = await Promise.all([
            this.prisma.educationArticle.findMany({
                where,
                skip,
                take: limit,
                orderBy: [{ isFeatured: 'desc' }, { order: 'asc' }, { createdAt: 'desc' }],
                select: {
                    id: true,
                    slug: true,
                    title: true,
                    summary: true,
                    content: true,
                    formula: true,
                    level: true,
                    readTimeMinutes: true,
                    interactiveWidget: true,
                    isFeatured: true,
                    viewsCount: true,
                    category: { select: { id: true, name: true, slug: true, icon: true } },
                    subcategory: { select: { id: true, name: true, slug: true } },
                    createdAt: true,
                },
            }),
            this.prisma.educationArticle.count({ where }),
        ]);

        return {
            items: items.map(withCoverImage),
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getArticleBySlug(slug: string, userId?: string) {
        const article = await this.prisma.educationArticle.findUnique({
            where: { slug },
            include: {
                category: { select: { id: true, name: true, slug: true, icon: true } },
                subcategory: { select: { id: true, name: true, slug: true } },
                relatedTo: {
                    include: {
                        target: {
                            select: {
                                id: true,
                                slug: true,
                                title: true,
                                summary: true,
                                level: true,
                                readTimeMinutes: true,
                            },
                        },
                    },
                },
            },
        });

        if (!article || article.status !== 'PUBLISHED') {
            throw new NotFoundException('Artículo no encontrado');
        }

        // Increment view count asynchronously
        this.prisma.educationArticle.update({
            where: { id: article.id },
            data: { viewsCount: { increment: 1 } },
        }).catch(() => {});

        // Fetch surrounding articles in the same subcategory/category for next/previous navigation
        const siblings = await this.prisma.educationArticle.findMany({
            where: {
                categoryId: article.categoryId,
                subcategoryId: article.subcategoryId,
                status: 'PUBLISHED',
            },
            orderBy: { order: 'asc' },
            select: { id: true, slug: true, title: true, order: true },
        });

        const currentIndex = siblings.findIndex(s => s.id === article.id);
        const previous = currentIndex > 0 ? siblings[currentIndex - 1] : null;
        const next = currentIndex >= 0 && currentIndex < siblings.length - 1 ? siblings[currentIndex + 1] : null;

        // User progress if logged in (strictly read-only: no lastReadAt mutations on consultation)
        let userProgress: any = null;
        if (userId) {
            userProgress = await this.prisma.educationUserProgress.findUnique({
                where: {
                    userId_articleId: {
                        userId,
                        articleId: article.id,
                    },
                },
            });
        }

        return {
            ...article,
            relatedArticles: article.relatedTo.map(r => r.target),
            navigation: { previous, next },
            userProgress,
        };
    }

    /**
     * Map of metric/tool keywords to article slugs.
     * Used by Finix frontend for inline ⓘ info icons!
     */
    async getGlossaryMap() {
        return {
            roic: 'que-es-el-roic',
            roic_wacc: 'que-es-el-roic',
            wacc: 'que-es-el-roic',
            pe: 'que-es-el-per',
            per: 'que-es-el-per',
            forward_pe: 'que-es-el-per',
            trailing_pe: 'que-es-el-per',
            rsi: 'que-es-el-rsi',
            macd: 'que-es-el-macd',
            fcf: 'que-es-el-flujo-de-caja-libre',
            free_cash_flow: 'que-es-el-flujo-de-caja-libre',
            flujo_de_caja: 'que-es-el-flujo-de-caja-libre',
            dcf: 'modelos-de-valuacion-dcf',
            fair_value: 'modelos-de-valuacion-dcf',
            valor_intrinseco: 'modelos-de-valuacion-dcf',
            tendencia: 'tendencias-alcista-bajista-lateral',
            tendencia_alcista: 'tendencias-alcista-bajista-lateral',
            higher_high: 'tendencias-alcista-bajista-lateral',
            higher_low: 'tendencias-alcista-bajista-lateral',
            soporte: 'soportes-resistencias-polaridad',
            resistencia: 'soportes-resistencias-polaridad',
            polaridad: 'soportes-resistencias-polaridad',
            velas: 'lectura-de-velas-japonesas',
            candlestick: 'lectura-de-velas-japonesas',
            martillo: 'lectura-de-velas-japonesas',
            ahorro_vs_inversion: 'que-es-invertir-vs-ahorrar',
            interes_compuesto: 'que-es-invertir-vs-ahorrar',
            inflacion: 'que-es-invertir-vs-ahorrar',
            stop_loss: 'gestion-del-riesgo-stop-loss-posicion',
            take_profit: 'gestion-del-riesgo-stop-loss-posicion',
            gestion_riesgo: 'gestion-del-riesgo-stop-loss-posicion',
            ev_ebitda: 'que-es-el-ev-ebitda',
            evebitda: 'que-es-el-ev-ebitda',
            evtoebitda: 'que-es-el-ev-ebitda',
            peg: 'que-es-el-peg-ratio',
            peg_ratio: 'que-es-el-peg-ratio',
            pegratio: 'que-es-el-peg-ratio',
            roe: 'que-es-el-roe-retorno-patrimonio',
            return_on_equity: 'que-es-el-roe-retorno-patrimonio',
            retorno_patrimonio: 'que-es-el-roe-retorno-patrimonio',
            sma: 'medias-moviles-sma-ema',
            ema: 'medias-moviles-sma-ema',
            medias_moviles: 'medias-moviles-sma-ema',
            sma50: 'medias-moviles-sma-ema',
            sma200: 'medias-moviles-sma-ema',
            bollinger: 'bandas-de-bollinger',
            bandas_bollinger: 'bandas-de-bollinger',
            cedear: 'que-son-los-cedears',
            cedears: 'que-son-los-cedears',
            etf: 'que-son-los-etfs',
            etfs: 'que-son-los-etfs',
            spy: 'que-son-los-etfs',
            tasas_interes: 'inflacion-y-tasas-de-interes',
            tasas: 'inflacion-y-tasas-de-interes',
            fed: 'inflacion-y-tasas-de-interes',
            politica_monetaria: 'inflacion-y-tasas-de-interes',
            dca: 'dollar-cost-averaging-dca',
            dollar_cost_averaging: 'dollar-cost-averaging-dca',
            drawdown: 'diversificacion-y-drawdown',
            max_drawdown: 'diversificacion-y-drawdown',
            diversificacion: 'diversificacion-y-drawdown',
        };
    }

    async getLearningPaths(userId?: string) {
        const paths = await this.prisma.educationLearningPath.findMany({
            where: { isActive: true },
            orderBy: { order: 'asc' },
            include: {
                items: {
                    orderBy: { order: 'asc' },
                    include: {
                        article: {
                            select: {
                                id: true,
                                slug: true,
                                title: true,
                                summary: true,
                                readTimeMinutes: true,
                                level: true,
                            },
                        },
                    },
                },
            },
        });

        if (!userId) return paths;

        // Attach completed status per user
        const progressList = await this.prisma.educationUserProgress.findMany({
            where: { userId, isCompleted: true },
            select: { articleId: true },
        });
        const completedSet = new Set(progressList.map(p => p.articleId));

        return paths.map(path => {
            const total = path.items.length;
            const completed = path.items.filter(item => completedSet.has(item.articleId)).length;
            const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
            return {
                ...path,
                progress: {
                    total,
                    completed,
                    percent,
                },
                items: path.items.map(item => ({
                    ...item,
                    isCompleted: completedSet.has(item.articleId),
                })),
            };
        });
    }

    async getLearningPathBySlug(slug: string, userId?: string) {
        const path = await this.prisma.educationLearningPath.findUnique({
            where: { slug },
            include: {
                items: {
                    orderBy: { order: 'asc' },
                    include: {
                        article: {
                            select: {
                                id: true,
                                slug: true,
                                title: true,
                                summary: true,
                                level: true,
                                readTimeMinutes: true,
                                category: { select: { name: true, slug: true } },
                            },
                        },
                    },
                },
            },
        });

        if (!path) throw new NotFoundException('Ruta de aprendizaje no encontrada');

        let completedSet = new Set<string>();
        if (userId) {
            const progress = await this.prisma.educationUserProgress.findMany({
                where: { userId, isCompleted: true },
                select: { articleId: true },
            });
            completedSet = new Set(progress.map(p => p.articleId));
        }

        const total = path.items.length;
        const completed = path.items.filter(item => completedSet.has(item.articleId)).length;

        return {
            ...path,
            progress: {
                total,
                completed,
                percent: total > 0 ? Math.round((completed / total) * 100) : 0,
            },
            items: path.items.map(item => ({
                ...item,
                isCompleted: completedSet.has(item.articleId),
            })),
        };
    }

    // ─── PROGRESO DEL USUARIO ────────────────────────────────────────────────

    async updateUserProgress(userId: string, slug: string, isCompleted: boolean) {
        const article = await this.prisma.educationArticle.findUnique({
            where: { slug },
            select: { id: true },
        });

        if (!article) throw new NotFoundException('Artículo no encontrado');

        return this.prisma.educationUserProgress.upsert({
            where: {
                userId_articleId: {
                    userId,
                    articleId: article.id,
                },
            },
            update: {
                isCompleted,
                completedAt: isCompleted ? new Date() : null,
                lastReadAt: new Date(),
            },
            create: {
                userId,
                articleId: article.id,
                isCompleted,
                completedAt: isCompleted ? new Date() : null,
                lastReadAt: new Date(),
            },
        });
    }

    async getUserProgress(userId: string) {
        const [readCount, completedCount, totalArticles] = await Promise.all([
            this.prisma.educationUserProgress.count({ where: { userId } }),
            this.prisma.educationUserProgress.count({ where: { userId, isCompleted: true } }),
            this.prisma.educationArticle.count({ where: { status: 'PUBLISHED' } }),
        ]);

        const recentProgress = await this.prisma.educationUserProgress.findMany({
            where: { userId },
            take: 10,
            orderBy: { lastReadAt: 'desc' },
            include: {
                article: {
                    select: {
                        id: true,
                        slug: true,
                        title: true,
                        summary: true,
                        level: true,
                        category: { select: { name: true, slug: true } },
                    },
                },
            },
        });

        return {
            stats: {
                readCount,
                completedCount,
                totalArticles,
                completionPercent: totalArticles > 0 ? Math.round((completedCount / totalArticles) * 100) : 0,
            },
            recent: recentProgress,
        };
    }

    // ─── ADMIN MANAGEMENT ────────────────────────────────────────────────────

    async adminGetArticles(params: { search?: string; status?: string; categoryId?: string; level?: string }) {
        const where: any = {};
        if (params.status) where.status = params.status;
        if (params.categoryId) where.categoryId = params.categoryId;
        if (params.level) where.level = params.level;
        if (params.search?.trim()) {
            where.OR = [
                { title: { contains: params.search.trim(), mode: 'insensitive' } },
                { slug: { contains: params.search.trim(), mode: 'insensitive' } },
            ];
        }

        return this.prisma.educationArticle.findMany({
            where,
            orderBy: [{ order: 'asc' }, { updatedAt: 'desc' }],
            include: {
                category: { select: { id: true, name: true, slug: true } },
                subcategory: { select: { id: true, name: true, slug: true } },
            },
        });
    }

    async adminCreateArticle(adminId: string, dto: CreateArticleDto) {
        const slug = dto.slug?.trim() || this.generateSlug(dto.title);

        const existing = await this.prisma.educationArticle.findUnique({ where: { slug } });
        if (existing) throw new BadRequestException(`Ya existe un artículo con el slug "${slug}".`);

        return this.prisma.educationArticle.create({
            data: {
                title: dto.title,
                slug,
                summary: dto.summary,
                content: dto.content,
                categoryId: dto.categoryId,
                subcategoryId: dto.subcategoryId || null,
                level: (dto.level as any) || 'BEGINNER',
                status: (dto.status as any) || 'PUBLISHED',
                isFeatured: dto.isFeatured ?? false,
                readTimeMinutes: dto.readTimeMinutes || 5,
                order: dto.order ?? 0,
                formula: dto.formula || null,
                interactiveWidget: dto.interactiveWidget || null,
                keyTakeaways: dto.keyTakeaways || [],
                commonMistakes: dto.commonMistakes || [],
                prosCons: dto.prosCons || null,
                practicalExample: dto.practicalExample || null,
                sources: dto.sources || [],
                seoTitle: dto.seoTitle || null,
                seoDescription: dto.seoDescription || null,
                createdById: adminId,
            },
        });
    }

    async adminUpdateArticle(id: string, dto: UpdateArticleDto) {
        const article = await this.prisma.educationArticle.findUnique({ where: { id } });
        if (!article) throw new NotFoundException('Artículo no encontrado');

        const slug = dto.slug?.trim() || article.slug;
        if (slug !== article.slug) {
            const existing = await this.prisma.educationArticle.findUnique({ where: { slug } });
            if (existing && existing.id !== id) {
                throw new BadRequestException(`El slug "${slug}" ya está en uso.`);
            }
        }

        return this.prisma.educationArticle.update({
            where: { id },
            data: {
                title: dto.title ?? article.title,
                slug,
                summary: dto.summary ?? article.summary,
                content: dto.content ?? article.content,
                categoryId: dto.categoryId ?? article.categoryId,
                subcategoryId: dto.subcategoryId !== undefined ? dto.subcategoryId : article.subcategoryId,
                level: (dto.level as any) ?? article.level,
                status: (dto.status as any) ?? article.status,
                isFeatured: dto.isFeatured ?? article.isFeatured,
                readTimeMinutes: dto.readTimeMinutes ?? article.readTimeMinutes,
                order: dto.order ?? article.order,
                formula: dto.formula !== undefined ? dto.formula : article.formula,
                interactiveWidget: dto.interactiveWidget !== undefined ? dto.interactiveWidget : article.interactiveWidget,
                keyTakeaways: dto.keyTakeaways ?? (article.keyTakeaways as any),
                commonMistakes: dto.commonMistakes ?? (article.commonMistakes as any),
                prosCons: dto.prosCons ?? (article.prosCons as any),
                practicalExample: dto.practicalExample !== undefined ? dto.practicalExample : article.practicalExample,
                sources: dto.sources ?? (article.sources as any),
                seoTitle: dto.seoTitle !== undefined ? dto.seoTitle : article.seoTitle,
                seoDescription: dto.seoDescription !== undefined ? dto.seoDescription : article.seoDescription,
            },
        });
    }

    async adminDeleteArticle(id: string) {
        return this.prisma.educationArticle.delete({ where: { id } });
    }

    async adminCreateCategory(dto: CreateCategoryDto) {
        const slug = dto.slug?.trim() || this.generateSlug(dto.name);
        return this.prisma.educationCategory.create({
            data: {
                name: dto.name,
                slug,
                description: dto.description || null,
                icon: dto.icon || 'BookOpen',
                order: dto.order ?? 0,
                isActive: dto.isActive ?? true,
            },
        });
    }

    async adminCreateSubcategory(dto: CreateSubcategoryDto) {
        const slug = dto.slug?.trim() || this.generateSlug(dto.name);
        return this.prisma.educationSubcategory.create({
            data: {
                categoryId: dto.categoryId,
                name: dto.name,
                slug,
                description: dto.description || null,
                order: dto.order ?? 0,
                isActive: dto.isActive ?? true,
            },
        });
    }

    private generateSlug(text: string): string {
        return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
}
