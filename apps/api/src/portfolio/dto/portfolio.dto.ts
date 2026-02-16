export class CreatePortfolioDto {
    nombre: string;
    descripcion?: string;
    objetivo?: string;
    monedaBase?: string;
    nivelRiesgo?: string;
    modoSocial?: boolean;
    esPrincipal?: boolean;
    admiteBienesRaices?: boolean;
}

export class UpdatePortfolioDto {
    nombre?: string;
    descripcion?: string;
    objetivo?: string;
    monedaBase?: string;
    nivelRiesgo?: string;
    modoSocial?: boolean;
    esPrincipal?: boolean;
    admiteBienesRaices?: boolean;
}

export class CreateAssetDto {
    ticker: string;
    tipoActivo: string;
    cantidad: number;
    precio: number;
    precioActual?: number;
}

export class UpdateAssetDto {
    ticker?: string;
    tipoActivo?: string;
    montoInvertido?: number;
    ppc?: number;
    precioActual?: number;
}

export class CreateTransactionDto {
    assetTicker: string;
    assetName?: string;
    assetType?: string;
    assetExchange?: string;
    type: 'BUY' | 'SELL' | 'DIVIDEND' | 'FEE' | 'DEPOSIT' | 'WITHDRAW';
    date?: string | Date;
    quantity: number;
    price: number;
    fee?: number;
    currency: string;
    notes?: string;
    updateCash?: boolean;
}
