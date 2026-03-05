import { FundamentalAnalysisDto } from './dto/fundamental-analysis.dto';
export interface StructuredAnalysis {
    rentabilidad: string;
    crecimiento: string;
    riesgoFinanciero: string;
    valoracion: string;
    conclusionFinal: string;
}
export declare class AiService {
    private readonly logger;
    private readonly ollamaBaseUrl;
    private readonly defaultModel;
    private readonly timeoutMs;
    generateFundamentalAnalysis(payload: FundamentalAnalysisDto): Promise<{
        ticker: string;
        model: string;
        provider: string;
        latencyMs: number;
        analysis: StructuredAnalysis;
        meta: {
            totalDurationNs: number;
            tokenCount: number;
        };
    }>;
    private resolveModel;
    private callOllama;
    private parseStructuredAnalysis;
    private tryParseJson;
    private extractJsonBlock;
    private toText;
}
