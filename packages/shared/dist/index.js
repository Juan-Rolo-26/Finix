"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateMovementSchema = exports.CreateAssetSchema = exports.CreatePortfolioSchema = exports.CreatePostSchema = exports.RegisterSchema = exports.LoginSchema = exports.UserSchema = exports.AccountPlan = exports.UserRole = void 0;
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
    CREATOR: 'CREATOR',
};
exports.UserSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    email: zod_1.z.string().email(),
    username: zod_1.z.string().min(3).max(20),
    role: zod_1.z.nativeEnum(exports.UserRole).default(exports.UserRole.USER),
    accountType: zod_1.z.nativeEnum(exports.AccountPlan).default(exports.AccountPlan.FREE),
    subscriptionStatus: zod_1.z.string().optional(),
    isInfluencer: zod_1.z.boolean().default(false),
    isVerified: zod_1.z.boolean().default(false),
    bio: zod_1.z.string().optional(),
    avatarUrl: zod_1.z.string().optional(),
    createdAt: zod_1.z.date(),
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
exports.CreatePostSchema = zod_1.z.object({
    content: zod_1.z.string().min(1).max(2000),
    mediaUrl: zod_1.z.string().optional(),
    tickers: zod_1.z.array(zod_1.z.string()).optional(), // e.g. ["$AAPL", "$BTC"]
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
    tipoActivo: zod_1.z.string(), // acciones, ETF, bonos, cripto, fondos
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
