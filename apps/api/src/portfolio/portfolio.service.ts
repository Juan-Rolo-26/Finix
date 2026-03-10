import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreatePortfolioDto, UpdatePortfolioDto, CreateAssetDto, UpdateAssetDto, CreateTransactionDto } from './dto/portfolio.dto';
import { MarketQuote, MarketService } from '../market/market.service';
import { AccessControlService } from '../access/access-control.service';

const normalizeAssetType = (value?: string) => {
    if (!value) return undefined;
    return value.trim().toUpperCase().replace(/\s+/g, '_');
};

const MOVEMENT_TYPE_TO_DB: Record<string, string> = {
    compra: 'BUY',
    buy: 'BUY',
    venta: 'SELL',
    sell: 'SELL',
    dividendo: 'DIVIDEND',
    dividend: 'DIVIDEND',
    fee: 'FEE',
    deposito: 'DEPOSIT',
    deposit: 'DEPOSIT',
    retiro: 'WITHDRAW',
    withdraw: 'WITHDRAW',
};

const DB_TYPE_TO_MOVEMENT: Record<string, string> = {
    BUY: 'compra',
    SELL: 'venta',
    DIVIDEND: 'dividendo',
    FEE: 'fee',
    DEPOSIT: 'deposito',
    WITHDRAW: 'retiro',
};

@Injectable()
export class PortfolioService {
    constructor(
        private prisma: PrismaService,
        private marketService: MarketService,
        private accessControlService: AccessControlService,
    ) { }

    private async assertPortfolioOwner(portfolioId: string, userId: string) {
        const portfolio = await this.prisma.portfolio.findFirst({
            where: { id: portfolioId, userId },
            select: { id: true },
        });

        if (!portfolio) {
            throw new NotFoundException('Portafolio no encontrado');
        }
    }

    private normalizeMovementType(value?: string) {
        if (!value) return undefined;
        return MOVEMENT_TYPE_TO_DB[value.trim().toLowerCase()];
    }

    private normalizeTicker(value?: string) {
        return String(value || '').trim().toUpperCase();
    }

    private async getLiveQuoteMap(holdings: any[]) {
        const quoteMap = new Map<string, MarketQuote>();
        const tickers = Array.from(
            new Set(
                holdings
                    .map((holding) => this.normalizeTicker(holding?.asset?.ticker))
                    .filter(Boolean)
            )
        );

        if (tickers.length === 0) {
            return quoteMap;
        }

        try {
            const quotes = await this.marketService.getQuotes(tickers);
            quotes.forEach((quote) => {
                const key = this.normalizeTicker(quote.inputSymbol);
                if (!key) return;
                quoteMap.set(key, quote);
            });
        } catch (error) {
            console.error('[PortfolioService] Failed to load live quotes:', error);
        }

        return quoteMap;
    }

    private toLegacyAsset(holding: any, portfolioCreatedAt?: Date, quoteMap?: Map<string, MarketQuote>) {
        const cantidad = Number(holding.quantity ?? 0);
        const ppc = Number(holding.averageCost ?? 0);
        const ticker = holding.asset?.ticker ?? 'N/A';
        const quote = quoteMap?.get(this.normalizeTicker(ticker));
        const precioActual = quote && typeof quote.price === 'number' ? quote.price : ppc;

        return {
            id: holding.assetId,
            ticker,
            tipoActivo: holding.asset?.type ?? 'UNKNOWN',
            cantidad,
            ppc,
            montoInvertido: cantidad * ppc,
            precioActual,
            precioTiempoReal: Boolean(quote && typeof quote.price === 'number'),
            precioFuente: quote?.symbol || null,
            precioActualizadoEn: quote?.updatedAt || null,
            createdAt: (portfolioCreatedAt ?? new Date()).toISOString(),
        };
    }

    private toLegacyMovement(transaction: any) {
        return {
            id: transaction.id,
            fecha: transaction.date,
            tipoMovimiento: DB_TYPE_TO_MOVEMENT[transaction.type] ?? String(transaction.type || '').toLowerCase(),
            ticker: transaction.asset?.ticker ?? 'CASH',
            claseActivo: transaction.asset?.type ?? 'CASH',
            cantidad: Number(transaction.quantity ?? 0),
            precio: Number(transaction.pricePerUnit ?? 0),
            total: Number(transaction.total ?? 0),
        };
    }

