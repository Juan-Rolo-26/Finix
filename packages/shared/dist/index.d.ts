import { z } from 'zod';
export declare const UserRole: {
    readonly USER: "USER";
    readonly INFLUENCER: "INFLUENCER";
    readonly MODERATOR: "MODERATOR";
    readonly ADMIN: "ADMIN";
};
export declare const UserSchema: z.ZodObject<{
    id: z.ZodString;
    email: z.ZodString;
    username: z.ZodString;
    role: z.ZodDefault<z.ZodNativeEnum<{
        readonly USER: "USER";
        readonly INFLUENCER: "INFLUENCER";
        readonly MODERATOR: "MODERATOR";
        readonly ADMIN: "ADMIN";
    }>>;
    isInfluencer: z.ZodDefault<z.ZodBoolean>;
    bio: z.ZodOptional<z.ZodString>;
    avatarUrl: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    role: "USER" | "INFLUENCER" | "MODERATOR" | "ADMIN";
    username: string;
    email: string;
    isInfluencer: boolean;
    createdAt: Date;
    bio?: string | undefined;
    avatarUrl?: string | undefined;
}, {
    id: string;
    username: string;
    email: string;
    createdAt: Date;
    role?: "USER" | "INFLUENCER" | "MODERATOR" | "ADMIN" | undefined;
    isInfluencer?: boolean | undefined;
    bio?: string | undefined;
    avatarUrl?: string | undefined;
}>;
export declare const LoginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const RegisterSchema: z.ZodObject<{
    email: z.ZodString;
    username: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    username: string;
    email: string;
    password: string;
}, {
    username: string;
    email: string;
    password: string;
}>;
export declare const CreatePostSchema: z.ZodObject<{
    content: z.ZodString;
    mediaUrl: z.ZodOptional<z.ZodString>;
    tickers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    content: string;
    mediaUrl?: string | undefined;
    tickers?: string[] | undefined;
}, {
    content: string;
    mediaUrl?: string | undefined;
    tickers?: string[] | undefined;
}>;
export declare const CreatePortfolioSchema: z.ZodObject<{
    nombre: z.ZodString;
    descripcion: z.ZodOptional<z.ZodString>;
    objetivo: z.ZodOptional<z.ZodString>;
    monedaBase: z.ZodDefault<z.ZodString>;
    nivelRiesgo: z.ZodDefault<z.ZodEnum<["bajo", "medio", "alto"]>>;
    modoSocial: z.ZodDefault<z.ZodBoolean>;
    esPrincipal: z.ZodDefault<z.ZodBoolean>;
    admiteBienesRaices: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    nombre: string;
    monedaBase: string;
    nivelRiesgo: "bajo" | "medio" | "alto";
    modoSocial: boolean;
    esPrincipal: boolean;
    admiteBienesRaices: boolean;
    descripcion?: string | undefined;
    objetivo?: string | undefined;
}, {
    nombre: string;
    descripcion?: string | undefined;
    objetivo?: string | undefined;
    monedaBase?: string | undefined;
    nivelRiesgo?: "bajo" | "medio" | "alto" | undefined;
    modoSocial?: boolean | undefined;
    esPrincipal?: boolean | undefined;
    admiteBienesRaices?: boolean | undefined;
}>;
export declare const CreateAssetSchema: z.ZodObject<{
    portfolioId: z.ZodString;
    ticker: z.ZodString;
    tipoActivo: z.ZodString;
    cantidad: z.ZodNumber;
    precio: z.ZodNumber;
    precioActual: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    portfolioId: string;
    ticker: string;
    tipoActivo: string;
    cantidad: number;
    precio: number;
    precioActual?: number | undefined;
}, {
    portfolioId: string;
    ticker: string;
    tipoActivo: string;
    cantidad: number;
    precio: number;
    precioActual?: number | undefined;
}>;
export declare const CreateMovementSchema: z.ZodObject<{
    portfolioId: z.ZodString;
    assetId: z.ZodOptional<z.ZodString>;
    fecha: z.ZodOptional<z.ZodDate>;
    tipoMovimiento: z.ZodEnum<["compra", "venta", "ajuste"]>;
    ticker: z.ZodString;
    claseActivo: z.ZodString;
    cantidad: z.ZodNumber;
    precio: z.ZodNumber;
    total: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    total: number;
    portfolioId: string;
    ticker: string;
    cantidad: number;
    precio: number;
    tipoMovimiento: "compra" | "venta" | "ajuste";
    claseActivo: string;
    assetId?: string | undefined;
    fecha?: Date | undefined;
}, {
    total: number;
    portfolioId: string;
    ticker: string;
    cantidad: number;
    precio: number;
    tipoMovimiento: "compra" | "venta" | "ajuste";
    claseActivo: string;
    assetId?: string | undefined;
    fecha?: Date | undefined;
}>;
export type User = z.infer<typeof UserSchema>;
export type LoginDto = z.infer<typeof LoginSchema>;
export type RegisterDto = z.infer<typeof RegisterSchema>;
export type CreatePostDto = z.infer<typeof CreatePostSchema>;
export type CreatePortfolioDto = z.infer<typeof CreatePortfolioSchema>;
export type CreateAssetDto = z.infer<typeof CreateAssetSchema>;
export type CreateMovementDto = z.infer<typeof CreateMovementSchema>;
