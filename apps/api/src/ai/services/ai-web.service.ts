import {
    Injectable,
    InternalServerErrorException,
    Logger,
    RequestTimeoutException,
    ServiceUnavailableException,
    BadGatewayException,
} from '@nestjs/common';
import { WebSearchService } from './web-search.service';
import { buildWebAnalysisPrompt, buildAssetWebPrompt } from '../utils/build-web-prompt';
import { WebAnalysisDto, AssetWebAnalysisDto } from '../dto/web-analysis.dto';

interface OllamaResponse {
    model?: string;
    response?: string;
    done?: boolean;
    total_duration?: number;
    eval_count?: number;
}

@Injectable()
export class AiWebService {
    private readonly logger = new Logger(AiWebService.name);
    private readonly ollamaBaseUrl =
        process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
    private readonly defaultModel =
        process.env.OLLAMA_MODEL || 'phi3:mini';
    private readonly timeoutMs = Number(process.env.OLLAMA_TIMEOUT_MS || 90_000);

    constructor(private readonly webSearch: WebSearchService) { }

    // ─── Web-aware free chat analysis ─────────────────────────────────────────

    async analyzeWebQuery(dto: WebAnalysisDto) {
        const startedAt = Date.now();
        const model = dto.model?.trim() || this.defaultModel;

        this.logger.log(`[WebAI] Searching web for: "${dto.query}"`);

        // 1. Search the web
        const searchResults = await this.webSearch.search(dto.query, 6);

        this.logger.log(
            `[WebAI] Got ${searchResults.length} web results, building prompt...`,
        );

        // 2. Build prompt
        const { system, prompt } = buildWebAnalysisPrompt({
            query: dto.query,
            context: dto.context,
            searchResults,
        });

        // 3. Call Ollama
        const raw = await this.callOllama({ model, system, prompt, isJson: false });
        const latencyMs = Date.now() - startedAt;

        this.logger.log(`[WebAI] Analysis complete in ${latencyMs}ms`);

        return {
            query: dto.query,
            model,
            provider: 'ollama',
            latencyMs,
            analysis: raw.response || '',
            sources: dto.includeSearchResults ? searchResults : undefined,
            meta: {
                webSourcesUsed: searchResults.length,
                tokenCount: raw.eval_count || null,
            },
        };
    }

    // ─── Asset news + web context analysis ────────────────────────────────────

    async analyzeAssetWithWebContext(dto: AssetWebAnalysisDto) {
        const startedAt = Date.now();
        const ticker = dto.ticker.toUpperCase().trim();
        const model = dto.model?.trim() || this.defaultModel;

        // Build multiple search queries for comprehensive coverage
        const queries = [
            `${ticker} stock news today 2025`,
            `${ticker} market analysis outlook`,
            `${ticker} earnings revenue forecast`,
        ];

        this.logger.log(`[WebAI] Fetching web context for ${ticker}...`);

        // Parallel searches
        const allResults = await Promise.all(
            queries.map((q) => this.webSearch.search(q, 3)),
        );

        // Deduplicate by URL
        const seen = new Set<string>();
        const searchResults = allResults
            .flat()
            .filter((r) => {
                if (seen.has(r.url)) return false;
                seen.add(r.url);
                return true;
            })
            .slice(0, 8);

        this.logger.log(
            `[WebAI] Got ${searchResults.length} unique results for ${ticker}`,
        );

        // Build prompt
        const { system, prompt } = buildAssetWebPrompt({
            ticker,
            question: dto.question,
            searchResults,
        });

        // Call Ollama
        const raw = await this.callOllama({ model, system, prompt, isJson: false });
        const latencyMs = Date.now() - startedAt;

        return {
            ticker,
            model,
            provider: 'ollama',
            latencyMs,
            analysis: raw.response || '',
            sources: searchResults,
            meta: {
                webSourcesUsed: searchResults.length,
                tokenCount: raw.eval_count || null,
            },
        };
    }

    // ─── Ollama caller ────────────────────────────────────────────────────────

    private async callOllama(params: {
        model: string;
        system: string;
        prompt: string;
        isJson: boolean;
    }): Promise<OllamaResponse> {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

        try {
            const body: Record<string, unknown> = {
                model: params.model,
                system: params.system,
                prompt: params.prompt,
                stream: false,
                options: {
                    temperature: 0.35,
                    top_p: 0.9,
                    num_predict: 1500,
                },
            };

            if (params.isJson) {
                body.format = 'json';
            }

            const response = await fetch(`${this.ollamaBaseUrl}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
                signal: controller.signal,
            });

            if (!response.ok) {
                const text = await response.text();
                this.logger.error(`Ollama ${response.status}: ${text.slice(0, 300)}`);
                if (response.status >= 500) {
                    throw new ServiceUnavailableException(
                        'Ollama no está disponible temporalmente.',
                    );
                }
                throw new BadGatewayException('Ollama devolvió una respuesta inválida.');
            }

            const json = (await response.json()) as OllamaResponse;
            if (!json || typeof json.response !== 'string') {
                throw new InternalServerErrorException('Respuesta inesperada del modelo IA.');
            }

            return json;
        } catch (error: any) {
            if (error?.name === 'AbortError') {
                throw new RequestTimeoutException(
                    `Timeout al consultar Ollama (${this.timeoutMs}ms).`,
                );
            }
            if (
                error instanceof RequestTimeoutException ||
                error instanceof ServiceUnavailableException ||
                error instanceof BadGatewayException ||
                error instanceof InternalServerErrorException
            ) {
                throw error;
            }
            this.logger.error(`Ollama error: ${error?.message || 'unknown'}`);
            throw new ServiceUnavailableException(
                'No se pudo conectar con el servicio de IA local (Ollama).',
            );
        } finally {
            clearTimeout(timeout);
        }
    }
}
