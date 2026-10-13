import { UiText as FinixUiText } from '@/i18n/UiText';
import { useTranslation as useFinixUiTranslation } from '@/i18n';
import { Link, useLocation } from 'react-router-dom';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function AccountRequired({ action, onClose }: { action: string; onClose?: () => void }) {
    const { ui: finixUi } = useFinixUiTranslation();

    const location = useLocation();
    const redirect = encodeURIComponent(`${location.pathname}${location.search}${location.hash}`);
    const content = <div className="space-y-4">
        <p>{""}<FinixUiText text={"Para"} />{" "}{action} {" "}<FinixUiText text={"necesitás una cuenta. Ingresá antes de empezar a escribir."} />{""}</p>
        <div className="flex flex-wrap gap-3">
            <Link className="inline-flex min-h-11 items-center rounded-xl bg-primary px-4 py-2 text-primary-foreground font-semibold" to={`/login?redirect=${redirect}`}>{""}<FinixUiText text={"Iniciar sesión"} />{""}</Link>
            <Link className="inline-flex min-h-11 items-center rounded-xl border px-4 py-2 font-semibold" to={`/login?mode=register&redirect=${redirect}`}>{""}<FinixUiText text={"Crear cuenta"} />{""}</Link>
        </div>
    </div>;
    if (!onClose) return <section aria-label={finixUi("Cuenta requerida")} className="rounded-2xl border bg-card p-4">{content}</section>;
    return <Dialog open onOpenChange={open => { if (!open) onClose(); }}><DialogContent>
        <DialogHeader><DialogTitle>{""}<FinixUiText text={"Ingresá para continuar"} />{""}</DialogTitle><DialogDescription>{""}<FinixUiText text={"Esta acción requiere una cuenta de Finix."} />{""}</DialogDescription></DialogHeader>
        {content}
    </DialogContent></Dialog>;
}
