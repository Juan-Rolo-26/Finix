import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    Request,
    UseGuards,
} from '@nestjs/common';
import { ChartAnalysisService } from './chart-analysis.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt.guard';
import {
    CreateChartAnalysisDto,
    UpdateChartAnalysisDto,
    CreateChartVersionDto,
    ForkChartAnalysisDto,
} from './dto/chart-analysis.dto';

@Controller('chart-analysis')
export class ChartAnalysisController {
    constructor(private readonly chartAnalysisService: ChartAnalysisService) {}

    @UseGuards(JwtAuthGuard)
    @Post()
    create(@Request() req: any, @Body() dto: CreateChartAnalysisDto) {
        return this.chartAnalysisService.create(req.user.id, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Get()
    findAllUser(
        @Request() req: any,
        @Query('symbol') symbol?: string,
        @Query('limit') limit?: string,
    ) {
        return this.chartAnalysisService.findAllUser(req.user.id, {
            symbol,
            limit: limit ? parseInt(limit, 10) : undefined,
        });
    }

    @Get('version/:versionId')
    getVersion(@Param('versionId') versionId: string) {
        return this.chartAnalysisService.getVersion(versionId);
    }

    @UseGuards(OptionalJwtAuthGuard)
    @Get(':id')
    findOne(@Param('id') id: string, @Request() req: any) {
        return this.chartAnalysisService.findOne(id, req.user?.id);
    }

    @UseGuards(JwtAuthGuard)
    @Put(':id')
    update(
        @Param('id') id: string,
        @Request() req: any,
        @Body() dto: UpdateChartAnalysisDto,
    ) {
        return this.chartAnalysisService.update(id, req.user.id, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    delete(@Param('id') id: string, @Request() req: any) {
        return this.chartAnalysisService.delete(id, req.user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id/version')
    createVersion(
        @Param('id') id: string,
        @Request() req: any,
        @Body() dto: CreateChartVersionDto,
    ) {
        return this.chartAnalysisService.createVersion(id, req.user.id, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id/fork')
    fork(
        @Param('id') id: string,
        @Request() req: any,
        @Body() dto: ForkChartAnalysisDto,
    ) {
        return this.chartAnalysisService.fork(id, req.user.id, dto);
    }
}
