import { WebSearchService } from './web-search.service';
import { WebAnalysisDto, AssetWebAnalysisDto } from '../dto/web-analysis.dto';
export declare class AiWebService {
    private readonly webSearch;
    private readonly logger;
    private readonly ollamaBaseUrl;
    private readonly defaultModel;
    private readonly timeoutMs;
    constructor(webSearch: WebSearchService);
    analyzeWebQuery(dto: WebAnalysisDto): Promise<{
        query: string;
        model: string;
        provider: string;
        latencyMs: number;
        analysis: string;
        sources: import("./web-search.service").WebSearchResult[];
        meta: {
            webSourcesUsed: number;
            tokenCount: number;
        };
    }>;
    analyzeAssetWithWebContext(dto: AssetWebAnalysisDto): Promise<{
        ticker: string;
        model: string;
        provider: string;
        latencyMs: number;
        analysis: string;
        sources: import("./web-search.service").WebSearchResult[];
        meta: {
            webSourcesUsed: number;
            tokenCount: number;
        };
    }>;
    private callOllama;
}
