export declare class RegisterRequestDto {
    email: string;
    username: string;
    password: string;
}
export declare class LoginRequestDto {
    email: string;
    password: string;
}
export declare class EmailCodeDto {
    email: string;
    code: string;
}
export declare class ForgotPasswordRequestDto {
    email: string;
}
export declare class ForgotPasswordResetDto extends EmailCodeDto {
    newPassword: string;
}
