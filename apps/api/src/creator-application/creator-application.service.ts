import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { MailService } from '../mail/mail.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';

@Injectable()
export class CreatorApplicationService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly mailService: MailService,
    ) { }

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

        const application = existing
            ? await this.prisma.creatorApplication.update({
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
            })
            : await this.prisma.creatorApplication.create({
                data: {
                    userId,
                    bio: dto.bio,
                    experience: dto.experience,
                    education: dto.education,
                    documentsUrl: dto.documentsUrl,
                    status: 'PENDING',
                },
            });

        // Notify admin about creator application
        const applicant = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { username: true, email: true },
        });

        this.mailService.sendAdminAlert({
            eventType: 'CREATOR_APPLICATION',
            title: `Nueva Solicitud de Creador: @${applicant?.username || 'usuario'}`,
            badgeText: 'SOLICITUD DE CREADOR',
            badgeColor: '#f59e0b',
            summary: `El usuario @${applicant?.username || 'usuario'} ha postulado para ser Creador Verificado en Finix.`,
            details: [
                { label: 'Postulante', value: `@${applicant?.username || 'N/A'} (${applicant?.email || 'N/A'})` },
                { label: 'Biografía', value: dto.bio ? (dto.bio.length > 200 ? `${dto.bio.slice(0, 200)}...` : dto.bio) : 'N/A' },
                { label: 'Experiencia', value: dto.experience ? (dto.experience.length > 200 ? `${dto.experience.slice(0, 200)}...` : dto.experience) : 'N/A' },
                { label: 'Educación', value: dto.education || 'N/A' },
                { label: 'Documentos Adjuntos', value: dto.documentsUrl || 'No adjuntados' },
                { label: 'ID Solicitud', value: application.id },
                { label: 'Fecha y Hora', value: new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' }) },
            ],
            actionUrl: `${this.mailService.getAdminUrl()}/creators`,
            actionLabel: 'Revisar Postulación en Admin',
        });

        return application;
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
