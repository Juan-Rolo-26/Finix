import { WATCHLIST_PLAN_LIMITS } from '@finix/shared';

export const WATCHLIST_CONFIG = WATCHLIST_PLAN_LIMITS;

export type WatchlistPersonalStatus = 'RESEARCHING' | 'WAITING_PRICE' | 'EARNINGS' | 'DISCARDED';

export const PERSONAL_STATUS_LABELS: Record<WatchlistPersonalStatus, { label: string; color: string; description: string }> = {
    RESEARCHING: {
        label: 'Investigando',
        color: 'blue',
        description: 'Activo en proceso de análisis fundamental o técnico.',
    },
    WAITING_PRICE: {
        label: 'Esperando precio',
        color: 'amber',
        description: 'A la espera de un punto de entrada u objetivo de precio definido.',
    },
    EARNINGS: {
        label: 'Siguiendo resultados',
        color: 'purple',
        description: 'Monitoreando próximos balances, reportes trimestrales o anuncios.',
    },
    DISCARDED: {
        label: 'Descartada',
        color: 'zinc',
        description: 'Idea revisada que no cumple las condiciones actuales de inversión.',
    },
};
