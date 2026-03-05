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
    private getLiveQuoteMap;
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
        movements: any;
        createdAt: any;
        updatedAt: any;
    }>;
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
        movements: any;
        createdAt: any;
        updatedAt: any;
    }>;
    deletePortfolio(portfolioId: string, userId: string): Promise<{
        ok: boolean;
    }>;
    createTransaction(portfolioId: string, userId: string, dto: CreateTransactionDto): Promise<{
        asset: {
            name: string;
            id: string;
            currency: string;
            type: string;
            ticker: string;
        };
    } & {
        id: string;
        currency: string;
        createdAt: Date;
        date: Date;
        type: string;
        total: import("@prisma/client/runtime/library").Decimal;
        fee: import("@prisma/client/runtime/library").Decimal;
        portfolioId: string;
        assetId: string | null;
        quantity: import("@prisma/client/runtime/library").Decimal;
        pricePerUnit: import("@prisma/client/runtime/library").Decimal;
        notes: string | null;
    }>;
    addAsset(portfolioId: string, userId: string, dto: CreateAssetDto): Promise<{
        asset: {
            name: string;
            id: string;
            currency: string;
            type: string;
            ticker: string;
        };
    } & {
        id: string;
        currency: string;
        createdAt: Date;
        date: Date;
        type: string;
        total: import("@prisma/client/runtime/library").Decimal;
        fee: import("@prisma/client/runtime/library").Decimal;
        portfolioId: string;
        assetId: string | null;
        quantity: import("@prisma/client/runtime/library").Decimal;
        pricePerUnit: import("@prisma/client/runtime/library").Decimal;
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
    getPortfolioMetrics(portfolioId: string, userId: string): Promise<{
        capitalTotal: number;
        valorActual: number;
        gananciaTotal: number;
        variacionPorcentual: number;
        diversificacionPorClase: Record<string, number>;
        diversificacionPorActivo: Record<string, number>;
        cantidadActivos: number;
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
    getWatchlists(userId: string): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        tickers: string;
        userId: string;
    }[]>;
    createWatchlist(userId: string, name: string, tickers: string): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        tickers: string;
        userId: string;
    }>;
    updateWatchlist(id: string, userId: string, data: {
        name?: string;
        tickers?: string;
    }): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        tickers: string;
        userId: string;
    }>;
    deleteWatchlist(id: string, userId: string): Promise<{
        ok: boolean;
    }>;
}
