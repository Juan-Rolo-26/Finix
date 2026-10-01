export const WATCHLIST_CONFIG = {
    FREE: {
        maxWatchlists: 1,
        maxItemsPerList: 5,
        allowCustomTargets: true,
        allowNotes: true,
        maxNotesPerItem: 3,
        allowCsvImport: false,
        allowIdeaTracking: false,
        allowAdvancedAlerts: false,
    },
    PRO: {
        maxWatchlists: 25,
        maxItemsPerList: 100,
        allowCustomTargets: true,
        allowNotes: true,
        maxNotesPerItem: 50,
        allowCsvImport: true,
        allowIdeaTracking: true,
        allowAdvancedAlerts: true,
    },
    CREATOR: {
        maxWatchlists: 50,
        maxItemsPerList: 200,
        allowCustomTargets: true,
        allowNotes: true,
        maxNotesPerItem: 100,
        allowCsvImport: true,
        allowIdeaTracking: true,
        allowAdvancedAlerts: true,
    },
};

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
