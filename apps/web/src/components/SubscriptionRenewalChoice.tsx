import { useEffect, useState } from 'react';
import { AlertCircle, CalendarDays, Check, Loader2, RefreshCw, X } from 'lucide-react';

interface SubscriptionRenewalChoiceProps {
    open: boolean;
    planName: string;
    monthlyPrice: string;
    busy?: boolean;
    error?: string | null;
    mercadoPagoAvailable?: boolean;
    stripeAvailable?: boolean;
    onClose: () => void;
    onConfirm: (autoRenew: boolean) => void;
    onConfirmStripe?: () => void;
}

export function SubscriptionRenewalChoice({ open, planName, monthlyPrice, busy = false, error, mercadoPagoAvailable = true, stripeAvailable = false, onClose, onConfirm, onConfirmStripe }: SubscriptionRenewalChoiceProps) {
    const [autoRenew, setAutoRenew] = useState(false);
    useEffect(() => { if (open) setAutoRenew(false); }, [open]);
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}>
            <section role="dialog" aria-modal="true" aria-labelledby="renewal-choice-title" className="w-full max-w-lg space-y-5 rounded-2xl border border-border bg-card p-5 shadow-2xl sm:p-6">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-primary">Antes de continuar</p>
                        <h2 id="renewal-choice-title" className="mt-1 text-xl font-bold">Elegí cómo pagar {planName}</h2>
                        <p className="mt-1 text-sm text-muted-foreground">Precio actual: {monthlyPrice} ARS por mes.</p>
                    </div>
                    <button type="button" aria-label="Cerrar" disabled={busy} onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-muted disabled:opacity-50"><X className="h-4 w-4" /></button>
                </div>

                <div className="space-y-3">
                    <button type="button" aria-pressed={!autoRenew} onClick={() => setAutoRenew(false)} className={`w-full rounded-xl border p-4 text-left transition-colors ${!autoRenew ? 'border-primary bg-primary/10' : 'border-border bg-background/50 hover:bg-muted/50'}`}>
                        <span className="flex items-center gap-2 text-sm font-semibold"><CalendarDays className="h-4 w-4 text-primary" />Pagar un mes, sin renovación</span>
                        <span className="mt-1 block pl-6 text-xs leading-relaxed text-muted-foreground">Pagás {monthlyPrice} ARS una sola vez. Mercado Pago muestra tarjetas Visa/Mastercard, billeteras y otros medios disponibles para tu cuenta.</span>
                    </button>
                    <button type="button" aria-pressed={autoRenew} onClick={() => setAutoRenew(true)} className={`w-full rounded-xl border p-4 text-left transition-colors ${autoRenew ? 'border-primary bg-primary/10' : 'border-border bg-background/50 hover:bg-muted/50'}`}>
                        <span className="flex items-center gap-2 text-sm font-semibold"><RefreshCw className="h-4 w-4 text-primary" />Renovar y cobrar automáticamente cada mes</span>
                        <span className="mt-1 block pl-6 text-xs leading-relaxed text-muted-foreground">Mercado Pago cobrará {monthlyPrice} ARS por mes hasta que canceles la renovación desde Configuración → Suscripción.</span>
                    </button>
                </div>

                {stripeAvailable && onConfirmStripe ? (
                    <div className="space-y-2 border-t border-border pt-4">
                        <p className="text-center text-xs text-muted-foreground">¿Preferís pagar con tarjeta directamente?</p>
                        <button type="button" disabled={busy} onClick={onConfirmStripe} className="w-full rounded-xl border border-indigo-400/40 bg-indigo-500/10 px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-indigo-500/20 disabled:opacity-50">
                            Pagar con tarjeta mediante Stripe
                        </button>
                        <p className="text-center text-[11px] text-muted-foreground">Stripe acepta tarjetas Visa, Mastercard y otras tarjetas habilitadas. Este checkout inicia renovación mensual.</p>
                    </div>
                ) : null}

                {error && (
                    <div role="alert" className="flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-700 dark:text-rose-300">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        <p className="leading-relaxed">{error}</p>
                    </div>
                )}

                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <button type="button" disabled={busy} onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50">Volver</button>
                    <button type="button" disabled={busy || !mercadoPagoAvailable} onClick={() => onConfirm(autoRenew)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50">
                        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        {busy ? 'Conectando…' : mercadoPagoAvailable ? 'Continuar a Mercado Pago' : 'Mercado Pago no disponible'}
                    </button>
                </div>
            </section>
        </div>
    );
}
