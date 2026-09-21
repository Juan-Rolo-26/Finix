import { useEffect, useState } from 'react';
import { Bell, BellOff, Send } from 'lucide-react';
import { apiFetch } from '@/lib/api';

async function pushRequest(path: string, body?: unknown) {
    const response = await apiFetch('/notifications/push/' + path, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : undefined);
    const data = await response.json();
    if (!response.ok) throw new Error(typeof data.message === 'string' ? data.message : 'No se pudo actualizar este dispositivo.');
    return data;
}
export default function PushSettings() {
    const [active, setActive] = useState(false);
    const [busy, setBusy] = useState(true);
    const [message, setMessage] = useState('');
    const supported = typeof window !== 'undefined' && window.isSecureContext && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    useEffect(() => {
        let live = true;
        void (async () => {
            try {
                if (!supported) return;
                const registration = await navigator.serviceWorker.getRegistration('/');
                const subscription = await registration?.pushManager.getSubscription();
                if (subscription) {
                    const status = await pushRequest('status', { endpoint: subscription.endpoint });
                    if (live) setActive(status.subscribed);
                }
            } catch { if (live) setMessage('No se pudo consultar el estado de este dispositivo.'); }
            finally { if (live) setBusy(false); }
        })();
        return () => { live = false; };
    }, [supported]);
    const toggle = async () => {
        setBusy(true); setMessage('');
        try {
            if (!supported) throw new Error('Este navegador no admite notificaciones push.');
            // Permission must originate directly from a user gesture on iOS.
            if (!active && await Notification.requestPermission() !== 'granted') throw new Error('Permiso denegado. Revisalo en la configuracion del navegador.');
            const config = await pushRequest('config');
            if (!active && !config.enabled) throw new Error('Push todavia no esta configurado en el servidor.');
            await navigator.serviceWorker.register('/sw.js', { scope: '/' });
            const registration = await navigator.serviceWorker.ready;
            let subscription = await registration.pushManager.getSubscription();
            if (active) {
                if (subscription) { await pushRequest('unsubscribe', { endpoint: subscription.endpoint }); await subscription.unsubscribe(); }
                setActive(false); setMessage('Notificaciones desactivadas en este dispositivo.');
            } else {
                const base64 = config.publicKey.replace(/-/g, '+').replace(/_/g, '/');
                const key = Uint8Array.from(atob(base64 + '='.repeat((4 - base64.length % 4) % 4)), c => c.charCodeAt(0));
                subscription = subscription || await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
                await pushRequest('subscribe', subscription.toJSON());
                setActive(true); setMessage('Este dispositivo puede recibir notificaciones.');
            }
        } catch (e) { setMessage(e instanceof Error ? e.message : 'No se pudo activar push.'); }
        finally { setBusy(false); }
    };
    const test = async () => {
        setBusy(true); setMessage('');
        try { await pushRequest('test', {}); setMessage('Prueba en cola. Puede tardar unos segundos.'); }
        catch (e) { setMessage(e instanceof Error ? e.message : 'No se pudo enviar la prueba.'); }
        finally { setBusy(false); }
    };
    return <section className="space-y-3 border-b border-border pb-5">
        <h3 className="font-semibold">Notificaciones en este dispositivo</h3>
        <p className="text-sm text-muted-foreground">{active ? 'Activadas' : 'Desactivadas'}</p>
        {!supported && <p className="text-sm text-muted-foreground">En iPhone, agrega Finix a la pantalla de inicio y abrilo desde ese icono. Se requiere HTTPS y un navegador compatible.</p>}
        <div className="flex flex-wrap gap-3"><button type="button" disabled={!supported || busy} onClick={() => void toggle()} className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-primary-foreground disabled:opacity-40">{active ? <BellOff size={16} /> : <Bell size={16} />}{active ? 'Desactivar' : 'Activar notificaciones'}</button>{active && <button type="button" disabled={busy} onClick={() => void test()} className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2"><Send size={16} />Enviar prueba</button>}</div>
        {message && <p role="status" className="text-sm">{message}</p>}
    </section>;
}
