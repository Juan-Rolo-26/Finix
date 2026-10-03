import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { MarketService } from '../market/market.service';
import { AlertsService } from '../alerts/alerts.service';
import { resolveMarketIdentity } from '../market/market-symbol';
import { getCedearDefinition } from '../market/cedear.data';
import { WATCHLIST_CONFIG } from './watchlist.config';
import { isFreeAccessEnabled } from '../access/free-access';
import {
    CreateWatchlistDto,
    UpdateWatchlistDto,
    AddWatchlistItemDto,
    UpdateWatchlistItemDto,
    AddNoteDto,
    BatchImportDto,
    MoveCopyItemDto,
} from './dto/watchlist.dto';

@Injectable()
export class WatchlistService {
    private readonly logger = new Logger(WatchlistService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly marketService: MarketService,
        private readonly alertsService: AlertsService,
    ) { }

    // ── Helper: Obtenemos el plan efectivo del usuario ──
    async getUserPlan(userId: string): Promise<'FREE' | 'PRO' | 'CREATOR'> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { plan: true },
        });
        const plan = (user?.plan || 'FREE').toUpperCase();
        if (user && isFreeAccessEnabled()) return 'CREATOR';
        if (plan === 'CREATOR') return 'CREATOR';
        if (plan === 'PRO') return 'PRO';
        return 'FREE';
    }

    // ── Helper: Normalizador canónico de símbolos ──
    private normalizeSymbol(input: string): { clean: string; baseTicker: string; isCedear: boolean } {
        const clean = (input || '').trim().toUpperCase();
        const isCedear = clean.startsWith('BCBA:') || clean.startsWith('BYMA:') || !!getCedearDefinition(clean);
        const baseTicker = clean.replace(/^(BCBA:|BYMA:|NASDAQ:|NYSE:|AMEX:|BINANCE:)/, '');
        return { clean, baseTicker, isCedear };
    }

    // ── 1. LISTAS PERSONALES: Obtener listas del usuario ──
    async getWatchlists(userId: string) {
        const plan = await this.getUserPlan(userId);
        const limits = WATCHLIST_CONFIG[plan];

        const watchlists = await this.prisma.watchlist.findMany({
            where: { userId },
            orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
            include: {
                items: {
                    select: {
                        id: true,
                        symbol: true,
                        name: true,
                        market: true,
                        currency: true,
                        assetType: true,
                        targetPrice: true,
                        personalStatus: true,
                        notes: { select: { id: true } },
                    },
                },
            },
        });

        return {
            plan,
            limits,
            watchlists: watchlists.map((wl) => ({
                id: wl.id,
                name: wl.name,
                description: wl.description,
                color: wl.color,
                isDefault: wl.isDefault,
                isArchived: wl.isArchived,
                order: wl.order,
                itemCount: wl.items.length,
                symbols: wl.items.map((i) => i.symbol),
                createdAt: wl.createdAt,
                updatedAt: wl.updatedAt,
            })),
        };
    }

    // ── 2. CREAR LISTA ──
    async createWatchlist(userId: string, dto: CreateWatchlistDto) {
        const plan = await this.getUserPlan(userId);
        const limits = WATCHLIST_CONFIG[plan];

        const currentCount = await this.prisma.watchlist.count({
            where: { userId, isArchived: false },
        });

        if (currentCount >= limits.maxWatchlists) {
            throw new ForbiddenException({
                code: 'WATCHLIST_LIMIT_REACHED',
                message: `El plan ${plan} permite hasta ${limits.maxWatchlists} lista(s) de seguimiento. Pasate a PRO para listas ilimitadas.`,
                upgradeUrl: '/pro',
            });
        }

        const isFirst = currentCount === 0;

        const watchlist = await this.prisma.watchlist.create({
            data: {
                userId,
                name: dto.name.trim(),
                description: dto.description?.trim() || null,
                color: dto.color || 'emerald',
                isDefault: isFirst,
                order: currentCount,
            },
        });

        return watchlist;
    }

    // ── 3. ACTUALIZAR LISTA ──
    async updateWatchlist(userId: string, id: string, dto: UpdateWatchlistDto) {
        const existing = await this.prisma.watchlist.findFirst({
            where: { id, userId },
        });
        if (!existing) throw new NotFoundException('Lista de seguimiento no encontrada.');

        return this.prisma.watchlist.update({
            where: { id },
            data: {
                ...(dto.name !== undefined && { name: dto.name.trim() }),
                ...(dto.description !== undefined && { description: dto.description?.trim() || null }),
                ...(dto.color !== undefined && { color: dto.color }),
                ...(dto.isArchived !== undefined && { isArchived: dto.isArchived }),
                ...(dto.order !== undefined && { order: dto.order }),
            },
        });
    }

    // ── 4. IMPACTO PREVIO A ELIMINACIÓN ──
    async getDeleteImpact(userId: string, id: string) {
        const watchlist = await this.prisma.watchlist.findFirst({
            where: { id, userId },
            include: {
                items: {
                    include: {
                        notes: true,
                    },
                },
            },
        });

        if (!watchlist) throw new NotFoundException('Lista de seguimiento no encontrada.');

        const itemCount = watchlist.items.length;
        const notesCount = watchlist.items.reduce((acc, item) => acc + item.notes.length, 0);

        // Contar alertas activas asociadas a los tickers de esta lista
        const symbols = watchlist.items.map((i) => i.symbol);
        const alertsCount = await this.prisma.marketAlert.count({
            where: {
                userId,
                ticker: { in: symbols },
                status: 'ACTIVE',
            },
        });

        return {
            watchlistId: id,
            name: watchlist.name,
            itemCount,
            notesCount,
            alertsCount,
            items: watchlist.items.map((i) => ({ symbol: i.symbol, name: i.name })),
        };
    }

    // ── 5. ELIMINAR LISTA ──
    async deleteWatchlist(userId: string, id: string) {
        const existing = await this.prisma.watchlist.findFirst({
            where: { id, userId },
        });
        if (!existing) throw new NotFoundException('Lista de seguimiento no encontrada.');

        await this.prisma.watchlist.delete({ where: { id } });
        return { success: true, message: `Lista "${existing.name}" eliminada correctamente.` };
    }

    // ── 6. DETALLE ENRIQUECIDO DE UNA LISTA (Cotizaciones, Objetivos, Calendario, Portafolio) ──
    async getWatchlistDetail(userId: string, id: string) {
        const plan = await this.getUserPlan(userId);
        const limits = WATCHLIST_CONFIG[plan];

        const watchlist = await this.prisma.watchlist.findFirst({
            where: { id, userId },
            include: {
                items: {
                    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
                    include: {
                        notes: {
                            orderBy: { createdAt: 'desc' },
                        },
                    },
                },
            },
        });

        if (!watchlist) throw new NotFoundException('Lista de seguimiento no encontrada.');

        // 1. Obtener símbolos y pedir cotizaciones en vivo en lote
        const symbols = watchlist.items.map((item) => resolveMarketIdentity(item.symbol, item.market).symbol);
        let quotesMap = new Map<string, any>();

        if (symbols.length > 0) {
            try {
                const quotes = await this.marketService.getQuotes(symbols);
                quotes.forEach((q) => {
                    quotesMap.set(q.inputSymbol?.toUpperCase(), q);
                });
            } catch (err: any) {
                this.logger.warn(`Error al obtener cotizaciones para lista ${id}: ${err.message}`);
            }
        }

        // 2. Verificar tenencia en portafolio de forma privada para el usuario
        const userHoldings = await this.prisma.holding.findMany({
            where: {
                portfolio: { userId },
                asset: {
                    OR: [
                        { ticker: { in: symbols } },
                        { symbol: { in: symbols } },
                    ],
                },
            },
            include: {
                asset: { select: { ticker: true, symbol: true, name: true } },
                portfolio: { select: { id: true, nombre: true } },
            },
        });

        const holdingsSet = new Map<string, { portfolioId: string; portfolioName: string }>();
        userHoldings.forEach((h: any) => {
            if (h.asset?.ticker) holdingsSet.set(h.asset.ticker.toUpperCase(), { portfolioId: h.portfolioId, portfolioName: h.portfolio?.nombre || 'Portafolio' });
            if (h.asset?.symbol) holdingsSet.set(h.asset.symbol.toUpperCase(), { portfolioId: h.portfolioId, portfolioName: h.portfolio?.nombre || 'Portafolio' });
        });

        // 3. Obtener alertas de mercado activas del usuario para estos activos
        const alerts = await this.prisma.marketAlert.findMany({
            where: {
                userId,
                ticker: { in: [...symbols, ...watchlist.items.map(item => item.symbol)] },
            },
            orderBy: { createdAt: 'desc' },
        });

        // 4. Próximos balances / resultados (Earnings) desde el Calendario
        const earningsSymbols = watchlist.items.map(item => {
            const identity = resolveMarketIdentity(item.symbol, item.market);
            return identity.cedear?.underlyingTicker || (!identity.crypto && ['STOCK', 'CEDEAR'].includes(identity.assetType) ? identity.ticker : null);
        }).filter((symbol): symbol is string => Boolean(symbol));
        const now = new Date();
        const in45Days = new Date(Date.now() + 45 * 24 * 60 * 60 * 1000);
        const upcomingEvents = await this.prisma.marketCalendarEvent.findMany({
            where: {
                ticker: { in: earningsSymbols },
                eventType: 'EARNINGS',
                timestampUtc: { gte: now, lte: in45Days },
            },
            orderBy: { timestampUtc: 'asc' },
        });

        const earningsMap = new Map<string, any>();
        upcomingEvents.forEach((e) => {
            if (e.ticker && !earningsMap.has(e.ticker.toUpperCase())) {
                earningsMap.set(e.ticker.toUpperCase(), {
                    date: e.date,
                    time: e.time,
                    title: e.title,
                    impact: e.impact,
                });
            }
        });

        // 5. Enriquecer cada ítem
        const enrichedItems = watchlist.items.map((item) => {
            const identity = resolveMarketIdentity(item.symbol, item.market);
            const symUpper = identity.symbol;
            const quote = quotesMap.get(symUpper) || null;
            const cedearDef = identity.cedear;

            const currentPrice = !quote?.unavailable && Number.isFinite(quote?.price) && quote.price > 0 ? quote.price : null;
            const changePercent = currentPrice !== null && Number.isFinite(quote?.change) ? quote.change : null;
            const premarketPrice = quote?.premarketPrice ?? null;
            const premarketChange = quote?.premarketChange ?? null;
            const updatedAt = quote?.updatedAt ?? null;
            const isUnavailable = !quote || quote.unavailable || currentPrice === null;

            // Cálculo del objetivo de precio
            let distancePct: number | null = null;
            let isTargetAbove: boolean | null = null;

            if (item.targetPrice && currentPrice && currentPrice > 0) {
                distancePct = Number((((item.targetPrice - currentPrice) / currentPrice) * 100).toFixed(2));
                isTargetAbove = item.targetPrice > currentPrice;
            }

            // Tenencia en portafolio
            const holdingInfo = holdingsSet.get(symUpper) || null;
            const isInPortfolio = Boolean(holdingInfo);

            // Alertas
            const activeAlert = alerts.find(alert => alert.id === item.alertId && alert.status === 'ACTIVE') || null;

            // Próximo balance
            const earningsSymbol = cedearDef?.underlyingTicker || (!identity.crypto && identity.assetType === 'STOCK' ? identity.ticker : '');
            const nextEarnings = earningsMap.get(earningsSymbol) || null;

            return {
                id: item.id,
                symbol: item.symbol,
                chartSymbol: identity.exchange ? identity.symbol : quote?.symbol || (getCedearDefinition(identity.ticker) ? `${getCedearDefinition(identity.ticker)!.underlyingExchange}:${identity.ticker}` : identity.symbol),
                name: item.name || cedearDef?.name || item.symbol,
                market: item.market || (cedearDef ? 'BCBA' : 'US'),
                currency: item.currency || (cedearDef ? 'ARS' : 'USD'),
                assetType: item.assetType || (cedearDef ? 'CEDEAR' : 'STOCK'),
                sector: item.sector || cedearDef?.sector || 'General',
                industry: item.industry || null,
                addedPrice: item.addedPrice,
                currentPrice,
                changePercent,
                premarketPrice,
                quoteUpdatedAt: updatedAt,
                isUnavailable,
                targetPrice: item.targetPrice,
                targetDirection: item.targetDirection,
                distancePct,
                isTargetAbove,
                personalStatus: item.personalStatus,
                reason: item.reason,
                tags: item.tags ? item.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
                notesCount: item.notes.length,
                notes: item.notes,
                isInPortfolio,
                portfolioId: holdingInfo?.portfolioId || null,
                hasActiveAlert: Boolean(activeAlert),
                activeAlert: activeAlert ? {
                    id: activeAlert.id,
                    alertType: activeAlert.alertType,
                    targetValue: activeAlert.targetValue,
                    condition: activeAlert.condition,
                    status: activeAlert.status,
                    notificationChannel: activeAlert.notificationChannel,
                } : null,
                nextEarnings,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt,
            };
        });

        return {
            id: watchlist.id,
            name: watchlist.name,
            description: watchlist.description,
            color: watchlist.color,
            isDefault: watchlist.isDefault,
            isArchived: watchlist.isArchived,
            plan,
            limits,
            itemCount: enrichedItems.length,
            items: enrichedItems,
            createdAt: watchlist.createdAt,
            updatedAt: watchlist.updatedAt,
        };
    }

    // ── 7. AGREGAR ÍTEM A UNA LISTA ──
    async addItem(userId: string, watchlistId: string, dto: AddWatchlistItemDto) {
        const plan = await this.getUserPlan(userId);
        const limits = WATCHLIST_CONFIG[plan];

        const watchlist = await this.prisma.watchlist.findFirst({
            where: { id: watchlistId, userId },
            include: { items: true },
        });

        if (!watchlist) throw new NotFoundException('Lista de seguimiento no encontrada.');

        if (watchlist.items.length >= limits.maxItemsPerList) {
            throw new ForbiddenException({
                code: 'WATCHLIST_ITEMS_LIMIT_REACHED',
                message: `El plan ${plan} permite hasta ${limits.maxItemsPerList} activos por lista. Pasate a PRO para ampliar capacidad.`,
                upgradeUrl: '/pro',
            });
        }

        const identity = resolveMarketIdentity(dto.symbol, dto.market);
        const symUpper = identity.symbol;

        // Evitar duplicados dentro de la misma lista
        const existingItem = watchlist.items.find(item => resolveMarketIdentity(item.symbol, item.market).symbol === symUpper);
        if (existingItem) {
            throw new BadRequestException(`El activo "${symUpper}" ya se encuentra en esta lista de seguimiento.`);
        }

        // Obtener cotización de referencia en el momento de agregado
        let addedPrice: number | null = null;
        let detectedCurrency = dto.currency || identity.currency;
        let detectedMarket = dto.market || identity.market;
        let detectedType = dto.assetType || identity.assetType;
        let detectedName = dto.name;

        const cedearDef = identity.cedear;
        if (cedearDef) {
            detectedCurrency = 'ARS';
            detectedMarket = 'BCBA';
            detectedType = 'CEDEAR';
            if (!detectedName) detectedName = cedearDef.name;
        }

        try {
            const quote = await this.marketService.getQuote(symUpper);
            if (quote && quote.price) {
                addedPrice = quote.price;
            }
        } catch { /* best effort */ }

        // Crear ítem
        const newItem = await this.prisma.watchlistItem.create({
            data: {
                watchlistId,
                symbol: symUpper,
                name: detectedName || symUpper,
                market: detectedMarket,
                currency: detectedCurrency,
                assetType: detectedType,
                sector: dto.sector || cedearDef?.sector || null,
                industry: dto.industry || null,
                addedPrice,
                targetPrice: dto.targetPrice || null,
                targetDirection: dto.targetDirection || null,
                personalStatus: dto.personalStatus || 'RESEARCHING',
                reason: dto.reason?.trim() || null,
                tags: dto.tags?.trim() || null,
                order: watchlist.items.length,
            },
        });

        // Si el usuario configuró alerta con objetivo de precio, creamos o vinculamos MarketAlert
        if (dto.alertEnabled && dto.targetPrice) {
            try {
                const condition = dto.targetDirection === 'BELOW' ? 'LESS_THAN' : 'GREATER_THAN';
                const alert = await this.alertsService.createAlert(userId, {
                    ticker: symUpper,
                    name: detectedName || symUpper,
                    alertType: 'PRICE_TARGET',
                    targetValue: dto.targetPrice,
                    condition,
                    notificationChannel: dto.alertChannel || 'EMAIL',
                });

                if (alert?.id) {
                    await this.prisma.watchlistItem.update({
                        where: { id: newItem.id },
                        data: { alertId: alert.id },
                    });
                }
            } catch (err: any) {
                this.logger.warn(`No se pudo crear MarketAlert automático para ${symUpper}: ${err.message}`);
            }
        }

        return newItem;
    }

    // ── 8. ACTUALIZAR ÍTEM (Objetivo, notas, tags, estado, motivo) ──
    async updateItem(userId: string, watchlistId: string, itemId: string, dto: UpdateWatchlistItemDto) {
        const item = await this.prisma.watchlistItem.findFirst({
            where: { id: itemId, watchlist: { id: watchlistId, userId } },
        });

        if (!item) throw new NotFoundException('Activo de seguimiento no encontrado.');

        const requestedTarget = dto.targetPrice !== undefined ? dto.targetPrice : item.targetPrice;
        if ((requestedTarget !== null && (!Number.isFinite(requestedTarget) || requestedTarget <= 0)) || (dto.alertEnabled && requestedTarget === null)) {
            throw new BadRequestException('Definí un precio objetivo mayor que cero.');
        }
        const updated = await this.prisma.watchlistItem.update({
            where: { id: itemId },
            data: {
                ...(dto.targetPrice !== undefined && { targetPrice: dto.targetPrice }),
                ...(dto.targetDirection !== undefined && { targetDirection: dto.targetDirection }),
                ...(dto.personalStatus !== undefined && { personalStatus: dto.personalStatus }),
                ...(dto.reason !== undefined && { reason: dto.reason?.trim() || null }),
                ...(dto.tags !== undefined && { tags: dto.tags?.trim() || null }),
                ...(dto.order !== undefined && { order: dto.order }),
            },
        });

        if (dto.alertEnabled !== undefined || dto.targetPrice !== undefined || dto.targetDirection !== undefined || dto.alertChannel !== undefined) {
            const target = dto.targetPrice !== undefined ? dto.targetPrice : item.targetPrice;
            const direction = dto.targetDirection || item.targetDirection || 'BELOW';
            if (item.alertId) {
                const enabled = dto.alertEnabled !== false && target !== null;
                await this.alertsService.updateAlert(userId, item.alertId, {
                    ...(target !== null && { targetValue: target }),
                    condition: direction === 'BELOW' ? 'LESS_THAN' : 'GREATER_THAN',
                    ...(dto.alertChannel && { notificationChannel: dto.alertChannel }),
                    ...(dto.alertEnabled !== undefined || target === null ? { status: enabled ? 'ACTIVE' : 'DISABLED' } : {}),
                });
            } else if (dto.alertEnabled && target) {
                const alert = await this.alertsService.createAlert(userId, {
                    ticker: item.symbol, name: item.name || item.symbol, alertType: 'PRICE_TARGET', targetValue: target,
                    condition: direction === 'BELOW' ? 'LESS_THAN' : 'GREATER_THAN', notificationChannel: dto.alertChannel || 'EMAIL',
                });
                await this.prisma.watchlistItem.update({ where: { id: itemId }, data: { alertId: alert.id } });
            }
        }

        return updated;
    }

    // ── 9. QUITAR ÍTEM DE LA LISTA ──
    async removeItem(userId: string, watchlistId: string, itemId: string) {
        const item = await this.prisma.watchlistItem.findFirst({
            where: { id: itemId, watchlist: { id: watchlistId, userId } },
        });

        if (!item) throw new NotFoundException('Activo de seguimiento no encontrado.');

        await this.prisma.watchlistItem.delete({ where: { id: itemId } });
        return { success: true, message: `Activo ${item.symbol} quitado de la lista.` };
    }

    // ── 10. GESTIÓN DE NOTAS POR ACTIVO ──
    async addNote(userId: string, itemId: string, dto: AddNoteDto) {
        const plan = await this.getUserPlan(userId);
        const limits = WATCHLIST_CONFIG[plan];

        const item = await this.prisma.watchlistItem.findFirst({
            where: { id: itemId, watchlist: { userId } },
            include: { notes: true },
        });

        if (!item) throw new NotFoundException('Activo de seguimiento no encontrado.');

        if (item.notes.length >= limits.maxNotesPerItem) {
            throw new ForbiddenException({
                code: 'NOTES_LIMIT_REACHED',
                message: `El plan ${plan} permite hasta ${limits.maxNotesPerItem} notas por activo. Pasate a PRO para notas ilimitadas.`,
                upgradeUrl: '/pro',
            });
        }

        return this.prisma.watchlistNote.create({
            data: {
                itemId,
                content: dto.content.trim(),
            },
        });
    }

    async deleteNote(userId: string, noteId: string) {
        const note = await this.prisma.watchlistNote.findFirst({
            where: { id: noteId, item: { watchlist: { userId } } },
        });

        if (!note) throw new NotFoundException('Nota no encontrada.');

        await this.prisma.watchlistNote.delete({ where: { id: noteId } });
        return { success: true };
    }

    // ── 11. RESOLUCIÓN DE SÍMBOLOS AMBIGUOS (Ej: AAPL US vs BYMA CEDEAR) ──
    async resolveSymbols(symbols: string[]) {
        const results = symbols.map((raw) => {
            const identity = resolveMarketIdentity(raw);
            const candidates: any[] = [];
            const ambiguousCedear = !identity.exchange && !identity.crypto ? getCedearDefinition(identity.ticker) : null;
            if (ambiguousCedear) {
                candidates.push({ symbol: `BCBA:${identity.ticker}`, name: ambiguousCedear.name, market: 'BCBA', currency: 'ARS', assetType: 'CEDEAR',
                    ratio: ambiguousCedear.ratio, underlying: ambiguousCedear.underlyingTicker, isCedear: true });
            }
            candidates.push({ symbol: ambiguousCedear ? `${ambiguousCedear.underlyingExchange}:${identity.ticker}` : identity.symbol,
                name: identity.cedear?.name || ambiguousCedear?.name || identity.ticker, market: identity.market, currency: identity.currency,
                assetType: identity.assetType, isCedear: Boolean(identity.cedear) });
            return { input: raw, clean: identity.symbol, hasAmbiguity: candidates.length > 1, candidates };
        });

        return { items: results };
    }

    // ── 12. IMPORTACIÓN EN LOTE (CSV o Pegar Símbolos) ──
    async batchImport(userId: string, watchlistId: string, dto: BatchImportDto) {
        const plan = await this.getUserPlan(userId);
        const limits = WATCHLIST_CONFIG[plan];

        if (!limits.allowCsvImport && plan === 'FREE') {
            throw new ForbiddenException({
                code: 'PRO_REQUIRED',
                message: 'La importación en lote y CSV es una funcionalidad de Finix PRO.',
                upgradeUrl: '/pro',
            });
        }

        const watchlist = await this.prisma.watchlist.findFirst({
            where: { id: watchlistId, userId },
            include: { items: true },
        });

        if (!watchlist) throw new NotFoundException('Lista de seguimiento no encontrada.');

        const existingSymbols = new Set(watchlist.items.map(item => resolveMarketIdentity(item.symbol, item.market).symbol));
        const toAdd = dto.items.filter(item => {
            const symbol = resolveMarketIdentity(item.symbol, item.market).symbol;
            if (existingSymbols.has(symbol)) return false;
            existingSymbols.add(symbol);
            return true;
        });

        if (watchlist.items.length + toAdd.length > limits.maxItemsPerList) {
            throw new ForbiddenException({
                code: 'WATCHLIST_ITEMS_LIMIT_REACHED',
                message: `No se pueden agregar ${toAdd.length} activos. El límite de tu plan es ${limits.maxItemsPerList} activos por lista.`,
                upgradeUrl: '/pro',
            });
        }

        const createdItems: any[] = [];

        for (const item of toAdd) {
            const identity = resolveMarketIdentity(item.symbol, item.market);
            const symUpper = identity.symbol;
            const cedearDef = identity.cedear;

            const created = await this.prisma.watchlistItem.create({
                data: {
                    watchlistId,
                    symbol: symUpper,
                    name: item.name || cedearDef?.name || symUpper,
                    market: item.market || identity.market,
                    currency: identity.currency,
                    assetType: identity.assetType,
                    sector: cedearDef?.sector || null,
                    targetPrice: item.targetPrice || null,
                    personalStatus: item.personalStatus || 'RESEARCHING',
                    reason: item.reason?.trim() || null,
                    tags: item.tags?.trim() || null,
                    order: watchlist.items.length + createdItems.length,
                },
            });
            createdItems.push(created);
        }

        return {
            success: true,
            totalProcessed: dto.items.length,
            addedCount: createdItems.length,
            duplicatesSkipped: dto.items.length - toAdd.length,
            items: createdItems,
        };
    }

    // ── 13. EXPORTACIÓN (CSV o JSON) ──
    async exportWatchlist(userId: string, watchlistId: string, format: 'csv' | 'json') {
        const detail = await this.getWatchlistDetail(userId, watchlistId);

        if (format === 'json') {
            return detail;
        }

        // CSV Header
        const headers = [
            'Símbolo',
            'Nombre',
            'Mercado',
            'Moneda',
            'Tipo',
            'Precio Actual',
            'Variación %',
            'Precio Objetivo',
            'Distancia %',
            'Estado Personal',
            'Motivo',
            'Etiquetas',
            'En Portafolio',
            'Notas',
        ];

        const rows = detail.items.map((item) => {
            const notesText = item.notes.map((n) => `[${new Date(n.createdAt).toLocaleDateString()}] ${n.content}`).join(' | ');
            return [
                `"${item.symbol}"`,
                `"${item.name}"`,
                `"${item.market}"`,
                `"${item.currency}"`,
                `"${item.assetType}"`,
                item.currentPrice ?? 'N/D',
                item.changePercent !== null ? `${item.changePercent.toFixed(2)}%` : 'N/D',
                item.targetPrice ?? 'N/D',
                item.distancePct !== null ? `${item.distancePct.toFixed(2)}%` : 'N/D',
                `"${item.personalStatus}"`,
                `"${(item.reason || '').replace(/"/g, '""')}"`,
                `"${item.tags.join(', ')}"`,
                item.isInPortfolio ? 'SÍ' : 'NO',
                `"${notesText.replace(/"/g, '""')}"`,
            ].join(',');
        });

        return [headers.join(','), ...rows].join('\n');
    }

    // ── 14. MOVER O COPIAR ACTIVOS ENTRE LISTAS ──
    async moveCopyItem(userId: string, dto: MoveCopyItemDto) {
        const sourceItem = await this.prisma.watchlistItem.findFirst({
            where: {
                symbol: dto.symbol.toUpperCase(),
                watchlist: { id: dto.sourceWatchlistId, userId },
            },
            include: { notes: true },
        });

        if (!sourceItem) throw new NotFoundException('Activo de origen no encontrado.');

        const targetList = await this.prisma.watchlist.findFirst({
            where: { id: dto.targetWatchlistId, userId },
            include: { items: true },
        });

        if (!targetList) throw new NotFoundException('Lista de destino no encontrada.');

        // Verificar duplicado en destino
        const alreadyInTarget = targetList.items.some((i) => i.symbol.toUpperCase() === dto.symbol.toUpperCase());
        if (alreadyInTarget) {
            throw new BadRequestException(`El activo "${dto.symbol}" ya está en la lista de destino.`);
        }

        // Crear en destino
        const newItem = await this.prisma.watchlistItem.create({
            data: {
                watchlistId: dto.targetWatchlistId,
                symbol: sourceItem.symbol,
                name: sourceItem.name,
                market: sourceItem.market,
                currency: sourceItem.currency,
                assetType: sourceItem.assetType,
                sector: sourceItem.sector,
                industry: sourceItem.industry,
                addedPrice: sourceItem.addedPrice,
                targetPrice: sourceItem.targetPrice,
                targetDirection: sourceItem.targetDirection,
                personalStatus: sourceItem.personalStatus,
                reason: sourceItem.reason,
                tags: sourceItem.tags,
                order: targetList.items.length,
            },
        });

        // Copiar notas si existen
        if (sourceItem.notes.length > 0) {
            for (const n of sourceItem.notes) {
                await this.prisma.watchlistNote.create({
                    data: { itemId: newItem.id, content: n.content },
                });
            }
        }

        // Si era MOVE, borrar el original
        if (dto.action === 'MOVE') {
            await this.prisma.watchlistItem.delete({ where: { id: sourceItem.id } });
        }

        return {
            success: true,
            action: dto.action,
            symbol: dto.symbol,
            targetWatchlistId: dto.targetWatchlistId,
        };
    }

    // ── 15. IDEAS PARA EXPLORAR (Conectado con Oportunidades Finix) ──
    async getIdeas(userId: string) {
        const plan = await this.getUserPlan(userId);
        const followed = await this.prisma.watchlistFollowedIdea.findMany({
            where: { userId },
        });
        const followedCategories = new Set(followed.map((f) => f.category));

        // Obtener screener cuantitativo desde MarketService
        let opportunitiesData: any = null;
        try {
            // Invocar el método del scanner interno de Finix
            opportunitiesData = await (this.marketService as any).opportunityScreenerService?.getScreenedData({
                limit: 50,
            });
        } catch { /* fallback */ }

        const items = opportunitiesData?.items || [];

        const categories = [
            {
                key: 'UNDERVALUED',
                title: 'Infravaloradas',
                description: 'Empresas con mayor descuento estimado respecto a su valor justo fundamental.',
                criteria: 'Descuento ≥ 15% sobre valor intrínseco Finix y ROIC positivo.',
                items: items
                    .filter((i: any) => (i.upside || 0) >= 15)
                    .slice(0, 10)
                    .map((i: any) => ({
                        symbol: i.ticker || i.symbol,
                        name: i.name,
                        sector: i.sector,
                        price: i.price,
                        metricLabel: 'Potencial',
                        metricValue: `+${(i.upside || 0).toFixed(1)}%`,
                    })),
            },
            {
                key: 'HEALTH',
                title: 'Calidad & Balance Sólido',
                description: 'Compañías con bajo endeudamiento, alta solvencia y excelente rentabilidad sobre capital.',
                criteria: 'Piotroski Score ≥ 7, Deuda neta / EBITDA < 2x y ROIC > 12%.',
                items: items
                    .filter((i: any) => (i.piotroskiScore || 0) >= 7 || (i.roic || 0) >= 12)
                    .slice(0, 10)
                    .map((i: any) => ({
                        symbol: i.ticker || i.symbol,
                        name: i.name,
                        sector: i.sector,
                        price: i.price,
                        metricLabel: 'ROIC',
                        metricValue: `${(i.roic || 0).toFixed(1)}%`,
                    })),
            },
            {
                key: 'GROWTH',
                title: 'Alto Crecimiento',
                description: 'Empresas que muestran aceleración sostenida en ingresos, EBITDA y flujo de caja libre.',
                criteria: 'Crecimiento de ingresos y EPS mayor al 15% interanual.',
                items: items
                    .filter((i: any) => (i.revenueGrowth || 0) >= 15 || (i.epsGrowth || 0) >= 15)
                    .slice(0, 10)
                    .map((i: any) => ({
                        symbol: i.ticker || i.symbol,
                        name: i.name,
                        sector: i.sector,
                        price: i.price,
                        metricLabel: 'Crecimiento',
                        metricValue: `+${(i.revenueGrowth || i.epsGrowth || 0).toFixed(1)}%`,
                    })),
            },
            {
                key: 'DIVIDEND',
                title: 'Dividendos Sostenibles',
                description: 'Rendimiento por dividendo atractivo respaldado por flujo de caja libre positivo y payout razonable.',
                criteria: 'Dividend Yield > 2.5% con Payout Ratio < 70% y FCF yield positivo.',
                items: items
                    .filter((i: any) => (i.dividendYield || 0) >= 2.5)
                    .slice(0, 10)
                    .map((i: any) => ({
                        symbol: i.ticker || i.symbol,
                        name: i.name,
                        sector: i.sector,
                        price: i.price,
                        metricLabel: 'Yield',
                        metricValue: `${(i.dividendYield || 0).toFixed(1)}%`,
                    })),
            },
        ];

        return {
            plan,
            isPro: plan !== 'FREE',
            categories: categories.map((cat) => ({
                ...cat,
                count: cat.items.length,
                isFollowed: followedCategories.has(cat.key),
            })),
        };
    }

    async toggleFollowIdea(userId: string, category: string) {
        const plan = await this.getUserPlan(userId);
        if (plan === 'FREE') {
            throw new ForbiddenException({
                code: 'PRO_REQUIRED',
                message: 'El seguimiento de listas de ideas automáticas es exclusivo de Finix PRO.',
                upgradeUrl: '/pro',
            });
        }

        const existing = await this.prisma.watchlistFollowedIdea.findFirst({
            where: { userId, category },
        });

        if (existing) {
            await this.prisma.watchlistFollowedIdea.delete({ where: { id: existing.id } });
            return { isFollowed: false, category };
        } else {
            await this.prisma.watchlistFollowedIdea.create({
                data: { userId, category },
            });
            return { isFollowed: true, category };
        }
    }

    // ── 16. PERTENENCIA DE UN SÍMBOLO EN LAS LISTAS DEL USUARIO (Para AddToWatchlistModal) ──
    async getUserListsForSymbol(userId: string, symbol: string) {
        const symUpper = symbol.trim().toUpperCase();
        const watchlists = await this.prisma.watchlist.findMany({
            where: { userId, isArchived: false },
            include: {
                items: {
                    where: { symbol: symUpper },
                    select: { id: true, symbol: true },
                },
            },
            orderBy: { order: 'asc' },
        });

        return {
            symbol: symUpper,
            lists: watchlists.map((wl) => ({
                id: wl.id,
                name: wl.name,
                color: wl.color,
                containsSymbol: wl.items.length > 0,
                itemId: wl.items[0]?.id || null,
            })),
        };
    }

    // ── 17. PUBLICACIONES COMUNITARIAS RELACIONADAS ──
    async getPublicCommunityPosts(symbol: string) {
        const clean = symbol.trim().toUpperCase();
        const baseTicker = clean.replace(/^(BCBA:|BYMA:|NASDAQ:|NYSE:)/, '');

        const posts = await this.prisma.post.findMany({
            where: {
                visibility: 'VISIBLE',
                deletedAt: null,
                OR: [
                    { assetSymbol: { equals: baseTicker, mode: 'insensitive' } },
                    { tickers: { contains: baseTicker, mode: 'insensitive' } },
                ],
            },
            take: 6,
            orderBy: { createdAt: 'desc' },
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        avatarUrl: true,
                        role: true,
                        isVerified: true,
                    },
                },
                _count: {
                    select: {
                        likes: true,
                        replies: true,
                    },
                },
            },
        });

        return {
            symbol: clean,
            disclaimer: 'Las publicaciones de la comunidad reflejan opiniones de usuarios de Finix y no constituyen asesoramiento financiero ni recomendaciones de inversión.',
            posts: (posts as any[]).map((p) => ({
                id: p.id,
                content: p.content,
                createdAt: p.createdAt,
                author: p.author ? {
                    id: p.author.id,
                    username: p.author.username,
                    avatarUrl: p.author.avatarUrl,
                    role: p.author.role,
                    isVerified: p.author.isVerified,
                } : null,
                likesCount: p._count?.likes ?? 0,
                repliesCount: p._count?.replies ?? 0,
            })),
        };
    }
}
