import { PortfolioService } from './portfolio.service';
import { CreatePortfolioDto, UpdatePortfolioDto, CreateAssetDto, UpdateAssetDto, CreateTransactionDto } from './dto/portfolio.dto';
export declare class PortfolioController {
    private portfolioService;
    constructor(portfolioService: PortfolioService);
    private resolveUserId;
    getWatchlists(req: any): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        tickers: string;
        userId: string;
    }[]>;
    createWatchlist(req: any, body: {
        name: string;
        tickers: string;
    }): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        tickers: string;
        userId: string;
    }>;
    updateWatchlist(req: any, id: string, body: {
        name?: string;
        tickers?: string;
    }): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        tickers: string;
        userId: string;
    }>;
    deleteWatchlist(req: any, id: string): Promise<{
        ok: boolean;
    }>;
    createPortfolio(req: any, dto: CreatePortfolioDto): Promise<{
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
    getUserPortfolios(req: any): Promise<{
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
    getPortfolioById(req: any, id: string): Promise<{
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
    getPortfolioMetrics(req: any, id: string): Promise<{
        capitalTotal: number;
        valorActual: number;
        gananciaTotal: number;
        variacionPorcentual: number;
        diversificacionPorClase: Record<string, number>;
        diversificacionPorActivo: Record<string, number>;
        cantidadActivos: number;
    }>;
    updatePortfolio(req: any, id: string, dto: UpdatePortfolioDto): Promise<{
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
    deletePortfolio(req: any, id: string): Promise<{
        ok: boolean;
    }>;
    addAsset(req: any, portfolioId: string, dto: CreateAssetDto): Promise<{
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
    getPortfolioAssets(req: any, portfolioId: string): Promise<{
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
    updateAsset(req: any, assetId: string, dto: UpdateAssetDto): Promise<void>;
    deleteAsset(req: any, assetId: string, portfolioId?: string): Promise<{
        ok: boolean;
        assetId: string;
        portfolioId: string;
        ticker: string;
    }>;
    getPortfolioMovements(req: any, portfolioId: string, tipoMovimiento?: string, ticker?: string, fechaDesde?: string, fechaHasta?: string): Promise<{
        id: any;
        fecha: any;
        tipoMovimiento: string;
        ticker: any;
        claseActivo: any;
        cantidad: number;
        precio: number;
        total: number;
    }[]>;
    createTransaction(req: any, portfolioId: string, dto: CreateTransactionDto): Promise<{
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
}
