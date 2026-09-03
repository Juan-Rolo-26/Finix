import { Controller, Get, Res, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Controller('health')
export class HealthController {
    constructor(private readonly prisma: PrismaService) { }

    @Get()
    check(@Res() res: any) {
        return res.status(HttpStatus.OK).json({ status: 'ok', message: 'API is running' });
    }

    @Get('db')
    async checkDb(@Res() res: any) {
        try {
            await this.prisma.$queryRawUnsafe('SELECT 1');
            return res.status(HttpStatus.OK).json({ status: 'ok', message: 'Database is connected' });
        } catch (error) {
            return res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
                status: 'error',
                message: 'Database connection failed',
            });
        }
    }
}
