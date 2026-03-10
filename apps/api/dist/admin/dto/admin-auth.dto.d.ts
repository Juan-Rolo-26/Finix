export declare class AdminLoginDto {
    email: string;
    password: string;
}
export declare class AdminVerifyTwoFactorDto {
    token: string;
    code: string;
}
export declare class AdminRefreshDto {
    refreshToken?: string;
}