    private toLegacyPortfolio(portfolio: any, quoteMap?: Map<string, MarketQuote>) {
        const assets = (portfolio.holdings ?? []).map((holding: any) => this.toLegacyAsset(holding, portfolio.createdAt, quoteMap));
        const movements = (portfolio.transactions ?? []).map((transaction: any) => this.toLegacyMovement(transaction));

        return {
            id: portfolio.id,
            nombre: portfolio.nombre,
            descripcion: portfolio.descripcion,
            objetivo: portfolio.objetivo,
            monedaBase: portfolio.monedaBase,
            nivelRiesgo: portfolio.nivelRiesgo,
            modoSocial: portfolio.modoSocial,
            esPrincipal: portfolio.esPrincipal,
            admiteBienesRaices: portfolio.admiteBienesRaices,
            assets,
            movements,
            createdAt: portfolio.createdAt,
            updatedAt: portfolio.updatedAt,
        };
    }

    // ==================== PORTFOLIOS ====================

    async createPortfolio(userId: string, dto: CreatePortfolioDto) {
        await this.accessControlService.limitFreePortfolio(userId);

        if (dto.esPrincipal) {
            await this.prisma.portfolio.updateMany({
                where: { userId, esPrincipal: true },
                data: { esPrincipal: false },
            });
        }

        const created = await this.prisma.portfolio.create({
            data: {
                userId,
                nombre: dto.nombre,
                descripcion: dto.descripcion,
                objetivo: dto.objetivo,
                monedaBase: dto.monedaBase || 'USD',
                nivelRiesgo: dto.nivelRiesgo || 'medio',
                modoSocial: dto.modoSocial || false,
                esPrincipal: dto.esPrincipal || false,
                admiteBienesRaices: dto.admiteBienesRaices || false,
            },
        });

        return this.getPortfolioById(created.id, userId);
    }

    async getUserPortfolios(userId: string) {
        const portfolios = await this.prisma.portfolio.findMany({
            where: { userId },
            include: {
                holdings: { include: { asset: true } },
                transactions: { include: { asset: true }, orderBy: { date: 'desc' }, take: 100 },
            },
            orderBy: [
                { esPrincipal: 'desc' },
                { createdAt: 'desc' },
            ],
        });

        const holdings = portfolios.flatMap((portfolio) => portfolio.holdings ?? []);
        const quoteMap = await this.getLiveQuoteMap(holdings);
        return portfolios.map((portfolio) => this.toLegacyPortfolio(portfolio, quoteMap));
    }

