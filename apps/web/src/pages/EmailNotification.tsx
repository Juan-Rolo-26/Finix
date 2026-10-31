import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Mail } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { formatNotificationTime } from '@/lib/notifications';

interface EmailCopy {
    id: string; notificationId: string; subject: string; to: string;
    sentAt: string; deliveredAt: string | null; deliveryStatus: string; html: string; text: string;
}
const safeEmailHead = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https: data:; style-src 'unsafe-inline' https:; font-src https: data:; form-action 'none';"><base target="_blank">`;

export default function EmailNotification() {
    const { recipientId } = useParams();
    const [email, setEmail] = useState<EmailCopy | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [retry, setRetry] = useState(0);
    useEffect(() => {
        const controller = new AbortController();
        setLoading(true); setError(''); setEmail(null);
        void (async () => {
            try {
                const response = await apiFetch('/notifications/emails/' + encodeURIComponent(recipientId || ''), { signal: controller.signal });
                if (!response.ok) throw new Error(response.status === 404 ? 'Este correo no está disponible en tu cuenta.' : 'No se pudo cargar el correo. Reintentá en unos momentos.');
                const data: EmailCopy = await response.json();
                if (controller.signal.aborted) return;
                setEmail(data);
                void apiFetch('/notifications/' + encodeURIComponent(data.notificationId) + '/read', { method: 'PATCH', signal: controller.signal })
                    .then(marked => { if (marked.ok && !controller.signal.aborted) window.dispatchEvent(new Event('finix:unread-refresh')); })
                    .catch(() => { /* The saved email remains readable if marking it read fails. */ });
            } catch (cause) {
                if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'No se pudo cargar el correo.');
            } finally { if (!controller.signal.aborted) setLoading(false); }
        })();
        return () => controller.abort();
    }, [recipientId, retry]);
    return <section className="w-full max-w-6xl mx-auto px-3 sm:px-6 py-5 sm:py-8 min-w-0">
        <Link to="/notifications" className="inline-flex items-center gap-2 text-sm font-semibold text-primary mb-5"><ArrowLeft size={16} /> Notificaciones</Link>
        {loading ? <div role="status" className="flex items-center justify-center gap-2 py-20 text-muted-foreground"><Loader2 className="animate-spin" size={20} /> Cargando correo…</div>
            : error ? <div role="alert" className="rounded-xl border border-border bg-card p-5"><p>{error}</p><button onClick={() => setRetry(value => value + 1)} className="mt-4 rounded-lg px-4 py-2 bg-primary text-primary-foreground font-semibold">Reintentar</button></div>
            : email && <article className="rounded-2xl border border-border bg-card overflow-hidden min-w-0">
                <header className="px-4 sm:px-6 py-5 border-b border-border space-y-2">
                    <p className="flex items-center gap-2 text-xs font-semibold text-primary"><Mail size={16} /> Correo de Finix</p>
                    <h1 className="text-xl sm:text-2xl font-bold break-words">{email.subject}</h1>
                    <p className="text-sm text-muted-foreground break-all">Para: {email.to}</p>
                    <p className="text-xs text-muted-foreground">{formatNotificationTime(email.sentAt)} · {email.deliveryStatus === 'DELIVERED' ? 'Entrega confirmada' : email.deliveryStatus === 'BOUNCED' ? 'No se pudo entregar por email' : 'Enviado por email'}</p>
                </header>
                {email.html ? <iframe title={email.subject} srcDoc={safeEmailHead + email.html}
                    sandbox="allow-popups allow-popups-to-escape-sandbox" referrerPolicy="no-referrer"
                    className="w-full border-0 bg-white" style={{ height: 'max(480px, 72dvh)' }} />
                    : <div className="p-5 sm:p-7 whitespace-pre-wrap break-words text-sm leading-relaxed">{email.text}</div>}
            </article>}
    </section>;
}
