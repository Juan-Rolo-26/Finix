"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildWebAnalysisPrompt = buildWebAnalysisPrompt;
exports.buildAssetWebPrompt = buildAssetWebPrompt;
function buildWebAnalysisPrompt(params) {
    const system = [
        'Sos FINIX AI, un analista financiero y económico de élite con acceso a información de toda la web.',
        'Tenés acceso a resultados de búsqueda en tiempo real que te permiten opinar sobre cualquier tema actual.',
        'Respondés siempre en español técnico pero accesible.',
        'Cuando disponés de fuentes web, las mencionás y las contextualizás.',
        'No inventás datos — si no tenés información suficiente, lo aclarás.',
        'Tu análisis siempre es balanceado: presentás pros, contras, riesgos y oportunidades.',
        'Sos directo, accionable y evitás vaguedades.',
    ].join(' ');
    const webContext = params.searchResults.length > 0
        ? [
            '--- CONTEXTO WEB (resultados de búsqueda en tiempo real) ---',
            ...params.searchResults.map((r, i) => `[${i + 1}] ${r.title}\nURL: ${r.url}\nResumen: ${r.snippet || 'Sin extracto disponible'}`),
            '--- FIN CONTEXTO WEB ---',
        ].join('\n\n')
        : 'No se encontraron resultados de búsqueda relevantes para esta consulta.';
    const userContext = params.context
        ? `\nContexto adicional del usuario: ${params.context}\n`
        : '';
    const prompt = [
        `Pregunta / Consulta del usuario:`,
        `"${params.query}"`,
        userContext,
        webContext,
        '',
        'Con base en los resultados de búsqueda y tu conocimiento, generá un análisis profundo y completo.',
        'Estructurá tu respuesta con:',
        '- Resumen ejecutivo',
        '- Análisis detallado',
        '- Puntos clave (oportunidades y riesgos)',
        '- Conclusión final',
        'Citá las fuentes web cuando sea relevante.',
    ].join('\n\n');
    return { system, prompt };
}
function buildAssetWebPrompt(params) {
    const system = [
        `Sos FINIX AI, un analista de inversiones de Wall Street con acceso en tiempo real a noticias y datos de mercado.`,
        'Analizás activos financieros combinando datos fundamentales con el contexto de noticias y tendencias actuales de la web.',
        'Respondés en español técnico pero claro.',
        'Nunca hacés recomendaciones de compra/venta — das análisis imparcial.',
        'Cuando citás noticias o fuentes, las referenciás explícitamente.',
    ].join(' ');
    const webContext = params.searchResults.length > 0
        ? [
            `--- NOTICIAS Y CONTEXTO WEB PARA ${params.ticker.toUpperCase()} ---`,
            ...params.searchResults.map((r, i) => `[${i + 1}] ${r.title}\nFuente: ${r.url}\n${r.snippet || ''}`),
            '--- FIN CONTEXTO ---',
        ].join('\n\n')
        : `No se encontraron noticias recientes para ${params.ticker}.`;
    const extraQ = params.question
        ? `\nPregunta específica del usuario: "${params.question}"\n`
        : '';
    const prompt = [
        `Analizá el activo financiero: ${params.ticker.toUpperCase()}`,
        extraQ,
        webContext,
        '',
        'Generá un análisis contextual completo con:',
        '1. Situación actual del activo según las noticias',
        '2. Factores macro y micro que lo impactan',
        '3. Sentimiento del mercado (basado en las fuentes)',
        '4. Riesgos y oportunidades detectados',
        '5. Conclusión con perspectiva de analista',
    ].join('\n\n');
    return { system, prompt };
}
//# sourceMappingURL=build-web-prompt.js.map