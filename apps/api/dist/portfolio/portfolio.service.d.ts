import { PrismaService } from '../prisma.service';
import { CreatePortfolioDto, UpdatePortfolioDto, CreateAssetDto, UpdateAssetDto, CreateTransactionDto } from './dto/portfolio.dto';
import { MarketService } from '../market/market.service';
export declare class PortfolioService {
    private prisma;
    private marketService;
    constructor(prisma: PrismaService, marketService: MarketService);
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
}
