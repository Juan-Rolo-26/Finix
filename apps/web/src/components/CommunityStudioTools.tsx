import { UiText as FinixUiText } from '@/i18n/UiText';
import { useTranslation as useFinixUiTranslation } from '@/i18n';
import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

async function request(path: string, method = 'GET', body?: unknown) {
    const response = await apiFetch(path, { method, ...(body !== undefined ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(Array.isArray(data.message) ? data.message.join('. ') : data.message || 'No se pudo completar la acción.');
    return data;
}
const fieldClass = 'w-full min-h-11 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground';
const buttonClass = 'min-h-11 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50';

export default function CommunityStudioTools({ community, onRefresh }: { community: any; onRefresh: () => void }) {
    const { ui: finixUi } = useFinixUiTranslation();

    const [tab, setTab] = useState('solicitudes');
    const [rows, setRows] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [form, setForm] = useState<Record<string, string>>({});
    const paths: Record<string, string> = { solicitudes: 'join-requests', invitaciones: 'invites', recursos: 'resources', eventos: 'events' };
    const base = `/communities/${community.id}`;
    const canOwn = community.isOwner || community.membership?.role === 'ADMIN' && community.tierLevel === 999;
    const load = useCallback(async () => {
        setLoading(true); setError('');
        try { setRows(tab === 'planes' ? (await request(base)).plans || [] : await request(`${base}/${paths[tab]}`)); }
        catch (e) { setError((e as Error).message); }
        finally { setLoading(false); }
    }, [base, tab]);
    useEffect(() => { void load(); }, [load]);
    useEffect(() => { setForm({}); setNotice(''); }, [tab]);
    const act = async (path: string, method: string, body?: unknown) => {
        setBusy(true); setError(''); setNotice('');
        try { const data = await request(path, method, body); setNotice(data.paymentRequired ? 'Solicitud aprobada. El usuario debe completar el checkout del plan.' : 'Cambios guardados.'); await load(); onRefresh(); return data; }
        catch (e) { setError((e as Error).message); }
        finally { setBusy(false); }
    };
    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        const values = new FormData(event.currentTarget as HTMLFormElement);
        let body: any;
        if (tab === 'invitaciones') body = { ...(form.days ? { expiresInDays: Number(form.days) } : {}), ...(form.uses ? { maxUses: Number(form.uses) } : {}) };
        if (tab === 'recursos') body = { title: form.title, description: form.description || '', resourceUrl: form.url, isPublic: form.public === 'true', requiredTierLevel: Number(form.tier || 0) };
        if (tab === 'eventos') body = { title: form.title, description: form.description || '', date: `${values.get("date")}:00-03:00`, link: form.url || '', requiredTierLevel: Number(form.tier || 0) };
        if (tab === 'planes') body = { name: form.title, price: Number(form.price || 0), interval: form.interval || 'monthly', tierLevel: Number(form.tier || 0), features: (form.features || '').split('\n').filter(Boolean) };
        const result = await act(`${base}/${tab === 'planes' ? 'plans' : paths[tab]}`, 'POST', body);
        if (result) setForm({});
    };
    const field = (name: string, label: string, type = 'text', required = false) => <label className="block space-y-1 text-sm"><span>{label}</span><input className={fieldClass} type={type} name={name} required={required} min={type === 'number' ? ['days', 'uses'].includes(name) ? 1 : 0 : undefined} step={name === 'price' ? 'any' : undefined} value={form[name] || ''} onChange={event => setForm(previous => ({ ...previous, [name]: event.target.value }))} /></label>;
    return <section className="space-y-5">
        <div><h2 className="text-xl font-bold">{""}<FinixUiText text={"Herramientas de comunidad"} />{""}</h2><p className="mt-1 text-sm text-muted-foreground">{""}<FinixUiText text={"Administrá el acceso y el material disponible para tus miembros."} />{""}</p></div>
        <div className="flex flex-wrap gap-2" role="tablist" aria-label={finixUi("Herramientas de comunidad")}>{['solicitudes', 'invitaciones', 'recursos', 'eventos', ...(canOwn ? ['planes'] : [])].map(item => <button role="tab" aria-selected={tab === item} className={`${fieldClass} w-auto capitalize ${tab === item ? 'border-primary text-primary' : ''}`} key={item} onClick={() => setTab(item)}>{item}</button>)}</div>
        {error && <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
        {notice && <p role="status" className="rounded-xl bg-primary/10 p-3 text-sm text-primary">{notice}</p>}
        {tab !== 'solicitudes' && <form onSubmit={submit} className="space-y-4 rounded-2xl border border-border bg-card p-4 sm:p-6">
            <h3 className="font-semibold">{tab === 'invitaciones' ? 'Crear invitación' : tab === 'planes' ? 'Crear plan' : tab === 'eventos' ? 'Crear evento' : 'Agregar recurso'}</h3>
            <div className="grid gap-4 sm:grid-cols-2">
                {tab === 'invitaciones' ? <>{field('days', 'Días de validez (vacío: sin vencimiento)', 'number')}{field('uses', 'Límite de usos (vacío: sin límite)', 'number')}</> : <>{field('title', tab === 'planes' ? 'Nombre del plan' : 'Título', 'text', true)}{tab !== 'planes' && field('description', 'Descripción')}</>}
                {['recursos', 'eventos'].includes(tab) && field('url', tab === 'recursos' ? 'Enlace al recurso' : 'Enlace al evento', 'url', tab === 'recursos')}
                {tab === 'eventos' && field('date', 'Fecha y hora (Argentina)', 'datetime-local', true)}
                {tab === 'recursos' && <label className="space-y-1 text-sm">{""}<FinixUiText text={"Visibilidad"} />{""}<select className={fieldClass} value={form.public || 'false'} onChange={e => setForm(p => ({ ...p, public: e.target.value }))}><option value="false">{""}<FinixUiText text={"Solo miembros"} />{""}</option><option value="true">{""}<FinixUiText text={"Público"} />{""}</option></select></label>}
                {tab !== 'invitaciones' && field('tier', 'Nivel mínimo de membresía', 'number')}
                {tab === 'planes' && <>{field('price', 'Precio', 'number')}<label className="space-y-1 text-sm">{""}<FinixUiText text={"Frecuencia"} />{""}<select className={fieldClass} value={form.interval || 'monthly'} onChange={e => setForm(p => ({ ...p, interval: e.target.value }))}><option value="monthly">{""}<FinixUiText text={"Mensual"} />{""}</option><option value="yearly">{""}<FinixUiText text={"Anual"} />{""}</option><option value="one_time">{""}<FinixUiText text={"Único"} />{""}</option></select></label><label className="space-y-1 text-sm">{""}<FinixUiText text={"Beneficios (uno por línea)"} />{""}<textarea className={fieldClass} value={form.features || ''} onChange={e => setForm(p => ({ ...p, features: e.target.value }))} /></label></>}
            </div><button disabled={busy} className={buttonClass}>{busy ? 'Guardando…' : 'Guardar'}</button>
        </form>}
        {loading ? <p role="status">{""}<FinixUiText text={"Cargando…"} />{""}</p> : rows.length === 0 ? <p className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">{""}<FinixUiText text={"No hay"} />{" "}{tab} {" "}<FinixUiText text={"para mostrar."} />{""}</p> : <div className="space-y-3">{rows.map(row => <article key={row.id} className="space-y-2 rounded-xl border border-border bg-card p-4">
            <h3 className="font-semibold">{row.user ? `@${row.user.username}` : row.title || row.name || 'Invitación'}</h3>
            {row.note && <p className="whitespace-pre-wrap text-sm">{row.note}</p>}{row.description && <p className="text-sm text-muted-foreground">{row.description}</p>}
            {row.eventDate && <p className="text-sm">{new Intl.DateTimeFormat('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', dateStyle: 'short', timeStyle: 'short' }).format(new Date(row.eventDate))}</p>}
            {row.inviteUrl && <><a className="block break-all text-sm text-primary underline" href={row.inviteUrl}>{row.inviteUrl}</a><p className="text-sm text-muted-foreground">{""}<FinixUiText text={"Usos:"} />{" "}{row.usedCount}{row.maxUses ? ` / ${row.maxUses}` : ''} · {row.expiresAt ? `Vence ${new Date(row.expiresAt).toLocaleDateString('es-AR')}` : 'Sin vencimiento'}</p><button className={buttonClass} onClick={async () => { try { await navigator.clipboard.writeText(row.inviteUrl); setNotice('Enlace copiado.'); } catch { setError('Copiá el enlace que aparece arriba.'); } }}>{""}<FinixUiText text={"Copiar enlace"} />{""}</button></>}
            {row.resourceUrl && <a href={row.resourceUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline">{""}<FinixUiText text={"Abrir recurso"} />{""}</a>}
            {tab === 'solicitudes' ? <div className="flex flex-wrap gap-2"><button disabled={busy} className={buttonClass} onClick={() => void act(`${base}/join-requests/${row.id}`, 'PATCH', { status: 'APPROVED' })}>{""}<FinixUiText text={"Aprobar"} />{""}</button><button disabled={busy} className="min-h-11 rounded-xl border border-border bg-secondary px-4 text-foreground hover:bg-muted transition-colors" onClick={() => void act(`${base}/join-requests/${row.id}`, 'PATCH', { status: 'REJECTED' })}>{""}<FinixUiText text={"Rechazar"} />{""}</button></div> : tab !== 'invitaciones' && <button disabled={busy} className="min-h-11 text-sm text-destructive" onClick={() => { if (confirm('¿Eliminar este elemento?')) void act(`${base}/${tab === 'planes' ? 'plans' : paths[tab]}/${row.id}`, 'DELETE'); }}>{""}<FinixUiText text={"Eliminar"} />{""}</button>}
        </article>)}</div>}
    </section>;
}
