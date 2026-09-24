import { IsString, IsOptional, IsBoolean, IsNumber, IsIn, Min, IsInt, IsArray, ValidateNested, MaxLength } from 'class-validator';
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
    @IsOptional()
    slug?: string;

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

    @IsString()
    @IsOptional()
    accentColor?: string;

    @IsString()
    @IsOptional()
    tags?: string;

    @IsBoolean()
    @IsOptional()
    showContentBeforeJoin?: boolean;

    @IsString()
    @IsOptional()
    @IsIn(['DRAFT', 'PUBLISHED'])
    status?: string;

    @IsInt()
    @IsOptional()
    @Min(1)
    maxMembers?: number;

    @IsString()
    @IsOptional()
    paymentGatewayConfig?: string;
}

export class UpdateCommunityDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    slug?: string;

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

    @IsString()
    @IsOptional()
    accentColor?: string;

    @IsString()
    @IsOptional()
    tags?: string;

    @IsBoolean()
    @IsOptional()
    showContentBeforeJoin?: boolean;

    @IsString()
    @IsOptional()
    @IsIn(['DRAFT', 'PUBLISHED', 'SUSPENDED', 'ARCHIVED'])
    status?: string;

    @IsBoolean()
    @IsOptional()
    isFeatured?: boolean;

    @IsInt()
    @IsOptional()
    @Min(1)
    maxMembers?: number;
}

export class CreateCommunityPostDto {
    @IsString()
    @MaxLength(1000)
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

    @IsString()
    @IsOptional()
    sectionId?: string;

    @IsBoolean()
    @IsOptional()
    isPinned?: boolean;
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

// ─── Sections DTOs ─────────────────────────────────────────────────────────────

export class CreateSectionDto {
    @IsString()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    icon?: string;

    @IsInt()
    @IsOptional()
    order?: number;

    @IsString()
    @IsOptional()
    @IsIn(['PUBLIC', 'MEMBERS_ONLY', 'PREMIUM'])
    visibility?: string;
}

export class UpdateSectionDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    icon?: string;

    @IsInt()
    @IsOptional()
    order?: number;

    @IsString()
    @IsOptional()
    @IsIn(['PUBLIC', 'MEMBERS_ONLY', 'PREMIUM'])
    visibility?: string;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}

export class ReorderSectionsDto {
    @IsArray()
    @IsString({ each: true })
    sectionIds: string[];
}

// ─── Moderation & Reports DTOs ─────────────────────────────────────────────────

export class CreateReportDto {
    @IsString()
    @IsIn(['POST', 'COMMENT', 'USER'])
    targetType: string;

    @IsString()
    targetId: string;

    @IsString()
    @IsIn(['SPAM', 'FRAUD', 'INAPPROPRIATE', 'FAKE_INFO', 'HARASSMENT', 'ADVERTISING', 'OTHER'])
    reason: string;

    @IsString()
    @IsOptional()
    details?: string;
}

export class ResolveReportDto {
    @IsString()
    @IsIn(['RESOLVED', 'DISMISSED'])
    status: string;

    @IsString()
    @IsOptional()
    @IsIn(['NONE', 'DELETED', 'HIDDEN', 'WARNED', 'MUTED', 'BANNED'])
    actionTaken?: string;
}

// ─── Join Requests & Invites DTOs ──────────────────────────────────────────────

export class CreateJoinRequestDto {
    @IsString()
    @IsOptional()
    note?: string;
}

export class ReviewJoinRequestDto {
    @IsString()
    @IsIn(['APPROVED', 'REJECTED'])
    status: string;
}

export class CreateInviteDto {
    @IsInt()
    @IsOptional()
    @Min(1)
    maxUses?: number;

    @IsInt()
    @IsOptional()
    expiresInDays?: number;
}

export class ManageMemberDto {
    @IsString()
    @IsIn(['MEMBER', 'MODERATOR', 'ADMIN'])
    role: string;
}

export class SubscribeCommunityDto {
    @IsString()
    planId: string;

    @IsString()
    @IsOptional()
    @IsIn(['stripe', 'mercadopago', 'card'])
    provider?: string;
}

export class PayWithCardDto {
    @IsString()
    planId: string;

    @IsString()
    cardNumber: string;

    @IsString()
    cardholderName: string;

    @IsString()
    expiryDate: string;

    @IsString()
    cvc: string;

    @IsString()
    @IsOptional()
    identificationNumber?: string;

    @IsString()
    @IsOptional()
    brand?: string;
}
