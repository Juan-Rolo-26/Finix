export interface PortfolioAsset {
    id: string;
    ticker: string;
    tipoActivo: string;
    montoInvertido: number;
    ppc: number;
    cantidad: number;
    precioActual?: number;
}

export interface PortfolioMovement {
    id: string;
    fecha: string;
    tipoMovimiento: string;
    ticker: string;
    claseActivo: string;
    cantidad: number;
    precio: number;
    total: number;
}

export interface PortfolioData {
    id: string;
    nombre: string;
    monedaBase: string;
    nivelRiesgo: string;
    esPrincipal: boolean;
    modoSocial: boolean;
    assets: PortfolioAsset[];
}

export interface PortfolioMetricsData {
    capitalTotal: number;
    capitalInvertido?: number;
    assetsValue?: number;
    cashBalance?: number;
    valorActual: number;
    totalValue?: number;
    gananciaTotal: number;
    variacionPorcentual: number;
    diversificacionPorClase: Record<string, number>;
    diversificacionPorActivo: Record<string, number>;
    cantidadActivos: number;
    retornosMensuales?: Array<{
        monthKey: string;
        label: string;
        value: number;
    }>;
}

