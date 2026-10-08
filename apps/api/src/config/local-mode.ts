/** Local rehearsals must never operate against a remote production database. */
export function isLocalMode(): boolean {
    if (process.env.FINIX_LOCAL_MODE !== 'true') return false;
    const url = new URL(process.env.DATABASE_URL || '');
    if (process.env.NODE_ENV === 'production' || !['127.0.0.1', 'localhost', '::1'].includes(url.hostname)) {
        throw new Error('FINIX_LOCAL_MODE requires a local database and a non-production environment');
    }
    return true;
}
