import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AnalysisService {
    private readonly logger = new Logger(AnalysisService.name);

    constructor(private prisma: PrismaService) { }

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
        if (computed.netDebt !== null && computed.netDebt !== undefined && computed.ebitda) {
            computed.netDebtToEbitda = Number((computed.netDebt / computed.ebitda).toFixed(2));
        }

        // 4. Free Cash Flow = Operating Cash Flow - CapEx
        if (computed.operatingCashFlow !== null && computed.operatingCashFlow !== undefined && computed.capEx !== null && computed.capEx !== undefined) {
            computed.freeCashFlow = Number((computed.operatingCashFlow - computed.capEx).toFixed(2));
        }

        // 5. FCF Yield = (Free Cash Flow / Market Cap) * 100
        if (computed.freeCashFlow && computed.marketCap) {
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
     * Listado público de análisis disponibles (solo PUBLISHED)
     */
    async getPublicList() {
        const analyses = await this.prisma.assetAnalysis.findMany({
            where: {
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
     * Obtener análisis individual por slug o ticker con control de acceso Pro.
     */
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

        const isPro = user?.role === 'ADMIN' || user?.plan === 'PRO' || user?.subscriptionStatus === 'ACTIVE';
        const computed = this.calculateDerivedMetrics(analysis);

        // Parsear campos JSON estructurados
        const parsed = {
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
        const slug = (dto.slug || dto.ticker || dto.symbol || 'asset')
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');

        const serialized = this.serializeJsonFields(dto);

        const created = await this.prisma.assetAnalysis.create({
            data: {
                ...serialized,
                slug,
                symbol: dto.symbol || dto.ticker || 'UNKNOWN',
                ticker: dto.ticker || dto.symbol,
                status: dto.status || 'DRAFT',
            },
        });

        await this.logAudit(created.id, userId, 'CREATE', 'all', null, 'Created analysis');

        return created;
    }

    /**
     * Admin: Actualizar análisis
     */
    async updateAnalysis(id: string, dto: any, userId?: string) {
        const existing = await this.prisma.assetAnalysis.findUnique({ where: { id } });
        if (!existing) {
            throw new NotFoundException('Análisis no encontrado');
        }

        const serialized = this.serializeJsonFields(dto);

        const updated = await this.prisma.assetAnalysis.update({
            where: { id },
            data: {
                ...serialized,
            },
        });

        await this.logAudit(id, userId, 'UPDATE', 'fields', null, 'Updated analysis data');

        return updated;
    }

    /**
     * Admin: Cambiar estado
     */
    async updateStatus(id: string, status: string, userId?: string) {
        const existing = await this.prisma.assetAnalysis.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException('Análisis no encontrado');

        const updated = await this.prisma.assetAnalysis.update({
            where: { id },
            data: { status },
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

    private serializeJsonFields(dto: any) {
        const clean = { ...dto };
        delete clean.id;
        delete clean.createdAt;
        delete clean.updatedAt;
        delete clean.auditLogs;

        const jsonFields = [
            'sectionVisibility',
            'executiveSummary',
            'businessModel',
            'historicalSeries',
            'segmentGrowth',
            'competitorsData',
            'technicalData',
            'risksData',
            'catalystsData',
            'scenariosData',
            'valuationMethodology',
            'swotData',
        ];

        for (const field of jsonFields) {
            if (clean[field] !== undefined) {
                if (typeof clean[field] === 'object' && clean[field] !== null) {
                    clean[field] = JSON.stringify(clean[field]);
                }
            }
        }

        return clean;
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
     * Sembrar o actualizar un análisis modelo de Apple Inc. (AAPL) de alta fidelidad
     */
    async seedAppleSample(userId?: string) {
        const sampleData = {
            symbol: 'NASDAQ:AAPL',
            ticker: 'AAPL',
            slug: 'apple',
            companyName: 'Apple Inc.',
            sector: 'Technology',
            industry: 'Consumer Electronics',
            country: 'United States',
            exchange: 'NASDAQ',
            logoUrl: 'https://companiesmarketcap.com/img/company-logos/64/AAPL.webp',
            foundedYear: 1976,
            ceo: 'Tim Cook',
            employeesCount: 161000,
            marketCap: 3450000000000, // $3.45T
            currentPrice: 228.50,
            dailyChange: 1.45,
            high52w: 237.23,
            low52w: 164.08,
            analysisDate: new Date(),
            status: 'PUBLISHED',
            sources: 'SEC Form 10-K (2024), Bloomberg Terminal, FactSet Research',
            legalDisclaimer: 'Este análisis tiene fines estrictamente informativos y educativos. No constituye asesoramiento financiero ni recomendación de compra o venta.',

            // 1. Empresa
            businessDescription: 'Apple Inc. diseña, manufactura y comercializa smartphones, computadoras personales, tabletas, wearables y accesorios, además de un ecosistema en rápida expansión de servicios de suscripción y pagos digitales.',
            productsServices: 'iPhone, Mac, iPad, Apple Watch, AirPods, Apple Vision Pro, App Store, Apple Music, iCloud, Apple Pay, AppleCare.',
            revenueGeneration: 'Venta de hardware premium con alto margen de contribución y monetización recurrente a través de servicios de software, suscripciones y comisiones del App Store.',
            mainRevenueSources: 'iPhone (52%), Servicios (25%), Wearables/Accesorios (9%), Mac (8%), iPad (6%).',
            geographicRevenue: 'América (42%), Europa (25%), Gran China (18%), Japón (7%), Resto de Asia-Pacífico (8%).',
            businessSegments: 'iPhone, Mac, iPad, Wearables Home & Accessories, Services.',
            mainCompetitors: 'Microsoft, Google (Alphabet), Samsung, Amazon, Meta, Xiaomi.',
            competitiveAdvantage: 'Ecosistema cerrado verticalmente integrado, costo de cambio extremadamente alto (High Switching Costs), pricing power absoluto y valor de marca global inigualable.',
            customerDependency: 'Muy baja concentración de clientes individuales; base instalada activa superior a 2.200 millones de dispositivos en todo el mundo.',
            productDependency: 'El iPhone continúa generando más del 50% de los ingresos totales, aunque el crecimiento acelerado de Servicios reduce gradualmente esta dependencia.',
            marketShare: 'Líder en smartphones premium globales (>70% de participación en rangos de precio superiores a $800 USD).',

            // 2. Ingresos y Crecimiento
            revenue: 391035000000, // $391B
            revenueGrowthYoY: 6.2,
            revenueCagr3y: 4.8,
            revenueCagr5y: 8.5,
            recurringRevenue: 'Servicios recurrentes anualizados superan los $96.000M con márgenes brutos superiores al 74%.',
            arr: 96000000000,
            revenueGuidance: 'Para el próximo trimestre fiscal, la gerencia proyecta un crecimiento de ingresos interanual en el rango medio de un dígito (5% - 7%).',
            estimatedRevenue: 412000000000,

            // 3. Rentabilidad
            eps: 6.70,
            epsGrowth: 10.2,
            grossMargin: 46.2,
            operatingMargin: 31.4,
            netMargin: 24.0,
            ebit: 123216000000,
            ebitda: 133500000000,
            ebitdaMargin: 34.1,
            roe: 156.0,
            roa: 28.5,
            roic: 38.2,
            roce: 42.0,
            freeCashFlow: 108800000000, // $108.8B
            fcfMargin: 27.8,
            fcfGrowth: 8.4,

            // 4. Valuación
            peRatio: 34.1,
            forwardPe: 29.8,
            pegRatio: 2.8,
            priceToSales: 8.8,
            priceToBook: 46.5,
            evToEbitda: 25.8,
            evToRevenue: 8.9,
            priceToFcf: 31.7,
            dividendYield: 0.44,
            historicalAvgPe: 26.5,
            sectorPe: 28.0,
            estimatedFairValue: 245.00,
            valuationPremiumDiscount: 28.7, // +28.7% premium vs histórico

            // 5. Balance
            cash: 65190000000, // $65.2B (cash + marketable securities)
            totalDebt: 106629000000,
            netDebt: 41439000000,
            netDebtToEbitda: 0.31,
            currentRatio: 1.07,
            quickRatio: 0.95,
            totalAssets: 364980000000,
            totalLiabilities: 308030000000,
            equity: 56950000000,
            longTermDebt: 95000000000,
            shortTermDebt: 11629000000,
            interestPaid: 3800000000,
            interestCoverageRatio: 32.4,

            // 6. Cash Flow
            operatingCashFlow: 118264000000,
            capEx: 9464000000,
            fcfPerShare: 7.15,
            fcfYield: 3.15,
            earningsToCashConversion: 115.0,

            // 7. Accionistas
            sharesOutstanding: 15204000000,
            shareDilution: -2.8, // Recompra activa reduce 2.8% de acciones al año
            insiderOwnership: 0.08,
            institutionalOwnership: 61.2,
            shortInterest: 1.15,
            shortFloat: 1.18,
            beta: 1.08,

            // 8. Técnico
            volume: 48200000,
            avgVolume: 52100000,
            relativeVolume: 0.92,
            sma20: 226.40,
            sma50: 221.80,
            sma100: 215.30,
            sma200: 198.50,
            rsi: 61.8,
            atr: 3.45,
            trend: 'Bullish',
            momentum: 'Strong',

            // JSON: Section Visibility
            sectionVisibility: {
                showHeader: true,
                showSummary: true,
                showCompany: true,
                showBusinessModel: true,
                showGrowth: true,
                showProfitability: true,
                showCashFlow: true,
                showBalance: true,
                showValuation: true,
                showFairValue: true,
                showOwnership: true,
                showCompetitors: true,
                showTechnical: true,
                showRisks: true,
                showCatalysts: true,
                showScenarios: true,
                showConclusion: true,
            },

            // JSON: Resumen Ejecutivo
            executiveSummary: {
                title: 'Liderazgo inquebrantable en hardware premium y expansión de márgenes vía Servicios',
                summary: 'Apple continúa consolidando el foso defensivo más amplio de la industria tecnológica. La combinación de una base instalada récord de más de 2.200 millones de dispositivos activos y un segmento de Servicios que ya representa más del 25% de los ingresos con un margen bruto superior al 74% garantiza una generación de flujo de caja libre masiva y consistente.',
                positivePoints: [
                    'Base instalada activa récord que impulsa ingresos recurrentes de alto margen.',
                    'Capacidad de retorno de capital a accionistas sin precedentes ($100B+ anuales en recompras).',
                    'Integración de Apple Intelligence impulsará un ciclo de renovación multianual del iPhone.',
                    'Balance sólido con ratio Deuda Neta / EBITDA de apenas 0.31x.'
                ],
                negativePoints: [
                    'Valuación exigente a más de 34x beneficios, cotizando con un 28% de prima sobre su promedio de 5 años.',
                    'Presión regulatoria global sobre las comisiones del App Store (DMA en Europa y DOJ en EE. UU.).',
                    'Desaceleración y competencia feroz de fabricantes locales en el mercado chino.'
                ],
                conclusion: 'Apple sigue siendo una de las empresas de mayor calidad en el mundo financiero. Aunque su múltiplo actual descuenta un escenario optimista a corto plazo, su capacidad de generación de efectivo y fidelidad de clientes justifican una posición central en carteras de largo plazo.'
            },

            // JSON: Modelo de Negocio
            businessModel: [
                { product: 'iPhone', description: 'Smartphones premium insignia con iOS y chips Apple Silicon A-series.', revenuePct: 52, growth: 3.5, margin: 38 },
                { product: 'Servicios', description: 'App Store, Apple Music, iCloud+, Apple TV+, Apple Pay, AppleCare.', revenuePct: 25, growth: 12.8, margin: 74.2 },
                { product: 'Wearables & Home', description: 'Apple Watch, AirPods, HomePod y Apple Vision Pro.', revenuePct: 9, growth: -1.5, margin: 32 },
                { product: 'Mac', description: 'Laptops MacBook Air/Pro y desktops con chips M-series.', revenuePct: 8, growth: 6.2, margin: 34 },
                { product: 'iPad', description: 'Tabletas de consumo y profesionales iPad Pro/Air.', revenuePct: 6, growth: 4.1, margin: 33 },
            ],

            // JSON: Series Históricas para Gráficos
            historicalSeries: {
                revenue: [
                    { period: '2020', value: 274515 },
                    { period: '2021', value: 365817 },
                    { period: '2022', value: 394328 },
                    { period: '2023', value: 383285 },
                    { period: '2024', value: 391035 },
                    { period: '2025 (E)', value: 416500 },
                ],
                revenueGrowthYoY: [
                    { period: '2021', value: 33.3 },
                    { period: '2022', value: 7.8 },
                    { period: '2023', value: -2.8 },
                    { period: '2024', value: 2.0 },
                    { period: '2025 (E)', value: 6.5 },
                ],
                eps: [
                    { period: '2020', value: 3.28 },
                    { period: '2021', value: 5.61 },
                    { period: '2022', value: 6.11 },
                    { period: '2023', value: 6.13 },
                    { period: '2024', value: 6.70 },
                    { period: '2025 (E)', value: 7.45 },
                ],
                margins: [
                    { period: '2020', grossMargin: 38.2, operatingMargin: 24.1, netMargin: 20.9 },
                    { period: '2021', grossMargin: 41.8, operatingMargin: 29.8, netMargin: 25.9 },
                    { period: '2022', grossMargin: 43.3, operatingMargin: 30.3, netMargin: 25.3 },
                    { period: '2023', grossMargin: 44.1, operatingMargin: 29.8, netMargin: 25.3 },
                    { period: '2024', grossMargin: 46.2, operatingMargin: 31.4, netMargin: 24.0 },
                ],
                cashFlow: [
                    { period: '2020', operatingCashFlow: 80674, capEx: 7309, freeCashFlow: 73365 },
                    { period: '2021', operatingCashFlow: 104038, capEx: 11085, freeCashFlow: 92953 },
                    { period: '2022', operatingCashFlow: 122151, capEx: 10708, freeCashFlow: 111443 },
                    { period: '2023', operatingCashFlow: 110543, capEx: 10959, freeCashFlow: 99584 },
                    { period: '2024', operatingCashFlow: 118264, capEx: 9464, freeCashFlow: 108800 },
                ],
                debt: [
                    { period: '2020', totalDebt: 112436, cash: 90943, netDebt: 21493 },
                    { period: '2021', totalDebt: 124719, cash: 62639, netDebt: 62080 },
                    { period: '2022', totalDebt: 120069, cash: 48304, netDebt: 71765 },
                    { period: '2023', totalDebt: 111088, cash: 61555, netDebt: 49533 },
                    { period: '2024', totalDebt: 106629, cash: 65190, netDebt: 41439 },
                ],
                pe: [
                    { period: '2020', pe: 33.5, historicalAvg: 26.5 },
                    { period: '2021', pe: 28.2, historicalAvg: 26.5 },
                    { period: '2022', pe: 21.8, historicalAvg: 26.5 },
                    { period: '2023', pe: 29.4, historicalAvg: 26.5 },
                    { period: '2024', pe: 34.1, historicalAvg: 26.5 },
                ],
                shares: [
                    { period: '2020', shares: 17500 },
                    { period: '2021', shares: 16701 },
                    { period: '2022', shares: 16215 },
                    { period: '2023', shares: 15785 },
                    { period: '2024', shares: 15204 },
                ],
            },

            // JSON: Competidores
            competitorsData: [
                { name: 'Apple Inc.', ticker: 'AAPL', revenue: 391, growth: 6.2, pe: 34.1, roic: 38.2, netMargin: 24.0, fcf: 108.8, marketCap: 3450 },
                { name: 'Microsoft', ticker: 'MSFT', revenue: 245, growth: 15.6, pe: 35.2, roic: 29.5, netMargin: 36.4, fcf: 74.1, marketCap: 3120 },
                { name: 'Alphabet', ticker: 'GOOGL', revenue: 307, growth: 13.8, pe: 23.4, roic: 27.1, netMargin: 27.2, fcf: 69.5, marketCap: 2050 },
                { name: 'Meta Platforms', ticker: 'META', revenue: 134, growth: 22.1, pe: 26.8, roic: 28.4, netMargin: 34.1, fcf: 48.2, marketCap: 1420 },
            ],

            // JSON: Datos Técnicos
            technicalData: {
                technicalSignal: 'BUY', // STRONG_SELL | SELL | NEUTRAL | BUY | STRONG_BUY
                technicalScore: 78,
                supports: [
                    { level: 220.00, strength: 'Fuerte', description: 'EMA de 50 días y soporte horizontal consolidado.' },
                    { level: 212.50, strength: 'Moderado', description: 'Gap alcista anterior y nivel de retroceso Fibonacci 38.2%.' },
                ],
                resistances: [
                    { level: 235.00, strength: 'Moderado', description: 'Resistencia intermedia cerca de máximos recientes.' },
                    { level: 237.23, strength: 'Clave', description: 'Máximo histórico (52W High).' },
                ],
                priceSeries: [
                    { date: 'May', price: 185, ma20: 182, ma50: 178, volume: 55 },
                    { date: 'Jun', price: 205, ma20: 198, ma50: 186, volume: 72 },
                    { date: 'Jul', price: 218, ma20: 212, ma50: 195, volume: 64 },
                    { date: 'Ago', price: 214, ma20: 216, ma50: 204, volume: 49 },
                    { date: 'Sep', price: 228.50, ma20: 226.40, ma50: 221.80, volume: 52 },
                ],
                rsiSeries: [
                    { date: 'May', rsi: 48 },
                    { date: 'Jun', rsi: 72 },
                    { date: 'Jul', rsi: 68 },
                    { date: 'Ago', rsi: 54 },
                    { date: 'Sep', rsi: 61.8 },
                ],
            },

            // JSON: Riesgos
            risksData: [
                {
                    title: 'Presión regulatoria antimonopolio en el App Store',
                    description: 'Demandas del Departamento de Justicia de EE. UU. y la aplicación del Digital Markets Act (DMA) en la Unión Europea podrían obligar a permitir tiendas de terceros y reducir las comisiones del 30%.',
                    severity: 'HIGH',
                    probability: 'Alta',
                    impact: 'Moderado'
                },
                {
                    title: 'Dependencia de la cadena de suministro en China',
                    description: 'Aunque la compañía continúa diversificando la producción hacia India y Vietnam, una escalada geopolítica entre EE. UU. y China plantearía interrupciones inmediatas en la manufactura.',
                    severity: 'MEDIUM',
                    probability: 'Media',
                    impact: 'Crítico'
                },
                {
                    title: 'Competencia agresiva en el mercado de smartphones en China',
                    description: 'El resurgimiento de marcas locales como Huawei en el segmento prémium chino ha comprimido la cuota de mercado regional de Apple en los últimos trimestres.',
                    severity: 'MEDIUM',
                    probability: 'Alta',
                    impact: 'Moderado'
                },
                {
                    title: 'Multiplicador de valuación sensible a tasas de interés',
                    description: 'Cotizando a 34x P/E, cualquier sorpresa en inflación o retraso en los recortes de tasas de interés de la Reserva Federal podría provocar una contracción de múltiplos.',
                    severity: 'LOW',
                    probability: 'Media',
                    impact: 'Bajo'
                }
            ],

            // JSON: Catalizadores
            catalystsData: [
                {
                    title: 'Ciclo de actualización masivo con Apple Intelligence',
                    description: 'La exclusividad de las nuevas funciones de IA generativa para modelos iPhone 15 Pro y serie iPhone 16 impulsará una tasa de actualización acelerada en la base instalada.',
                    horizon: '6 - 12 meses',
                    impact: 'Muy Positivo'
                },
                {
                    title: 'Expansión de servicios financieros y suscripciones',
                    description: 'Crecimiento de doble dígito sostenido en Apple Pay, suscripciones de contenido y computación en la nube propia con márgenes brutos récord superiores al 74%.',
                    horizon: '1 - 3 años',
                    impact: 'Alto'
                },
                {
                    title: 'Monetización de nuevos factores de forma (Spatial Computing)',
                    description: 'Evolución de visionOS y lanzamiento de versiones más accesibles del headset de realidad mixta para capturar el incipiente mercado de computación espacial.',
                    horizon: '2 - 4 años',
                    impact: 'Moderado'
                }
            ],

            // JSON: Escenarios Bull, Base, Bear
            scenariosData: {
                bull: {
                    title: 'Superciclo de IA y expansión de márgenes',
                    assumptions: 'Crecimiento de ingresos de 10% anual, Servicios superando el 30% del mix y margen bruto alcanzando 48%.',
                    expectedRevenue: '$435B',
                    expectedEps: '$8.20',
                    targetPe: '35x',
                    fairValue: '$287.00',
                    upside: '+25.6%'
                },
                base: {
                    title: 'Crecimiento maduro continuo y recompras masivas',
                    assumptions: 'Crecimiento de ingresos en el rango de 5% - 7%, estabilidad en cuota de mercado de iPhone y recompras de acciones continuadas al 2.5% anual.',
                    expectedRevenue: '$412B',
                    expectedEps: '$7.45',
                    targetPe: '32x',
                    fairValue: '$245.00',
                    upside: '+7.2%'
                },
                bear: {
                    title: 'Vientos en contra regulatorios y contracción de múltiplos',
                    assumptions: 'Impacto negativo de 15% en ingresos de App Store por fallos antimonopolio y pérdida de 3 puntos de cuota en China. Contracción de múltiplo P/E a promedio histórico de 24x.',
                    expectedRevenue: '$380B',
                    expectedEps: '$6.20',
                    targetPe: '25x',
                    fairValue: '$180.00',
                    upside: '-21.2%'
                }
            },

            // JSON: Metodología Fair Value
            valuationMethodology: {
                method: 'Descuento de Flujos de Caja (DCF) + Múltiplo de Salida',
                assumptions: 'WACC: 8.5%, Crecimiento Terminal: 3.5%, Proyección FCF a 10 años con CAGR de 7.2%.',
                result: '$245.00 por acción',
                date: new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }),
                notes: 'El modelo asume que el flujo de caja libre libre de Apple seguirá respaldado por recompras de acciones acumulativas y el aumento constante del margen bruto debido a la ponderación del segmento Servicios.'
            },

            // JSON: SWOT / DAFO
            swotData: {
                strengths: [
                    'Ecosistema cerrado con los costos de cambio más altos de la industria.',
                    'Poder de fijación de precios demostrado frente a la inflación.',
                    'Generación de más de $100.000 millones en flujo de caja libre anual.',
                    'Lealtad de clientes y retención superior al 95%.'
                ],
                weaknesses: [
                    'Dependencia superior al 50% de las ventas generadas por el iPhone.',
                    'Precio elevado de productos en mercados emergentes sensibles al poder adquisitivo.'
                ],
                opportunities: [
                    'Integración de Apple Intelligence en toda la gama de hardware.',
                    'Monetización creciente de pagos digitales y salud preventiva.',
                    'Aumento de penetración en India y el sudeste asiático.'
                ],
                threats: [
                    'Litigios antimonopolio globales sobre el control del App Store.',
                    'Disrupciones en cadenas de suministro en el este asiático.',
                    'Competencia agresiva con subsidios gubernamentales en el mercado chino.'
                ]
            }
        };

        const existing = await this.prisma.assetAnalysis.findFirst({
            where: {
                OR: [{ slug: 'apple' }, { ticker: 'AAPL' }],
            },
        });

        if (existing) {
            const updated = await this.updateAnalysis(existing.id, sampleData, userId);
            return { message: 'Sample Apple analysis updated', data: updated };
        } else {
            const created = await this.createAnalysis(sampleData, userId);
            return { message: 'Sample Apple analysis created', data: created };
        }
    }
}