    private async canExposePortfoliosPublicly(userId: string) {
        const owner = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                isProfilePublic: true,
                showPortfolio: true,
            },
        });

        return Boolean(owner?.isProfilePublic && owner?.showPortfolio);
    }

    private async getVisiblePublicPortfolioRecords(userId: string, includeTransactions = false) {
        const canExpose = await this.canExposePortfoliosPublicly(userId);
        if (!canExpose) {
            return [];
        }

        const portfolios = await this.prisma.portfolio.findMany({
            where: { userId },
            include: {
                holdings: { include: { asset: true } },
                ...(includeTransactions
                    ? {
                        transactions: {
                            include: { asset: true },
                            orderBy: { date: 'desc' as const },
                            take: 100,
                        },
                    }
                    : {}),
            },
            orderBy: [
                { esPrincipal: 'desc' },
                { createdAt: 'desc' },
            ],
        });

        if (portfolios.length === 0) {
            return [];
        }

        const explicitlyPublic = portfolios.filter((portfolio) => portfolio.modoSocial);
        if (explicitlyPublic.length > 0) {
            return explicitlyPublic;
        }

        // Backward compatibility: if the user exposed the portfolio section but no
        // portfolio has been marked social yet, surface the primary/first one.
        return [portfolios[0]];
    }

    async getPublicPortfolios(userId: string) {
        const portfolios = await this.getVisiblePublicPortfolioRecords(userId, true);
        const holdings = portfolios.flatMap((portfolio) => portfolio.holdings ?? []);
        const quoteMap = await this.getLiveQuoteMap(holdings);
        return portfolios.map((portfolio) => this.toLegacyPortfolio(portfolio, quoteMap));
    }

    async getPortfolioById(portfolioId: string, userId: string) {
        const portfolio = await this.prisma.portfolio.findFirst({
            where: { id: portfolioId, userId },
            include: {
                holdings: { include: { asset: true } },
                transactions: { include: { asset: true }, orderBy: { date: 'desc' }, take: 200 },
            },
        });

        if (!portfolio) {
            throw new NotFoundException('Portafolio no encontrado');
        }

        const quoteMap = await this.getLiveQuoteMap(portfolio.holdings ?? []);
        return this.toLegacyPortfolio(portfolio, quoteMap);
    }

    private async getPublicPortfolioRecord(portfolioId: string, includeTransactions = false) {
        const targetPortfolio = await this.prisma.portfolio.findUnique({
            where: { id: portfolioId },
            select: { userId: true },
        });

        if (!targetPortfolio) {
            throw new NotFoundException('Portafolio publico no encontrado');
        }

        const visiblePortfolios = await this.getVisiblePublicPortfolioRecords(
            targetPortfolio.userId,
            includeTransactions,
        );
        const portfolio = visiblePortfolios.find((item) => item.id === portfolioId);

        if (!portfolio) {
            throw new NotFoundException('Portafolio publico no encontrado');
        }

        return portfolio;
    }

    async updatePortfolio(portfolioId: string, userId: string, dto: UpdatePortfolioDto) {
        await this.assertPortfolioOwner(portfolioId, userId);

        if (dto.esPrincipal) {
            await this.prisma.portfolio.updateMany({
                where: { userId, esPrincipal: true, id: { not: portfolioId } },
                data: { esPrincipal: false },
            });
        }

        await this.prisma.portfolio.update({
            where: { id: portfolioId },
            data: dto,
        });

        return this.getPortfolioById(portfolioId, userId);
    }

    async deletePortfolio(portfolioId: string, userId: string) {
        await this.assertPortfolioOwner(portfolioId, userId);

        await this.prisma.portfolio.delete({
            where: { id: portfolioId },
        });

        return { ok: true };
    }

    // ==================== TRANSACTIONS & HOLDINGS ====================

    async createTransaction(portfolioId: string, userId: string, dto: CreateTransactionDto) {
        const portfolio = await this.prisma.portfolio.findFirst({
            where: { id: portfolioId, userId },
        });

        if (!portfolio) {
            throw new NotFoundException('Portafolio no encontrado');
        }

        const quantity = Number(dto.quantity);
        const price = Number(dto.price || 0);
        const fee = Number(dto.fee || 0);
        const grossAmount = quantity * price;

        if (!Number.isFinite(quantity) || quantity <= 0) {
            throw new BadRequestException('La cantidad debe ser mayor a 0');
        }

        if ((dto.type === 'BUY' || dto.type === 'SELL') && (!Number.isFinite(price) || price <= 0)) {
            throw new BadRequestException('El precio debe ser mayor a 0 para compras/ventas');
        }

        if (!Number.isFinite(fee) || fee < 0) {
            throw new BadRequestException('La comisión no puede ser negativa');
        }

        const cleanedTicker = (dto.assetTicker || '').trim();
        const normalizedTicker = cleanedTicker.toUpperCase();
        const normalizedType = normalizeAssetType(dto.assetType);
        const normalizedName = dto.assetName?.trim();

        let asset: any = null;
        const shouldUseAsset = dto.type === 'BUY' || dto.type === 'SELL' || Boolean(normalizedTicker);

        if (shouldUseAsset) {
            if (!normalizedTicker) {
                throw new BadRequestException('assetTicker es requerido para este tipo de transacción');
            }

            asset = await this.prisma.asset.findUnique({
                where: { ticker: normalizedTicker },
            });

            if (!asset) {
                asset = await this.prisma.asset.create({
                    data: {
                        ticker: normalizedTicker,
                        name: normalizedName || normalizedTicker,
                        type: normalizedType || 'STOCK',
                        currency: dto.currency || portfolio.monedaBase || 'USD',
                    }
                });
            } else if (normalizedName || normalizedType) {
                const updates: { name?: string; type?: string } = {};
                if (normalizedName && asset.name === asset.ticker) {
                    updates.name = normalizedName;
                }
                if (normalizedType && (!asset.type || asset.type === 'STOCK')) {
                    updates.type = normalizedType;
                }
                if (Object.keys(updates).length > 0) {
                    asset = await this.prisma.asset.update({
                        where: { id: asset.id },
                        data: updates,
                    });
                }
            }
        }

        const date = dto.date ? new Date(dto.date) : new Date();

        let total = 0;
        if (dto.type === 'BUY' || dto.type === 'SELL') {
            // El total representa el monto nocional del activo; la comisión se guarda aparte.
            total = grossAmount;
        } else {
            total = Math.abs(quantity);
        }

        const transaction = await this.prisma.transaction.create({
            data: {
                portfolioId,
                assetId: asset?.id || null,
                type: dto.type,
                date,
                quantity,
                pricePerUnit: price,
                fee,
                total,
                currency: dto.currency || portfolio.monedaBase || 'USD',
                notes: dto.notes,
            },
            include: {
                asset: true,
            }
        });

        if (asset && (dto.type === 'BUY' || dto.type === 'SELL')) {
            const holding = await this.prisma.holding.findUnique({
                where: { portfolioId_assetId: { portfolioId, assetId: asset.id } }
            });

            if (dto.type === 'BUY') {
                const currentQty = holding ? Number(holding.quantity) : 0;
                const currentWac = holding ? Number(holding.averageCost) : 0;
                const newQty = currentQty + quantity;
                const newWac = newQty > 0
                    ? ((currentQty * currentWac) + (quantity * price)) / newQty
                    : 0;

                await this.prisma.holding.upsert({
                    where: { portfolioId_assetId: { portfolioId, assetId: asset.id } },
                    create: {
                        portfolioId,
                        assetId: asset.id,
                        quantity: newQty,
                        averageCost: newWac,
                    },
                    update: {
                        quantity: newQty,
                        averageCost: newWac,
                    }
                });
            } else {
                const currentQty = holding ? Number(holding.quantity) : 0;
                if (currentQty < quantity) {
                    throw new BadRequestException('Saldo insuficiente. Venta en corto no habilitada.');
                }

                const remainingQty = currentQty - quantity;
                if (remainingQty <= 0) {
                    await this.prisma.holding.delete({
                        where: { portfolioId_assetId: { portfolioId, assetId: asset.id } },
                    });
                } else {
                    await this.prisma.holding.update({
                        where: { portfolioId_assetId: { portfolioId, assetId: asset.id } },
                        data: { quantity: remainingQty },
                    });
                }
            }
        }

        if (dto.updateCash !== false) {
            const currency = dto.currency || portfolio.monedaBase || 'USD';
            const account = await this.prisma.cashAccount.upsert({
                where: { portfolioId_currency: { portfolioId, currency } },
                create: { portfolioId, currency, balance: 0 },
                update: {},
            });

            let cashChange = 0;
            if (dto.type === 'BUY') cashChange = -(grossAmount + fee);
            if (dto.type === 'SELL') cashChange = grossAmount - fee;
            if (dto.type === 'DIVIDEND') cashChange = total;
            if (dto.type === 'DEPOSIT') cashChange = total;
            if (dto.type === 'WITHDRAW') cashChange = -total;
            if (dto.type === 'FEE') cashChange = -total;

            await this.prisma.cashAccount.update({
                where: { id: account.id },
                data: { balance: { increment: cashChange } },
            });
        }

        return transaction;
    }

    // Legacy Support / Adapters
    async addAsset(portfolioId: string, userId: string, dto: CreateAssetDto) {
        return this.createTransaction(portfolioId, userId, {
            assetTicker: dto.ticker,
            assetName: dto.ticker,
            assetType: dto.tipoActivo,
            type: 'BUY',
            quantity: dto.cantidad,
            price: dto.precioActual || dto.precio,
            currency: 'USD',
            fee: 0,
            updateCash: true,
        });
    }

    async getPortfolioAssets(portfolioId: string, userId: string) {
        await this.assertPortfolioOwner(portfolioId, userId);

        const holdings = await this.prisma.holding.findMany({
            where: { portfolioId },
            include: { asset: true },
        });

        const quoteMap = await this.getLiveQuoteMap(holdings);
        return holdings.map((holding) => this.toLegacyAsset(holding, undefined, quoteMap));
    }

    async deleteAsset(assetId: string, userId: string, portfolioId?: string) {
        if (portfolioId) {
            await this.assertPortfolioOwner(portfolioId, userId);
        }

        const holdings = await this.prisma.holding.findMany({
            where: {
                assetId,
                ...(portfolioId ? { portfolioId } : {}),
                portfolio: { userId },
            },
            include: {
                asset: true,
            },
        });

        if (holdings.length === 0) {
            throw new NotFoundException('Activo no encontrado en tus portafolios');
        }

        if (!portfolioId && holdings.length > 1) {
            throw new BadRequestException('Debes indicar portfolioId para eliminar un activo repetido en varios portafolios.');
        }

        const target = holdings[0];
        await this.prisma.holding.delete({
            where: { id: target.id },
        });

        return {
            ok: true,
            assetId,
            portfolioId: target.portfolioId,
            ticker: target.asset?.ticker,
        };
    }

    private async buildPortfolioMetrics(portfolio: {
        holdings: Array<{ quantity: any; averageCost: any; asset?: { ticker?: string; type?: string } | null }>;
    }) {
        const quoteMap = await this.getLiveQuoteMap(portfolio.holdings ?? []);
        let capitalTotal = 0;
        let valorActual = 0;
        let gananciaTotal = 0;
        const diversificacionPorClase: Record<string, number> = {};
        const diversificacionPorActivo: Record<string, number> = {};

        for (const holding of portfolio.holdings) {
            const qty = Number(holding.quantity || 0);
            const avgCost = Number(holding.averageCost || 0);
            const invested = qty * avgCost;
            const ticker = holding.asset?.ticker || 'N/A';
            const quote = quoteMap.get(this.normalizeTicker(ticker));
            const currentPrice = quote && typeof quote.price === 'number' ? quote.price : avgCost;
            const currentValue = qty * currentPrice;
            const assetType = holding.asset?.type || 'UNKNOWN';

            capitalTotal += invested;
            valorActual += currentValue;
            gananciaTotal += (currentValue - invested);

            diversificacionPorClase[assetType] = (diversificacionPorClase[assetType] || 0) + currentValue;
            diversificacionPorActivo[ticker] = (diversificacionPorActivo[ticker] || 0) + currentValue;
        }

        return {
            capitalTotal,
            valorActual,
            gananciaTotal,
            variacionPorcentual: capitalTotal > 0 ? (gananciaTotal / capitalTotal) * 100 : 0,
            diversificacionPorClase,
            diversificacionPorActivo,
            cantidadActivos: portfolio.holdings.length,
        };
    }

    async getPortfolioMetrics(portfolioId: string, userId: string) {
        const portfolio = await this.prisma.portfolio.findFirst({
            where: { id: portfolioId, userId },
            include: {
                holdings: { include: { asset: true } },
            },
        });

        if (!portfolio) {
            throw new NotFoundException('Portafolio no encontrado');
        }

        return this.buildPortfolioMetrics(portfolio);
    }

    async getPublicPortfolioMetrics(portfolioId: string) {
        const portfolio = await this.getPublicPortfolioRecord(portfolioId);
        return this.buildPortfolioMetrics(portfolio);
    }

    async updateAsset(assetId: string, userId: string, dto: UpdateAssetDto) {
        throw new BadRequestException('Update Asset not supported. Use Transactions to adjust.');
    }

    async getPortfolioMovements(portfolioId: string, userId: string, filters?: any) {
        await this.assertPortfolioOwner(portfolioId, userId);

        const where: any = { portfolioId };

        const movementType = this.normalizeMovementType(filters?.tipoMovimiento);
        if (movementType) {
            where.type = movementType;
        }

        if (filters?.ticker) {
            const ticker = String(filters.ticker).trim().toUpperCase();
            const assets = await this.prisma.asset.findMany({
                where: {
                    ticker: {
                        contains: ticker,
                    }
                },
                select: { id: true },
            });
            const assetIds = assets.map((asset) => asset.id);
            if (assetIds.length === 0) {
                return [];
            }
            where.assetId = { in: assetIds };
        }

        if (filters?.fechaDesde || filters?.fechaHasta) {
            where.date = {};
            if (filters.fechaDesde) where.date.gte = filters.fechaDesde;
            if (filters.fechaHasta) where.date.lte = filters.fechaHasta;
        }

        const transactions = await this.prisma.transaction.findMany({
            where,
            include: { asset: true },
            orderBy: { date: 'desc' },
        });

        return transactions.map((transaction) => this.toLegacyMovement(transaction));
    }

    async getPublicPortfolioMovements(portfolioId: string) {
        const portfolio = await this.getPublicPortfolioRecord(portfolioId, true);
        return (portfolio.transactions ?? []).map((transaction) => this.toLegacyMovement(transaction));
    }

    // ==================== WATCHLISTS ====================

    async getWatchlists(userId: string) {
        return this.prisma.watchlist.findMany({
            where: { userId },
            orderBy: { createdAt: 'asc' },
        });
    }

    async createWatchlist(userId: string, name: string, tickers: string) {
        if (!name || name.trim().length === 0) {
            throw new BadRequestException('El nombre de la watchlist es requerido');
        }
        return this.prisma.watchlist.create({
            data: { userId, name: name.trim(), tickers },
        });
    }

    async updateWatchlist(id: string, userId: string, data: { name?: string; tickers?: string }) {
        const existing = await this.prisma.watchlist.findFirst({ where: { id, userId } });
        if (!existing) throw new NotFoundException('Watchlist no encontrada');
        return this.prisma.watchlist.update({
            where: { id },
            data: {
                ...(data.name !== undefined && { name: data.name.trim() }),
                ...(data.tickers !== undefined && { tickers: data.tickers }),
            },
        });
    }

    async deleteWatchlist(id: string, userId: string) {
        const existing = await this.prisma.watchlist.findFirst({ where: { id, userId } });
        if (!existing) throw new NotFoundException('Watchlist no encontrada');
        await this.prisma.watchlist.delete({ where: { id } });
        return { ok: true };
    }
}
