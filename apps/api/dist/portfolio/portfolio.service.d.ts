import { PrismaService } from '../prisma.service';
import { CreatePortfolioDto, UpdatePortfolioDto, CreateAssetDto, UpdateAssetDto, CreateTransactionDto } from './dto/portfolio.dto';
import { MarketService } from '../market/market.service';
import { AccessControlService } from '../access/access-control.service';
export declare class PortfolioService {
    private prisma;
    private marketService;
    private accessControlService;
    constructor(prisma: PrismaService, marketService: MarketService, accessControlService: AccessControlService);
    private assertPortfolioOwner;
    private normalizeMovementType;
    private normalizeTicker;
    private normalizeCurrency;
    private sortTransactionsChronologically;
    private addToBalanceMap;
    private sumBalanceMap;
    private getTransactionCashDelta;
    private getLiveQuoteMap;
    private toMonthKey;
    private shiftUtcMonth;
    private getTrailingMonthlyWindows;
    private getHistoricalMonthEndPriceMap;
    private getHistoricalMonthEndPriceMaps;
    private buildCurrentHoldingMap;
    private buildCurrentCashMap;
    private buildBaselineHoldingMap;
    private buildBaselineCashMap;
    private buildSyntheticFundingEvents;
    private buildCashEventTimeline;
    private buildHoldingMapAtDate;
    private buildCashMapAtDate;
    private buildHoldingCostMap;
    private calculatePortfolioValueForMonth;
    private buildEffectiveCashState;
    private buildFallbackPriceMap;
    private buildMonthlyReturns;
    private toLegacyAsset;
    private toLegacyMovement;
    private toLegacyPortfolio;
    createPortfolio(userId: string, dto: CreatePortfolioDto): Promise<{
        id: any;
        nombre: any;
        descripcion: any;
        objetivo: any;
        monedaBase: any;
        nivelRiesgo: any;
        modoSocial: any;
        esPrincipal: any;
        admiteBienesRaices: any;
        assets: any;
        cash: number;
        cashBalance: number;
        cashByCurrency: {
            [k: string]: number;
        };
        cashAccounts: {
            currency: string;
            balance: number;
        }[];
        assetsValue: number;
        totalValue: number;
        movements: any;
        createdAt: any;
        updatedAt: any;
    }>;
    getUserPortfolios(userId: string): Promise<{
        id: any;
        nombre: any;
        descripcion: any;
        objetivo: any;
        monedaBase: any;
        nivelRiesgo: any;
        modoSocial: any;
        esPrincipal: any;
        admiteBienesRaices: any;
        assets: any;
        cash: number;
        cashBalance: number;
        cashByCurrency: {
            [k: string]: number;
        };
        cashAccounts: {
            currency: string;
            balance: number;
        }[];
        assetsValue: number;
        totalValue: number;
        movements: any;
        createdAt: any;
        updatedAt: any;
    }[]>;
    private canExposePortfoliosPublicly;
    private getVisiblePublicPortfolioRecords;
    getPublicPortfolios(userId: string): Promise<{
        id: any;
        nombre: any;
        descripcion: any;
        objetivo: any;
        monedaBase: any;
        nivelRiesgo: any;
        modoSocial: any;
        esPrincipal: any;
        admiteBienesRaices: any;
        assets: any;
        cash: number;
        cashBalance: number;
        cashByCurrency: {
            [k: string]: number;
        };
        cashAccounts: {
            currency: string;
            balance: number;
        }[];
        assetsValue: number;
        totalValue: number;
        movements: any;
        createdAt: any;
        updatedAt: any;
    }[]>;
    getPortfolioById(portfolioId: string, userId: string): Promise<{
        id: any;
        nombre: any;
        descripcion: any;
        objetivo: any;
        monedaBase: any;
        nivelRiesgo: any;
        modoSocial: any;
        esPrincipal: any;
        admiteBienesRaices: any;
        assets: any;
        cash: number;
        cashBalance: number;
        cashByCurrency: {
            [k: string]: number;
        };
        cashAccounts: {
            currency: string;
            balance: number;
        }[];
        assetsValue: number;
        totalValue: number;
        movements: any;
        createdAt: any;
        updatedAt: any;
    }>;
    private getPublicPortfolioRecord;
    updatePortfolio(portfolioId: string, userId: string, dto: UpdatePortfolioDto): Promise<{
        id: any;
        nombre: any;
        descripcion: any;
        objetivo: any;
        monedaBase: any;
        nivelRiesgo: any;
        modoSocial: any;
        esPrincipal: any;
        admiteBienesRaices: any;
        assets: any;
        cash: number;
        cashBalance: number;
        cashByCurrency: {
            [k: string]: number;
        };
        cashAccounts: {
            currency: string;
            balance: number;
        }[];
        assetsValue: number;
        totalValue: number;
        movements: any;
        createdAt: any;
        updatedAt: any;
    }>;
    deletePortfolio(portfolioId: string, userId: string): Promise<{
        ok: boolean;
    }>;
    createTransaction(portfolioId: string, userId: string, dto: CreateTransactionDto): Promise<{
        asset: {
            id: string;
            name: string;
            type: string;
            currency: string;
            ticker: string;
        };
    } & {
        id: string;
        createdAt: Date;
        date: Date;
        portfolioId: string;
        assetId: string | null;
        type: string;
        quantity: import("@prisma/client/runtime/library").Decimal;
        pricePerUnit: import("@prisma/client/runtime/library").Decimal;
        fee: import("@prisma/client/runtime/library").Decimal;
        total: import("@prisma/client/runtime/library").Decimal;
        currency: string;
        notes: string | null;
    }>;
    addAsset(portfolioId: string, userId: string, dto: CreateAssetDto): Promise<{
        asset: {
            id: string;
            name: string;
            type: string;
            currency: string;
            ticker: string;
        };
    } & {
        id: string;
        createdAt: Date;
        date: Date;
        portfolioId: string;
        assetId: string | null;
        type: string;
        quantity: import("@prisma/client/runtime/library").Decimal;
        pricePerUnit: import("@prisma/client/runtime/library").Decimal;
        fee: import("@prisma/client/runtime/library").Decimal;
        total: import("@prisma/client/runtime/library").Decimal;
        currency: string;
        notes: string | null;
    }>;
    getPortfolioAssets(portfolioId: string, userId: string): Promise<{
        id: any;
        ticker: any;
        tipoActivo: any;
        cantidad: number;
        ppc: number;
        montoInvertido: number;
        precioActual: number;
        value: number;
        precioTiempoReal: boolean;
        precioFuente: string;
        precioActualizadoEn: string;
        createdAt: string;
    }[]>;
    deleteAsset(assetId: string, userId: string, portfolioId?: string): Promise<{
        ok: boolean;
        assetId: string;
        portfolioId: string;
        ticker: string;
    }>;
    private buildPortfolioMetrics;
    getPortfolioMetrics(portfolioId: string, userId: string): Promise<{
        capitalTotal: number;
        capitalInvertido: number;
        assetsValue: number;
        cashBalance: number;
        cashByCurrency: {
            [k: string]: number;
        };
        valorActual: number;
        totalValue: number;
        gananciaTotal: number;
        variacionPorcentual: number;
        diversificacionPorClase: Record<string, number>;
        diversificacionPorActivo: Record<string, number>;
        cantidadActivos: number;
        retornosMensuales: {
            monthKey: string;
            label: string;
            value: number;
        }[];
    }>;
    getPublicPortfolioMetrics(portfolioId: string): Promise<{
        capitalTotal: number;
        capitalInvertido: number;
        assetsValue: number;
        cashBalance: number;
        cashByCurrency: {
            [k: string]: number;
        };
        valorActual: number;
        totalValue: number;
        gananciaTotal: number;
        variacionPorcentual: number;
        diversificacionPorClase: Record<string, number>;
        diversificacionPorActivo: Record<string, number>;
        cantidadActivos: number;
        retornosMensuales: {
            monthKey: string;
            label: string;
            value: number;
        }[];
    }>;
    updateAsset(assetId: string, userId: string, dto: UpdateAssetDto): Promise<void>;
    getPortfolioMovements(portfolioId: string, userId: string, filters?: any): Promise<{
        id: any;
        fecha: any;
        tipoMovimiento: string;
        ticker: any;
        claseActivo: any;
        cantidad: number;
        precio: number;
        total: number;
    }[]>;
    getPublicPortfolioMovements(portfolioId: string): Promise<{
        id: any;
        fecha: any;
        tipoMovimiento: string;
        ticker: any;
        claseActivo: any;
        cantidad: number;
        precio: number;
        total: number;
    }[]>;
    getWatchlists(userId: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        name: string;
        tickers: string;
    }[]>;
    createWatchlist(userId: string, name: string, tickers: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        name: string;
        tickers: string;
    }>;
    updateWatchlist(id: string, userId: string, data: {
        name?: string;
        tickers?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        name: string;
        tickers: string;
    }>;
    deleteWatchlist(id: string, userId: string): Promise<{
        ok: boolean;
    }>;
}
