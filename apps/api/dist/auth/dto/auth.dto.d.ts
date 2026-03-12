export declare class EmailRequestDto {
    email: string;
}
export declare class RegisterRequestDto {
    email: string;
    username: string;
    password: string;
}
export declare class LoginRequestDto {
    email: string;
    password: string;
}
export declare class EmailCodeDto extends EmailRequestDto {
    code: string;
}
export declare class ForgotPasswordRequestDto extends EmailRequestDto {
}
export declare class ForgotPasswordResetDto extends EmailCodeDto {
    newPassword: string;
}
