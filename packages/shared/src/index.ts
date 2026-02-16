import { z } from 'zod';

export const UserRole = {
    USER: 'USER',
    INFLUENCER: 'INFLUENCER',
    MODERATOR: 'MODERATOR',
    ADMIN: 'ADMIN',
} as const;

export const UserSchema = z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    username: z.string().min(3).max(20),
    role: z.nativeEnum(UserRole).default(UserRole.USER),
    isInfluencer: z.boolean().default(false),
    bio: z.string().optional(),
    avatarUrl: z.string().optional(),
    createdAt: z.date(),
});

export const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
});

export const RegisterSchema = z.object({
    email: z.string().email(),
    username: z.string().min(3).max(20),
    password: z.string().min(8),
});

export const CreatePostSchema = z.object({
    content: z.string().min(1).max(2000),
    mediaUrl: z.string().optional(),
    tickers: z.array(z.string()).optional(), // e.g. ["$AAPL", "$BTC"]
});

export const CreatePortfolioSchema = z.object({
    nombre: z.string().min(1).max(100),
    descripcion: z.string().optional(),
    objetivo: z.string().optional(),
    monedaBase: z.string().default('USD'),
    nivelRiesgo: z.enum(['bajo', 'medio', 'alto']).default('medio'),
    modoSocial: z.boolean().default(false),
    esPrincipal: z.boolean().default(false),
    admiteBienesRaices: z.boolean().default(false),
});

export const CreateAssetSchema = z.object({
    portfolioId: z.string().uuid(),
    ticker: z.string(),
    tipoActivo: z.string(), // acciones, ETF, bonos, cripto, fondos
    cantidad: z.number().positive(),
    precio: z.number().positive(),
    precioActual: z.number().positive().optional(),
});

export const CreateMovementSchema = z.object({
    portfolioId: z.string().uuid(),
    assetId: z.string().uuid().optional(),
    fecha: z.date().optional(),
    tipoMovimiento: z.enum(['compra', 'venta', 'ajuste']),
    ticker: z.string(),
    claseActivo: z.string(),
    cantidad: z.number().positive(),
    precio: z.number().positive(),
    total: z.number().positive(),
});

export type User = z.infer<typeof UserSchema>;
export type LoginDto = z.infer<typeof LoginSchema>;
export type RegisterDto = z.infer<typeof RegisterSchema>;
export type CreatePostDto = z.infer<typeof CreatePostSchema>;
export type CreatePortfolioDto = z.infer<typeof CreatePortfolioSchema>;
export type CreateAssetDto = z.infer<typeof CreateAssetSchema>;
export type CreateMovementDto = z.infer<typeof CreateMovementSchema>;
