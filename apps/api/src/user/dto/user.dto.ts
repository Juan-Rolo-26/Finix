import { IsString, IsOptional, IsBoolean, IsNumber, IsUrl, MaxLength, Min, Max } from 'class-validator';

export class UpdateProfileDto {
    @IsOptional()
    @IsString()
    @MaxLength(20)
    username?: string;

    @IsOptional()
    @IsString()
    email?: string; // Additional format validation handled in service due to Prisma conflict check

    @IsOptional()
    @IsString()
    @MaxLength(300)
    bio?: string;

    @IsOptional()
    @IsString()
    @MaxLength(2000)
    bioLong?: string;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    avatarUrl?: string;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    bannerUrl?: string;

    @IsOptional()
    @IsString()
    @MaxLength(120)
    title?: string;

    @IsOptional()
    @IsString()
    @MaxLength(120)
    company?: string;

    @IsOptional()
    @IsString()
    @MaxLength(120)
    location?: string;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    website?: string;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    linkedinUrl?: string;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    twitterUrl?: string;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    youtubeUrl?: string;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    instagramUrl?: string;

    @IsOptional()
    @IsString()
    @MaxLength(2000)
    specializations?: string;

    @IsOptional()
    @IsString()
    @MaxLength(2000)
    certifications?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(80)
    yearsExperience?: number;

    @IsOptional()
    @IsBoolean()
    isProfilePublic?: boolean;

    @IsOptional()
    @IsBoolean()
    showPortfolio?: boolean;

    @IsOptional()
    @IsBoolean()
    showStats?: boolean;

    @IsOptional()
    @IsBoolean()
    acceptingFollowers?: boolean;
}

export class ChangePasswordDto {
    @IsString()
    currentPassword?: string;

    @IsString()
    newPassword?: string;
}
