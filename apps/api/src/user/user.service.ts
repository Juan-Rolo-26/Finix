import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma.service';

@Injectable()
export class UserService {
    constructor(private prisma: PrismaService) { }

    private getProfileSelect() {
        return {
            id: true,
            username: true,
            email: true,
            bio: true,
            bioLong: true,
            avatarUrl: true,
            bannerUrl: true,
            isInfluencer: true,
            isVerified: true,
            accountType: true,
            title: true,
            company: true,
            location: true,
            website: true,
            linkedinUrl: true,
            twitterUrl: true,
            youtubeUrl: true,
            instagramUrl: true,
            yearsExperience: true,
            specializations: true,
            certifications: true,
            totalReturn: true,
            winRate: true,
            riskScore: true,
            isProfilePublic: true,
            showPortfolio: true,
            showStats: true,
            acceptingFollowers: true,
            createdAt: true,
            _count: {
                select: {
                    posts: true,
                    following: true,
                    followedBy: true,
                },
            },
        };
    }

    async getCurrentUserProfile(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: this.getProfileSelect(),
        });

        if (!user) {
            throw new NotFoundException('Usuario no encontrado');
        }

        return user;
    }

    async getUserProfile(username: string) {
        const user = await this.prisma.user.findUnique({
            where: { username },
            select: this.getProfileSelect(),
        });

        if (!user) {
            throw new NotFoundException('Usuario no encontrado');
        }

        // Si el perfil es privado, limitar la información mostrada
        if (!user.isProfilePublic) {
            return {
                id: user.id,
                username: user.username,
                bio: user.bio,
                avatarUrl: user.avatarUrl,
                isInfluencer: user.isInfluencer,
                isVerified: user.isVerified,
                accountType: user.accountType,
                isProfilePublic: false,
            };
        }

        return user;
    }

    private normalizeNullableText(value: unknown, maxLen: number) {
        if (value === null) return null;
        if (typeof value !== 'string') return undefined;
        const normalized = value.trim();
        if (normalized.length === 0) return null;
        if (normalized.length > maxLen) {
            throw new BadRequestException(`El texto no puede superar ${maxLen} caracteres`);
        }
        return normalized;
    }

    async updateProfile(userId: string, updateData: any) {
        const filteredData: any = {};

        if (updateData.username !== undefined) {
            if (typeof updateData.username !== 'string') {
                throw new BadRequestException('El username es inválido');
            }
            const username = updateData.username.trim();
            if (username.length < 3 || username.length > 20) {
                throw new BadRequestException('El username debe tener entre 3 y 20 caracteres');
            }
            filteredData.username = username;
        }

        if (updateData.email !== undefined) {
            if (typeof updateData.email !== 'string') {
                throw new BadRequestException('El email es inválido');
            }
            const email = updateData.email.trim().toLowerCase();
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                throw new BadRequestException('El email es inválido');
            }
            filteredData.email = email;
        }

        const stringFieldConfig: Record<string, number> = {
            bio: 300,
            bioLong: 2000,
            avatarUrl: 500,
            bannerUrl: 500,
            title: 120,
            company: 120,
            location: 120,
            website: 500,
            linkedinUrl: 500,
            twitterUrl: 500,
            youtubeUrl: 500,
            instagramUrl: 500,
            specializations: 2000,
            certifications: 2000,
        };

        for (const [field, maxLen] of Object.entries(stringFieldConfig)) {
            if (updateData[field] !== undefined) {
                const normalized = this.normalizeNullableText(updateData[field], maxLen);
                if (normalized !== undefined) {
                    filteredData[field] = normalized;
                }
            }
        }

        if (updateData.yearsExperience !== undefined) {
            if (updateData.yearsExperience === null || updateData.yearsExperience === '') {
                filteredData.yearsExperience = null;
            } else {
                const years = Number(updateData.yearsExperience);
                if (!Number.isFinite(years) || years < 0 || years > 80) {
                    throw new BadRequestException('Los años de experiencia son inválidos');
                }
                filteredData.yearsExperience = Math.round(years);
            }
        }

        const booleanFields = ['isProfilePublic', 'showPortfolio', 'showStats', 'acceptingFollowers'];
        for (const field of booleanFields) {
            if (updateData[field] !== undefined) {
                filteredData[field] = Boolean(updateData[field]);
            }
        }

        if (Object.keys(filteredData).length === 0) {
            return this.getCurrentUserProfile(userId);
        }

        try {
            const updated = await this.prisma.user.update({
                where: { id: userId },
                data: filteredData,
                select: this.getProfileSelect(),
            });
            return updated;
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                throw new BadRequestException('El username o email ya está en uso');
            }
            throw error;
        }
    }

    async changePassword(userId: string, currentPassword: string, newPassword: string) {
        if (!currentPassword || !newPassword) {
            throw new BadRequestException('Debes completar la contraseña actual y la nueva');
        }

        if (newPassword.length < 8) {
            throw new BadRequestException('La nueva contraseña debe tener al menos 8 caracteres');
        }

        if (newPassword === currentPassword) {
            throw new BadRequestException('La nueva contraseña no puede ser igual a la actual');
        }

        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, password: true },
        });

        if (!user) {
            throw new NotFoundException('Usuario no encontrado');
        }

        const isValidPassword = await argon2.verify(user.password, currentPassword);
        if (!isValidPassword) {
            throw new UnauthorizedException('La contraseña actual es incorrecta');
        }

        const hashedPassword = await argon2.hash(newPassword);
        await this.prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });

        return { success: true, message: 'Contraseña actualizada correctamente' };
    }

    async getUserStats(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                _count: {
                    select: {
                        posts: true,
                        following: true,
                        followedBy: true,
                        portfolios: true,
                    },
                },
            },
        });

        if (!user) {
            throw new NotFoundException('Usuario no encontrado');
        }

        // Calcular estadísticas adicionales si tiene portfolios
        const portfolioStats = await this.calculatePortfolioStats(userId);

        return {
            postsCount: user._count.posts,
            followersCount: user._count.followedBy,
            followingCount: user._count.following,
            portfoliosCount: user._count.portfolios,
            ...portfolioStats,
        };
    }

    private async calculatePortfolioStats(userId: string) {
        // Obtener todos los portfolios del usuario con holdings y transacciones
        const portfolios = await this.prisma.portfolio.findMany({
            where: { userId },
            include: {
                holdings: {
                    include: {
                        asset: {
                            select: {
                                ticker: true,
                            },
                        },
                    },
                },
                transactions: true,
            },
        });

        if (portfolios.length === 0) {
            return {
                totalReturn: null,
                winRate: null,
                riskScore: null,
            };
        }

        // Por ahora, retornar valores de ejemplo
        // TODO: Implementar lógica completa de cálculo de rendimiento
        const totalHoldings = portfolios.reduce((sum, p) => sum + p.holdings.length, 0);
        const totalTransactions = portfolios.reduce((sum, p) => sum + p.transactions.length, 0);

        // Score de riesgo basado en diversificación
        const uniqueTickers = new Set(
            portfolios.flatMap((p) => p.holdings.map((h) => h.asset.ticker))
        ).size;

        const riskScore = totalHoldings === 0
            ? 5.0
            : Math.min(10, Math.max(1, 10 - (uniqueTickers / 2)));

        // Valores de ejemplo - en producción se calcularían realísticamente
        return {
            totalReturn: totalTransactions > 0 ? Math.random() * 20 - 5 : null,  // Simulado
            winRate: totalTransactions > 0 ? 50 + Math.random() * 30 : null,     // Simulado
            riskScore: parseFloat(riskScore.toFixed(1)),
        };
    }
}
