import { Type } from 'class-transformer';
import { IsBoolean, IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreatePortfolioDto {
    @IsString()
    nombre: string;

    @IsOptional()
    @IsString()
    descripcion?: string;

    @IsOptional()
    @IsString()
    objetivo?: string;

    @IsOptional()
    @IsString()
    monedaBase?: string;

    @IsOptional()
    @IsString()
    nivelRiesgo?: string;

    @IsOptional()
    @IsBoolean()
    modoSocial?: boolean;

    @IsOptional()
    @IsBoolean()
    esPrincipal?: boolean;

    @IsOptional()
    @IsBoolean()
    admiteBienesRaices?: boolean;
}

export class UpdatePortfolioDto {
    @IsOptional()
    @IsString()
    nombre?: string;

    @IsOptional()
    @IsString()
    descripcion?: string;

    @IsOptional()
    @IsString()
    objetivo?: string;

    @IsOptional()
    @IsString()
    monedaBase?: string;

    @IsOptional()
    @IsString()
    nivelRiesgo?: string;

    @IsOptional()
    @IsBoolean()
    modoSocial?: boolean;

    @IsOptional()
    @IsBoolean()
    esPrincipal?: boolean;

    @IsOptional()
    @IsBoolean()
    admiteBienesRaices?: boolean;
}

export class CreateAssetDto {
    @IsString()
    ticker: string;

    @IsString()
    tipoActivo: string;

    @Type(() => Number)
    @IsNumber()
    @Min(0)
    cantidad: number;

    @Type(() => Number)
    @IsNumber()
    @Min(0)
    precio: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    precioActual?: number;
}

export class UpdateAssetDto {
    @IsOptional()
    @IsString()
    ticker?: string;

    @IsOptional()
    @IsString()
    tipoActivo?: string;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    montoInvertido?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    ppc?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    precioActual?: number;
}

export class CreateTransactionDto {
    @IsString()
    assetTicker: string;

    @IsOptional()
    @IsString()
    assetName?: string;

    @IsOptional()
    @IsString()
    assetType?: string;

    @IsOptional()
    @IsString()
    assetExchange?: string;

    @IsIn(['BUY', 'SELL', 'DIVIDEND', 'FEE', 'DEPOSIT', 'WITHDRAW'])
    type: 'BUY' | 'SELL' | 'DIVIDEND' | 'FEE' | 'DEPOSIT' | 'WITHDRAW';

    @IsOptional()
    @IsString()
    date?: string | Date;

    @Type(() => Number)
    @IsNumber()
    @Min(0)
    quantity: number;

    @Type(() => Number)
    @IsNumber()
    @Min(0)
    price: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    fee?: number;

    @IsString()
    currency: string;

    @IsOptional()
    @IsString()
    notes?: string;

    @IsOptional()
    @IsBoolean()
    updateCash?: boolean;
}
