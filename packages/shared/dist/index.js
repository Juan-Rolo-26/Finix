"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateMovementSchema = exports.CreateAssetSchema = exports.CreatePortfolioSchema = exports.CreatePostSchema = exports.ResetPasswordSchema = exports.ForgotPasswordSchema = exports.VerifyEmailSchema = exports.RegisterSchema = exports.LoginSchema = exports.UserSchema = exports.AccountPlan = exports.UserRole = void 0;
const zod_1 = require("zod");
exports.UserRole = {
    USER: 'USER',
    INFLUENCER: 'INFLUENCER',
    MODERATOR: 'MODERATOR',
    ADMIN: 'ADMIN',
};
exports.AccountPlan = {
    FREE: 'FREE',
    PRO: 'PRO',
};
exports.UserSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    email: zod_1.z.string().email(),
    username: zod_1.z.string().min(3).max(20),
    role: zod_1.z.nativeEnum(exports.UserRole).default(exports.UserRole.USER),
    plan: zod_1.z.nativeEnum(exports.AccountPlan).default(exports.AccountPlan.FREE),
    accountType: zod_1.z.string().default('BASIC'),
    subscriptionStatus: zod_1.z.string().optional(),
    isInfluencer: zod_1.z.boolean().default(false),
    isCreator: zod_1.z.boolean().default(false),
    isVerified: zod_1.z.boolean().default(false),
    bio: zod_1.z.string().optional(),
    avatarUrl: zod_1.z.string().optional(),
    onboardingCompleted: zod_1.z.boolean().default(false),
    onboardingStep: zod_1.z.number().default(0),
    createdAt: zod_1.z.coerce.date(),
});
exports.LoginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8),
});
exports.RegisterSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    username: zod_1.z.string().min(3).max(20),
    password: zod_1.z.string().min(8),
});
exports.VerifyEmailSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    code: zod_1.z.string().length(6),
});
exports.ForgotPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
});
exports.ResetPasswordSchema = zod_1.z.object({
    token: zod_1.z.string().min(1),
    newPassword: zod_1.z.string().min(8),
});
exports.CreatePostSchema = zod_1.z.object({
    content: zod_1.z.string().max(2000).optional(),
    mediaUrl: zod_1.z.string().optional(),
    tickers: zod_1.z.array(zod_1.z.string()).optional(),
    parentId: zod_1.z.string().uuid().optional(),
    quotedPostId: zod_1.z.string().uuid().optional(),
});
exports.CreatePortfolioSchema = zod_1.z.object({
    nombre: zod_1.z.string().min(1).max(100),
    descripcion: zod_1.z.string().optional(),
    objetivo: zod_1.z.string().optional(),
    monedaBase: zod_1.z.string().default('USD'),
    nivelRiesgo: zod_1.z.enum(['bajo', 'medio', 'alto']).default('medio'),
    modoSocial: zod_1.z.boolean().default(false),
    esPrincipal: zod_1.z.boolean().default(false),
    admiteBienesRaices: zod_1.z.boolean().default(false),
});
exports.CreateAssetSchema = zod_1.z.object({
    portfolioId: zod_1.z.string().uuid(),
    ticker: zod_1.z.string(),
    tipoActivo: zod_1.z.string(),
    cantidad: zod_1.z.number().positive(),
    precio: zod_1.z.number().positive(),
    precioActual: zod_1.z.number().positive().optional(),
});
exports.CreateMovementSchema = zod_1.z.object({
    portfolioId: zod_1.z.string().uuid(),
    assetId: zod_1.z.string().uuid().optional(),
    fecha: zod_1.z.date().optional(),
    tipoMovimiento: zod_1.z.enum(['compra', 'venta', 'ajuste']),
    ticker: zod_1.z.string(),
    claseActivo: zod_1.z.string(),
    cantidad: zod_1.z.number().positive(),
    precio: zod_1.z.number().positive(),
    total: zod_1.z.number().positive(),
});
