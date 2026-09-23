import { useEffect, useState } from 'react';
import { X, Lock, Loader2 } from 'lucide-react';
import { apiFetch } from '../lib/api';

interface Plan { id: string; name: string; price: number | string; interval?: string; }
interface Props {
    isOpen: boolean; onClose: () => void;
    community: { id: string; name: string; imageUrl?: string; plans?: Plan[] };
    initialPlan?: Plan | null; onSuccess: () => void;
}

export default function CommunityPaymentModal({ isOpen, onClose, community, initialPlan, onSuccess }: Props) {
    const [planId, setPlanId] = useState('');
    const [available, setAvailable] = useState<{ mercadopago: boolean; stripe: boolean } | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    useEffect(() => {
        if (!isOpen) return;
        let active = true;
        setPlanId(initialPlan?.id || community.plans?.[0]?.id || '');
        setError(''); setAvailable(null);
        Promise.all(['mercadopago', 'stripe'].map(async provider => {
            const response = await apiFetch(`/${provider}/config`);
            if (!response.ok) throw new Error('No pudimos consultar los medios de pago. Cerrá y volvé a intentar.');
            return (await response.json()).configured === true;
        })).then(([mercadopago, stripe]) => { if (active) setAvailable({ mercadopago, stripe }); })
            .catch(err => { if (active) setError(err.message); });
        return () => { active = false; };
    }, [isOpen, initialPlan?.id, community.id, community.plans]);
    if (!isOpen) return null;
    const selected = community.plans?.find(plan => plan.id === planId);
    const free = selected && Number(selected.price) === 0;
    const checkout = async (provider: 'mercadopago' | 'stripe') => {
        if (!selected || loading) return;
        setLoading(true); setError('');
        try {
            const response = await apiFetch(`/communities/${community.id}/checkout`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planId: selected.id, provider }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'No se pudo iniciar el pago.');
            if (data.freeJoined) { onSuccess(); onClose(); return; }
            const url = data.url || data.init_point || (import.meta.env.DEV ? data.sandbox_init_point : undefined);
            if (!url) throw new Error('La pasarela no devolvió un enlace de pago.');
            window.location.assign(url);
        } catch (err: any) { setError(err.message || 'No se pudo iniciar el pago.'); }
        finally { setLoading(false); }
    };
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-labelledby="community-payment-title">
            <div className="w-full max-w-md max-h-[85dvh] overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-xl space-y-5">
                <div className="flex items-start justify-between gap-3">
                    <div><h2 id="community-payment-title" className="text-xl font-bold">Unirte a {community.name}</h2><p className="text-sm text-muted-foreground mt-1">Precios en pesos argentinos (ARS).</p></div>
                    <button aria-label="Cerrar" onClick={onClose} disabled={loading} className="p-2"><X className="w-5 h-5" /></button>
                </div>
                <label className="block text-sm font-medium">Plan
                    <select value={planId} onChange={event => setPlanId(event.target.value)} disabled={loading} className="mt-2 w-full rounded-xl border border-border bg-background p-3">
                        {(community.plans || []).map(plan => <option key={plan.id} value={plan.id}>{plan.name} — {Number(plan.price).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })} ARS</option>)}
                    </select>
                </label>
                {selected && <p className="text-sm text-muted-foreground">Acceso por {['year', 'yearly'].includes(selected.interval || '') ? 'un año' : 'un mes'}. Mercado Pago: pago por período, sin renovación automática. Stripe: renovación automática, cancelable desde la comunidad.</p>}
                <p className="flex gap-2 text-sm"><Lock className="h-4 w-4 shrink-0 mt-0.5" />Ingresás tus datos de pago únicamente en la página de la pasarela.</p>
                {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
                {!selected && <p className="text-sm text-muted-foreground">Esta comunidad todavía no tiene planes disponibles.</p>}
                {!available && !error && <Loader2 className="w-5 h-5 animate-spin" aria-label="Consultando medios de pago" />}
                {(free || available?.mercadopago) && <button disabled={loading || !selected} onClick={() => checkout('mercadopago')} className="w-full rounded-xl bg-primary text-primary-foreground p-3 font-semibold disabled:opacity-50">{loading ? 'Abriendo checkout…' : free ? 'Unirme gratis' : 'Pagar con Mercado Pago'}</button>}
                {!free && available?.stripe && <button disabled={loading || !selected} onClick={() => checkout('stripe')} className="w-full rounded-xl border border-border p-3 font-semibold disabled:opacity-50">Suscribirme con Stripe</button>}
                {!free && available && !available.mercadopago && !available.stripe && <p className="text-sm text-muted-foreground">Los pagos no están disponibles en este momento.</p>}
            </div>
        </div>
    );
}
