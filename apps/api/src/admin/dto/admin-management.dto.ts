import { Transform, Type } from 'class-transformer';
import {
    IsBoolean,
    Equals,
    IsDateString,
    IsIn,
    IsInt,
    IsOptional,
    IsString,
    Max,
    MaxLength,
    Min,
} from 'class-validator';

const USER_ROLES = ['USER', 'CREATOR', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN'] as const;
const USER_STATUSES = ['ACTIVE', 'BANNED'] as const;
const POST_VISIBILITY = ['VISIBLE', 'HIDDEN'] as const;
const REPORT_STATUSES = ['OPEN', 'IN_REVIEW', 'RESOLVED', 'DISMISSED'] as const;

const trimString = ({ value }: { value: unknown }) => {
    if (typeof value !== 'string') {
        return value;
    }
    return value.trim();
};

export class AdminPaginationDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit: number = 50;
}

export class AdminUsersQueryDto extends AdminPaginationDto {
    @IsOptional()
    @Transform(trimString)
    @IsString()
    @MaxLength(120)
    search?: string;

    @IsOptional()
    @Transform(trimString)
    @IsString()
    @IsIn(USER_ROLES)
    role?: string;

    @IsOptional()
    @Transform(trimString)
    @IsString()
    @IsIn(USER_STATUSES)
    status?: string;
}

export class AdminUpdateUserDto {
    @IsOptional()
    @Transform(trimString)
    @IsString()
    @IsIn(USER_STATUSES)
    status?: string;

    @IsOptional()
    @IsBoolean()
    shadowbanned?: boolean;

    @IsOptional()
    @Transform(trimString)
    @IsString()
    @IsIn(USER_ROLES)
    role?: string;
}

export class AdminPostsQueryDto extends AdminPaginationDto {
    @IsOptional()
    @Transform(trimString)
    @IsString()
    @MaxLength(200)
    search?: string;

    @IsOptional()
    @Transform(trimString)
    @IsString()
    @IsIn(POST_VISIBILITY)
    visibility?: string;

    @IsOptional()
    @Transform(trimString)
    @IsString()
    @MaxLength(50)
    type?: string;

    @IsOptional()
    @Transform(trimString)
    @IsString()
    @MaxLength(120)
    author?: string;

    @IsOptional()
    @Transform(trimString)
    @IsString()
    hasReports?: string;
}

export class AdminUpdatePostDto {
    @IsOptional()
    @Transform(trimString)
    @IsString()
    @IsIn(POST_VISIBILITY)
    visibility?: string;

    @IsOptional()
    @IsBoolean()
    deleted?: boolean;
}

export class AdminResolveReportDto {
    @IsOptional()
    @Transform(trimString)
    @IsString()
    @IsIn(REPORT_STATUSES)
    status?: string;

    @IsOptional()
    @Transform(trimString)
    @IsString()
    @MaxLength(500)
    resolutionNote?: string;
}

export class AdminAuditLogsQueryDto extends AdminPaginationDto {
    @IsOptional()
    @Transform(trimString)
    @IsString()
    @MaxLength(80)
    action?: string;

    @IsOptional()
    @Transform(trimString)
    @IsString()
    @MaxLength(80)
    adminId?: string;

    @IsOptional()
    @IsDateString()
    from?: string;

    @IsOptional()
    @IsDateString()
    to?: string;
}

export class AdminSendProEmailDto {
    @Transform(trimString)
    @IsString()
    @MaxLength(160)
    subject: string;

    @Transform(trimString)
    @IsString()
    @MaxLength(160)
    title: string;

    @Transform(trimString)
    @IsString()
    @MaxLength(8000)
    message: string;

    @IsOptional()
    @Transform(trimString)
    @IsString()
    @MaxLength(1000)
    imageUrl?: string;

    @IsOptional()
    @Transform(trimString)
    @IsString()
    @MaxLength(80)
    ctaLabel?: string;

    @IsOptional()
    @Transform(trimString)
    @IsString()
    @MaxLength(1000)
    ctaUrl?: string;

    @Equals(true, { message: 'Debés confirmar el envío a usuarios PRO' })
    confirm: boolean;
}
