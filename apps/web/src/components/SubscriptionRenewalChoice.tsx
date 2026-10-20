import { UiText as FinixUiText } from '@/i18n/UiText';
import { useTranslation as useFinixUiTranslation } from '@/i18n';
import { useEffect } from 'react';
import { AlertCircle, Check, Loader2, RefreshCw, X } from 'lucide-react';

interface SubscriptionRenewalChoiceProps {
    open: boolean;
    planName: string;
    monthlyPrice: string;
    busy?: boolean;
    error?: string | null;
    mercadoPagoAvailable?: boolean;
    stripeAvailable?: boolean;
    stripeMonthlyPrice?: number | null;
    onClose: () => void;
    onConfirm: () => void;
    onConfirmStripe?: () => void;
}

export function SubscriptionRenewalChoice({ open, planName, monthlyPrice, busy = false, error, mercadoPagoAvailable = true, stripeAvailable = false, stripeMonthlyPrice, onClose, onConfirm, onConfirmStripe }: SubscriptionRenewalChoiceProps) {
    const { ui: finixUi } = useFinixUiTranslation();

    useEffect(() => {
        if (!open) return;
        const handleEscape = (event: KeyboardEvent) => { if (event.key === 'Escape' && !busy) onClose(); };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [open, busy, onClose]);
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}>
            <section role="dialog" aria-modal="true" aria-labelledby="renewal-choice-title" className="w-full max-w-lg space-y-5 rounded-2xl border border-border bg-card p-5 shadow-2xl sm:p-6">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-primary">{""}<FinixUiText text={"Antes de continuar"} />{""}</p>
                        <h2 id="renewal-choice-title" className="mt-1 text-xl font-bold">{""}<FinixUiText text={"Elegí cómo pagar"} />{" "}{planName}</h2>
                        <p className="mt-1 text-sm text-muted-foreground">{mercadoPagoAvailable ? `Prueba gratis por 2 días. Después, $${monthlyPrice} ARS por mes.` : 'Prueba gratis por 2 días; el precio mensual se confirma antes del cobro.'}</p>
                    </div>
                    <button type="button" aria-label={finixUi("Cerrar")} disabled={busy} onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-muted disabled:opacity-50"><X className="h-4 w-4" /></button>
                </div>

                {mercadoPagoAvailable && <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
                    <span className="flex items-center gap-2 text-sm font-semibold"><RefreshCw className="h-4 w-4 text-primary" />{""}<FinixUiText text={"2 días gratis y después renovación mensual"} />{""}</span>
                    <span className="mt-1 block pl-6 text-xs leading-relaxed text-muted-foreground">{""}<FinixUiText text={"Agregás un medio de pago en Mercado Pago. El primer cobro de"} />{" "}{monthlyPrice} {" "}<FinixUiText text={"ARS se hace al terminar la prueba. Podés cancelar antes desde Configuración → Suscripción."} />{""}</span>
                </div>}

                {stripeAvailable && onConfirmStripe ? (
                    <div className="space-y-2 border-t border-border pt-4">
                        <p className="text-center text-xs text-muted-foreground">{""}<FinixUiText text={"¿Preferís pagar con tarjeta directamente?"} />{""}</p>
                        <button type="button" disabled={busy} onClick={onConfirmStripe} className="w-full rounded-xl border border-primary/40 bg-primary/10 px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-primary/20 disabled:opacity-50">
                            {" "}<FinixUiText text={"Pagar con tarjeta mediante Stripe"} />{" "}</button>
                        <p className="text-center text-[11px] text-muted-foreground">{stripeMonthlyPrice ? `2 días gratis; después US$${stripeMonthlyPrice.toLocaleString('es-AR')} por mes. Cancelá antes para evitar el primer cobro.` : 'La prueba dura 2 días. El precio mensual y la moneda se confirman en Stripe antes del cobro.'}</p>
                    </div>
                ) : null}

                {error && (
                    <div role="alert" className="flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-700 dark:text-rose-300">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        <p className="leading-relaxed">{error}</p>
                    </div>
                )}

                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <button type="button" disabled={busy} onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50">{""}<FinixUiText text={"Volver"} />{""}</button>
                    <button type="button" disabled={busy || !mercadoPagoAvailable} onClick={onConfirm} className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50">
                        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        {busy ? 'Conectando…' : mercadoPagoAvailable ? 'Continuar a Mercado Pago' : 'Mercado Pago no disponible'}
                    </button>
                </div>
            </section>
        </div>
    );
}
