import { useEffect, useState } from 'react';
import { Mail, Send, Eye, ImagePlus, Trash2, RefreshCw } from 'lucide-react';
import { adminFetch, readAdminErrorMessage } from '../lib/api';
import EmailChart, { uploadEmailImage } from '../components/EmailChart';

type Campaign = { id: string; subject: string; status: string; sentCount: number; recipientCount: number; failedCount: number };
type Analysis = { id: string; companyName: string; ticker: string; symbol: string; status: string; slug?: string };
type Template = { id: string; name: string; subject: string; contentText?: string; contentHtml: string };
const inputClass = 'w-full min-w-0 rounded-md border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary';
const initial = { subject: '', title: '', message: '', imageUrl: '', chartUrl: '', analysisId: '', ctaLabel: 'Ver en Finix', ctaUrl: 'https://finixarg.com', audience: 'PRO', scheduledAt: '' };

async function request(path: string, body?: unknown) {
    const response = await adminFetch('/admin/email-marketing/' + path, body ? { method: 'POST', body: JSON.stringify(body) } : undefined);
    if (!response.ok) throw new Error(await readAdminErrorMessage(response, 'No se pudo completar la solicitud'));
    return response.json();
}
export default function EmailMarketing() {
    const [tab, setTab] = useState('dashboard');
    const [form, setForm] = useState(initial);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [analyses, setAnalyses] = useState<Analysis[]>([]);
    const [metrics, setMetrics] = useState<Record<string, number>>({});
    const [enabled, setEnabled] = useState(false);
    const [busy, setBusy] = useState(false);
    const [notice, setNotice] = useState('');
    const [error, setError] = useState('');
    const [html, setHtml] = useState('');
    const [mobile, setMobile] = useState(false);
    const [testEmail, setTestEmail] = useState('');
    const update = (key: keyof typeof initial, value: string) => { setForm(f => ({ ...f, [key]: value })); setHtml(''); };
    const run = async (action: () => Promise<void>) => {
        setBusy(true); setError(''); setNotice('');
        try { await action(); } catch (e) { setError(e instanceof Error ? e.message : 'Error inesperado'); } finally { setBusy(false); }
    };
    const load = async () => {
        const data = await request('dashboard');
        setCampaigns(data.campaigns); setMetrics(data.metrics); setEnabled(data.sendEnabled);
    };
    useEffect(() => { void run(load); }, []);
    const payload = () => ({ ...form, scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : undefined });
    const preview = () => run(async () => { setHtml((await request('preview', payload())).html); });
    const loadAnalyses = () => run(async () => {
        const response = await adminFetch('/admin/analysis?limit=100');
        if (!response.ok) throw new Error(await readAdminErrorMessage(response, 'No se pudieron cargar los analisis'));
        const result = await response.json();
        setAnalyses((result.data || result).filter((a: Analysis) => a.status === 'PUBLISHED'));
    });
    const selectAnalysis = (id: string) => {
        const analysis = analyses.find(a => a.id === id);
        if (!analysis) { update('analysisId', ''); return; }
        const title = 'Analisis PRO: ' + (analysis.companyName || analysis.ticker || analysis.symbol);
        setForm(f => ({ ...f, analysisId: id, subject: title, title, message: 'Te compartimos nuestro analisis de ' + (analysis.companyName || analysis.symbol) + '.', ctaLabel: 'Leer en Finix', ctaUrl: 'https://finixarg.com/analysis/' + encodeURIComponent(analysis.slug || id) }));
        setHtml('');
    };
    const send = (event: React.FormEvent) => {
        event.preventDefault();
        if (!window.confirm('Se creara una campana para los usuarios PRO activos con consentimiento. Destinatarios actuales: ' + (metrics.recipientCount || 0) + '. ¿Confirmar?')) return;
        void run(async () => {
            await request('campaigns', payload()); setNotice('Campana guardada en la cola.'); await load(); setTab('dashboard');
        });
    };
    const upload = (file?: File) => { if (file) void run(async () => { update('imageUrl', await uploadEmailImage(file)); }); };
    return <div className="space-y-6 text-foreground">
        <header className="flex flex-wrap items-center justify-between gap-3"><h1 className="flex items-center gap-2 text-2xl font-bold"><Mail className="text-primary" />Email & Alertas</h1><button onClick={() => setTab('create')} className="rounded-md bg-primary px-4 py-2 text-primary-foreground">Nueva campana</button></header>
        {error && <p role="alert" className="rounded-md border border-red-400/40 bg-red-500/10 p-3 text-red-700 dark:text-red-300">{error}</p>}
        {notice && <p role="status" className="border-l-2 border-primary p-3">{notice}</p>}
        {!enabled && <p className="border-l-2 border-amber-500 p-3 text-sm">Envios pausados en este entorno. Las campanas permanecen en cola.</p>}
        <nav className="flex gap-3 overflow-x-auto border-b border-border">{[['dashboard', 'Dashboard'], ['create', 'Crear email'], ['templates', 'Plantillas'], ['automations', 'Automatizaciones']].map(([key, label]) => <button key={key} onClick={() => { setTab(key); if (key === 'templates') void run(async () => setTemplates(await request('templates'))); }} className={'whitespace-nowrap border-b-2 px-3 py-3 text-sm ' + (key === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground')}>{label}</button>)}</nav>
        {tab === 'dashboard' && <section className="space-y-5">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{[['PRO elegibles', metrics.recipientCount], ['Enviados', metrics.sent], ['Fallidos', metrics.failed], ['Campanas recientes', campaigns.length]].map(([label, value]) => <div key={label} className="border-l border-border pl-4"><p className="text-sm text-muted-foreground">{label}</p><p className="text-2xl font-semibold">{value || 0}</p></div>)}</div>
            <button title="Actualizar" aria-label="Actualizar" disabled={busy} onClick={() => void run(load)} className="rounded-md border border-border p-2"><RefreshCw size={18} /></button>
            <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b border-border"><tr>{['Campana', 'Estado', 'Enviados', 'Fallidos'].map(v => <th key={v} className="p-3">{v}</th>)}</tr></thead><tbody>{campaigns.map(c => <tr key={c.id} className="border-b border-border"><td className="p-3">{c.subject}</td><td className="p-3">{c.status}</td><td className="p-3">{c.sentCount}/{c.recipientCount}</td><td className="p-3">{c.failedCount}</td></tr>)}</tbody></table>{!campaigns.length && <p className="py-8 text-muted-foreground">Todavia no hay campanas.</p>}</div>
        </section>}
        {tab === 'templates' && <div className="grid gap-4 md:grid-cols-2">{!templates.length && <p>No hay plantillas guardadas.</p>}{templates.map(t => <article key={t.id} className="rounded-lg border border-border bg-card p-4"><h2 className="font-semibold">{t.name}</h2><iframe title={t.name} sandbox="" srcDoc={t.contentHtml} className="my-4 h-52 w-full border border-border bg-white" /><button className="rounded-md border border-primary px-3 py-2 text-primary" onClick={() => { setForm({ ...initial, subject: t.subject, title: t.name, message: t.contentText || '' }); setHtml(''); setTab('create'); }}>Usar contenido</button></article>)}</div>}
        {tab === 'automations' && <section className="divide-y divide-border"><div className="flex flex-wrap justify-between gap-4 py-5"><div><h2 className="font-semibold">Nuevo analisis PRO</h2><p className="mt-2 text-sm text-muted-foreground">Primera publicacion · Usuarios PRO activos con consentimiento</p></div><span className={enabled ? 'text-primary' : 'text-amber-600 dark:text-amber-400'}>{enabled ? 'Envio habilitado' : 'Cola pausada'}</span></div><p className="py-4 text-sm text-muted-foreground">Las ediciones de un analisis ya anunciado no generan otro envio.</p></section>}
        {tab === 'create' && <div className="grid min-w-0 gap-6 2xl:grid-cols-2">
            <form onSubmit={send} className="min-w-0 space-y-5">
                <fieldset disabled={busy} className="min-w-0 space-y-5">
                    <div className="flex flex-wrap items-center gap-3"><h2 className="font-semibold">Analisis PRO completo</h2><button type="button" onClick={() => void loadAnalyses()} className="rounded-md border border-border px-3 py-2 text-sm">Cargar publicados</button></div>
                    <Field label="Analisis"><select className={inputClass} value={form.analysisId} onChange={e => selectAnalysis(e.target.value)}><option value="">Sin analisis adjunto</option>{analyses.map(a => <option key={a.id} value={a.id}>{a.ticker || a.symbol} · {a.companyName}</option>)}</select></Field>
                    {(['subject', 'title'] as const).map(key => <Field key={key} label={key === 'subject' ? 'Asunto' : 'Titulo'}><input required maxLength={160} className={inputClass} value={form[key]} onChange={e => update(key, e.target.value)} /></Field>)}
                    <Field label="Introduccion"><textarea required maxLength={10000} rows={5} className={inputClass} value={form.message} onChange={e => update('message', e.target.value)} /></Field>
                    <EmailChart onAttach={url => update('chartUrl', url)} />
                    {form.chartUrl && <div><img src={form.chartUrl} alt="Grafico adjunto" className="h-auto w-full rounded-md border border-border" /><button type="button" title="Quitar grafico" aria-label="Quitar grafico" onClick={() => update('chartUrl', '')} className="p-2"><Trash2 size={18} /></button></div>}
                    <label className="flex cursor-pointer items-center gap-2 text-sm"><ImagePlus size={18} />Subir imagen<input type="file" accept="image/png,image/jpeg,image/webp" className="min-w-0" onChange={e => upload(e.target.files?.[0])} /></label>
                    <Field label="Imagen (URL)"><input type="url" className={inputClass} value={form.imageUrl} onChange={e => update('imageUrl', e.target.value)} /></Field>
                    <div className="grid gap-3 sm:grid-cols-2"><Field label="Texto del enlace"><input className={inputClass} value={form.ctaLabel} onChange={e => update('ctaLabel', e.target.value)} /></Field><Field label="Destino"><input type="url" className={inputClass} value={form.ctaUrl} onChange={e => update('ctaUrl', e.target.value)} /></Field></div>
                    <Field label={'Programar · ' + Intl.DateTimeFormat().resolvedOptions().timeZone}><input type="datetime-local" className={inputClass} value={form.scheduledAt} onChange={e => update('scheduledAt', e.target.value)} /></Field>
                    <div className="flex flex-wrap gap-2"><button type="button" onClick={() => void preview()} className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2"><Eye size={16} />Vista previa</button><button type="submit" disabled={!enabled} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-40"><Send size={16} />{form.scheduledAt ? 'Programar' : 'Enviar a PRO'}</button></div>
                    <div className="flex flex-wrap items-end gap-3 border-t border-border pt-4"><Field label="Email de prueba"><input type="email" className={inputClass} value={testEmail} onChange={e => setTestEmail(e.target.value)} /></Field><button type="button" disabled={!enabled || !testEmail} onClick={() => void run(async () => { await request('test', { campaign: payload(), email: testEmail }); setNotice('Prueba enviada. No se creo una campana.'); })} className="rounded-md border border-border px-4 py-2 disabled:opacity-40">Enviar prueba</button></div>
                </fieldset>
            </form>
            <aside className="min-w-0 self-start"><div className="mb-3 flex gap-2">{[false, true].map(v => <button key={String(v)} onClick={() => setMobile(v)} aria-pressed={mobile === v} className={'border-b-2 px-3 py-2 text-sm ' + (mobile === v ? 'border-primary text-primary' : 'border-transparent')}>{v ? 'Movil' : 'Desktop'}</button>)}</div>{html ? <iframe title="Vista previa del email" sandbox="" srcDoc={html} className={'mx-auto h-[800px] max-w-full rounded-lg border border-border bg-white ' + (mobile ? 'w-[375px]' : 'w-full')} /> : <div className="border-y border-border py-16 text-center text-muted-foreground">Vista previa pendiente</div>}</aside>
        </div>}
    </div>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block min-w-0 space-y-2"><span className="text-sm font-medium">{label}</span>{children}</label>; }
