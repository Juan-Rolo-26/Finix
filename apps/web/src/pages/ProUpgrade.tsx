import FreeAccessNotice from '@/components/FreeAccessNotice';
import { usePlanCheckout } from '@/hooks/usePlanCheckout';
import { PlanCheckoutDialog } from '@/components/PlanCheckoutDialog';
import { formatArs, subscribedPlan } from '@/lib/plans';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, Sparkles, Zap, Shield, Target, Loader2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

const FEATURES = [
    'Datos de mercado y Pre-Market organizados.',
    'Mapas de calor y filtros por sector.',
    'Portafolios y métricas de seguimiento.',
    'Balances, múltiplos y herramientas de análisis.',
    'Noticias, calendario y datos por activo.',
    'Alertas configurables por Email y Telegram.',
    'Pago mensual seguro en ARS mediante Mercado Pago.',
    'Sin permanencia mínima.'
];

export default function ProUpgrade() {
    const checkout = usePlanCheckout();
    const freeAccess = checkout.catalog?.freeAccessEnabled === true;
    const proPriceArs = checkout.catalog?.proPriceArs;
    const navigate = useNavigate();
    const user = useAuthStore(s => s.user);
    const hasPro = subscribedPlan(user) !== 'FREE';
    const loading = checkout.busy;
    const handleUpgrade = () => checkout.choose('PRO');

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
            <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pt-4"><FreeAccessNotice /></div>
            {(checkout.configError || (checkout.error && !checkout.selectedPlan)) && <div role="alert" className="relative z-10 mx-auto max-w-6xl px-6 py-4">{checkout.configError || checkout.error}<button className="ml-3 text-primary underline" onClick={() => { void checkout.reload(); }}>Reintentar</button></div>}
            {freeAccess && <p className="relative z-10 mx-auto px-6 pt-3 text-sm text-muted-foreground">Precio mensual configurado: {formatArs(proPriceArs)}. El acceso temporal no crea una suscripción.</p>}
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
                                <Sparkles className="w-4 h-4" /> Herramientas para analizar mercados
                            </div>
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-extrabold tracking-tight leading-[1.1]">
                                Entendé mejor el mercado <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">
                                    con más datos
                                </span>
                            </h1>
                            <p className="text-lg text-muted-foreground leading-relaxed max-w-lg">
                                Reuní cotizaciones, noticias, portafolios y métricas en un mismo lugar. Consultá los precios, límites y condiciones de cada plan antes de contratar.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                    <Target className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm">Datos ordenados</h4>
                                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Consultá información de mercados y empresas en un mismo espacio.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                                    <Shield className="w-5 h-5 text-blue-500" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm">Herramientas claras</h4>
                                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Usá métricas y filtros para hacer tu propio seguimiento.</p>
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
                                    <p className="text-muted-foreground text-sm mt-1">Más datos para tu propio análisis.</p>
                                </div>
                                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                                    <Zap className="w-6 h-6 text-primary" />
                                </div>
                            </div>

                            <div className="flex items-baseline gap-2 mb-1">
                                <span className="text-5xl font-extrabold tracking-tighter">{freeAccess ? 'Gratis' : formatArs(proPriceArs)} </span>
                                <span className="text-muted-foreground font-medium">{freeAccess ? 'durante esta etapa' : '/ mes'}</span>
                            </div>
                            <p className="text-xs text-emerald-400 font-semibold mb-6 flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5" /> {freeAccess ? 'Todas las funciones PRO están incluidas sin pagar.' : 'Elegí un pago mensual o la renovación automática con Mercado Pago.'}
                            </p>

                            <button 
                                onClick={handleUpgrade}
                                disabled={loading || checkout.loading || !checkout.catalog}
                                className={`w-full py-4 px-6 rounded-2xl font-extrabold text-base sm:text-lg flex items-center justify-center gap-3 transition-all duration-200 ${
                                    hasPro && !freeAccess
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
                                        <span>{freeAccess ? 'Crear cuenta gratis' : 'Iniciar sesión para comprar'}</span>
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                ) : freeAccess ? ('Usar PRO gratis') : hasPro ? (
                                    'Gestionar mi plan'
                                ) : (
                                    <>
                                        <span>Mejorar a PRO</span>
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                            <p className="text-center text-xs text-muted-foreground mt-4 mb-6 leading-relaxed">
                                El pago se gestiona de forma segura con Mercado Pago. Podés elegir un mes por vez o renovar automáticamente desde <strong className="text-foreground">Configuración &gt; Planes PRO y Creador</strong>.
                            </p>

                            <div className="space-y-4 pt-6 border-t border-border/40">
                                {FEATURES.filter(feature => !freeAccess || !feature.startsWith('Pago mensual')).map((feat, i) => (
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
            <PlanCheckoutDialog checkout={checkout} />
        </div>
    );
}
