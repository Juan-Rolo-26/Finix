import { AiService } from './ai.service';
import { AiWebService } from './services/ai-web.service';
import { FundamentalAnalysisDto } from './dto/fundamental-analysis.dto';
import { WebAnalysisDto, AssetWebAnalysisDto } from './dto/web-analysis.dto';
export declare class AiController {
    private readonly aiService;
    private readonly aiWebService;
    constructor(aiService: AiService, aiWebService: AiWebService);
    generateFundamentalAnalysis(body: FundamentalAnalysisDto): Promise<{
        ticker: string;
        model: string;
        provider: string;
        latencyMs: number;
        analysis: import("./ai.service").StructuredAnalysis;
        meta: {
            totalDurationNs: number;
            tokenCount: number;
        };
    }>;
    analyzeWebQuery(body: WebAnalysisDto): Promise<{
        query: string;
        model: string;
        provider: string;
        latencyMs: number;
        analysis: string;
        sources: import("./services/web-search.service").WebSearchResult[];
        meta: {
            webSourcesUsed: number;
            tokenCount: number;
        };
    }>;
    analyzeAssetWithWebContext(body: AssetWebAnalysisDto): Promise<{
        ticker: string;
        model: string;
        provider: string;
        latencyMs: number;
        analysis: string;
        sources: import("./services/web-search.service").WebSearchResult[];
        meta: {
            webSourcesUsed: number;
            tokenCount: number;
        };
    }>;
}
