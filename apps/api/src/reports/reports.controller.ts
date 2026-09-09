import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request as ExpressRequest } from 'express';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) { }

    @Post()
    async createReport(
        @Request() req: ExpressRequest,
        @Body() body: { targetType: string; targetId: string; reason: string }
    ) {
        const userId = (req.user as any).id;
        return this.reportsService.createReport(userId, body.targetType, body.targetId, body.reason);
    }
}
