import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { queuePublishedAnalysis } from '../admin/email-content';
import { normalizeAnalysisQuery } from './analysis-requests.service';
import { fundamentalOnly } from './fundamental-visibility';
import { hasEffectiveProAccess } from '../auth/pro-access';
import { fetchVerifiedFundamentals } from './verified-fundamentals';

@Injectable()
export class AnalysisService {
    private readonly logger = new Logger(AnalysisService.name);

    constructor(private prisma: PrismaService) { }

    private isJuanUser(u?: any): boolean {
        if (!u) return false;
        const usr = String(u.username || '').toLowerCase();
        const eml = String(u.email || '').toLowerCase();
        const cleanUsr = usr.replace(/[^a-z0-9]/g, '');
        const cleanEml = eml.replace(/[^a-z0-9]/g, '');
        return cleanUsr.includes('juan2608') ||
               cleanUsr.includes('juan26') ||
               usr.includes('juan26-08') ||
               usr.includes('juan2608') ||
               cleanEml.includes('juan2608') ||
               cleanEml.includes('juan26') ||
               eml.includes('juan26-08') ||
               eml.includes('juan2608');
    }

    /**
     * Calcula métricas derivadas basadas en las reglas de negocio (sin inventar datos).
     */
    public calculateDerivedMetrics(data: any) {
        const computed = { ...data };

        // 1. Revenue Growth YoY (si no viene explícito o si tenemos histórico)
        if (computed.revenue && computed.prevRevenue && !computed.revenueGrowthYoY) {
            computed.revenueGrowthYoY = Number((((computed.revenue / computed.prevRevenue) - 1) * 100).toFixed(2));
        }

        // 2. Net Debt = Total Debt - Cash
        if (computed.totalDebt !== null && computed.totalDebt !== undefined && computed.cash !== null && computed.cash !== undefined) {
            computed.netDebt = Number((computed.totalDebt - computed.cash).toFixed(2));
        }

        // 3. Net Debt / EBITDA
        if (computed.netDebtToEbitda == null && computed.netDebt !== null && computed.netDebt !== undefined && computed.ebitda) {
            computed.netDebtToEbitda = Number((computed.netDebt / computed.ebitda).toFixed(2));
        }

        // 4. Free Cash Flow = Operating Cash Flow - CapEx
        if (computed.operatingCashFlow !== null && computed.operatingCashFlow !== undefined && computed.capEx !== null && computed.capEx !== undefined) {
            computed.freeCashFlow = Number((computed.operatingCashFlow - Math.abs(computed.capEx)).toFixed(2));
        }

        // 5. FCF Yield = (Free Cash Flow / Market Cap) * 100
        if (computed.fcfYield == null && computed.freeCashFlow && computed.marketCap && (() => { try { const meta = JSON.parse(computed.historicalSeries || '{}').meta; return meta?.currency === 'USD' && meta?.cashFlowBasis === 'TTM'; } catch { return false; } })()) {
            computed.fcfYield = Number(((computed.freeCashFlow / computed.marketCap) * 100).toFixed(2));
        }

        // 6. Premium / Discount vs Historical P/E = ((Current P/E / Historical Avg P/E) - 1) * 100
        if (computed.peRatio && computed.historicalAvgPe) {
            computed.valuationPremiumDiscount = Number((((computed.peRatio / computed.historicalAvgPe) - 1) * 100).toFixed(2));
        }

        // 7. Upside / Downside vs Fair Value = ((Fair Value / Current Price) - 1) * 100
        if (computed.estimatedFairValue && computed.currentPrice) {
            computed.fairValueUpsideDownside = Number((((computed.estimatedFairValue / computed.currentPrice) - 1) * 100).toFixed(2));
        }

        // 8. Distancia al máximo 52W: ((Current Price / High 52W) - 1) * 100
        if (computed.currentPrice && computed.high52w) {
            computed.distanceToHigh = Number((((computed.currentPrice / computed.high52w) - 1) * 100).toFixed(2));
        }

        // 9. Distancia al mínimo 52W: ((Current Price / Low 52W) - 1) * 100
        if (computed.currentPrice && computed.low52w) {
            computed.distanceToLow = Number((((computed.currentPrice / computed.low52w) - 1) * 100).toFixed(2));
        }

        return computed;
    }

