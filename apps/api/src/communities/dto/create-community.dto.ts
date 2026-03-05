import { IsString, IsOptional, IsBoolean, IsNumber, IsIn, Min, IsInt } from 'class-validator';

export class CreateCommunityDto {
    @IsString()
    name: string;

    @IsString()
    description: string;

    @IsString()
    category: string; // "Acciones", "Cripto", "ETFs", "Argentina", "USA"

    @IsBoolean()
    isPaid: boolean;

    @IsNumber()
    @IsOptional()
    @Min(0)
    price?: number;

    @IsString()
    @IsOptional()
    @IsIn(['monthly', 'yearly'])
    billingType?: string;

    @IsString()
    @IsOptional()
    imageUrl?: string;

    @IsString()
    @IsOptional()
    bannerUrl?: string;

    @IsInt()
    @IsOptional()
    @Min(1)
    maxMembers?: number;
}

export class UpdateCommunityDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    category?: string;

    @IsBoolean()
    @IsOptional()
    isPaid?: boolean;

    @IsNumber()
    @IsOptional()
    @Min(0)
    price?: number;

    @IsString()
    @IsOptional()
    imageUrl?: string;

    @IsString()
    @IsOptional()
    @IsIn(['monthly', 'yearly'])
    billingType?: string;

    @IsInt()
    @IsOptional()
    @Min(1)
    maxMembers?: number;
}

export class CreateCommunityPostDto {
    @IsString()
    content: string;

    @IsString()
    @IsOptional()
    mediaUrl?: string;

    @IsBoolean()
    @IsOptional()
    isPublic?: boolean;
}

export class CreateCommunityResourceDto {
    @IsString()
    title: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    resourceUrl: string;

    @IsBoolean()
    @IsOptional()
    isPublic?: boolean;
}
