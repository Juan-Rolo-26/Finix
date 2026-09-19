import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, ShieldCheck, Lock, CreditCard, CheckCircle2,
    AlertCircle, Sparkles, Loader2, ExternalLink
} from 'lucide-react';
import { apiFetch } from '../lib/api';

interface Plan {
    id: string;
    name: string;
    price: number | string;
    interval?: string;
    description?: string;
    features?: string[] | string;
}

interface CommunityPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    community: {
        id: string;
        name: string;
        imageUrl?: string;
        plans?: (Plan | any)[];
    };
    initialPlan?: Plan | null;
    onSuccess: () => void;
}

export default function CommunityPaymentModal({
    isOpen,
    onClose,
    community,
    initialPlan,
    onSuccess,
}: CommunityPaymentModalProps) {
    const plans = community.plans && community.plans.length > 0
        ? community.plans
        : [{ id: 'default-paid', name: 'Plan Premium', price: 15, interval: 'monthly', description: 'Acceso total a publicaciones y análisis exclusivos' }];

    const [selectedPlan, setSelectedPlan] = useState<Plan>(initialPlan || plans[0]);
    const [cardholderName, setCardholderName] = useState('');
    const [cardNumber, setCardNumber] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [cvc, setCvc] = useState('');
    const [identification, setIdentification] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const isSuccess = false;
    const successData: any = null;

    if (!isOpen) return null;

    // Detect card brand: Visa or Mastercard
    const cleanNumber = cardNumber.replace(/\D/g, '');
    const isVisa = /^4/.test(cleanNumber);
    const isMastercard = /^(5[1-5]|222[1-9]|22[3-9]|2[3-6]|27[01]|2720)/.test(cleanNumber);
    const detectedBrand = isVisa ? 'VISA' : isMastercard ? 'MASTERCARD' : cleanNumber.length > 1 ? 'TARJETA' : null;

    // Format card number with spaces (4 4 4 4)
    const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
        const parts = raw.match(/.{1,4}/g) || [];
        setCardNumber(parts.join(' '));
        setError('');
    };

    // Format expiry date (MM/YY)
    const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/\D/g, '').slice(0, 4);
        if (val.length >= 3) {
            val = `${val.slice(0, 2)}/${val.slice(2)}`;
        }
        setExpiryDate(val);
        setError('');
    };

    // Format CVC (up to 4 digits)
    const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/\D/g, '').slice(0, 4);
        setCvc(val);
        setError('');
    };

    const handlePayWithCard = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await apiFetch(`/communities/${community.id}/checkout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planId: selectedPlan.id, provider: 'mercadopago' }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'No se pudo iniciar el checkout seguro.');
            if (data.init_point || data.sandbox_init_point) window.location.href = data.init_point || data.sandbox_init_point;
            else if (data.freeJoined) { onSuccess(); onClose(); }
        } catch (err: any) {
            setError(err.message || 'No se pudo iniciar el checkout seguro.');
            setLoading(false);
        } finally {
            if (!error) setLoading(false);
        }
    };

    const handleStripeCheckout = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await apiFetch(`/communities/${community.id}/checkout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planId: selectedPlan.id, provider: 'stripe' }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'No se pudo iniciar checkout');
            if (data.url) {
                window.location.href = data.url;
            } else if (data.freeJoined) {
                onSuccess();
                onClose();
            }
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/75 backdrop-blur-md"
                    onClick={!loading ? onClose : undefined}
                />

                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className="relative w-full max-w-xl rounded-2xl sm:rounded-3xl border border-white/10 shadow-2xl overflow-hidden z-10 my-auto"
                    style={{ background: 'hsl(var(--card))' }}
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-primary/10 text-primary border border-primary/20">
                                <CreditCard className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-base text-foreground flex items-center gap-1.5">
                                    Membresía Premium
                                    <Sparkles className="w-4 h-4 text-amber-400" />
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    {community.name}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            disabled={loading}
                            className="p-1.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {isSuccess ? (
                        /* Success Screen */
                        <div className="p-8 text-center space-y-4">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto"
                            >
                                <CheckCircle2 className="w-10 h-10" />
                            </motion.div>
                            <h4 className="text-xl font-bold text-foreground">
                                ¡Pago aprobado exitosamente!
                            </h4>
                            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                                Tu membresía a <span className="text-foreground font-semibold">{selectedPlan.name}</span> está activa. Acceso inmediato desbloqueado.
                            </p>
                            <div className="p-3 rounded-xl bg-muted/50 border border-border/40 text-xs font-mono text-muted-foreground">
                                {successData?.brand} •••• {successData?.last4} — Aprobado
                            </div>
                        </div>
                    ) : (
                        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
                            {/* Plan Selector */}
                            {plans.length > 1 && (
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        Seleccioná tu plan
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {plans.map(p => (
                                            <button
                                                key={p.id}
                                                type="button"
                                                onClick={() => setSelectedPlan(p)}
                                                className={`p-3 rounded-xl text-left border transition-all ${selectedPlan.id === p.id
                                                    ? 'border-primary bg-primary/10 shadow-sm'
                                                    : 'border-border/60 hover:bg-muted/40'
                                                    }`}
                                            >
                                                <div className="font-semibold text-sm">{p.name}</div>
                                                <div className="text-primary font-bold text-base">
                                                    ${p.price} <span className="text-xs font-normal text-muted-foreground">USD/{p.interval === 'yearly' ? 'año' : 'mes'}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* El número de tarjeta nunca se procesa dentro de Finix. El pago se completa en el checkout PCI del proveedor. */}
                            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-muted-foreground">
                                <div className="flex items-start gap-2">
                                    <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-500 mt-0.5" />
                                    <span>Serás redirigido a Mercado Pago o Stripe. Allí podrás usar Visa, Mastercard y las tarjetas y medios disponibles en tu país. Finix no guarda datos de tarjeta.</span>
                                </div>
                            </div>

                            {/* Resumen visual del pago: los datos sensibles se cargan únicamente en el proveedor */}
                            <div className="relative rounded-2xl p-5 overflow-hidden text-white shadow-xl bg-gradient-to-tr from-slate-950 via-slate-900 to-emerald-950 border border-emerald-500/30">
                                <div className="absolute -right-8 -bottom-8 w-40 h-40 rounded-full bg-primary/20 blur-2xl pointer-events-none" />
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-6 rounded bg-amber-400/80 flex items-center justify-center text-[10px] font-bold text-black tracking-widest">
                                            CHIP
                                        </div>
                                        <span className="text-[10px] tracking-widest text-emerald-300/80 font-mono">FINIX PAY</span>
                                    </div>

                                    {/* Brand Badges */}
                                    <div className="flex items-center gap-1.5">
                                        <span className={`px-2 py-0.5 rounded text-xs font-black tracking-wider transition-opacity ${isVisa ? 'bg-blue-600 text-white opacity-100 shadow' : isMastercard ? 'opacity-30' : 'bg-white/10 opacity-70'}`}>
                                            VISA
                                        </span>
                                        <span className={`px-2 py-0.5 rounded text-xs font-black tracking-wider transition-opacity ${isMastercard ? 'bg-orange-600 text-white opacity-100 shadow' : isVisa ? 'opacity-30' : 'bg-white/10 opacity-70'}`}>
                                            MASTERCARD
                                        </span>
                                    </div>
                                </div>

                                <div className="font-mono text-lg sm:text-xl tracking-widest text-white/90 mb-4 min-h-[28px]">
                                    {cardNumber || '•••• •••• •••• ••••'}
                                </div>

                                <div className="flex items-end justify-between text-xs">
                                    <div>
                                        <div className="text-[9px] uppercase tracking-wider text-white/50">Titular</div>
                                        <div className="font-medium tracking-wide uppercase truncate max-w-[180px]">
                                            {cardholderName || 'NOMBRE Y APELLIDO'}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-[9px] uppercase tracking-wider text-white/50">Vence</div>
                                        <div className="font-mono font-medium">
                                            {expiryDate || 'MM/AA'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Form */}
                            <form onSubmit={handlePayWithCard} className="space-y-3.5">
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="p-3 rounded-xl bg-destructive/15 border border-destructive/30 text-destructive text-xs flex items-center gap-2"
                                    >
                                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                        <span>{error}</span>
                                    </motion.div>
                                )}

                                <div>
                                    <label className="text-xs font-semibold text-foreground/80 mb-1 block">
                                        Tarjeta (se ingresa de forma segura en Mercado Pago)
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            placeholder="Se completa en el checkout seguro"
                                            value={cardNumber}
                                            onChange={handleCardNumberChange}
                                            disabled={loading}
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background/50 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all pr-16"
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[11px] font-bold text-muted-foreground pointer-events-none">
                                            {detectedBrand || 'VISA / MC'}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-foreground/80 mb-1 block">
                                            Datos de pago
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="No se solicitan en Finix"
                                        value={cardholderName}
                                        onChange={e => { setCardholderName(e.target.value.toUpperCase()); setError(''); }}
                                        disabled={loading}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all uppercase"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-semibold text-foreground/80 mb-1 block">
                                            Mercado Pago / Stripe
                                        </label>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            placeholder="Checkout externo"
                                            value={expiryDate}
                                            onChange={handleExpiryChange}
                                            disabled={loading}
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background/50 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-foreground/80 mb-1 block flex items-center justify-between">
                                            <span>Datos sensibles</span>
                                            <span className="text-[10px] text-muted-foreground font-normal">3-4 dígitos</span>
                                        </label>
                                        <input
                                            type="password"
                                            inputMode="numeric"
                                            placeholder="No se almacenan"
                                            value={cvc}
                                            onChange={handleCvcChange}
                                            disabled={loading}
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background/50 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-foreground/80 mb-1 block">Identificación</label>
                                    <input
                                        type="text"
                                        placeholder="Se solicita solo en el proveedor si corresponde"
                                        value={identification}
                                        onChange={e => setIdentification(e.target.value)}
                                        disabled={loading}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                                    />
                                </div>

                                {/* Summary & Security */}
                                <div className="p-3.5 rounded-xl bg-muted/40 border border-border/50 space-y-2 text-xs">
                                    <div className="flex justify-between items-center text-muted-foreground">
                                        <span>Plan {selectedPlan.name}</span>
                                        <span>${selectedPlan.price} USD</span>
                                    </div>
                                    <div className="flex justify-between items-center font-bold text-foreground pt-1 border-t border-border/40 text-sm">
                                        <span>Total a pagar</span>
                                        <span className="text-primary text-base">${selectedPlan.price} USD</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                    <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                    <span>Cifrado SSL bancario de 256 bits y cumplimiento de estándares PCI-DSS.</span>
                                </div>

                                {/* Pay Button */}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-md hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>Procesando pago seguro...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Lock className="w-4 h-4" />
                                            <span>Pagar ${selectedPlan.price} USD con Mercado Pago</span>
                                        </>
                                    )}
                                </button>
                            </form>

                            {/* Alternative: Stripe Checkout */}
                            <div className="pt-2 text-center">
                                <button
                                    type="button"
                                    onClick={handleStripeCheckout}
                                    disabled={loading}
                                    className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
                                >
                                    <span>¿Preferís Stripe Checkout externo?</span>
                                    <ExternalLink className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
