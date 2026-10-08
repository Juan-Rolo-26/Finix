import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

export default function PaymentResult() {
    const [params] = useSearchParams();
    const [status, setStatus] = useState('checking');
    const [attempt, setAttempt] = useState(0);
    const [communityId, setCommunityId] = useState(params.get('community') || '');
    const sync = useAuthStore(state => state.syncFromSession);
    const user = useAuthStore(state => state.user);
    const query = params.toString();
    useEffect(() => {
        let cancelled = false;
        let timer: ReturnType<typeof setTimeout>;
        let tries = 0;
        const search = new URLSearchParams(query);
        const provider = search.get('provider');
        const id = search.get('payment_id') || search.get('collection_id');
        const reference = search.get('reference');
        const session = search.get('session_id');
        const path = provider === 'stripe' && session
            ? `/stripe/checkout/${encodeURIComponent(session)}/status`
            : reference ? `/mercadopago/subscription-status?reference=${encodeURIComponent(reference)}`
            : id && /^\d+$/.test(id) ? `/mercadopago/status/${id}` : null;
        setStatus('checking');
        const check = async () => {
            if (!path) { setStatus('unverified'); return; }
            try {
                const response = await apiFetch(path);
                if ([401, 403].includes(response.status)) { if (!cancelled) setStatus('unauthorized'); return; }
                if (!response.ok) throw new Error('No se pudo verificar');
                const data = await response.json();
                if (cancelled) return;
                if (data.status === 'approved') {
                    await sync();
                    if (!cancelled) { setStatus('approved'); if (data.communityId) setCommunityId(data.communityId); }
                    return;
                }
                if (['rejected', 'cancelled', 'refunded', 'charged_back'].includes(data.status)) { setStatus('failed'); return; }
                setStatus(data.status === 'pending' ? 'pending' : 'unavailable');
            } catch { if (!cancelled) setStatus('unavailable'); }
            if (!cancelled && ++tries < 12) timer = setTimeout(check, 5000);
        };
        void check();
        return () => { cancelled = true; clearTimeout(timer); };
    }, [query, attempt, sync]);
    const approved = status === 'approved';
    return <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
        <section className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center space-y-5">
            {approved ? <CheckCircle2 className="mx-auto h-12 w-12 text-primary" /> : status === 'checking' ? <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" /> : <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />}
            <h1 className="text-2xl font-bold">{approved ? 'Pago confirmado' : status === 'failed' ? 'El pago no se completó' : status === 'unverified' ? 'Falta la referencia del pago' : status === 'unauthorized' ? 'Verificá tu cuenta' : status === 'unavailable' ? 'No pudimos consultar el pago' : status === 'pending' ? 'Pago pendiente de confirmación' : 'Verificando tu pago'}</h1>
            <p className="text-muted-foreground">{approved ? 'La pasarela confirmó el pago y sincronizamos tu cuenta.' : status === 'failed' ? 'La pasarela no confirmó un pago válido. Revisá su estado antes de intentar nuevamente.' : status === 'unverified' ? 'Este enlace no contiene una referencia verificable. Consultá el comprobante de la pasarela y tu facturación en Configuración.' : status === 'unauthorized' ? 'Iniciá sesión con la cuenta que realizó el pago para consultar su estado.' : status === 'unavailable' ? 'No recibimos una confirmación del servidor. Podés reintentar la consulta; no hace falta iniciar otro pago.' : 'Esperamos la confirmación de la pasarela. No hace falta que vuelvas a pagar. Podés consultar nuevamente en unos momentos.'}</p>
            {!approved && !['unverified', 'unauthorized', 'checking'].includes(status) && <button className="rounded-xl border border-border px-4 py-3" onClick={() => setAttempt(value => value + 1)}>Consultar estado</button>}
            {status === 'unauthorized' && !user && <Link className="block text-primary underline" to={`/auth?redirect=${encodeURIComponent(`/payment-result?${query}`)}`}>Iniciar sesión</Link>}
            <Link className="block rounded-xl bg-primary text-primary-foreground px-4 py-3 font-semibold" to={communityId ? `/comunidades/${encodeURIComponent(communityId)}` : approved ? '/settings?tab=suscripcion' : '/pricing#planes'}>{communityId ? 'Volver a la comunidad' : approved ? 'Ver mi suscripción' : 'Volver a planes'}</Link>
        </section>
    </main>;
}
