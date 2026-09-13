export type CalendarImportance = 'HIGH' | 'MEDIUM' | 'LOW';
export type CalendarSourceType = 'AUTOMATIC' | 'MANUAL';
export type EarningsReportTiming = 'BMO' | 'AMC' | 'DMH'; // Before Market Open, After Market Close, During Market Hours
export type EarningsDateStatus = 'CONFIRMED' | 'ESTIMATED';

export interface EconomicEventItem {
    id?: string;
    eventType: 'ECONOMIC';
    country: 'US' | 'AR' | string;
    currency?: string;
    title: string;
    description?: string;
    category: 'INFLATION' | 'CENTRAL_BANK' | 'EMPLOYMENT' | 'ACTIVITY' | 'FISCAL' | 'TRADE' | 'OTHER' | string;
    importance: CalendarImportance;
    marketImpactScore: number;
    date: string; // YYYY-MM-DD
    time?: string; // e.g. "10:30"
    timestampUtc: Date;
    timezone: string;
    previousValue?: string;
    consensusValue?: string;
    actualValue?: string;
    surprise?: number;
    surprisePercent?: number;
    expectedMarketEffect?: string;
    affectedAssets?: string[];
    source?: string;
    sourceUrl?: string;
    sourceType?: CalendarSourceType;
    isPublished?: boolean;
    isFeatured?: boolean;
}

export interface EarningsEventItem {
    id?: string;
    eventType?: 'EARNINGS';
    ticker: string;
    companyName: string;
    logoUrl?: string;
    date: string; // YYYY-MM-DD
    time?: string; // e.g. "18:00"
    timestampUtc: Date;
    timezone: string;
    dateStatus: EarningsDateStatus;
    reportTiming?: EarningsReportTiming;
    epsEstimate?: number;
    revenueEstimate?: number;
    actualEps?: number;
    actualRevenue?: number;
    epsSurprise?: number;
    revenueSurprise?: number;
    marketCap?: number;
    earningsImpactScore: number;
    source?: string;
    sourceUrl?: string;
    sourceType?: CalendarSourceType;
    isPublished?: boolean;
    isFeatured?: boolean;
}

export interface HomeCalendarEventCard {
    id: string;
    type: 'EARNINGS' | 'ECONOMIC';
    country?: string; // US, AR
    ticker?: string; // For earnings
    title: string;
    subtitle?: string; // e.g. "Presenta resultados" or "Índice de Precios al Consumidor"
    date: string; // YYYY-MM-DD
    time?: string; // HH:mm
    dayLabel: string; // e.g. "MIÉ", "JUE", "VIE"
    timingLabel?: string; // "Después del cierre", "Antes de la apertura"
    importance: CalendarImportance;
    impactScore: number;
    logoUrl?: string;
    epsEstimate?: number;
    revenueEstimate?: number;
    dateStatus?: EarningsDateStatus;
    previousValue?: string;
    consensusValue?: string;
    actualValue?: string;
    surprise?: number;
    expectedMarketEffect?: string;
    affectedAssets?: string[];
}

export interface HomeCalendarResponse {
    events: HomeCalendarEventCard[];
    weekRange: {
        from: string;
        to: string;
    };
    updatedAt: string;
}

export interface CalendarWeekDay {
    date: string; // YYYY-MM-DD
    dayName: string; // "Lunes", "Martes", "Miércoles", "Jueves", "Viernes"
    shortDay: string; // "LUN", "MAR", "MIÉ", "JUE", "VIE"
    isToday: boolean;
    economicEvents: EconomicEventItem[];
    earningsEvents: EarningsEventItem[];
}

export interface CalendarWeekResponse {
    weekRange: {
        from: string;
        to: string;
    };
    isProUser: boolean;
    categories: {
        all: number;
        us: number;
        ar: number;
        earnings: number;
    };
    days: CalendarWeekDay[];
}

export interface IEarningsProvider {
    getUpcomingEarnings(from: string, to: string): Promise<EarningsEventItem[]>;
    getCompanyEarnings(symbol: string): Promise<EarningsEventItem | null>;
    getWeeklyEarnings(): Promise<EarningsEventItem[]>;
}

export interface ICalendarProvider {
    getUpcomingEconomicEvents(from: string, to: string, countries: string[]): Promise<EconomicEventItem[]>;
}
