import {
    Body,
    Controller,
    Post,
    UseGuards,
    UsePipes,
    ValidationPipe,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AiService } from './ai.service';
import { AiWebService } from './services/ai-web.service';
import { FundamentalAnalysisDto } from './dto/fundamental-analysis.dto';
import { WebAnalysisDto, AssetWebAnalysisDto } from './dto/web-analysis.dto';

const VALIDATION_PIPE = new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
});

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
    constructor(
        private readonly aiService: AiService,
        private readonly aiWebService: AiWebService,
    ) { }

    /**
     * POST /api/ai/fundamental-analysis
     * Análisis fundamental clásico de un activo (sin acceso web).
     */
    @Post('fundamental-analysis')
    @HttpCode(HttpStatus.OK)
    @UsePipes(VALIDATION_PIPE)
    async generateFundamentalAnalysis(@Body() body: FundamentalAnalysisDto) {
        return this.aiService.generateFundamentalAnalysis(body);
    }

    /**
     * POST /api/ai/web-analysis
     * Chat libre con la IA — puede opinar sobre cualquier tema usando búsqueda web en tiempo real.
     *
     * Body: { query: string, context?: string, model?: string, includeSearchResults?: boolean }
     */
    @Post('web-analysis')
    @HttpCode(HttpStatus.OK)
    @UsePipes(VALIDATION_PIPE)
    async analyzeWebQuery(@Body() body: WebAnalysisDto) {
        return this.aiWebService.analyzeWebQuery(body);
    }

    /**
     * POST /api/ai/asset-web-context
     * Análisis de un activo/ticker con contexto de noticias y datos web en tiempo real.
     *
     * Body: { ticker: string, question?: string, model?: string }
     */
    @Post('asset-web-context')
    @HttpCode(HttpStatus.OK)
    @UsePipes(VALIDATION_PIPE)
    async analyzeAssetWithWebContext(@Body() body: AssetWebAnalysisDto) {
        return this.aiWebService.analyzeAssetWithWebContext(body);
    }
}