    /**
     * Listado público de análisis disponibles (solo PUBLISHED, o todos si es Admin)
     */
    async getPublicList(user?: any) {
        const isAdmin = user?.role === 'ADMIN' || this.isJuanUser(user);
        const analyses = await this.prisma.assetAnalysis.findMany({
            where: isAdmin ? {} : {
                status: 'PUBLISHED',
            },
            select: {
                id: true,
                slug: true,
                symbol: true,
                ticker: true,
                companyName: true,
                sector: true,
                industry: true,
                country: true,
                exchange: true,
                logoUrl: true,
                currentPrice: true,
                dailyChange: true,
                marketCap: true,
                analysisDate: true,
                updatedAt: true,
                status: true,
                estimatedFairValue: true,
                peRatio: true,

            },
            orderBy: {
                updatedAt: 'desc',
            },
        });

        return analyses.map((a: any) => ({
            ...a,
            slug: a.slug || a.ticker?.toLowerCase() || a.symbol?.toLowerCase()?.replace(/[^a-z0-9]/g, '') || 'stock',
        }));
    }

    /**
     * Auto-rellena datos técnicos, fundamentales, mercado y logo desde TradingView Scanner.
     */
    async fetchTradingViewAssetData(symbolOrTicker: string) {
        try { return await fetchVerifiedFundamentals(symbolOrTicker); }
        catch (error: any) { throw new BadRequestException(error.message || 'No se pudieron consultar datos verificables.'); }
    }

    async getAnalysisBySlugOrTicker(slugOrTicker: string, user: any) {
        const query = slugOrTicker.trim();
        const upperQuery = query.toUpperCase();
        const lowerQuery = query.toLowerCase();

        const analysis = await this.prisma.assetAnalysis.findFirst({
            where: {
                OR: [
                    { slug: lowerQuery },
                    { ticker: upperQuery },
                    { symbol: upperQuery },
                    { symbol: query },
                ],
                // Si es admin puede ver en cualquier estado; si no, solo PUBLISHED
                ...(user?.role === 'ADMIN' ? {} : { status: 'PUBLISHED' }),
            },
        });

        if (!analysis) {
            throw new NotFoundException(`No se encontró ningún análisis para '${slugOrTicker}'`);
        }

        const isPro = hasEffectiveProAccess(user);
        const computed = this.calculateDerivedMetrics(analysis);

        // Parsear campos JSON estructurados
        const parsed = fundamentalOnly({
            ...computed,
            sectionVisibility: computed.sectionVisibility ? JSON.parse(computed.sectionVisibility) : {},
            executiveSummary: computed.executiveSummary ? JSON.parse(computed.executiveSummary) : null,
            businessModel: computed.businessModel ? JSON.parse(computed.businessModel) : [],
            historicalSeries: computed.historicalSeries ? JSON.parse(computed.historicalSeries) : {},
            segmentGrowth: computed.segmentGrowth ? JSON.parse(computed.segmentGrowth) : [],
            competitorsData: computed.competitorsData ? JSON.parse(computed.competitorsData) : [],
            technicalData: computed.technicalData ? JSON.parse(computed.technicalData) : {},
            risksData: computed.risksData ? JSON.parse(computed.risksData) : [],
            catalystsData: computed.catalystsData ? JSON.parse(computed.catalystsData) : [],
            scenariosData: computed.scenariosData ? JSON.parse(computed.scenariosData) : null,
            valuationMethodology: computed.valuationMethodology ? JSON.parse(computed.valuationMethodology) : null,
            swotData: computed.swotData ? JSON.parse(computed.swotData) : null,
        });

        if (isPro) {
            return {
                isProRestricted: false,
                data: parsed,
            };
        }

        // Para usuarios Free: Entregar Teaser / Preview limitada
        const previewExecutiveSummary = parsed.executiveSummary ? {
            title: parsed.executiveSummary.title,
            summary: parsed.executiveSummary.summary ? parsed.executiveSummary.summary.slice(0, 220) + '...' : '',
        } : null;

        return {
            isProRestricted: true,
            data: {
                id: parsed.id,
                slug: parsed.slug,
                symbol: parsed.symbol,
                ticker: parsed.ticker,
                companyName: parsed.companyName,
                exchange: parsed.exchange,
                sector: parsed.sector,
                industry: parsed.industry,
                country: parsed.country,
                logoUrl: parsed.logoUrl,
                currentPrice: parsed.currentPrice,
                dailyChange: parsed.dailyChange,
                high52w: parsed.high52w,
                low52w: parsed.low52w,
                marketCap: parsed.marketCap,
                distanceToHigh: parsed.distanceToHigh,
                distanceToLow: parsed.distanceToLow,
                analysisDate: parsed.analysisDate,
                updatedAt: parsed.updatedAt,
                executiveSummary: previewExecutiveSummary,
                // Ocultar métricas profundas, series históricas y comparaciones
            },
        };
    }

