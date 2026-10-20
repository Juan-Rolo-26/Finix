const TECHNICAL_FIELDS = ['rsi','sma20','sma50','sma100','sma200','macd','bollingerBands','atr','supports','resistances','trend','momentum','technicalData'];
const technicalText = /\bRSI\b|\bSMA\s*\d|media(?:s)? m[oó]vil|lectura t[eé]cnica|configuraci[oó]n t[eé]cnica|an[aá]lisis t[eé]cnico|señal(?:es)? t[eé]cnica|soportes? (?:y |o )?resistencias?/i;
function cleanNarrative(value: any): any {
    if (Array.isArray(value)) return value.map(cleanNarrative).filter(item => item !== '');
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key,item]) => [key,cleanNarrative(item)]));
    if (typeof value !== 'string') return value;
    return value.split(/(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚ])/).filter(sentence => !technicalText.test(sentence)).join(' ').trim();
}
/** Hide technical research globally while retaining the stored editor data. */
export function fundamentalOnly<T extends Record<string, any>>(analysis: T): T {
    const result: any = { ...analysis };
    for (const key of TECHNICAL_FIELDS) delete result[key];
    let visibility = result.sectionVisibility || {};
    try { if (typeof visibility === 'string') visibility = JSON.parse(visibility); } catch { visibility = {}; }
    result.sectionVisibility = { ...visibility, showTechnical: false };
    if (result.executiveSummary) {
        let summary = result.executiveSummary;
        try { if (typeof summary === 'string') summary = JSON.parse(summary); } catch { /* Keep plain text for legacy summaries. */ }
        result.executiveSummary = cleanNarrative(summary);
    }
    return result;
}
