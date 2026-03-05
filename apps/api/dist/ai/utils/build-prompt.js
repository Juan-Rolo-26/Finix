"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildFundamentalPrompt = buildFundamentalPrompt;
function buildFundamentalPrompt(input) {
    const system = [
        'Sos un analista financiero profesional estilo Wall Street.',
        'No inventes datos ni supuestos externos: usa solamente los datos recibidos.',
        'Si faltara un dato, aclaralo explícitamente sin inferir números.',
        'Escribí en español técnico pero claro y accionable.',
        'Debes devolver exclusivamente JSON válido, sin markdown ni texto extra.',
        'El JSON debe tener exactamente estas claves: rentabilidad, crecimiento, riesgoFinanciero, valoracion, conclusionFinal.',
    ].join(' ');
    const prompt = [
        'Analizá estos fundamentales y generá un diagnóstico profesional:',
        JSON.stringify({
            ticker: input.ticker,
            fundamentalData: input.fundamentalData,
        }, null, 2),
        'Objetivo del análisis:',
        '1) Rentabilidad (ROE, ROIC, FCF)',
        '2) Crecimiento (revenueGrowth y su calidad)',
        '3) Riesgo financiero (deuda y resiliencia)',
        '4) Valoración (principalmente PE vs calidad del negocio)',
        '5) Conclusión final con sesgo práctico (sin recomendación legal).',
        'Formato de salida (JSON estricto):',
        '{"rentabilidad":"...","crecimiento":"...","riesgoFinanciero":"...","valoracion":"...","conclusionFinal":"..."}',
    ].join('\n\n');
    return { system, prompt };
}
//# sourceMappingURL=build-prompt.js.map