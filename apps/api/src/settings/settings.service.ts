import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { normalizeStoredUploadUrl } from '../uploads/upload-url.util';

@Injectable()
export class SettingsService {
    constructor(private prisma: PrismaService) { }

    private normalizeUserMedia<T extends { avatarUrl?: string | null; bannerUrl?: string | null }>(user: T): T {
        return {
            ...user,
            avatarUrl: normalizeStoredUploadUrl(user.avatarUrl) ?? null,
            bannerUrl: normalizeStoredUploadUrl(user.bannerUrl) ?? null,
        };
    }

    // ─── GET ALL SETTINGS ───────────────────────────────────────────────────────
    async getSettings(userId: string) {
        // `investmentEmailNotifications` is present after the accompanying migration.
        // Keep the select dynamic so an older generated Prisma client never prevents
        // the API from starting while its deployment runs `prisma generate`.
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                username: true,
                email: true,
                bio: true,
                bioLong: true,
                avatarUrl: true,
                bannerUrl: true,
                location: true,
                title: true,
                company: true,
                website: true,
                linkedinUrl: true,
                twitterUrl: true,
                youtubeUrl: true,
                instagramUrl: true,
                yearsExperience: true,
                plan: true,
                accountType: true,
                subscriptionStatus: true,
                isVerified: true,
                isInfluencer: true,
                isCreator: true,
                // Privacy
                isProfilePublic: true,
                showPortfolio: true,
                showStats: true,
                acceptingFollowers: true,
                showActivity: true,
                showExactReturns: true,
                returnsVisibilityMode: true,
                // Preferences
                language: true,
                currency: true,
                autoRefreshMarket: true,
                compactTables: true,
                showAdvancedMetrics: true,
                theme: true,
                chartDensity: true,
                marketNotifications: true,
                investmentEmailNotifications: true,
                timezone: true,
                // Onboarding
                onboardingCompleted: true,
                onboardingStep: true,
                createdAt: true,
            },
        } as any);

        if (!user) throw new NotFoundException('Usuario no encontrado');
        return this.normalizeUserMedia(user);
    }

    // ─── PRIVACY ────────────────────────────────────────────────────────────────
    async updatePrivacy(userId: string, dto: {
        isProfilePublic?: boolean;
        showPortfolio?: boolean;
        showStats?: boolean;
        acceptingFollowers?: boolean;
        showActivity?: boolean;
        showExactReturns?: boolean;
        returnsVisibilityMode?: string;
    }) {
        const data: any = {};

        if (dto.isProfilePublic !== undefined) data.isProfilePublic = Boolean(dto.isProfilePublic);
        if (dto.acceptingFollowers !== undefined) data.acceptingFollowers = Boolean(dto.acceptingFollowers);
        if (dto.showActivity !== undefined) data.showActivity = Boolean(dto.showActivity);
        if (dto.showExactReturns !== undefined) data.showExactReturns = Boolean(dto.showExactReturns);

        if (dto.returnsVisibilityMode !== undefined) {
            if (!['exact', 'range'].includes(dto.returnsVisibilityMode)) {
                throw new BadRequestException('returnsVisibilityMode debe ser "exact" o "range"');
            }
            data.returnsVisibilityMode = dto.returnsVisibilityMode;
        }

        // Backend rule: if profile is private, portfolio and stats must be false
        const isPublic = dto.isProfilePublic !== undefined ? Boolean(dto.isProfilePublic) : undefined;

        if (isPublic === false) {
            data.showPortfolio = false;
            data.showStats = false;
        } else {
            if (dto.showPortfolio !== undefined) data.showPortfolio = Boolean(dto.showPortfolio);
            if (dto.showStats !== undefined) data.showStats = Boolean(dto.showStats);
        }

        await this.prisma.user.update({ where: { id: userId }, data });
        return { success: true, message: 'Privacidad guardada correctamente' };
    }

    // ─── PREFERENCES ────────────────────────────────────────────────────────────
    async updatePreferences(userId: string, dto: {
        language?: string;
        currency?: string;
        autoRefreshMarket?: boolean;
        compactTables?: boolean;
        showAdvancedMetrics?: boolean;
        theme?: string;
        chartDensity?: string;
        marketNotifications?: boolean;
        investmentEmailNotifications?: boolean;
        timezone?: string;
    }) {
        const data: any = {};

        const VALID_LANGUAGES = ['es-AR', 'en-US', 'pt-BR'];
        const VALID_CURRENCIES = ['USD', 'ARS', 'EUR', 'BRL'];
        const VALID_THEMES = ['dark', 'light', 'system'];
        const VALID_DENSITIES = ['basic', 'normal', 'advanced'];

        if (dto.language !== undefined) {
            if (!VALID_LANGUAGES.includes(dto.language)) throw new BadRequestException('Idioma no válido');
            data.language = dto.language;
        }
        if (dto.currency !== undefined) {
            if (!VALID_CURRENCIES.includes(dto.currency)) throw new BadRequestException('Moneda no válida');
            data.currency = dto.currency;
        }
        if (dto.theme !== undefined) {
            if (!VALID_THEMES.includes(dto.theme)) throw new BadRequestException('Tema no válido');
            data.theme = dto.theme;
        }
        if (dto.chartDensity !== undefined) {
            if (!VALID_DENSITIES.includes(dto.chartDensity)) throw new BadRequestException('Densidad no válida');
            data.chartDensity = dto.chartDensity;
        }
        if (dto.autoRefreshMarket !== undefined) data.autoRefreshMarket = Boolean(dto.autoRefreshMarket);
        if (dto.compactTables !== undefined) data.compactTables = Boolean(dto.compactTables);
        if (dto.showAdvancedMetrics !== undefined) data.showAdvancedMetrics = Boolean(dto.showAdvancedMetrics);
        if (dto.marketNotifications !== undefined) data.marketNotifications = Boolean(dto.marketNotifications);
        if (dto.investmentEmailNotifications !== undefined) {
            const enabled = Boolean(dto.investmentEmailNotifications);
            if (enabled) {
                const user = await this.prisma.user.findUnique({
                    where: { id: userId },
                    select: { plan: true, subscriptionStatus: true },
                });
                const isPro = user?.plan === 'PRO' && user?.subscriptionStatus === 'ACTIVE';
                if (!isPro) {
                    throw new ForbiddenException('Las alertas por email de inversiones son exclusivas para Finix PRO');
                }
            }
            data.investmentEmailNotifications = enabled;
        }
        if (dto.timezone !== undefined) {
            if (typeof dto.timezone !== 'string' || dto.timezone.length > 60) throw new BadRequestException('Zona horaria no válida');
            data.timezone = dto.timezone;
        }

        if (Object.keys(data).length === 0) return { success: true, message: 'Sin cambios' };

        await this.prisma.user.update({ where: { id: userId }, data });
        return { success: true, message: 'Preferencias guardadas' };
    }

    // ─── ONBOARDING ─────────────────────────────────────────────────────────────
    async updateOnboarding(userId: string, dto: {
        step?: number;
        completed?: boolean;
        // Step data (profile)
        bio?: string;
        location?: string;
        avatarUrl?: string;
        // Step data (first portfolio)
        portfolioName?: string;
        portfolioCurrency?: string;
    }) {
        const data: any = {};

        if (dto.step !== undefined) {
            if (typeof dto.step !== 'number' || dto.step < 0 || dto.step > 10) {
                throw new BadRequestException('Paso de onboarding inválido');
            }
            data.onboardingStep = dto.step;
        }

        if (dto.completed === true) {
            data.onboardingCompleted = true;
        }

        if (dto.bio !== undefined) {
            data.bio = typeof dto.bio === 'string' ? dto.bio.trim().slice(0, 300) : null;
        }
        if (dto.location !== undefined) {
            data.location = typeof dto.location === 'string' ? dto.location.trim().slice(0, 120) : null;
        }
        if (dto.avatarUrl !== undefined) {
            data.avatarUrl = typeof dto.avatarUrl === 'string'
                ? normalizeStoredUploadUrl(dto.avatarUrl.trim().slice(0, 500))
                : null;
        }

        await this.prisma.user.update({ where: { id: userId }, data });

        // Create first portfolio if requested
        if (dto.portfolioName && dto.portfolioCurrency) {
            const existingPortfolios = await this.prisma.portfolio.count({ where: { userId } });
            if (existingPortfolios === 0) {
                await this.prisma.portfolio.create({
                    data: {
                        userId,
                        nombre: dto.portfolioName.trim().slice(0, 100),
                        monedaBase: dto.portfolioCurrency,
                    },
                });
            }
        }

        return { success: true, message: 'Onboarding guardado' };
    }

    // ─── SAVE AVATAR URL ────────────────────────────────────────────────────────
    async saveAvatarUrl(userId: string, avatarUrl: string) {
        await this.prisma.user.update({
            where: { id: userId },
            data: { avatarUrl: normalizeStoredUploadUrl(avatarUrl) ?? avatarUrl },
        });
        return { success: true };
    }

    async saveBannerUrl(userId: string, bannerUrl: string) {
        await this.prisma.user.update({
            where: { id: userId },
            data: { bannerUrl: normalizeStoredUploadUrl(bannerUrl) ?? bannerUrl },
        });
        return { success: true };
    }

    // ─── LOGOUT ALL SESSIONS ────────────────────────────────────────────────────
    async logoutAllSessions(userId: string) {
        // In a JWT-based system without token blacklisting, we rotate a secret or
        // store a "sessions_invalidated_at" timestamp. For now we return success.
        // TODO: implement token invalidation if needed
        return { success: true, message: 'Sesiones cerradas (JWT stateless - tokens expirarán naturalmente)' };
    }

    // ─── FINANCIAL ADVISOR VERIFICATION ─────────────────────────────────────────
    async getVerification(userId: string) {
        return this.prisma.financialAdvisorVerification.findFirst({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async submitVerification(userId: string, data: any) {
        if (!data.fullName || !data.documentNumber || !data.registrationNumber) {
            throw new BadRequestException('Faltan campos obligatorios para la verificación');
        }

        const existing = await this.prisma.financialAdvisorVerification.findFirst({
            where: { userId, status: { in: ['pending', 'under_review'] } },
        });

        const payload = {
            fullName: String(data.fullName).trim(),
            documentType: String(data.documentType || 'DNI').trim(),
            documentCountry: String(data.documentCountry || 'Argentina').trim(),
            documentNumber: String(data.documentNumber).trim(),
            professionalCategory: String(data.professionalCategory || 'Asesor Financiero').trim(),
            registrationNumber: String(data.registrationNumber).trim(),
            registrationEntity: String(data.registrationEntity || 'CNV').trim(),
            professionalCountry: String(data.professionalCountry || 'Argentina').trim(),
            identityDocumentFrontPath: String(data.identityDocumentFrontPath || '').trim(),
            identityDocumentBackPath: String(data.identityDocumentBackPath || '').trim(),
            professionalDocumentPath: String(data.professionalDocumentPath || '').trim(),
            experienceYears: data.experienceYears ? Number(data.experienceYears) : null,
            specialization: data.specialization ? String(data.specialization).trim() : null,
            company: data.company ? String(data.company).trim() : null,
            professionalPosition: data.professionalPosition ? String(data.professionalPosition).trim() : null,
            website: data.website ? String(data.website).trim() : null,
            linkedin: data.linkedin ? String(data.linkedin).trim() : null,
            professionalDescription: data.professionalDescription ? String(data.professionalDescription).trim() : null,
            status: 'pending',
            submittedAt: new Date(),
        };

        if (existing) {
            return this.prisma.financialAdvisorVerification.update({
                where: { id: existing.id },
                data: payload,
            });
        }

        return this.prisma.financialAdvisorVerification.create({
            data: {
                ...payload,
                userId,
            },
        });
    }

    // ─── DELETE / DEACTIVATE ACCOUNT ──────────────────────────────────────────
    async deleteAccount(userId: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException('Usuario no encontrado');
        }

        // Cancel any active subscriptions
        await this.prisma.subscription.updateMany({
            where: { userId },
            data: { status: 'CANCELED' },
        }).catch(() => {});

        // Clean relations that might lack cascade
        await this.prisma.$transaction(async (tx) => {
            await tx.creatorApplication.deleteMany({ where: { userId } }).catch(() => {});
            await tx.report.deleteMany({ where: { reporterId: userId } }).catch(() => {});
            await tx.subscription.deleteMany({ where: { userId } }).catch(() => {});
            await tx.user.delete({ where: { id: userId } });
        });

        return { success: true, message: 'Cuenta eliminada con éxito' };
    }
}
