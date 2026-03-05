"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var AiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiService = void 0;
const common_1 = require("@nestjs/common");
const build_prompt_1 = require("./utils/build-prompt");
let AiService = AiService_1 = class AiService {
    constructor() {
        this.logger = new common_1.Logger(AiService_1.name);
        this.ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
        this.defaultModel = process.env.OLLAMA_MODEL || 'phi3:mini';
        this.timeoutMs = Number(process.env.OLLAMA_TIMEOUT_MS || 45_000);
    }
    async generateFundamentalAnalysis(payload) {
        const startedAt = Date.now();
        const ticker = payload.ticker.toUpperCase().trim();
        const model = this.resolveModel(payload.model);
        const { system, prompt } = (0, build_prompt_1.buildFundamentalPrompt)({
            ticker,
            fundamentalData: payload.fundamentalData,
        });
        const raw = await this.callOllama({
            model,
            system,
            prompt,
        });
        const analysis = this.parseStructuredAnalysis(raw.response || '');
        const latencyMs = Date.now() - startedAt;
        this.logger.log(`AI fundamental analysis generated for ${ticker} using ${model} in ${latencyMs}ms`);
        return {
            ticker,
            model,
            provider: 'ollama',
            latencyMs,
            analysis,
            meta: {
                totalDurationNs: raw.total_duration || null,
                tokenCount: raw.eval_count || null,
            },
        };
    }
    resolveModel(requestedModel) {
        const cleaned = (requestedModel || '').trim();
        return cleaned || this.defaultModel;
    }
    async callOllama(params) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
        try {
            const response = await fetch(`${this.ollamaBaseUrl}/api/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: params.model,
                    system: params.system,
                    prompt: params.prompt,
                    stream: false,
                    format: 'json',
                    options: {
                        temperature: 0.2,
                        top_p: 0.9,
                    },
                }),
                signal: controller.signal,
            });
            if (!response.ok) {
                const text = await response.text();
                this.logger.error(`Ollama error ${response.status}: ${text.slice(0, 300)}`);
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
                throw new common_1.RequestTimeoutException(`Timeout al consultar Ollama (${this.timeoutMs} ms).`);
            }
            if (error instanceof common_1.RequestTimeoutException ||
                error instanceof common_1.ServiceUnavailableException ||
                error instanceof common_1.BadGatewayException ||
                error instanceof common_1.InternalServerErrorException) {
                throw error;
            }
            this.logger.error(`Error comunicando con Ollama: ${error?.message || 'unknown error'}`);
            throw new common_1.ServiceUnavailableException('No se pudo conectar con el servicio de IA local (Ollama).');
        }
        finally {
            clearTimeout(timeout);
        }
    }
    parseStructuredAnalysis(responseText) {
        const normalized = responseText.trim();
        if (!normalized) {
            throw new common_1.InternalServerErrorException('El modelo devolvió una respuesta vacía.');
        }
        const parsed = this.tryParseJson(normalized) || this.tryParseJson(this.extractJsonBlock(normalized));
        if (!parsed) {
            return {
                rentabilidad: 'No fue posible estructurar la respuesta en JSON de forma confiable.',
                crecimiento: 'No fue posible estructurar la respuesta en JSON de forma confiable.',
                riesgoFinanciero: 'No fue posible estructurar la respuesta en JSON de forma confiable.',
                valoracion: 'No fue posible estructurar la respuesta en JSON de forma confiable.',
                conclusionFinal: normalized,
            };
        }
        return {
            rentabilidad: this.toText(parsed.rentabilidad),
            crecimiento: this.toText(parsed.crecimiento),
            riesgoFinanciero: this.toText(parsed.riesgoFinanciero),
            valoracion: this.toText(parsed.valoracion),
            conclusionFinal: this.toText(parsed.conclusionFinal),
        };
    }
    tryParseJson(value) {
        if (!value)
            return null;
        try {
            return JSON.parse(value);
        }
        catch {
            return null;
        }
    }
    extractJsonBlock(value) {
        const match = value.match(/\{[\s\S]*\}/);
        return match ? match[0] : '';
    }
    toText(value) {
        if (typeof value === 'string') {
            const cleaned = value.trim();
            return cleaned || 'Sin detalle suficiente.';
        }
        return 'Sin detalle suficiente.';
    }
};
exports.AiService = AiService;
exports.AiService = AiService = AiService_1 = __decorate([
    (0, common_1.Injectable)()
], AiService);
//# sourceMappingURL=ai.service.js.map