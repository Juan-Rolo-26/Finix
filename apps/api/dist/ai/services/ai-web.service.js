"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AiWebService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiWebService = void 0;
const common_1 = require("@nestjs/common");
const web_search_service_1 = require("./web-search.service");
const build_web_prompt_1 = require("../utils/build-web-prompt");
let AiWebService = AiWebService_1 = class AiWebService {
    constructor(webSearch) {
        this.webSearch = webSearch;
        this.logger = new common_1.Logger(AiWebService_1.name);
        this.ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
        this.defaultModel = process.env.OLLAMA_MODEL || 'phi3:mini';
        this.timeoutMs = Number(process.env.OLLAMA_TIMEOUT_MS || 90_000);
    }
    async analyzeWebQuery(dto) {
        const startedAt = Date.now();
        const model = dto.model?.trim() || this.defaultModel;
        this.logger.log(`[WebAI] Searching web for: "${dto.query}"`);
        const searchResults = await this.webSearch.search(dto.query, 6);
        this.logger.log(`[WebAI] Got ${searchResults.length} web results, building prompt...`);
        const { system, prompt } = (0, build_web_prompt_1.buildWebAnalysisPrompt)({
            query: dto.query,
            context: dto.context,
            searchResults,
        });
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
    async analyzeAssetWithWebContext(dto) {
        const startedAt = Date.now();
        const ticker = dto.ticker.toUpperCase().trim();
        const model = dto.model?.trim() || this.defaultModel;
        const queries = [
            `${ticker} stock news today 2025`,
            `${ticker} market analysis outlook`,
            `${ticker} earnings revenue forecast`,
        ];
        this.logger.log(`[WebAI] Fetching web context for ${ticker}...`);
        const allResults = await Promise.all(queries.map((q) => this.webSearch.search(q, 3)));
        const seen = new Set();
        const searchResults = allResults
            .flat()
            .filter((r) => {
            if (seen.has(r.url))
                return false;
            seen.add(r.url);
            return true;
        })
            .slice(0, 8);
        this.logger.log(`[WebAI] Got ${searchResults.length} unique results for ${ticker}`);
        const { system, prompt } = (0, build_web_prompt_1.buildAssetWebPrompt)({
            ticker,
            question: dto.question,
            searchResults,
        });
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
    async callOllama(params) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
        try {
            const body = {
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
                    throw new common_1.ServiceUnavailableException('Ollama no está disponible temporalmente.');
                }
                throw new common_1.BadGatewayException('Ollama devolvió una respuesta inválida.');
            }
            const json = (await response.json());
            if (!json || typeof json.response !== 'string') {
                throw new common_1.InternalServerErrorException('Respuesta inesperada del modelo IA.');
            }
            return json;
        }
        catch (error) {
            if (error?.name === 'AbortError') {
                throw new common_1.RequestTimeoutException(`Timeout al consultar Ollama (${this.timeoutMs}ms).`);
            }
            if (error instanceof common_1.RequestTimeoutException ||
                error instanceof common_1.ServiceUnavailableException ||
                error instanceof common_1.BadGatewayException ||
                error instanceof common_1.InternalServerErrorException) {
                throw error;
            }
            this.logger.error(`Ollama error: ${error?.message || 'unknown'}`);
            throw new common_1.ServiceUnavailableException('No se pudo conectar con el servicio de IA local (Ollama).');
        }
        finally {
            clearTimeout(timeout);
        }
    }
};
exports.AiWebService = AiWebService;
exports.AiWebService = AiWebService = AiWebService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [web_search_service_1.WebSearchService])
], AiWebService);
//# sourceMappingURL=ai-web.service.js.map