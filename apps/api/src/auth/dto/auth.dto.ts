import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class EmailRequestDto {
    @IsEmail()
    email: string;
}

export class RegisterRequestDto {
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(3)
    @MaxLength(20)
    @Matches(/^[a-zA-Z0-9_]+$/, {
        message: 'El nombre de usuario solo puede contener letras, numeros y guiones bajos',
    })
    username: string;

    @IsString()
    @MinLength(8)
    password: string;
}

export class LoginRequestDto {
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(8)
    password: string;
}

export class EmailCodeDto extends EmailRequestDto {
    @IsString()
    @Matches(/^\d{6}$/, {
        message: 'El codigo debe tener 6 digitos',
    })
    code: string;
}

export class ForgotPasswordRequestDto extends EmailRequestDto {}

export class ForgotPasswordResetDto extends EmailCodeDto {
    @IsString()
    @MinLength(8)
    newPassword: string;
}
