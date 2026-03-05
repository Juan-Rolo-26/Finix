import { z } from 'zod';

export const UserRole = {
    USER: 'USER',
    INFLUENCER: 'INFLUENCER',
    MODERATOR: 'MODERATOR',
    ADMIN: 'ADMIN',
} as const;

export const AccountPlan = {
    FREE: 'FREE',
    PRO: 'PRO',
} as const;

export type AccountPlanType = typeof AccountPlan[keyof typeof AccountPlan];

export const UserSchema = z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    username: z.string().min(3).max(20),
    role: z.nativeEnum(UserRole).default(UserRole.USER),
    plan: z.nativeEnum(AccountPlan).default(AccountPlan.FREE),
    accountType: z.string().default('BASIC'),
    subscriptionStatus: z.string().optional(),
    isInfluencer: z.boolean().default(false),
    isCreator: z.boolean().default(false),
    isVerified: z.boolean().default(false),
    bio: z.string().optional(),
    avatarUrl: z.string().optional(),
    onboardingCompleted: z.boolean().default(false),
    onboardingStep: z.number().default(0),
    createdAt: z.coerce.date(),
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

export const VerifyEmailSchema = z.object({
    email: z.string().email(),
    code: z.string().length(6),
});

export const ForgotPasswordSchema = z.object({
    email: z.string().email(),
});

export const ResetPasswordSchema = z.object({
    token: z.string().min(1),
    newPassword: z.string().min(8),
});

export const CreatePostSchema = z.object({
    content: z.string().max(2000).optional(),
    mediaUrl: z.string().optional(),
    tickers: z.array(z.string()).optional(),
    parentId: z.string().uuid().optional(),
    quotedPostId: z.string().uuid().optional(),
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
    tipoActivo: z.string(),
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
export type VerifyEmailDto = z.infer<typeof VerifyEmailSchema>;
export type ForgotPasswordDto = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordDto = z.infer<typeof ResetPasswordSchema>;
export type CreatePostDto = z.infer<typeof CreatePostSchema>;
export type CreatePortfolioDto = z.infer<typeof CreatePortfolioSchema>;
export type CreateAssetDto = z.infer<typeof CreateAssetSchema>;
export type CreateMovementDto = z.infer<typeof CreateMovementSchema>;

