import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
    CreateChartAnalysisDto,
    UpdateChartAnalysisDto,
    CreateChartVersionDto,
    ForkChartAnalysisDto,
} from './dto/chart-analysis.dto';

const MAX_CHART_STATE_BYTES = 500 * 1024; // 500 KB
const MAX_DRAWINGS_COUNT = 300;

@Injectable()
export class ChartAnalysisService {
    constructor(private prisma: PrismaService) {}

    private validateChartState(chartState: any) {
        if (!chartState || typeof chartState !== 'object') {
            throw new BadRequestException('El chartState debe ser un objeto válido.');
        }

        const serialized = JSON.stringify(chartState);
        if (serialized.length > MAX_CHART_STATE_BYTES) {
            throw new BadRequestException('El estado del gráfico excede el tamaño máximo permitido (500 KB).');
        }

        if (Array.isArray(chartState.drawings) && chartState.drawings.length > MAX_DRAWINGS_COUNT) {
            throw new BadRequestException(`No se permiten más de ${MAX_DRAWINGS_COUNT} elementos dibujados.`);
        }
    }

    private sanitizeDrawings(chartState: any) {
        if (chartState && Array.isArray(chartState.drawings)) {
            chartState.drawings = chartState.drawings.map((d: any) => {
                if (d?.style?.text && typeof d.style.text === 'string') {
                    d.style.text = d.style.text.slice(0, 500).replace(/[<>]/g, '');
                }
                return d;
            });
        }
        return chartState;
    }

    async create(userId: string, dto: CreateChartAnalysisDto) {
        this.validateChartState(dto.chartState);
        const cleanState = this.sanitizeDrawings(dto.chartState);

        return this.prisma.chartAnalysis.create({
            data: {
                userId,
                symbol: dto.symbol.toUpperCase().trim(),
                exchange: dto.exchange ? dto.exchange.toUpperCase().trim() : null,
                timeframe: dto.timeframe || '1D',
                title: dto.title?.trim() || `Análisis ${dto.symbol}`,
                description: dto.description?.trim() || null,
                chartState: cleanState,
                isPublic: dto.isPublic ?? false,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        avatarUrl: true,
                        accountType: true,
                        isVerified: true,
                    },
                },
            },
        });
    }

    async findAllUser(userId: string, query?: { symbol?: string; limit?: number }) {
        const take = Math.min(query?.limit || 50, 100);
        return this.prisma.chartAnalysis.findMany({
            where: {
                userId,
                ...(query?.symbol ? { symbol: query.symbol.toUpperCase().trim() } : {}),
            },
            orderBy: { updatedAt: 'desc' },
            take,
            include: {
                _count: {
                    select: { versions: true },
                },
            },
        });
    }

    async findOne(id: string, currentUserId?: string) {
        const analysis = await this.prisma.chartAnalysis.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        avatarUrl: true,
                        accountType: true,
                        isVerified: true,
                    },
                },
                forkedFrom: {
                    select: {
                        id: true,
                        title: true,
                        user: { select: { username: true } },
                    },
                },
            },
        });

        if (!analysis) {
            throw new NotFoundException('Análisis técnico no encontrado.');
        }

        if (!analysis.isPublic && analysis.userId !== currentUserId) {
            throw new ForbiddenException('No tienes permisos para ver este análisis privado.');
        }

        return analysis;
    }

    async update(id: string, userId: string, dto: UpdateChartAnalysisDto) {
        const existing = await this.prisma.chartAnalysis.findUnique({
            where: { id },
        });

        if (!existing) {
            throw new NotFoundException('Análisis no encontrado.');
        }

        if (existing.userId !== userId) {
            throw new ForbiddenException('No tienes autorización para editar este análisis.');
        }

        let cleanState = existing.chartState;
        if (dto.chartState) {
            this.validateChartState(dto.chartState);
            cleanState = this.sanitizeDrawings(dto.chartState);
        }

        return this.prisma.chartAnalysis.update({
            where: { id },
            data: {
                title: dto.title !== undefined ? dto.title.trim() : undefined,
                description: dto.description !== undefined ? dto.description.trim() : undefined,
                symbol: dto.symbol ? dto.symbol.toUpperCase().trim() : undefined,
                exchange: dto.exchange !== undefined ? dto.exchange?.toUpperCase().trim() : undefined,
                timeframe: dto.timeframe !== undefined ? dto.timeframe : undefined,
                chartState: cleanState,
                isPublic: dto.isPublic !== undefined ? dto.isPublic : undefined,
                updatedAt: new Date(),
            },
        });
    }

    async delete(id: string, userId: string) {
        const existing = await this.prisma.chartAnalysis.findUnique({
            where: { id },
        });

        if (!existing) {
            throw new NotFoundException('Análisis no encontrado.');
        }

        if (existing.userId !== userId) {
            throw new ForbiddenException('No tienes autorización para eliminar este análisis.');
        }

        await this.prisma.chartAnalysis.delete({ where: { id } });
        return { success: true, message: 'Análisis eliminado correctamente.' };
    }

    async createVersion(id: string, userId: string, dto?: CreateChartVersionDto) {
        const analysis = await this.prisma.chartAnalysis.findUnique({
            where: { id },
            include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } },
        });

        if (!analysis) {
            throw new NotFoundException('Análisis no encontrado.');
        }

        if (analysis.userId !== userId) {
            throw new ForbiddenException('Solo el creador puede congelar una versión de este análisis.');
        }

        const stateToFreeze = dto?.chartState || analysis.chartState;
        this.validateChartState(stateToFreeze);
        const cleanState = this.sanitizeDrawings(stateToFreeze);

        const lastVersionNumber = analysis.versions[0]?.versionNumber || 0;
        const newVersionNumber = lastVersionNumber + 1;

        return this.prisma.chartAnalysisVersion.create({
            data: {
                analysisId: id,
                versionNumber: newVersionNumber,
                chartState: cleanState,
            },
        });
    }

    async getVersion(versionId: string) {
        const version = await this.prisma.chartAnalysisVersion.findUnique({
            where: { id: versionId },
            include: {
                analysis: {
                    select: {
                        id: true,
                        title: true,
                        symbol: true,
                        exchange: true,
                        timeframe: true,
                        userId: true,
                        user: {
                            select: {
                                id: true,
                                username: true,
                                avatarUrl: true,
                                isVerified: true,
                            },
                        },
                    },
                },
            },
        });

        if (!version) {
            throw new NotFoundException('Versión de análisis no encontrada.');
        }

        return version;
    }

    async fork(id: string, userId: string, dto?: ForkChartAnalysisDto) {
        const source = await this.prisma.chartAnalysis.findUnique({
            where: { id },
            include: { user: { select: { username: true } } },
        });

        if (!source) {
            throw new NotFoundException('Análisis original no encontrado.');
        }

        if (!source.isPublic && source.userId !== userId) {
            throw new ForbiddenException('No se puede copiar un análisis privado ajeno.');
        }

        const newTitle = dto?.newTitle || `${source.title} (Copia de @${source.user.username})`;

        return this.prisma.chartAnalysis.create({
            data: {
                userId,
                symbol: source.symbol,
                exchange: source.exchange,
                timeframe: source.timeframe,
                title: newTitle,
                description: source.description,
                chartState: source.chartState as any,
                isPublic: false,
                forkedFromId: source.id,
            },
        });
    }
}
