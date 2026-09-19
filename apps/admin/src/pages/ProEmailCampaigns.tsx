import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Image, Loader2, Mail, Send, Users, XCircle } from 'lucide-react';
import { adminFetch, readAdminErrorMessage } from '../lib/api';

type Campaign = {
    id: string;
    subject: string;
    title: string;
    recipientCount: number;
    sentCount: number;
    failedCount: number;
    createdAt: string;
    createdBy: { username: string; email: string };
};

const initialForm = {
    subject: '',
    title: '',
    message: '',
    imageUrl: '',
    ctaLabel: 'Ver en Finix',
    ctaUrl: 'https://finixarg.com',
    confirm: false,
};

const inputClass = 'w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15';

export default function ProEmailCampaigns() {
    const [recipientCount, setRecipientCount] = useState(0);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [form, setForm] = useState(initialForm);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const response = await adminFetch('/admin/pro-email/summary');
            if (!response.ok) throw new Error(await readAdminErrorMessage(response, 'No se pudo cargar el resumen de emails'));
            const data = await response.json();
            setRecipientCount(Number(data.recipientCount || 0));
            setCampaigns(Array.isArray(data.campaigns) ? data.campaigns : []);
        } catch (error: any) {
            setFeedback({ type: 'error', text: error.message || 'No se pudo cargar el resumen de emails' });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const update = (key: keyof typeof initialForm, value: string | boolean) => {
        setForm((previous) => ({ ...previous, [key]: value }));
    };

    const send = async (event: React.FormEvent) => {
        event.preventDefault();
        setFeedback(null);
        if (!form.confirm) {
            setFeedback({ type: 'error', text: 'Confirmá el envío antes de continuar.' });
            return;
        }
        setSending(true);
        try {
            const response = await adminFetch('/admin/pro-email/campaigns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            if (!response.ok) throw new Error(await readAdminErrorMessage(response, 'No se pudo enviar la campaña'));
            const data = await response.json();
            setFeedback({ type: 'success', text: `Campaña enviada: ${data.sentCount}/${data.recipientCount} correos entregados.` });
            setForm(initialForm);
            await load();
        } catch (error: any) {
            setFeedback({ type: 'error', text: error.message || 'No se pudo enviar la campaña' });
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="space-y-7">
            <header className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground"><Mail className="h-6 w-6 text-primary" /> Emails para Finix PRO</h1>
                    <p className="mt-1 text-sm text-muted-foreground">Campañas de inversión para usuarios PRO que aceptaron recibirlas.</p>
                </div>
                <div className="rounded-xl border border-primary/25 bg-primary/5 px-4 py-3 text-right">
                    <p className="text-xs font-medium text-muted-foreground">Destinatarios con consentimiento</p>
                    <p className="mt-0.5 flex items-center justify-end gap-1.5 text-2xl font-bold text-primary"><Users className="h-5 w-5" /> {loading ? '—' : recipientCount}</p>
                </div>
            </header>

            {feedback && (
                <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${feedback.type === 'success' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400'}`}>
                    {feedback.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}{feedback.text}
                </div>
            )}

            <div className="grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
                <form onSubmit={send} className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-sm">
                    <div className="flex items-center justify-between gap-3 border-b border-border pb-4"><h2 className="font-semibold">Nueva campaña</h2><span className="text-xs text-muted-foreground">Solo usuarios PRO activos y suscriptos</span></div>
                    <Field label="Asunto del email"><input required maxLength={160} value={form.subject} onChange={(e) => update('subject', e.target.value)} placeholder="Ej: Panorama semanal de mercados" className={inputClass} /></Field>
                    <Field label="Título"><input required maxLength={160} value={form.title} onChange={(e) => update('title', e.target.value)} placeholder="Tu resumen de inversiones" className={inputClass} /></Field>
                    <Field label="Mensaje"><textarea required maxLength={8000} rows={8} value={form.message} onChange={(e) => update('message', e.target.value)} placeholder="Escribí el contenido. Los saltos de línea se respetan en el email." className={`${inputClass} resize-y`} /></Field>
                    <Field label="Imagen (opcional, URL https)"><div className="relative"><Image className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" /><input type="url" maxLength={1000} value={form.imageUrl} onChange={(e) => update('imageUrl', e.target.value)} placeholder="https://..." className={`${inputClass} pl-10`} /></div></Field>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Texto del botón"><input maxLength={80} value={form.ctaLabel} onChange={(e) => update('ctaLabel', e.target.value)} className={inputClass} /></Field>
                        <Field label="URL del botón"><input type="url" maxLength={1000} value={form.ctaUrl} onChange={(e) => update('ctaUrl', e.target.value)} className={inputClass} /></Field>
                    </div>
                    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-amber-500/25 bg-amber-500/5 p-4 text-sm">
                        <input type="checkbox" checked={form.confirm} onChange={(e) => update('confirm', e.target.checked)} className="mt-0.5 h-4 w-4 accent-primary" />
                        <span><strong className="block text-foreground">Confirmo el envío a {recipientCount} usuarios PRO.</strong><span className="text-xs text-muted-foreground">Se enviará sólo a cuentas activas, verificadas y con esta preferencia activada.</span></span>
                    </label>
                    <button type="submit" disabled={sending || loading || recipientCount === 0} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">
                        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}{sending ? 'Enviando campaña…' : `Enviar a ${recipientCount} usuarios PRO`}
                    </button>
                </form>

                <aside className="space-y-5">
                    <div className="overflow-hidden rounded-2xl border border-border bg-[#f4f7f6] shadow-sm">
                        <div className="bg-[#0d2a1c] px-6 py-5 text-white"><span className="font-extrabold tracking-[.12em]">FINIX</span><span className="ml-2 text-[10px] font-bold tracking-wider text-emerald-200">PRO INVERSIÓN</span></div>
                        {form.imageUrl && <img src={form.imageUrl} alt="Vista previa" className="h-36 w-full object-cover" onError={(event) => { event.currentTarget.style.display = 'none'; }} />}
                        <div className="p-6"><p className="text-sm text-slate-500">Hola inversor,</p><h2 className="mt-3 text-xl font-bold text-slate-900">{form.title || 'Título de tu campaña'}</h2><p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-600">{form.message || 'El mensaje aparecerá aquí.'}</p><span className="mt-5 inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">{form.ctaLabel || 'Ver en Finix'} →</span></div>
                    </div>
                    <div className="flex gap-3 rounded-xl border border-border bg-card p-4 text-xs text-muted-foreground"><AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />Cada envío queda registrado en la auditoría y los usuarios pueden desactivarlo desde Configuración.</div>
                </aside>
            </div>

            <section className="overflow-hidden rounded-2xl border border-border bg-card"><div className="border-b border-border px-6 py-4"><h2 className="font-semibold">Últimas campañas</h2></div><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-secondary/40 text-xs text-muted-foreground"><tr><th className="px-6 py-3">Asunto</th><th className="px-6 py-3">Resultados</th><th className="px-6 py-3">Enviada por</th><th className="px-6 py-3">Fecha</th></tr></thead><tbody className="divide-y divide-border">{campaigns.length === 0 ? <tr><td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">Todavía no se enviaron campañas.</td></tr> : campaigns.map((campaign) => <tr key={campaign.id}><td className="px-6 py-4 font-medium text-foreground">{campaign.subject}</td><td className="px-6 py-4 text-muted-foreground">{campaign.sentCount}/{campaign.recipientCount} enviados{campaign.failedCount > 0 ? ` · ${campaign.failedCount} fallidos` : ''}</td><td className="px-6 py-4 text-muted-foreground">{campaign.createdBy?.username || campaign.createdBy?.email}</td><td className="px-6 py-4 text-muted-foreground">{new Date(campaign.createdAt).toLocaleString('es-AR')}</td></tr>)}</tbody></table></div></section>
        </div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return <label className="block space-y-1.5"><span className="text-sm font-medium text-foreground">{label}</span>{children}</label>;
}
