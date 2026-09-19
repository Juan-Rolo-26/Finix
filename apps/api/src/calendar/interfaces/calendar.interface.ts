export type CalendarImportance = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type CalendarImpact = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type MarketCalendarStatus = 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'PUBLISHED' | 'HIDDEN' | 'CANCELLED';
export type CalendarSourceType = 'AUTOMATIC' | 'MANUAL';
export type EarningsReportTiming = 'BMO' | 'AMC' | 'DMH'; // Before Market Open, After Market Close, During Market Hours
export type EarningsDateStatus = 'CONFIRMED' | 'ESTIMATED';

export type MarketCalendarCategory =
    | 'MACROECONOMIC'
    | 'MONETARY_POLICY'
    | 'INFLATION'
    | 'EMPLOYMENT'
    | 'GDP'
    | 'INTEREST_RATES'
    | 'CENTRAL_BANK'
    | 'CONSUMER'
    | 'HOUSING'
    | 'MANUFACTURING'
    | 'TRADE'
    | 'FISCAL'
    | 'BOND_AUCTION'
    | 'COMMODITIES'
    | 'EARNINGS'
    | 'CORPORATE_EVENT'
    | 'IPO'
    | 'DIVIDEND'
    | 'SHAREHOLDER_MEETING'
    | 'ECONOMIC_SPEECH'
    | 'OTHER';

export interface EconomicEventItem {
    id?: string;
    externalId?: string;
    sourceId?: string;
    sourceName?: string;
    eventType: 'ECONOMIC' | 'CORPORATE_EVENT' | 'EARNINGS' | 'MARKET';
    country: 'US' | 'AR' | string;
    countryCode?: string;
    currency?: string;
    title: string;
    description?: string;
    category: MarketCalendarCategory | string;
    subcategory?: string;
    importance: CalendarImportance;
    impact?: CalendarImpact;
    marketImpactScore: number;
    impactScore?: number;
    date: string; // YYYY-MM-DD
    time?: string; // e.g. "10:30"
    timestampUtc: Date;
    timezone: string;
    previousValue?: string;
    forecastValue?: string;
    consensusValue?: string;
    actualValue?: string;
    unit?: string;
    surprise?: number;
    surprisePercent?: number;
    expectedMarketEffect?: string;
    affectedAssets?: string[];
    source?: string;
    sourceUrl?: string;
    sourceType?: CalendarSourceType;
    companyName?: string;
    ticker?: string;
    status?: MarketCalendarStatus;
    isManual?: boolean;
    isAutomatic?: boolean;
    isVerified?: boolean;
    isPublished?: boolean;
    isFeatured?: boolean;
    eventFingerprint?: string;
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
    marketReaction?: number;
    marketCap?: number;
    earningsImpactScore: number;
    source?: string;
    sourceUrl?: string;
    sourceType?: CalendarSourceType;
    isPublished?: boolean;
    isFeatured?: boolean;
}

export interface DividendEventItem {
    id?: string;
    eventType?: 'DIVIDEND';
    ticker: string;
    companyName: string;
    logoUrl?: string;
    exDate: string; // YYYY-MM-DD
    paymentDate?: string; // YYYY-MM-DD (cuándo pagan)
    recordDate?: string; // YYYY-MM-DD
    declarationDate?: string;
    amount?: number; // Monto en USD por acción (cuánto pagan)
    yield?: number; // Rendimiento por dividendo en %
    frequency?: string;
    marketCap?: number;
    source?: string;
    sourceType?: CalendarSourceType;
    isPublished?: boolean;
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
    dividendEvents: DividendEventItem[];
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
        dividends: number;
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
