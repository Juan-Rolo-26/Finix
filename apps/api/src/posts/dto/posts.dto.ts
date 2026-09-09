import { IsString, IsOptional, IsArray, IsEnum, MaxLength, ArrayMaxSize, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export enum PostType {
    TEXT = 'TEXT',
    ANALYSIS = 'ANALYSIS',
    ALERT = 'ALERT',
    QUESTION = 'QUESTION'
}

export enum AnalysisType {
    TECHNICAL = 'TECHNICAL',
    FUNDAMENTAL = 'FUNDAMENTAL',
    MACRO = 'MACRO'
}

export enum RiskLevel {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH'
}

export class MediaUrlDto {
    @IsString()
    url: string;

    @IsString()
    mediaType: string;
}

export class CreatePostDto {
    @IsString()
    @MaxLength(5000)
    content: string;

    @IsOptional()
    @IsEnum(PostType)
    type?: PostType;

    @IsOptional()
    @IsString()
    @MaxLength(20)
    assetSymbol?: string;

    @IsOptional()
    @IsEnum(AnalysisType)
    analysisType?: AnalysisType;

    @IsOptional()
    @IsEnum(RiskLevel)
    riskLevel?: RiskLevel;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    @ArrayMaxSize(10)
    tickers?: string[];

    @IsOptional()
    @IsArray()
    @ArrayMaxSize(4)
    @ValidateNested({ each: true })
    @Type(() => MediaUrlDto)
    mediaUrls?: MediaUrlDto[];

    @IsOptional()
    @IsString()
    parentId?: string;

    @IsOptional()
    @IsString()
    quotedPostId?: string;
}

export class UpdatePostDto {
    @IsString()
    @MaxLength(5000)
    content: string;
}

export class AddCommentDto {
    @IsString()
    @MaxLength(1000)
    content: string;

    @IsOptional()
    @IsString()
    parentId?: string;
}

export class ReportPostDto {
    @IsString()
    @MaxLength(500)
    reason: string;
}
