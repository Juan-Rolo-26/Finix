import { WATCHLIST_PLAN_LIMITS } from '@finix/shared';
import { usePlatformAccessStore } from '@/stores/platformAccessStore';

export default function WatchlistLimitsSummary() {
    const freeAccess = usePlatformAccessStore(state => state.freeAccessEnabled);
    return <section aria-label="Límites de Seguimiento" className="space-y-3 rounded-xl border border-border p-4 text-sm">
        <h3 className="font-semibold">Límites de Seguimiento</h3>
        <dl className="space-y-2">
            {(['FREE', 'PRO', 'CREATOR'] as const).map(plan => <div key={plan} className="flex flex-wrap justify-between gap-2">
                <dt className="font-medium">{plan === 'FREE' ? 'Gratis' : plan === 'PRO' ? 'PRO' : 'Creador'}</dt>
                <dd>{WATCHLIST_PLAN_LIMITS[plan].maxWatchlists} listas · {WATCHLIST_PLAN_LIMITS[plan].maxItemsPerList} activos por lista</dd>
            </div>)}
        </dl>
        {freeAccess && <p className="text-muted-foreground">Durante el acceso gratuito con cuenta se aplican los límites de Creador. La disponibilidad de Seguimiento depende de su habilitación en la plataforma.</p>}
    </section>;
}
