export type OpportunityCategory = 'ALL' | 'UNDERVALUED' | 'HEALTH' | 'GROWTH' | 'DIVIDEND';

interface IndicatorSource {
    price?: number | null;
    fairValue?: number | null;
    opportunityScore?: number | null;
    dividendYield?: number | null;
    scoreBreakdown?: { balance?: number | null; growth?: number | null };
}

export const opportunityIndicatorMeta: Record<OpportunityCategory, { label: string; description: string }> = {
    ALL: { label: 'Puntaje Finix', description: 'Puntaje de 0 a 100 según las métricas disponibles; la cobertura se muestra por separado.' },
    UNDERVALUED: { label: 'Valuación estimada', description: 'Descuento = (valor justo − precio) / valor justo × 100. El valor justo proviene del modelo DCF de Finix; difiere del potencial alcista, que se calcula sobre el precio.' },
    HEALTH: { label: 'Salud del balance', description: 'Puntaje de balance de 0 a 100, basado en liquidez corriente, liquidez rápida y deuda/patrimonio disponibles. Es un puntaje, no una probabilidad.' },
    GROWTH: { label: 'Puntaje de crecimiento', description: 'Puntaje de 0 a 100 calculado por Finix a partir del crecimiento disponible de ingresos, EPS, EBITDA, FCF y beneficio neto. Las tasas reales aparecen en sus columnas.' },
    DIVIDEND: { label: 'Rendimiento por dividendos', description: 'Dividendos como porcentaje del precio, según los datos de la fuente. El payout se muestra por separado.' },
};

const finite = (value: number | null | undefined): value is number => typeof value === 'number' && Number.isFinite(value);
const validScore = (value: number | null | undefined) => finite(value) && value >= 0 && value <= 100 ? value : null;
const percent = (value: number) => `${new Intl.NumberFormat('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value)}%`;

export function getOpportunityIndicator(category: OpportunityCategory, item: IndicatorSource) {
    const meta = opportunityIndicatorMeta[category];
    if (category === 'UNDERVALUED') {
        const valid = finite(item.price) && item.price > 0 && finite(item.fairValue) && item.fairValue > 0;
        const discount = valid ? (1 - item.price! / item.fairValue!) * 100 : null;
        const value = discount !== null && Number.isFinite(discount) ? discount : null;
        return { ...meta, value, display: value === null ? '—' : percent(Math.abs(value)), detail: value === null ? 'Sin valuación comparable' : value > 0 ? 'Debajo del valor estimado' : value < 0 ? 'Sobre el valor estimado' : 'En el valor estimado', tone: value === null || value === 0 ? 'default' : value > 0 ? 'positive' : 'negative', progress: null } as const;
    }
    if (category === 'DIVIDEND') {
        const value = finite(item.dividendYield) && item.dividendYield >= 0 ? item.dividendYield : null;
        return { ...meta, value, display: value === null ? '—' : percent(value), detail: value === null ? 'Sin datos de dividendos' : 'Dividendos / precio', tone: value !== null && value > 0 ? 'positive' : 'default', progress: null } as const;
    }
    const value = validScore(category === 'ALL' ? item.opportunityScore : category === 'HEALTH' ? item.scoreBreakdown?.balance : item.scoreBreakdown?.growth);
    return { ...meta, value, display: value === null ? '—' : `${Math.round(value)}/100`, detail: value === null ? 'Sin puntaje disponible' : category === 'HEALTH' ? 'Liquidez y endeudamiento' : category === 'GROWTH' ? 'Crecimiento fundamental' : 'Indicador compuesto', tone: 'default', progress: value } as const;
}
