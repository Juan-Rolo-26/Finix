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
exports.CreatorApplicationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
let CreatorApplicationService = class CreatorApplicationService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(userId, dto) {
        const existing = await this.prisma.creatorApplication.findUnique({
            where: { userId },
        });
        if (existing && existing.status === 'PENDING') {
            throw new common_1.BadRequestException('Ya tienes una solicitud pendiente.');
        }
        if (existing && existing.status === 'APPROVED') {
            throw new common_1.BadRequestException('Ya eres un creador aprobado.');
        }
        if (existing) {
            return this.prisma.creatorApplication.update({
                where: { id: existing.id },
                data: {
                    bio: dto.bio,
                    experience: dto.experience,
                    education: dto.education,
                    documentsUrl: dto.documentsUrl,
                    status: 'PENDING',
                    reviewedBy: null,
                    reviewedAt: null,
                },
            });
        }
        return this.prisma.creatorApplication.create({
            data: {
                userId,
                bio: dto.bio,
                experience: dto.experience,
                education: dto.education,
                documentsUrl: dto.documentsUrl,
                status: 'PENDING',
            },
        });
    }
    async findAll(status) {
        return this.prisma.creatorApplication.findMany({
            where: status ? { status } : {},
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                        avatarUrl: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findMyApplication(userId) {
        return this.prisma.creatorApplication.findUnique({
            where: { userId },
        });
    }
    async updateStatus(id, adminId, dto) {
        const application = await this.prisma.creatorApplication.findUnique({
            where: { id },
        });
        if (!application) {
            throw new common_1.NotFoundException('Solicitud no encontrada');
        }
        const updated = await this.prisma.creatorApplication.update({
            where: { id },
            data: {
                status: dto.status,
                reviewedBy: adminId,
                reviewedAt: new Date(),
            },
        });
        if (dto.status === 'APPROVED') {
            await this.prisma.user.update({
                where: { id: application.userId },
                data: { isCreator: true },
            });
        }
        else {
            await this.prisma.user.update({
                where: { id: application.userId },
                data: { isCreator: false },
            });
        }
        return updated;
    }
};
exports.CreatorApplicationService = CreatorApplicationService;
exports.CreatorApplicationService = CreatorApplicationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CreatorApplicationService);
//# sourceMappingURL=creator-application.service.js.map