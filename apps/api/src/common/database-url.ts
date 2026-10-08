/** Configure the persistent Nest server without logging database credentials. */
export function normalizeDatabaseUrl(rawUrl?: string, poolMode = process.env.FINIX_DATABASE_POOL_MODE || 'session') {
    if (!rawUrl) return rawUrl;
    let url: URL;
    try { url = new URL(rawUrl); } catch { return rawUrl; }
    if (!url.hostname.endsWith('.pooler.supabase.com')) return rawUrl;

    if (!['session', 'transaction', 'configured'].includes(poolMode)) {
        throw new Error('FINIX_DATABASE_POOL_MODE debe ser session, transaction o configured');
    }
    const standardPort = !url.port || ['5432', '6543'].includes(url.port);
    if (standardPort && poolMode === 'session') {
        // A long-lived API can reuse prepared statements. Transaction mode with
        // pgbouncer=true adds BEGIN/DEALLOCATE/COMMIT to each Prisma operation.
        url.port = '5432';
        url.searchParams.delete('pgbouncer');
    } else if (standardPort && poolMode === 'transaction') {
        url.port = '6543';
        url.searchParams.set('pgbouncer', 'true');
    }
    if (!url.searchParams.has('connection_limit')) {
        // Session connections occupy pool slots for the lifetime of this process.
        url.searchParams.set('connection_limit', url.port === '5432' ? '5' : '10');
    }
    if (!url.searchParams.has('connect_timeout')) url.searchParams.set('connect_timeout', '10');
    if (!url.searchParams.has('pool_timeout')) url.searchParams.set('pool_timeout', '15');
    return url.toString();
}
