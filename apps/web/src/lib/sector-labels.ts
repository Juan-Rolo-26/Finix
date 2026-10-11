const SECTOR_LABELS: Record<string, string> = {
    'Information Technology': 'Tecnología de la información', Technology: 'Tecnología',
    'Health Care': 'Salud', Healthcare: 'Salud', Financials: 'Finanzas',
    'Financial Services': 'Servicios financieros',
    'Consumer Discretionary': 'Consumo discrecional', 'Consumer Cyclical': 'Consumo cíclico',
    'Consumer Staples': 'Consumo básico', 'Consumer Defensive': 'Consumo básico',
    'Communication Services': 'Servicios de comunicación', Industrials: 'Industria',
    'Basic Materials': 'Materiales básicos', Materials: 'Materiales', Energy: 'Energía',
    Utilities: 'Servicios públicos', 'Real Estate': 'Sector inmobiliario',
};
/** Translate display text; retain the provider value for requests and filters. */
export function sectorLabel(value: string | null | undefined): string {
    return value ? SECTOR_LABELS[value] || value : 'Sector no disponible';
}
