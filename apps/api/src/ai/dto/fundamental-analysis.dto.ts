import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

export class FundamentalDataDto {
    @Type(() => Number)
    @IsNumber()
    marketCap: number;

    @Type(() => Number)
    @IsNumber()
    peRatio: number;

    @Type(() => Number)
    @IsNumber()
    roe: number;

    @Type(() => Number)
    @IsNumber()
    roic: number;

    @Type(() => Number)
    @IsNumber()
    debtToEquity: number;

    @Type(() => Number)
    @IsNumber()
    revenueGrowth: number;

    @Type(() => Number)
    @IsNumber()
    freeCashFlow: number;
}

export class FundamentalAnalysisDto {
    @IsString()
    @IsNotEmpty()
    ticker: string;

    @ValidateNested()
    @Type(() => FundamentalDataDto)
    fundamentalData: FundamentalDataDto;

    @IsOptional()
    @IsString()
    model?: string;
}
