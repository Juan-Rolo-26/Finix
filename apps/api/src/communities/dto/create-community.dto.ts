import { IsString, IsOptional, IsBoolean, IsNumber, IsIn, Min, IsInt, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CommunityPlanDto {
    @IsString()
    name: string;

    @IsNumber()
    @Min(0)
    price: number;

    @IsString()
    @IsIn(['monthly', 'yearly', 'one_time'])
    interval: string;

    @IsArray()
    @IsString({ each: true })
    features: string[];

    @IsInt()
    @Min(0)
    tierLevel: number;
}

export class CreateCommunityDto {
    @IsString()
    name: string;

    @IsString()
    description: string;

    @IsString()
    category: string;

    @IsString()
    @IsOptional()
    @IsIn(['PUBLIC', 'PRIVATE', 'EXCLUSIVE'])
    privacyType?: string;

    @IsString()
    @IsOptional()
    rules?: string;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CommunityPlanDto)
    plans?: CommunityPlanDto[];

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

    @IsString()
    @IsOptional()
    @IsIn(['PUBLIC', 'PRIVATE', 'EXCLUSIVE'])
    privacyType?: string;

    @IsString()
    @IsOptional()
    rules?: string;

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

export class CreateCommunityPostDto {
    @IsString()
    content: string;

    @IsArray()
    @IsOptional()
    @ValidateNested({ each: true })
    mediaUrls?: Record<string, string>[];

    @IsString()
    @IsOptional()
    @IsIn(['PUBLIC', 'MEMBERS', 'PREMIUM_TIER'])
    targetVisibility?: string;

    @IsInt()
    @IsOptional()
    requiredTierLevel?: number;
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

    @IsInt()
    @IsOptional()
    requiredTierLevel?: number;
}

export class CreateEventDto {
    @IsString()
    title: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    date: string;

    @IsString()
    @IsOptional()
    link?: string;
}
