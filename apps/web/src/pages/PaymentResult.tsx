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
                if (!response.ok) throw new Error('No se pudo verificar');
                const data = await response.json();
                if (cancelled) return;
                if (data.status === 'approved') {
                    await sync();
                    if (!cancelled) { setStatus('approved'); if (data.communityId) setCommunityId(data.communityId); }
                    return;
                }
                if (['rejected', 'cancelled', 'refunded', 'charged_back'].includes(data.status)) { setStatus('failed'); return; }
                setStatus('pending');
            } catch { if (!cancelled) setStatus('pending'); }
            if (!cancelled && ++tries < 12) timer = setTimeout(check, 5000);
        };
        void check();
        return () => { cancelled = true; clearTimeout(timer); };
    }, [query, attempt, sync]);
    const approved = status === 'approved';
    return <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
        <section className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center space-y-5">
            {approved ? <CheckCircle2 className="mx-auto h-12 w-12 text-primary" /> : status === 'checking' ? <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" /> : <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />}
            <h1 className="text-2xl font-bold">{approved ? 'Pago confirmado' : status === 'failed' ? 'El pago no se completó' : 'Verificando tu pago'}</h1>
            <p className="text-muted-foreground">{approved ? 'Tu acceso ya está actualizado.' : status === 'failed' ? 'Podés volver e intentar con otro medio de pago.' : 'Esperamos la confirmación de la pasarela. No hace falta que vuelvas a pagar. Podés consultar nuevamente en unos momentos.'}</p>
            {!approved && <button className="rounded-xl border border-border px-4 py-3" onClick={() => setAttempt(value => value + 1)}>Consultar estado</button>}
            <Link className="block rounded-xl bg-primary text-primary-foreground px-4 py-3 font-semibold" to={communityId ? `/comunidades/${encodeURIComponent(communityId)}` : approved ? '/settings' : '/pro'}>{communityId ? 'Volver a la comunidad' : approved ? 'Ver mi suscripción' : 'Volver a planes'}</Link>
        </section>
    </main>;
}
