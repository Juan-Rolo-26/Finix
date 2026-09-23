import { Controller, Get, Post, Patch, Delete, Param, Body, Req, Query, UseGuards, UnauthorizedException } from '@nestjs/common';
import { AlertsService, CreateAlertDto, UpdateAlertDto } from './alerts.service';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt.guard';
import { PrismaService } from '../prisma.service';

@Controller('alerts')
@UseGuards(OptionalJwtAuthGuard)
export class AlertsController {
    constructor(
        private readonly alertsService: AlertsService,
        private readonly prisma: PrismaService,
    ) { }

    private async resolveUserId(req: any): Promise<string> {
        // Alertas siempre pertenecen al usuario autenticado. Nunca atribuir
        // solicitudes anónimas al admin ni confiar en un ID enviado por header.
        const id = req.user?.id || req.user?.sub;
        if (id) {
            const userExists = await (this.prisma as any).user.findUnique({ where: { id: String(id) } });
            if (userExists) return String(id);
        }
        throw new UnauthorizedException('Iniciá sesión para administrar tus alertas.');
    }

    @Get()
    async getAlerts(
        @Req() req: any,
        @Query('status') status?: string,
        @Query('ticker') ticker?: string,
    ) {
        const userId = await this.resolveUserId(req);
        return this.alertsService.getUserAlerts(userId, { status, ticker });
    }

    @Post()
    async createAlert(
        @Req() req: any,
        @Body() body: CreateAlertDto,
    ) {
        const userId = await this.resolveUserId(req);
        return this.alertsService.createAlert(userId, body);
    }

    @Get('admin/overview')
    async getAdminOverview() {
        return this.alertsService.getAdminOverview();
    }

    @Post('check')
    async triggerCheck() {
        return this.alertsService.checkActiveAlerts();
    }

    @Get(':id')
    async getAlert(
        @Req() req: any,
        @Param('id') id: string,
    ) {
        const userId = await this.resolveUserId(req);
        return this.alertsService.getAlert(userId, id);
    }

    @Patch(':id')
    async updateAlert(
        @Req() req: any,
        @Param('id') id: string,
        @Body() body: UpdateAlertDto,
    ) {
        const userId = await this.resolveUserId(req);
        return this.alertsService.updateAlert(userId, id, body);
    }

    @Patch(':id/toggle')
    async toggleAlert(
        @Req() req: any,
        @Param('id') id: string,
    ) {
        const userId = await this.resolveUserId(req);
        return this.alertsService.toggleAlert(userId, id);
    }

    @Delete(':id')
    async deleteAlert(
        @Req() req: any,
        @Param('id') id: string,
    ) {
        const userId = await this.resolveUserId(req);
        return this.alertsService.deleteAlert(userId, id);
    }
}
