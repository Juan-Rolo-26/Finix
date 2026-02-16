"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PortfolioService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const market_service_1 = require("../market/market.service");
const normalizeAssetType = (value) => {
    if (!value)
        return undefined;
    return value.trim().toUpperCase().replace(/\s+/g, '_');
};
const MOVEMENT_TYPE_TO_DB = {
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
const DB_TYPE_TO_MOVEMENT = {
    BUY: 'compra',
    SELL: 'venta',
    DIVIDEND: 'dividendo',
    FEE: 'fee',
    DEPOSIT: 'deposito',
    WITHDRAW: 'retiro',
};
let PortfolioService = class PortfolioService {
    constructor(prisma, marketService) {
        this.prisma = prisma;
        this.marketService = marketService;
    }
    async assertPortfolioOwner(portfolioId, userId) {
        const portfolio = await this.prisma.portfolio.findFirst({
            where: { id: portfolioId, userId },
            select: { id: true },
        });
        if (!portfolio) {
            throw new common_1.NotFoundException('Portafolio no encontrado');
        }
    }
    normalizeMovementType(value) {
        if (!value)
            return undefined;
        return MOVEMENT_TYPE_TO_DB[value.trim().toLowerCase()];
    }
    normalizeTicker(value) {
        return String(value || '').trim().toUpperCase();
    }
    async getLiveQuoteMap(holdings) {
        const quoteMap = new Map();
        const tickers = Array.from(new Set(holdings
            .map((holding) => this.normalizeTicker(holding?.asset?.ticker))
            .filter(Boolean)));
        if (tickers.length === 0) {
            return quoteMap;
        }
        try {
            const quotes = await this.marketService.getQuotes(tickers);
            quotes.forEach((quote) => {
                const key = this.normalizeTicker(quote.inputSymbol);
                if (!key)
                    return;
                quoteMap.set(key, quote);
            });
        }
        catch (error) {
            console.error('[PortfolioService] Failed to load live quotes:', error);
        }
        return quoteMap;
    }
    toLegacyAsset(holding, portfolioCreatedAt, quoteMap) {
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
    toLegacyMovement(transaction) {
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
    toLegacyPortfolio(portfolio, quoteMap) {
        const assets = (portfolio.holdings ?? []).map((holding) => this.toLegacyAsset(holding, portfolio.createdAt, quoteMap));
        const movements = (portfolio.transactions ?? []).map((transaction) => this.toLegacyMovement(transaction));
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
    async createPortfolio(userId, dto) {
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
    async getUserPortfolios(userId) {
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
    async getPortfolioById(portfolioId, userId) {
        const portfolio = await this.prisma.portfolio.findFirst({
            where: { id: portfolioId, userId },
            include: {
                holdings: { include: { asset: true } },
                transactions: { include: { asset: true }, orderBy: { date: 'desc' }, take: 200 },
            },
        });
        if (!portfolio) {
            throw new common_1.NotFoundException('Portafolio no encontrado');
        }
        const quoteMap = await this.getLiveQuoteMap(portfolio.holdings ?? []);
        return this.toLegacyPortfolio(portfolio, quoteMap);
    }
    async updatePortfolio(portfolioId, userId, dto) {
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
    async deletePortfolio(portfolioId, userId) {
        await this.assertPortfolioOwner(portfolioId, userId);
        await this.prisma.portfolio.delete({
            where: { id: portfolioId },
        });
        return { ok: true };
    }
    async createTransaction(portfolioId, userId, dto) {
        const portfolio = await this.prisma.portfolio.findFirst({
            where: { id: portfolioId, userId },
        });
        if (!portfolio) {
            throw new common_1.NotFoundException('Portafolio no encontrado');
        }
        const quantity = Number(dto.quantity);
        const price = Number(dto.price || 0);
        const fee = Number(dto.fee || 0);
        if (!Number.isFinite(quantity) || quantity <= 0) {
            throw new common_1.BadRequestException('La cantidad debe ser mayor a 0');
        }
        if ((dto.type === 'BUY' || dto.type === 'SELL') && (!Number.isFinite(price) || price <= 0)) {
            throw new common_1.BadRequestException('El precio debe ser mayor a 0 para compras/ventas');
        }
        const cleanedTicker = (dto.assetTicker || '').trim();
        const normalizedTicker = cleanedTicker.toUpperCase();
        const normalizedType = normalizeAssetType(dto.assetType);
        const normalizedName = dto.assetName?.trim();
        let asset = null;
        const shouldUseAsset = dto.type === 'BUY' || dto.type === 'SELL' || Boolean(normalizedTicker);
        if (shouldUseAsset) {
            if (!normalizedTicker) {
                throw new common_1.BadRequestException('assetTicker es requerido para este tipo de transacción');
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
            }
            else if (normalizedName || normalizedType) {
                const updates = {};
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
        if (dto.type === 'BUY') {
            total = (quantity * price) + fee;
        }
        else if (dto.type === 'SELL') {
            total = (quantity * price) - fee;
        }
        else {
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
            }
            else {
                const currentQty = holding ? Number(holding.quantity) : 0;
                if (currentQty < quantity) {
                    throw new common_1.BadRequestException('Saldo insuficiente. Venta en corto no habilitada.');
                }
                const remainingQty = currentQty - quantity;
                if (remainingQty <= 0) {
                    await this.prisma.holding.delete({
                        where: { portfolioId_assetId: { portfolioId, assetId: asset.id } },
                    });
                }
                else {
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
            if (dto.type === 'BUY')
                cashChange = -total;
            if (dto.type === 'SELL')
                cashChange = total;
            if (dto.type === 'DIVIDEND')
                cashChange = total;
            if (dto.type === 'DEPOSIT')
                cashChange = total;
            if (dto.type === 'WITHDRAW')
                cashChange = -total;
            if (dto.type === 'FEE')
                cashChange = -total;
            await this.prisma.cashAccount.update({
                where: { id: account.id },
                data: { balance: { increment: cashChange } },
            });
        }
        return transaction;
    }
    async addAsset(portfolioId, userId, dto) {
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
    async getPortfolioAssets(portfolioId, userId) {
        await this.assertPortfolioOwner(portfolioId, userId);
        const holdings = await this.prisma.holding.findMany({
            where: { portfolioId },
            include: { asset: true },
        });
        const quoteMap = await this.getLiveQuoteMap(holdings);
        return holdings.map((holding) => this.toLegacyAsset(holding, undefined, quoteMap));
    }
    async deleteAsset(assetId, userId, portfolioId) {
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
            throw new common_1.NotFoundException('Activo no encontrado en tus portafolios');
        }
        if (!portfolioId && holdings.length > 1) {
            throw new common_1.BadRequestException('Debes indicar portfolioId para eliminar un activo repetido en varios portafolios.');
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
    async getPortfolioMetrics(portfolioId, userId) {
        const portfolio = await this.prisma.portfolio.findFirst({
            where: { id: portfolioId, userId },
            include: {
                holdings: { include: { asset: true } },
            },
        });
        if (!portfolio) {
            throw new common_1.NotFoundException('Portafolio no encontrado');
        }
        const quoteMap = await this.getLiveQuoteMap(portfolio.holdings ?? []);
        let capitalTotal = 0;
        let valorActual = 0;
        let gananciaTotal = 0;
        const diversificacionPorClase = {};
        const diversificacionPorActivo = {};
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
    async updateAsset(assetId, userId, dto) {
        throw new common_1.BadRequestException('Update Asset not supported. Use Transactions to adjust.');
    }
    async getPortfolioMovements(portfolioId, userId, filters) {
        await this.assertPortfolioOwner(portfolioId, userId);
        const where = { portfolioId };
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
            if (filters.fechaDesde)
                where.date.gte = filters.fechaDesde;
            if (filters.fechaHasta)
                where.date.lte = filters.fechaHasta;
        }
        const transactions = await this.prisma.transaction.findMany({
            where,
            include: { asset: true },
            orderBy: { date: 'desc' },
        });
        return transactions.map((transaction) => this.toLegacyMovement(transaction));
    }
};
exports.PortfolioService = PortfolioService;
exports.PortfolioService = PortfolioService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        market_service_1.MarketService])
], PortfolioService);
//# sourceMappingURL=portfolio.service.js.map