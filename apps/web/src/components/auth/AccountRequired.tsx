import { Link, useLocation } from 'react-router-dom';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function AccountRequired({ action, onClose }: { action: string; onClose?: () => void }) {
    const location = useLocation();
    const redirect = encodeURIComponent(`${location.pathname}${location.search}${location.hash}`);
    const content = <div className="space-y-4">
        <p>Para {action} necesitás una cuenta. Ingresá antes de empezar a escribir.</p>
        <div className="flex flex-wrap gap-3">
            <Link className="inline-flex min-h-11 items-center rounded-xl bg-primary px-4 py-2 text-primary-foreground font-semibold" to={`/login?redirect=${redirect}`}>Iniciar sesión</Link>
            <Link className="inline-flex min-h-11 items-center rounded-xl border px-4 py-2 font-semibold" to={`/login?mode=register&redirect=${redirect}`}>Crear cuenta</Link>
        </div>
    </div>;
    if (!onClose) return <section aria-label="Cuenta requerida" className="rounded-2xl border bg-card p-4">{content}</section>;
    return <Dialog open onOpenChange={open => { if (!open) onClose(); }}><DialogContent>
        <DialogHeader><DialogTitle>Ingresá para continuar</DialogTitle><DialogDescription>Esta acción requiere una cuenta de Finix.</DialogDescription></DialogHeader>
        {content}
    </DialogContent></Dialog>;
}
