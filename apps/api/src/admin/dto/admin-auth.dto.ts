import { IsEmail, IsOptional, IsString, Length, MinLength } from 'class-validator';

export class AdminLoginDto {
    @IsEmail()
    email!: string;

    @IsString()
    @MinLength(8)
    password!: string;
}

export class AdminVerifyTwoFactorDto {
    @IsString()
    token!: string;

    @IsString()
    @Length(6, 6)
    code!: string;
}

export class AdminRefreshDto {
    @IsOptional()
    @IsString()
    refreshToken?: string;
}
