import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsObject, MaxLength } from 'class-validator';

export class CreateChartAnalysisDto {
    @IsString()
    @IsNotEmpty()
    symbol: string;

    @IsString()
    @IsOptional()
    exchange?: string;

    @IsString()
    @IsNotEmpty()
    timeframe: string;

    @IsString()
    @IsOptional()
    @MaxLength(120)
    title?: string;

    @IsString()
    @IsOptional()
    @MaxLength(2000)
    description?: string;

    @IsObject()
    @IsNotEmpty()
    chartState: Record<string, any>;

    @IsBoolean()
    @IsOptional()
    isPublic?: boolean;
}

export class UpdateChartAnalysisDto {
    @IsString()
    @IsOptional()
    @MaxLength(120)
    title?: string;

    @IsString()
    @IsOptional()
    @MaxLength(2000)
    description?: string;

    @IsString()
    @IsOptional()
    symbol?: string;

    @IsString()
    @IsOptional()
    exchange?: string;

    @IsString()
    @IsOptional()
    timeframe?: string;

    @IsObject()
    @IsOptional()
    chartState?: Record<string, any>;

    @IsBoolean()
    @IsOptional()
    isPublic?: boolean;
}

export class CreateChartVersionDto {
    @IsObject()
    @IsOptional()
    chartState?: Record<string, any>;
}

export class ForkChartAnalysisDto {
    @IsString()
    @IsOptional()
    @MaxLength(120)
    newTitle?: string;
}