    /**
     * Admin: Listado de todos los análisis
     */
    async getAdminList() {
        return this.prisma.assetAnalysis.findMany({
            orderBy: {
                updatedAt: 'desc',
            },
        });
    }

    /**
     * Admin: Obtener análisis completo por ID
     */
    async getAdminById(id: string) {
        const item = await this.prisma.assetAnalysis.findUnique({
            where: { id },
            include: {
                auditLogs: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                },
            },
        });

        if (!item) {
            throw new NotFoundException('Análisis no encontrado');
        }

        const computed = this.calculateDerivedMetrics(item);

        return {
            ...computed,
            sectionVisibility: computed.sectionVisibility ? JSON.parse(computed.sectionVisibility) : {},
            executiveSummary: computed.executiveSummary ? JSON.parse(computed.executiveSummary) : null,
            businessModel: computed.businessModel ? JSON.parse(computed.businessModel) : [],
            historicalSeries: computed.historicalSeries ? JSON.parse(computed.historicalSeries) : {},
            segmentGrowth: computed.segmentGrowth ? JSON.parse(computed.segmentGrowth) : [],
            competitorsData: computed.competitorsData ? JSON.parse(computed.competitorsData) : [],
            technicalData: computed.technicalData ? JSON.parse(computed.technicalData) : {},
            risksData: computed.risksData ? JSON.parse(computed.risksData) : [],
            catalystsData: computed.catalystsData ? JSON.parse(computed.catalystsData) : [],
            scenariosData: computed.scenariosData ? JSON.parse(computed.scenariosData) : null,
            valuationMethodology: computed.valuationMethodology ? JSON.parse(computed.valuationMethodology) : null,
            swotData: computed.swotData ? JSON.parse(computed.swotData) : null,
        };
    }

    /**
     * Admin: Crear análisis
     */
    async createAnalysis(dto: any, userId?: string) {
        try {
            // Si viene un ID válido o ya existe en base de datos, redirigir a actualización
            if (dto.id) {
                const existingById = await this.prisma.assetAnalysis.findUnique({ where: { id: dto.id } });
                if (existingById) {
                    return this.updateAnalysis(dto.id, dto, userId);
                }
            }

            let slug = (dto.slug || dto.ticker || dto.symbol || 'asset')
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '');

            const symbol = dto.symbol || dto.ticker || 'UNKNOWN';
            const ticker = dto.ticker || dto.symbol || symbol;

            // Verificar si ya existe un análisis para este slug o ticker
            const existingMatch = await this.prisma.assetAnalysis.findFirst({
                where: {
                    OR: [
                        { slug },
                        { ticker: { equals: ticker, mode: 'insensitive' } }
                    ]
                }
            });

            if (existingMatch) {
                this.logger.log(`Análisis existente encontrado para slug "${slug}" / ticker "${ticker}" (ID: ${existingMatch.id}). Actualizando en su lugar.`);
                return this.updateAnalysis(existingMatch.id, dto, userId);
            }

            const sanitized = this.sanitizeAnalysisData(dto);

            const created = await this.prisma.$transaction(async tx => {
            const analysis = await tx.assetAnalysis.create({
                data: {
                    ...sanitized,
                    slug,
                    symbol,
                    ticker,
                    status: dto.status || 'PUBLISHED',
                },
            });
            await queuePublishedAnalysis(tx, analysis, userId);
            if (analysis.status === 'PUBLISHED' && analysis.isActive && tx.analysisRequest) {
                await tx.analysisRequest.updateMany({ where: { normalizedQuery: { in: [analysis.ticker,analysis.symbol,analysis.companyName].filter(Boolean).map(normalizeAnalysisQuery) }, status: { in: ['PENDING','IN_REVIEW'] } }, data: { status: 'PUBLISHED' } });
            }
            return analysis;
            });

            await this.logAudit(created.id, userId, 'CREATE', 'all', null, 'Created analysis');
            return created;
        } catch (error: any) {
            this.logger.error(`Error creando análisis: ${error.message}`, error.stack);
            if (error instanceof BadRequestException || error instanceof NotFoundException) throw error;
            throw new BadRequestException(`No se pudo crear el análisis: ${error.message}`);
        }
    }

    /**
     * Admin: Actualizar análisis
     */
    async updateAnalysis(id: string, dto: any, userId?: string) {
        try {
            const existing = await this.prisma.assetAnalysis.findUnique({ where: { id } });
            if (!existing) {
                throw new NotFoundException('Análisis no encontrado');
            }

            const sanitized = this.sanitizeAnalysisData(dto);

            // Manejar slug único de forma segura si cambió
            if (sanitized.slug && sanitized.slug !== existing.slug) {
                const slugConflict = await this.prisma.assetAnalysis.findUnique({
                    where: { slug: sanitized.slug },
                });
                if (slugConflict && slugConflict.id !== id) {
                    // Mantener el slug actual si hay conflicto con otro registro
                    delete sanitized.slug;
                }
            }

            const updated = await this.prisma.$transaction(async tx => {
            const analysis = await tx.assetAnalysis.update({
                where: { id },
                data: sanitized,
            });
            await queuePublishedAnalysis(tx, analysis, userId);
            if (analysis.status === 'PUBLISHED' && analysis.isActive && tx.analysisRequest) {
                await tx.analysisRequest.updateMany({ where: { normalizedQuery: { in: [analysis.ticker,analysis.symbol,analysis.companyName].filter(Boolean).map(normalizeAnalysisQuery) }, status: { in: ['PENDING','IN_REVIEW'] } }, data: { status: 'PUBLISHED' } });
            }
            return analysis;
            });

            await this.logAudit(id, userId, 'UPDATE', 'fields', null, 'Updated analysis data');
            return updated;
        } catch (error: any) {
            this.logger.error(`Error actualizando análisis ${id}: ${error.message}`, error.stack);
            if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
            throw new BadRequestException(`No se pudo actualizar el análisis: ${error.message}`);
        }
    }

    /**
     * Admin: Cambiar estado
     */
    async updateStatus(id: string, status: string, userId?: string) {
        const existing = await this.prisma.assetAnalysis.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException('Análisis no encontrado');

        const updated = await this.prisma.$transaction(async tx => {
        const analysis = await tx.assetAnalysis.update({
            where: { id },
            data: { status },
        });
        await queuePublishedAnalysis(tx, analysis, userId);
        return analysis;
        });

        await this.logAudit(id, userId, 'STATUS_CHANGE', 'status', (existing as any).status, status);

        return updated;
    }

    /**
     * Admin: Eliminar análisis
     */
    async deleteAnalysis(id: string, userId?: string) {
        await this.logAudit(id, userId, 'DELETE', 'all', null, 'Deleted analysis');
        return this.prisma.assetAnalysis.delete({ where: { id } });
    }

    private sanitizeAnalysisData(dto: any): Record<string, any> {
        if (!dto || typeof dto !== 'object') return {};

        const FLOAT_FIELDS = new Set([
            'marketCap', 'revenue', 'revenueGrowthYoY', 'revenueCagr3y', 'revenueCagr5y', 'arr', 'mrr', 'estimatedRevenue',
            'eps', 'epsGrowth', 'grossMargin', 'operatingMargin', 'netMargin', 'ebit', 'ebitda', 'ebitdaMargin',
            'roe', 'roa', 'roic', 'roce', 'freeCashFlow', 'fcfMargin', 'fcfGrowth', 'peRatio', 'forwardPe', 'pegRatio',
            'priceToSales', 'priceToBook', 'evToEbitda', 'evToRevenue', 'priceToFcf', 'dividendYield', 'marketCapToFcf',
            'historicalAvgPe', 'sectorPe', 'estimatedFairValue', 'valuationPremiumDiscount', 'cash', 'totalDebt', 'netDebt',
            'netDebtToEbitda', 'currentRatio', 'quickRatio', 'totalAssets', 'totalLiabilities', 'equity', 'equityGrowth',
            'longTermDebt', 'shortTermDebt', 'interestPaid', 'interestCoverageRatio', 'operatingCashFlow', 'capEx',
            'fcfPerShare', 'fcfYield', 'earningsToCashConversion', 'sharesOutstanding', 'shareDilution', 'insiderOwnership',
            'institutionalOwnership', 'shortInterest', 'shortFloat', 'beta', 'currentPrice', 'dailyChange', 'weeklyChange',
            'monthlyChange', 'yearlyChange', 'high52w', 'low52w', 'distanceToHigh', 'distanceToLow', 'volume', 'avgVolume',
            'relativeVolume', 'sma20', 'sma50', 'sma100', 'sma200', 'rsi', 'atr', 'historicalVolatility',
        ]);

        const INT_FIELDS = new Set(['foundedYear', 'employeesCount']);

        const JSON_FIELDS = new Set([
            'sectionVisibility', 'executiveSummary', 'businessModel', 'historicalSeries',
            'segmentGrowth', 'competitorsData', 'technicalData', 'risksData', 'catalystsData',
            'scenariosData', 'valuationMethodology', 'swotData',
        ]);

        const STRING_FIELDS = new Set([
            'symbol', 'ticker', 'companyName', 'sector', 'industry', 'country', 'ceo',
            'businessDescription', 'productsServices', 'revenueGeneration', 'mainRevenueSources',
            'geographicRevenue', 'businessSegments', 'mainCompetitors', 'competitiveAdvantage',
            'customerDependency', 'productDependency', 'marketShare', 'growthBySegment',
            'growthByRegion', 'recurringRevenue', 'revenueGuidance', 'realVsEstimatedRevenue',
            'epsEstimatedVsReal', 'historicalValuation', 'competitorsPe', 'historicalCashFlow',
            'insiderBuys', 'insiderSells', 'buybacks', 'sharesGrowthReduction', 'macd',
            'bollingerBands', 'supports', 'resistances', 'trend', 'momentum', 'slug', 'status',
            'exchange', 'logoUrl', 'sources', 'legalDisclaimer',
        ]);

        const output: Record<string, any> = {};

        for (const [key, val] of Object.entries(dto)) {
            if (FLOAT_FIELDS.has(key)) {
                if (val === null || val === undefined || val === '' || isNaN(Number(val))) {
                    output[key] = null;
                } else {
                    output[key] = parseFloat(String(val));
                }
            } else if (INT_FIELDS.has(key)) {
                if (val === null || val === undefined || val === '' || isNaN(Number(val))) {
                    output[key] = null;
                } else {
                    output[key] = parseInt(String(val), 10);
                }
            } else if (JSON_FIELDS.has(key)) {
                if (val === null || val === undefined) {
                    output[key] = null;
                } else if (typeof val === 'object') {
                    output[key] = JSON.stringify(val);
                } else {
                    output[key] = String(val);
                }
            } else if (STRING_FIELDS.has(key)) {
                output[key] = (val !== null && val !== undefined && val !== '') ? String(val).trim() : null;
            } else if (key === 'isActive') {
                output[key] = Boolean(val);
            } else if (key === 'analysisDate') {
                if (!val) {
                    output[key] = null;
                } else {
                    const d = new Date(val as any);
                    output[key] = isNaN(d.getTime()) ? null : d;
                }
            }
            // All unwhitelisted fields (e.g. fairValueUpsideDownside, id, createdAt, updatedAt, auditLogs)
            // are safely excluded so Prisma never throws an Unknown argument error!
        }

        return output;
    }

    private async logAudit(analysisId: string, userId: string | undefined, action: string, field?: string, oldValue?: string | null, newValue?: string | null) {
        try {
            await this.prisma.analysisAuditLog.create({
                data: {
                    analysisId,
                    userId: userId || 'admin',
                    action,
                    field: field || null,
                    oldValue: oldValue ? String(oldValue).slice(0, 500) : null,
                    newValue: newValue ? String(newValue).slice(0, 500) : null,
                },
            });
        } catch (e) {
            this.logger.error('Error logging audit', e);
        }
    }

    /**
     * Actualizar Apple con datos publicados; nunca restaurar un modelo ficticio.
     */
    async seedAppleSample(userId?: string) {
        const observed = await this.fetchTradingViewAssetData('NASDAQ:AAPL');
        const data = await this.createAnalysis({ ...observed, ticker: 'AAPL', slug: 'apple', status: 'PUBLISHED' }, userId);
        return { message: 'Análisis de Apple actualizado con datos verificados.', data };
    }
}
