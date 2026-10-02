type LegacyEvent = {
    sourceType?: string | null;
    source?: string | null;
    sourceName?: string | null;
    isManual?: boolean;
    externalId?: string | null;
    sourceId?: string | null;
    title?: string;
    time?: string | null;
    previousValue?: string | null;
    consensusValue?: string | null;
    actualValue?: string | null;
    ticker?: string;
    epsEstimate?: number | null;
    revenueEstimate?: number | null;
    actualEps?: number | null;
    actualRevenue?: number | null;
};

// Exact fingerprints of the removed weekly templates, not a list of valid events.
// Manual entries, sourced records and published actuals are never suppressed.
const economicTemplates = new Set(
    [
        [
            'Apple Special Event \u2014 Presentaci\u00f3n de Nuevos Dispositivos y Ecosistema Apple Intelligence',
            'Apple Investor Relations',
            '14:00',
            null,
            null,
        ],
        [
            'NVIDIA GTC Keynote \u2014 Conferencia de Inteligencia Artificial & Computaci\u00f3n Acelerada',
            'NVIDIA Investor Relations',
            '13:00',
            null,
            null,
        ],
        [
            'Tesla Autonomous Technology & Robotaxi Investor Event',
            'Tesla Investor Relations',
            '17:00',
            null,
            null,
        ],
        [
            'Subastas de Letras del Tesoro de EE.UU. (T-Bills Auction)',
            'U.S. Department of the Treasury / Investing.com',
            '11:30',
            '4.85%',
            '4.80%',
        ],
        [
            'Ventas Minoristas Mensuales (Retail Sales)',
            'U.S. Census Bureau / Investing.com',
            '08:30',
            '0.4%',
            '0.3%',
        ],
        [
            '\u00cdndice de Precios al Consumidor (IPC de EE.UU.)',
            'U.S. Bureau of Labor Statistics (BLS)',
            '08:30',
            '2.9%',
            '2.8%',
        ],
        [
            'Decisi\u00f3n de Tasa de Inter\u00e9s de la Reserva Federal (FOMC)',
            'Federal Reserve (FOMC Calendars)',
            '14:00',
            '5.25%',
            '5.00%',
        ],
        [
            'Conferencia de Prensa de Jerome Powell (FOMC)',
            'Federal Reserve (Fed)',
            '14:30',
            null,
            null,
        ],
        [
            '\u00cdndice de Precios al Productor (IPP de EE.UU.)',
            'U.S. Bureau of Labor Statistics (BLS)',
            '08:30',
            '2.4%',
            '2.2%',
        ],
        [
            'Peticiones Iniciales de Subsidio por Desempleo (Jobless Claims)',
            'U.S. Department of Labor (DOL) / Investing.com',
            '08:30',
            '225K',
            '220K',
        ],
        [
            'Sentimiento del Consumidor de la Univ. de Michigan',
            'University of Michigan / Investing.com',
            '10:00',
            '67.9',
            '69.5',
        ],
        [
            'Liquidaci\u00f3n de Divisas del Agro (CIARA-CEC / BCRA)',
            'CIARA-CEC / BCRA',
            '15:00',
            'USD 2.150 M',
            'USD 2.300 M',
        ],
        [
            'IPC \u2014 Inflaci\u00f3n de Argentina (INDEC)',
            'INDEC Argentina',
            '16:00',
            '4.0%',
            '3.8%',
        ],
        [
            'Canasta B\u00e1sica Total y Alimentaria (L\u00ednea de Pobreza e Indigencia)',
            'INDEC Argentina',
            '16:00',
            '+3.7%',
            '+3.5%',
        ],
        [
            'Decisi\u00f3n de Tasa de Pol\u00edtica Monetaria (BCRA)',
            'Banco Central de la Rep\u00fablica Argentina (BCRA)',
            '17:30',
            '35.0%',
            '35.0%',
        ],
        [
            'ICA \u2014 Intercambio Comercial Argentino (Balanza Comercial)',
            'INDEC Argentina',
            '16:00',
            'USD +1.380 M',
            'USD +1.450 M',
        ],
        [
            'EMAE \u2014 Estimador Mensual de Actividad Econ\u00f3mica (INDEC)',
            'INDEC Argentina',
            '16:00',
            '-1.4%',
            '+0.6%',
        ],
    ].map((row) => JSON.stringify(row)),
);
const earningsTemplates = new Set(
    [
        ['ORCL', '08:00', 1.38, 13.28],
        ['ADBE', '18:05', 4.65, 5.37],
        ['NKE', '08:15', 0.52, 11.6],
        ['FDX', '18:15', 4.75, 22.1],
        ['LEN', '18:00', 3.63, 8.7],
        ['GIS', '07:00', 1.06, 4.8],
        ['NVDA', '18:00', 0.74, 32.5],
        ['MU', '18:00', 1.11, 7.65],
        ['COST', '18:15', 5.08, 79.8],
        ['ACN', '06:50', 2.78, 16.38],
        ['DRI', '07:00', 1.75, 2.8],
        ['KMX', '18:00', 0.85, 6.8],
        ['CCL', '09:15', 1.15, 7.9],
        ['KBH', '08:00', 2.06, 1.73],
    ].map((row) => JSON.stringify(row)),
);

function isAutomaticTemplateCandidate(event: LegacyEvent): boolean {
    return (
        event.sourceType === 'AUTOMATIC' && !event.isManual && !event.externalId && !event.sourceId
    );
}

export function isLegacyEconomicTemplate(event: LegacyEvent): boolean {
    if (!isAutomaticTemplateCandidate(event) || event.actualValue != null) return false;
    return economicTemplates.has(
        JSON.stringify([
            event.title,
            event.sourceName || event.source,
            event.time,
            event.previousValue ?? null,
            event.consensusValue ?? null,
        ]),
    );
}

export function isLegacyEarningsTemplate(event: LegacyEvent): boolean {
    if (
        !isAutomaticTemplateCandidate(event) ||
        event.source !== 'SEC EDGAR / Consensus' ||
        event.actualEps != null ||
        event.actualRevenue != null
    )
        return false;
    return earningsTemplates.has(
        JSON.stringify([event.ticker, event.time, event.epsEstimate, event.revenueEstimate]),
    );
}
