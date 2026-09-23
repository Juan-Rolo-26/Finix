import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, Sparkles, Zap, Shield, Target, Loader2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, isProUser } from '@/stores/authStore';
import { apiFetch } from '@/lib/api';
import { SubscriptionRenewalChoice } from '@/components/SubscriptionRenewalChoice';

const FEATURES = [
    'Análisis fundamentales detallados de más de 5,000 acciones.',
    'Alertas exclusivas por Gmail en tiempo real y reportes prioritarios.',
    'Métricas técnicas en tiempo real e indicadores avanzados.',
    'Estimaciones de "Fair Value" y detección de premiums o descuentos.',
    'Desglose profundo de balances financieros y flujo de caja (Cash Flow).',
    'Badge de Inversor PRO en tu perfil para mayor reputación.',
    'Elegís entre renovar automáticamente cada mes o pagar un mes por vez.',
    'Cero anuncios y soporte prioritario 24/7.'
];

export default function ProUpgrade() {
    const navigate = useNavigate();
    const user = useAuthStore(s => s.user);
    const hasPro = isProUser(user);
    const [loading, setLoading] = useState(false);
    const [renewalChoiceOpen, setRenewalChoiceOpen] = useState(false);
    const [proPrice, setProPrice] = useState(8500);

    useEffect(() => {
        apiFetch('/mercadopago/config')
            .then(res => res.json())
            .then(data => {
                if (data.proPriceArs) {
                    setProPrice(data.proPriceArs);
                }
            })
            .catch(() => {});
    }, []);

    const handleUpgrade = async () => {
        if (!user) {
            navigate(`/auth?redirect=${encodeURIComponent('/pro')}&plan=PRO`);
            return;
        }
        setRenewalChoiceOpen(true);
    };

    const confirmCheckout = async (autoRenew: boolean) => {
        setLoading(true);
        try {
            const res = await apiFetch('/mercadopago/checkout/pro', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ autoRenew }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Error al conectar con Mercado Pago');
            }
            const data = await res.json();
            const checkoutUrl = data.init_point || (import.meta.env.DEV ? data.sandbox_init_point : undefined) || data.url;
            if (checkoutUrl) {
                window.location.href = checkoutUrl;
            } else {
                throw new Error('No se recibió la URL de checkout de Mercado Pago');
            }
        } catch (error: any) {
            alert(error.message || 'Ocurrió un error inesperado.');
            setRenewalChoiceOpen(false);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full opacity-30"
                    style={{ background: 'radial-gradient(circle, hsl(var(--primary)/0.2) 0%, transparent 60%)', filter: 'blur(100px)' }} />
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full opacity-20"
                    style={{ background: 'radial-gradient(circle, hsl(160 80% 40%/0.3) 0%, transparent 60%)', filter: 'blur(100px)' }} />
            </div>

            {/* Header */}
            <header className="relative z-10 w-full max-w-5xl mx-auto px-6 py-8 flex items-center justify-between">
                <button 
                    onClick={() => navigate(-1)}
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-secondary/50 hover:bg-secondary border border-border/50 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="font-heading font-extrabold text-2xl tracking-tighter">FINIX</div>
            </header>

            {/* Main Content */}
            <main className="relative z-10 flex-1 flex items-center justify-center p-6">
                <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
                    
                    {/* Left Column (Copy) */}
                    <motion.div 
                        initial={{ opacity: 0, x: -30 }} 
                        animate={{ opacity: 1, x: 0 }} 
                        transition={{ duration: 0.6 }}
                        className="space-y-8"
                    >
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest bg-primary/10 text-primary border border-primary/20">
                                <Sparkles className="w-4 h-4" /> Desbloqueá tu potencial
                            </div>
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-extrabold tracking-tight leading-[1.1]">
                                Invertí con <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">
                                    Inteligencia Superior
                                </span>
                            </h1>
                            <p className="text-lg text-muted-foreground leading-relaxed max-w-lg">
                                Obtené acceso instantáneo a nuestros reportes de análisis profundos, valuaciones en tiempo real y métricas financieras exclusivas diseñadas para que tomes mejores decisiones.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                    <Target className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm">Precisión Total</h4>
                                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Encontrá el "Fair Value" de miles de activos.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                                    <Shield className="w-5 h-5 text-blue-500" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm">Menos Riesgo</h4>
                                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Conocé el flujo de caja y la deuda de cada empresa.</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Right Column (Pricing Card) */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }} 
                        animate={{ opacity: 1, scale: 1 }} 
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="relative"
                    >
                        <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-emerald-500/10 rounded-[3rem] blur-xl opacity-50" />
                        
                        <div className="relative bg-card/60 backdrop-blur-2xl border border-border/50 rounded-[2.5rem] p-8 md:p-10 shadow-2xl">
                            
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold">Finix Pro</h2>
                                    <p className="text-muted-foreground text-sm mt-1">El aliado perfecto del inversor.</p>
                                </div>
                                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                                    <Zap className="w-6 h-6 text-primary" />
                                </div>
                            </div>

                            <div className="flex items-baseline gap-2 mb-1">
                                <span className="text-5xl font-extrabold tracking-tighter">${proPrice.toLocaleString('es-AR')}</span>
                                <span className="text-muted-foreground font-medium">ARS / mes</span>
                            </div>
                            <p className="text-xs text-emerald-400 font-semibold mb-6 flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5" /> Elegís si querés renovación automática antes de pagar.
                            </p>

                            <button 
                                onClick={handleUpgrade}
                                disabled={loading || hasPro}
                                className={`w-full py-4 px-6 rounded-2xl font-extrabold text-base sm:text-lg flex items-center justify-center gap-3 transition-all duration-200 ${
                                    hasPro
                                        ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-emerald-600 via-primary to-emerald-500 hover:from-emerald-500 hover:to-primary text-white shadow-xl shadow-primary/30 hover:shadow-primary/50 hover:scale-[1.01] active:scale-[0.99] border border-emerald-400/30 cursor-pointer'
                                }`}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Conectando...
                                    </>
                                ) : !user ? (
                                    <>
                                        <span>Iniciar sesión para mejorar a PRO</span>
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                ) : hasPro ? (
                                    'Ya eres PRO'
                                ) : (
                                    <>
                                        <span>Mejorar a PRO</span>
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                            <p className="text-center text-xs text-muted-foreground mt-4 mb-6 leading-relaxed">
                                Antes del pago elegís entre una única cuota mensual o renovación automática. La renovación se cancela desde <strong className="text-foreground">Configuración &gt; Planes PRO y Creador</strong>.
                            </p>

                            <div className="space-y-4 pt-6 border-t border-border/40">
                                {FEATURES.map((feat, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <div className="mt-0.5 rounded-full bg-primary/20 p-1 shrink-0">
                                            <Check className="w-3 h-3 text-primary" />
                                        </div>
                                        <span className="text-sm font-medium text-foreground/90 leading-relaxed">{feat}</span>
                                    </div>
                                ))}
                            </div>

                        </div>
                    </motion.div>

                </div>
            </main>
            <SubscriptionRenewalChoice
                open={renewalChoiceOpen}
                planName="Finix PRO"
                monthlyPrice={proPrice.toLocaleString('es-AR')}
                busy={loading}
                onClose={() => setRenewalChoiceOpen(false)}
                onConfirm={(autoRenew) => { void confirmCheckout(autoRenew); }}
            />
        </div>
    );
}
