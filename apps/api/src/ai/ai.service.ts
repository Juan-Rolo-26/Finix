import {
    BadGatewayException,
    Injectable,
    InternalServerErrorException,
    Logger,
    RequestTimeoutException,
    ServiceUnavailableException,
} from '@nestjs/common';
import { FundamentalAnalysisDto } from './dto/fundamental-analysis.dto';
import { buildFundamentalPrompt } from './utils/build-prompt';

interface OllamaGenerateResponse {
    model?: string;
    response?: string;
    done?: boolean;
    total_duration?: number;
    eval_count?: number;
}

export interface StructuredAnalysis {
    rentabilidad: string;
    crecimiento: string;
    riesgoFinanciero: string;
    valoracion: string;
    conclusionFinal: string;
}

@Injectable()
export class AiService {
    private readonly logger = new Logger(AiService.name);
    private readonly ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
    private readonly defaultModel = process.env.OLLAMA_MODEL || 'phi3:mini';
    private readonly timeoutMs = Number(process.env.OLLAMA_TIMEOUT_MS || 45_000);

    async generateFundamentalAnalysis(payload: FundamentalAnalysisDto) {
        const startedAt = Date.now();
        const ticker = payload.ticker.toUpperCase().trim();
        const model = this.resolveModel(payload.model);

        const { system, prompt } = buildFundamentalPrompt({
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

        this.logger.log(
            `AI fundamental analysis generated for ${ticker} using ${model} in ${latencyMs}ms`
        );

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

    private resolveModel(requestedModel?: string): string {
        const cleaned = (requestedModel || '').trim();
        return cleaned || this.defaultModel;
    }

    private async callOllama(params: {
        model: string;
        system: string;
        prompt: string;
    }): Promise<OllamaGenerateResponse> {
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
                this.logger.error(
                    `Ollama error ${response.status}: ${text.slice(0, 300)}`
                );

                if (response.status >= 500) {
                    throw new ServiceUnavailableException('Ollama no está disponible temporalmente.');
                }
                throw new BadGatewayException('Ollama devolvió una respuesta inválida.');
            }

            const json = (await response.json()) as OllamaGenerateResponse;
            if (!json || typeof json.response !== 'string') {
                throw new InternalServerErrorException('Respuesta inesperada del modelo IA.');
            }

            return json;
        } catch (error: any) {
            if (error?.name === 'AbortError') {
                throw new RequestTimeoutException(
                    `Timeout al consultar Ollama (${this.timeoutMs} ms).`
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

            this.logger.error(`Error comunicando con Ollama: ${error?.message || 'unknown error'}`);
            throw new ServiceUnavailableException('No se pudo conectar con el servicio de IA local (Ollama).');
        } finally {
            clearTimeout(timeout);
        }
    }

    private parseStructuredAnalysis(responseText: string): StructuredAnalysis {
        const normalized = responseText.trim();
        if (!normalized) {
            throw new InternalServerErrorException('El modelo devolvió una respuesta vacía.');
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

    private tryParseJson(value: string): any | null {
        if (!value) return null;
        try {
            return JSON.parse(value);
        } catch {
            return null;
        }
    }

    private extractJsonBlock(value: string): string {
        const match = value.match(/\{[\s\S]*\}/);
        return match ? match[0] : '';
    }

    private toText(value: unknown): string {
        if (typeof value === 'string') {
            const cleaned = value.trim();
            return cleaned || 'Sin detalle suficiente.';
        }
        return 'Sin detalle suficiente.';
    }
}
