import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

export default function CommunityInvite() {
    const { code } = useParams();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [invite, setInvite] = useState<any>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    useEffect(() => { const controller = new AbortController();
        apiFetch(`/communities/invites/${code}`, { signal: controller.signal }).then(async response => { const data = await response.json(); if (!response.ok) throw new Error(data.message || 'Invitación no disponible.'); if (!controller.signal.aborted) setInvite(data); }).catch(e => { if (!controller.signal.aborted) setError(e.message); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
        return () => controller.abort();
    }, [code]);
    const accept = async () => { setBusy(true); setError(''); try {
        const response = await apiFetch(`/communities/invites/${code}/accept`, { method: 'POST' });
        const data = await response.json(); if (!response.ok) throw new Error(data.message || 'No se pudo aceptar la invitación.');
        navigate(`/comunidades/${invite.community.slug || invite.community.id}${data.paymentRequired ? '?plan=1' : ''}`);
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); } };
    return <main className="mx-auto w-full max-w-xl space-y-4 px-4 py-10"><Link className="text-primary" to="/comunidades">← Comunidades</Link><section className="space-y-4 rounded-2xl border border-border bg-card p-6"><h1 className="text-2xl font-bold">Invitación a una comunidad</h1>{loading && <p role="status">Cargando invitación…</p>}{error && <p role="alert" className="text-destructive">{error}</p>}{invite && <><h2 className="text-xl font-semibold">{invite.community.name}</h2><p className="text-muted-foreground">{invite.community.description}</p>{user ? <button disabled={busy} onClick={() => void accept()} className="min-h-11 rounded-xl bg-primary px-5 text-primary-foreground disabled:opacity-50">{busy ? 'Ingresando…' : 'Aceptar invitación'}</button> : <p>Ingresá a tu cuenta desde el botón de acceso y volvé a este enlace para aceptar.</p>}</>}</section></main>;
}
