const zone = 'America/Argentina/Buenos_Aires';
export function isCurrentDailyCampaign(sourceKey: string, now = new Date()) {
    if (!sourceKey.startsWith('finix-approved:daily:')) return false;
    const suffix = sourceKey.slice('finix-approved:daily:'.length);
    const iso = new Intl.DateTimeFormat('en-CA', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
    const legacy = new Intl.DateTimeFormat('es-AR', { timeZone: zone, day: '2-digit', month: 'long', year: 'numeric' }).format(now);
    return suffix === iso || suffix === legacy;
}
