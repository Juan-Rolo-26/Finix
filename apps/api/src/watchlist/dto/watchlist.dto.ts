import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsArray, ValidateNested, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateWatchlistDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    color?: string;
}

export class UpdateWatchlistDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    color?: string;

    @IsBoolean()
    @IsOptional()
    isArchived?: boolean;

    @IsNumber()
    @IsOptional()
    order?: number;
}

export class AddWatchlistItemDto {
    @IsString()
    @IsNotEmpty()
    symbol: string;

    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    market?: string;

    @IsString()
    @IsOptional()
    currency?: string;

    @IsString()
    @IsOptional()
    assetType?: string;

    @IsString()
    @IsOptional()
    sector?: string;

    @IsString()
    @IsOptional()
    industry?: string;

    @IsNumber()
    @IsOptional()
    targetPrice?: number;

    @IsString()
    @IsOptional()
    @IsIn(['ABOVE', 'BELOW'])
    targetDirection?: 'ABOVE' | 'BELOW';

    @IsString()
    @IsOptional()
    @IsIn(['RESEARCHING', 'WAITING_PRICE', 'EARNINGS', 'DISCARDED'])
    personalStatus?: string;

    @IsString()
    @IsOptional()
    reason?: string;

    @IsString()
    @IsOptional()
    tags?: string;

    @IsBoolean()
    @IsOptional()
    alertEnabled?: boolean;

    @IsString()
    @IsOptional()
    @IsIn(['EMAIL', 'PUSH', 'ALL'])
    alertChannel?: 'EMAIL' | 'PUSH' | 'ALL';
}

export class UpdateWatchlistItemDto {
    @IsNumber()
    @IsOptional()
    targetPrice?: number | null;

    @IsString()
    @IsOptional()
    targetDirection?: 'ABOVE' | 'BELOW' | null;

    @IsString()
    @IsOptional()
    @IsIn(['RESEARCHING', 'WAITING_PRICE', 'EARNINGS', 'DISCARDED'])
    personalStatus?: string;

    @IsString()
    @IsOptional()
    reason?: string;

    @IsString()
    @IsOptional()
    tags?: string;

    @IsNumber()
    @IsOptional()
    order?: number;

    @IsBoolean()
    @IsOptional()
    alertEnabled?: boolean;

    @IsString()
    @IsOptional()
    @IsIn(['EMAIL', 'PUSH', 'ALL'])
    alertChannel?: 'EMAIL' | 'PUSH' | 'ALL';
}

export class AddNoteDto {
    @IsString()
    @IsNotEmpty()
    content: string;
}

export class BatchImportItemDto {
    @IsString()
    @IsNotEmpty()
    symbol: string;

    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    market?: string;

    @IsNumber()
    @IsOptional()
    targetPrice?: number;

    @IsString()
    @IsOptional()
    reason?: string;

    @IsString()
    @IsOptional()
    tags?: string;

    @IsString()
    @IsOptional()
    personalStatus?: string;
}

export class BatchImportDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => BatchImportItemDto)
    items: BatchImportItemDto[];
}

export class MoveCopyItemDto {
    @IsString()
    @IsNotEmpty()
    sourceWatchlistId: string;

    @IsString()
    @IsNotEmpty()
    targetWatchlistId: string;

    @IsString()
    @IsNotEmpty()
    symbol: string;

    @IsString()
    @IsIn(['MOVE', 'COPY'])
    action: 'MOVE' | 'COPY';
}

export class ResolveSymbolsDto {
    @IsArray()
    @IsString({ each: true })
    symbols: string[];
}

export class FollowIdeaDto {
    @IsString()
    @IsIn(['UNDERVALUED', 'HEALTH', 'GROWTH', 'DIVIDEND'])
    category: string;
}
