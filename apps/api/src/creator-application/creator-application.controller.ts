import {
    Body,
    Controller,
    Get,
    Param,
    Post,
    Put,
    Query,
    Request,
    UnauthorizedException,
    UseGuards,
} from '@nestjs/common';
import { CreatorApplicationService } from './creator-application.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma.service';

@Controller('creator-application')
export class CreatorApplicationController {
    constructor(
        private readonly service: CreatorApplicationService,
        private readonly prisma: PrismaService, // For admin check
    ) { }

    @UseGuards(JwtAuthGuard)
    @Post()
    apply(@Request() req, @Body() dto: CreateApplicationDto) {
        return this.service.create(req.user.id, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Get('my')
    getMyApplication(@Request() req) {
        return this.service.findMyApplication(req.user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Get()
    async findAll(@Request() req, @Query('status') status?: string) {
        // Simple admin check
        const user = await this.prisma.user.findUnique({ where: { id: req.user.id } });
        if (user?.role !== 'ADMIN') {
            throw new UnauthorizedException('Requiere permisos de administrador');
        }
        return this.service.findAll(status);
    }

    @UseGuards(JwtAuthGuard)
    @Put(':id/status')
    async updateStatus(
        @Request() req,
        @Param('id') id: string,
        @Body() dto: UpdateApplicationDto,
    ) {
        // Simple admin check
        const user = await this.prisma.user.findUnique({ where: { id: req.user.id } });
        if (user?.role !== 'ADMIN') {
            throw new UnauthorizedException('Requiere permisos de administrador');
        }
        return this.service.updateStatus(id, req.user.id, dto);
    }
}
