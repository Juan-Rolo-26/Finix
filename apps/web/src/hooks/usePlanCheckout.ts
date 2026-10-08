import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '@/lib/api';
import { PaidPlan, subscribedPlan } from '@/lib/plans';
import { useAuthStore } from '@/stores/authStore';
import { usePlatformAccessStore } from '@/stores/platformAccessStore';

export interface PlanLimits {
    maxPortfolios: number | null;
    maxWatchlists: number;
    maxItemsPerList: number;
    maxNotesPerItem: number;
    allowCsvImport: boolean;
    allowIdeaTracking: boolean;
    allowAdvancedAlerts: boolean;
}
interface Catalog {
    freeAccessEnabled: boolean;
    purchasesPaused: boolean;
    proPriceArs: number | null;
    creatorPriceArs: number | null;
    mercadoPagoAvailable: boolean;
    stripeAvailable: boolean;
    proPriceUsd: number | null;
    planLimits?: Record<'FREE' | PaidPlan, PlanLimits>;
}
const positivePrice = (value: unknown) => Number.isFinite(Number(value)) && Number(value) > 0 ? Number(value) : null;

export function usePlanCheckout() {
    const navigate = useNavigate();
    const user = useAuthStore(state => state.user);
    const [catalog, setCatalog] = useState<Catalog | null>(null);
    const [loading, setLoading] = useState(true);
    const [configError, setConfigError] = useState<string | null>(null);
    const [selectedPlan, setSelectedPlan] = useState<PaidPlan | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const reload = useCallback(async () => {
        setLoading(true);
        setConfigError(null);
        try {
            const results = await Promise.allSettled(['/mercadopago/config', '/stripe/config'].map(async path => {
                const response = await apiFetch(path);
                if (!response.ok) throw new Error('No se pudo consultar la configuración de planes.');
                return response.json();
            }));
            const mp = results[0].status === 'fulfilled' ? results[0].value : null;
            const stripe = results[1].status === 'fulfilled' ? results[1].value : null;
            if (!mp || typeof mp.freeAccessEnabled !== 'boolean' || typeof mp.purchasesPaused !== 'boolean') {
                setCatalog(null);
                setConfigError('No pudimos consultar los precios y la disponibilidad. Reintentá en unos momentos.');
            } else {
                const paused = mp.freeAccessEnabled || mp.purchasesPaused;
                setCatalog({
                    freeAccessEnabled: mp.freeAccessEnabled, purchasesPaused: paused,
                    proPriceArs: positivePrice(mp.proPriceArs), creatorPriceArs: positivePrice(mp.creatorPriceArs),
                    mercadoPagoAvailable: !paused && (mp.checkoutReady === true || mp.configured === true),
                    stripeAvailable: !paused && stripe?.configured === true && stripe?.purchasesPaused !== true,
                    proPriceUsd: positivePrice(stripe?.proPriceUsd), planLimits: mp.planLimits,
                });
                usePlatformAccessStore.setState({ loaded: true, freeAccessEnabled: mp.freeAccessEnabled, purchasesPaused: paused });
            }
        } catch {
            setCatalog(null);
            setConfigError('No pudimos consultar los planes. Reintentá en unos momentos.');
        } finally { setLoading(false); }
    }, []);
    useEffect(() => { void reload(); }, [reload]);

    const choose = (plan: PaidPlan) => {
        if (!catalog || loading || busy) return;
        setError(null);
        if (catalog.freeAccessEnabled) {
            const destination = plan === 'CREATOR' ? '/comunidades/crear' : '/market';
            navigate(user ? destination : `/auth?mode=register&redirect=${encodeURIComponent(destination)}`);
            return;
        }
        const current = subscribedPlan(user);
        if (current === 'CREATOR' || current === plan) { navigate('/settings?tab=suscripcion'); return; }
        if (catalog.purchasesPaused) { setError('Las nuevas compras están pausadas. Tu suscripción existente se puede gestionar desde Configuración.'); return; }
        if (!catalog.mercadoPagoAvailable && !catalog.stripeAvailable) { setError('Los medios de pago no están disponibles en este momento.'); return; }
        const amount = plan === 'PRO' ? catalog.proPriceArs : catalog.creatorPriceArs;
        if (amount == null && !catalog.stripeAvailable) { setError('No pudimos verificar el precio de este plan. Reintentá antes de pagar.'); return; }
        if (!user) { navigate(`/auth?redirect=${encodeURIComponent(`/pricing?plan=${plan}#planes`)}&plan=${plan === 'CREATOR' ? 'Creador' : 'PRO'}`); return; }
        setSelectedPlan(plan);
    };

    const confirm = async (provider: 'mercadopago' | 'stripe', autoRenew = false) => {
        if (!selectedPlan || !catalog || busy || catalog.purchasesPaused || catalog.freeAccessEnabled || !user) return;
        const amount = selectedPlan === 'PRO' ? catalog.proPriceArs : catalog.creatorPriceArs;
        if (provider === 'mercadopago' && (!catalog.mercadoPagoAvailable || amount == null)) return;
        if (provider === 'stripe' && !catalog.stripeAvailable) return;
        setBusy(true);
        setError(null);
        try {
            const plan = selectedPlan.toLowerCase();
            const path = provider === 'mercadopago' ? `/mercadopago/checkout/${plan}` : `/stripe/subscriptions/${plan}/checkout`;
            const response = await apiFetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, ...(provider === 'mercadopago' ? { body: JSON.stringify({ autoRenew }) } : {}) });
            const data = await response.json();
            if (!response.ok) throw new Error(Array.isArray(data.message) ? data.message.join(' ') : data.message || 'No se pudo iniciar el pago.');
            const url = data.checkoutUrl || data.url || (data.environment === 'sandbox' ? data.sandbox_init_point : data.init_point);
            if (!url || !/^https?:\/\//i.test(url)) throw new Error('La pasarela no devolvió un enlace de pago válido.');
            window.location.assign(url);
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : 'No se pudo iniciar el pago. Intentá nuevamente.');
        } finally { setBusy(false); }
    };
    const close = () => { if (!busy) { setSelectedPlan(null); setError(null); } };
    const selectedPrice = selectedPlan === 'CREATOR' ? catalog?.creatorPriceArs : catalog?.proPriceArs;
    return { catalog, loading, configError, reload, selectedPlan, selectedPrice, busy, error, choose, confirm, close };
}
