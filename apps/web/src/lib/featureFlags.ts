/**
 * Feature Flags para Finix Web.
 * Permite activar o desactivar secciones según el entorno o variables de entorno.
 */

/**
 * Determina si la sección de Seguimiento (Watchlists) está activa.
 *
 * Comportamiento:
 * - En local (Vite DEV o hostname localhost/127.0.0.1): ACTIVA por defecto.
 * - Al deployar / build de producción (subir a GitHub / hosting): DESACTIVADA por defecto.
 * - Puede ser forzada explícitamente definiendo VITE_ENABLE_WATCHLIST="true" o "false" en .env.
 */
export function isWatchlistEnabled(): boolean {
    if (import.meta.env.VITE_ENABLE_WATCHLIST === 'true') {
        return true;
    }
    if (import.meta.env.VITE_ENABLE_WATCHLIST === 'false') {
        return false;
    }

    // Si estamos en modo desarrollo de Vite (npm run dev)
    if (import.meta.env.DEV) {
        return true;
    }

    // Verificación adicional de ejecución local en navegador
    if (typeof window !== 'undefined') {
        const host = window.location.hostname;
        if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0') {
            return true;
        }
    }

    return false;
}
