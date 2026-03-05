"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
let SettingsService = class SettingsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getSettings(userId) {
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
                isProfilePublic: true,
                showPortfolio: true,
                showStats: true,
                acceptingFollowers: true,
                showActivity: true,
                showExactReturns: true,
                returnsVisibilityMode: true,
                language: true,
                currency: true,
                autoRefreshMarket: true,
                compactTables: true,
                showAdvancedMetrics: true,
                theme: true,
                chartDensity: true,
                marketNotifications: true,
                timezone: true,
                onboardingCompleted: true,
                onboardingStep: true,
                createdAt: true,
            },
        });
        if (!user)
            throw new common_1.NotFoundException('Usuario no encontrado');
        return user;
    }
    async updatePrivacy(userId, dto) {
        const data = {};
        if (dto.isProfilePublic !== undefined)
            data.isProfilePublic = Boolean(dto.isProfilePublic);
        if (dto.acceptingFollowers !== undefined)
            data.acceptingFollowers = Boolean(dto.acceptingFollowers);
        if (dto.showActivity !== undefined)
            data.showActivity = Boolean(dto.showActivity);
        if (dto.showExactReturns !== undefined)
            data.showExactReturns = Boolean(dto.showExactReturns);
        if (dto.returnsVisibilityMode !== undefined) {
            if (!['exact', 'range'].includes(dto.returnsVisibilityMode)) {
                throw new common_1.BadRequestException('returnsVisibilityMode debe ser "exact" o "range"');
            }
            data.returnsVisibilityMode = dto.returnsVisibilityMode;
        }
        const isPublic = dto.isProfilePublic !== undefined ? Boolean(dto.isProfilePublic) : undefined;
        if (isPublic === false) {
            data.showPortfolio = false;
            data.showStats = false;
        }
        else {
            if (dto.showPortfolio !== undefined)
                data.showPortfolio = Boolean(dto.showPortfolio);
            if (dto.showStats !== undefined)
                data.showStats = Boolean(dto.showStats);
        }
        await this.prisma.user.update({ where: { id: userId }, data });
        return { success: true, message: 'Privacidad guardada correctamente' };
    }
    async updatePreferences(userId, dto) {
        const data = {};
        const VALID_LANGUAGES = ['es-AR', 'en-US', 'pt-BR'];
        const VALID_CURRENCIES = ['USD', 'ARS', 'EUR', 'BRL'];
        const VALID_THEMES = ['dark', 'light', 'system'];
        const VALID_DENSITIES = ['basic', 'normal', 'advanced'];
        if (dto.language !== undefined) {
            if (!VALID_LANGUAGES.includes(dto.language))
                throw new common_1.BadRequestException('Idioma no válido');
            data.language = dto.language;
        }
        if (dto.currency !== undefined) {
            if (!VALID_CURRENCIES.includes(dto.currency))
                throw new common_1.BadRequestException('Moneda no válida');
            data.currency = dto.currency;
        }
        if (dto.theme !== undefined) {
            if (!VALID_THEMES.includes(dto.theme))
                throw new common_1.BadRequestException('Tema no válido');
            data.theme = dto.theme;
        }
        if (dto.chartDensity !== undefined) {
            if (!VALID_DENSITIES.includes(dto.chartDensity))
                throw new common_1.BadRequestException('Densidad no válida');
            data.chartDensity = dto.chartDensity;
        }
        if (dto.autoRefreshMarket !== undefined)
            data.autoRefreshMarket = Boolean(dto.autoRefreshMarket);
        if (dto.compactTables !== undefined)
            data.compactTables = Boolean(dto.compactTables);
        if (dto.showAdvancedMetrics !== undefined)
            data.showAdvancedMetrics = Boolean(dto.showAdvancedMetrics);
        if (dto.marketNotifications !== undefined)
            data.marketNotifications = Boolean(dto.marketNotifications);
        if (dto.timezone !== undefined) {
            if (typeof dto.timezone !== 'string' || dto.timezone.length > 60)
                throw new common_1.BadRequestException('Zona horaria no válida');
            data.timezone = dto.timezone;
        }
        if (Object.keys(data).length === 0)
            return { success: true, message: 'Sin cambios' };
        await this.prisma.user.update({ where: { id: userId }, data });
        return { success: true, message: 'Preferencias guardadas' };
    }
    async updateOnboarding(userId, dto) {
        const data = {};
        if (dto.step !== undefined) {
            if (typeof dto.step !== 'number' || dto.step < 0 || dto.step > 10) {
                throw new common_1.BadRequestException('Paso de onboarding inválido');
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
            data.avatarUrl = typeof dto.avatarUrl === 'string' ? dto.avatarUrl.trim().slice(0, 500) : null;
        }
        await this.prisma.user.update({ where: { id: userId }, data });
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
    async saveAvatarUrl(userId, avatarUrl) {
        await this.prisma.user.update({
            where: { id: userId },
            data: { avatarUrl },
        });
        return { success: true };
    }
    async logoutAllSessions(userId) {
        return { success: true, message: 'Sesiones cerradas (JWT stateless - tokens expirarán naturalmente)' };
    }
};
exports.SettingsService = SettingsService;
exports.SettingsService = SettingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SettingsService);
//# sourceMappingURL=settings.service.js.map