import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import {
    Mail,
    Send,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Shield,
    TrendingUp,
    Newspaper,
    Clock,
    UserPlus,
} from 'lucide-react';

export function FinixNewsletterBanner() {
    const navigate = useNavigate();
    const user = useAuthStore((s) => s.user);

    const [email, setEmail] = useState(() => (user?.email ? user.email : ''));
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [feedbackMessage, setFeedbackMessage] = useState('');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        // Registration is strictly required to receive the newsletter
        if (!user) {
            const targetEmail = email.trim();
            const redirectUrl = targetEmail
                ? `/register?email=${encodeURIComponent(targetEmail)}&redirect=/home`
                : '/register?redirect=/home';
            navigate(redirectUrl);
            return;
        }

        const trimmed = (email || user.email || '').trim().toLowerCase();
        if (!trimmed) {
            setStatus('error');
            setFeedbackMessage('Por favor ingresá tu correo electrónico.');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmed)) {
            setStatus('error');
            setFeedbackMessage('Ingresá una dirección de correo válida (ej: tu@email.com).');
            return;
        }

        setStatus('loading');
        setFeedbackMessage('');

        try {
            const res = await apiFetch('/newsletter/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: trimmed }),
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                const errorMsg = Array.isArray(data?.message)
                    ? data.message.join('. ')
                    : data?.message || 'No se pudo registrar la suscripción. Intentá de nuevo.';
                setStatus('error');
                setFeedbackMessage(errorMsg);
                return;
            }

            setStatus('success');
            setFeedbackMessage(
                data?.message || `¡Listo! Activamos el boletín diario en ${trimmed}. Revisá tu casilla.`
            );
        } catch {
            setStatus('error');
            setFeedbackMessage('Ocurrió un error de conexión. Por favor reintentá en unos segundos.');
        }
    };

    return (
        <section className="w-full my-6 select-none" aria-label="Suscripción al boletín financiero">
            <div className="relative overflow-hidden rounded-2xl bg-card border border-border/80 p-5 sm:p-7 md:p-8 text-card-foreground shadow-xs transition-colors dark:bg-[#071618] dark:border-emerald-500/30">
                {/* Decorative radial glows */}
                <div className="absolute -top-24 -right-24 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 max-w-3xl mx-auto space-y-4 text-center">
                    {/* Header badge — Slim and minimalist */}
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                        <Mail className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        <span>Boletín diario de mercados · 100% gratis</span>
                    </div>

                    {/* Headline and subtitle */}
                    <div className="space-y-1.5">
                        <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-foreground leading-snug">
                            Recibí el resumen de mercados todos los días en tu correo
                        </h2>
                        <p className="text-xs sm:text-sm text-muted-foreground font-normal leading-relaxed max-w-xl mx-auto">
                            Dólar MEP y CCL, Merval, Wall Street, balances y las noticias clave al cierre de cada rueda.
                        </p>
                    </div>

                    {/* Subscription Form */}
                    {status === 'success' ? (
                        <div className="max-w-md mx-auto p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 space-y-2 animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex items-center justify-center gap-2 font-semibold text-xs sm:text-sm">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                <span>{feedbackMessage}</span>
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                                Si no lo ves en tu bandeja principal, revisá tu carpeta de Promociones o Spam.
                            </p>
                        </div>
                    ) : user ? (
                        /* Authenticated User: Slim 1-click subscription */
                        <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-2">
                            <div className="flex flex-col sm:flex-row gap-2 items-stretch">
                                <div className="relative flex-1 min-w-0">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                                        <Mail className="w-3.5 h-3.5" />
                                    </div>
                                    <input
                                        type="email"
                                        value={email || user.email || ''}
                                        readOnly
                                        disabled={status === 'loading'}
                                        placeholder="Tu correo registrado"
                                        className="w-full h-8.5 sm:h-9 pl-9 pr-3 rounded-lg bg-background border border-border/80 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 text-xs text-foreground placeholder:text-muted-foreground transition-all shadow-2xs disabled:opacity-50"
                                        aria-label="Correo electrónico para suscripción"
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={status === 'loading'}
                                    className="h-8.5 sm:h-9 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs active:scale-95 disabled:opacity-60 cursor-pointer shrink-0"
                                >
                                    {status === 'loading' ? (
                                        <>
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            <span>Activando...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Activar en mi cuenta</span>
                                            <Send className="w-3 h-3" />
                                        </>
                                    )}
                                </button>
                            </div>

                            {status === 'error' && (
                                <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">
                                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                    <span>{feedbackMessage}</span>
                                </div>
                            )}

                            <p className="text-[11px] text-muted-foreground text-center">
                                Recibirás el boletín diario directamente en tu casilla registrada.
                            </p>
                        </form>
                    ) : (
                        /* Guest User: Must register to receive email */
                        <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-2">
                            <div className="flex flex-col sm:flex-row gap-2 items-stretch">
                                <div className="relative flex-1 min-w-0">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                                        <Mail className="w-3.5 h-3.5" />
                                    </div>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(e.target.value);
                                            if (status === 'error') setStatus('idle');
                                        }}
                                        placeholder="Ingresá tu correo para registrarte"
                                        className="w-full h-8.5 sm:h-9 pl-9 pr-3 rounded-lg bg-background border border-border/80 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 text-xs text-foreground placeholder:text-muted-foreground transition-all shadow-2xs"
                                        aria-label="Correo electrónico para registro"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="h-8.5 sm:h-9 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs active:scale-95 cursor-pointer shrink-0"
                                >
                                    <UserPlus className="w-3.5 h-3.5" />
                                    <span>Registrarme gratis</span>
                                </button>
                            </div>

                            <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
                                <span>Debés estar registrado para recibirlo.</span>
                                <span>·</span>
                                <button
                                    type="button"
                                    onClick={() => navigate('/login?redirect=/home')}
                                    className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline cursor-pointer"
                                >
                                    ¿Ya tenés cuenta? Iniciá sesión
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Value highlights — Clean minimal icons */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-3 text-xs text-muted-foreground font-medium border-t border-border/40">
                        <div className="flex items-center justify-center gap-1.5 py-1">
                            <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span>Dólar & Merval al día</span>
                        </div>
                        <div className="flex items-center justify-center gap-1.5 py-1">
                            <Newspaper className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span>Noticias en 3 minutos</span>
                        </div>
                        <div className="flex items-center justify-center gap-1.5 py-1">
                            <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span>Cada tarde al cierre</span>
                        </div>
                        <div className="flex items-center justify-center gap-1.5 py-1">
                            <Shield className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span>100% gratuito y seguro</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
