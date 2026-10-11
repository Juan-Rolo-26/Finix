import { IsString, IsOptional, IsEnum, IsBoolean, IsInt, IsArray } from 'class-validator';

export enum EducationLevelDto {
    BEGINNER = 'BEGINNER',
    INTERMEDIATE = 'INTERMEDIATE',
    ADVANCED = 'ADVANCED',
}

export enum EducationStatusDto {
    DRAFT = 'DRAFT',
    PUBLISHED = 'PUBLISHED',
    ARCHIVED = 'ARCHIVED',
}

export class CreateArticleDto {
    @IsString()
    title: string;

    @IsString()
    @IsOptional()
    slug?: string;

    @IsString()
    summary: string;

    @IsString()
    content: string;

    @IsString()
    categoryId: string;

    @IsString()
    @IsOptional()
    subcategoryId?: string;

    @IsEnum(EducationLevelDto)
    @IsOptional()
    level?: EducationLevelDto;

    @IsEnum(EducationStatusDto)
    @IsOptional()
    status?: EducationStatusDto;

    @IsBoolean()
    @IsOptional()
    isFeatured?: boolean;

    @IsInt()
    @IsOptional()
    readTimeMinutes?: number;

    @IsInt()
    @IsOptional()
    order?: number;

    @IsString()
    @IsOptional()
    formula?: string;

    @IsString()
    @IsOptional()
    interactiveWidget?: string;

    @IsArray()
    @IsOptional()
    keyTakeaways?: string[];

    @IsArray()
    @IsOptional()
    commonMistakes?: string[];

    @IsOptional()
    prosCons?: { pros: string[]; cons: string[] };

    @IsString()
    @IsOptional()
    practicalExample?: string;

    @IsArray()
    @IsOptional()
    sources?: any[];

    @IsArray()
    @IsOptional()
    relatedArticleIds?: string[];

    @IsString()
    @IsOptional()
    seoTitle?: string;

    @IsString()
    @IsOptional()
    seoDescription?: string;
}

export class UpdateArticleDto extends CreateArticleDto {}
