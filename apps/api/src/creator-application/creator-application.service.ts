import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';

@Injectable()
export class CreatorApplicationService {
    constructor(private readonly prisma: PrismaService) { }

    async create(userId: string, dto: CreateApplicationDto) {
        const existing = await this.prisma.creatorApplication.findUnique({
            where: { userId },
        });

        if (existing && existing.status === 'PENDING') {
            throw new BadRequestException('Ya tienes una solicitud pendiente.');
        }

        if (existing && existing.status === 'APPROVED') {
            throw new BadRequestException('Ya eres un creador aprobado.');
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

    async findAll(status?: string) {
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

    async findMyApplication(userId: string) {
        return this.prisma.creatorApplication.findUnique({
            where: { userId },
        });
    }

    async updateStatus(id: string, adminId: string, dto: UpdateApplicationDto) {
        const application = await this.prisma.creatorApplication.findUnique({
            where: { id },
        });

        if (!application) {
            throw new NotFoundException('Solicitud no encontrada');
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
        } else {
            // If rejected or any other status, ensure isCreator is false
            await this.prisma.user.update({
                where: { id: application.userId },
                data: { isCreator: false },
            });
        }

        return updated;
    }
}
