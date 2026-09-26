import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Crown,
    Sparkles,
    Users,
    TrendingUp,
    ShieldCheck,
    Coins,
    BarChart3,
    Check,
    ChevronRight,
    ArrowRight,
    ArrowLeft,
    CheckCircle2,
    DollarSign,
    HelpCircle,
    Layers,
    Sliders,
    Loader2
} from 'lucide-react';
import { useAuthStore, isCreatorUser } from '@/stores/authStore';
import { apiFetch } from '@/lib/api';
import { SubscriptionRenewalChoice } from '@/components/SubscriptionRenewalChoice';

export default function CreatorPage() {
    const navigate = useNavigate();
    const user = useAuthStore(s => s.user);
    const isCreator = isCreatorUser(user);

    const [loadingCheckout, setLoadingCheckout] = useState(false);
    const [renewalChoiceOpen, setRenewalChoiceOpen] = useState(false);
    const [creatorPrice, setCreatorPrice] = useState(29900);
    const [checkoutError, setCheckoutError] = useState<string | null>(null);

    // Earnings Calculator State
    const [memberCount, setMemberCount] = useState<number>(100);
    const [monthlyFee, setMonthlyFee] = useState<number>(15000);

    // FAQ Accordion State
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    useEffect(() => {
        apiFetch('/mercadopago/config')
            .then(res => res.json())
            .then(data => {
                if (data.creatorPriceArs) {
                    setCreatorPrice(data.creatorPriceArs);
                }
            })
            .catch(() => {});
    }, []);

    const handleCheckoutCreator = async () => {
        if (!user) {
            navigate(`/auth?redirect=${encodeURIComponent('/creator')}&plan=Creador`);
            return;
        }

        if (isCreator) {
            navigate('/comunidades/crear');
            return;
        }

        setCheckoutError(null);
        setRenewalChoiceOpen(true);
    };

    const confirmCreatorCheckout = async (autoRenew: boolean) => {
        setLoadingCheckout(true);
        try {
            const res = await apiFetch('/mercadopago/checkout/creator', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ autoRenew }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Error al conectar con Mercado Pago');
            }
            const data = await res.json();
            const checkoutUrl = data.checkoutUrl || data.url || data.init_point;
            if (checkoutUrl) {
                window.location.href = checkoutUrl;
            } else {
                throw new Error('No se recibió el enlace de pago');
            }
        } catch (error: any) {
            setCheckoutError(error.message || 'Ocurrió un error al procesar la solicitud.');
        } finally {
            setLoadingCheckout(false);
        }
    };

    // Earnings calculations
    const grossMonthlyArs = memberCount * monthlyFee;
    const grossAnnualArs = grossMonthlyArs * 12;
    const estimatedUsdMonthly = Math.round(grossMonthlyArs / 1250); // Tipo de cambio de referencia

    const faqs = [
        {
            q: '¿Qué es el Programa de Creadores de Finix?',
            a: 'Es la suite profesional para analistas, educadores e inversores que quieren liderar su propia comunidad financiera. Te permite crear canales públicos y salas privadas de pago, compartir tesis fundamentadas con datos bursátiles en tiempo real y cobrar suscripciones mensuales automatizadas.'
        },
        {
            q: '¿Cómo y cuándo cobro las suscripciones de mis miembros?',
            a: 'Tus miembros se suscriben mediante Mercado Pago con cobro recurrente automático. Los fondos se acreditan de forma directa y transparente en tu cuenta conectada, sin demoras ni retenciones sorpresivas.'
        },
        {
            q: '¿Puedo tener canales gratuitos y salas VIP de pago simultáneamente?',
            a: '¡Sí! Podés configurar canales abiertos para interactuar con toda la red y atraer nuevos seguidores, y habilitar salas exclusivas solo para miembros activos que abonan tu cuota mensual.'
        },
        {
            q: '¿Qué incluye además de las herramientas para crear comunidades?',
            a: 'El Plan Creador incluye TODO lo de Finix PRO: cotizaciones de mercados en tiempo real, portafolios institucionales sin límites, modelos de valuación (DCF), noticias financieras en vivo y calendario económico con balances corporativos.'
        },
        {
            q: '¿Tengo permanencia o penalización si quiero cancelar?',
            a: 'Ninguna. Podés cancelar en cualquier momento con un solo clic desde Configuración > Suscripción. Conservás tus beneficios hasta el último día del ciclo contratado.'
        }
    ];

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden selection:bg-amber-500/20 selection:text-amber-300">
            {/* Ambient Background Glows */}
            <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
                <div
                    className="absolute top-[-15%] left-[20%] w-[60%] h-[50%] rounded-full opacity-25"
                    style={{
                        background: 'radial-gradient(circle, hsl(45 95% 55% / 0.35) 0%, hsl(var(--primary)/0.25) 50%, transparent 75%)',
                        filter: 'blur(120px)'
                    }}
                />
                <div
                    className="absolute top-[40%] right-[-10%] w-[50%] h-[50%] rounded-full opacity-20"
                    style={{
                        background: 'radial-gradient(circle, hsl(var(--primary)/0.35) 0%, transparent 70%)',
                        filter: 'blur(130px)'
                    }}
                />
            </div>

            {/* Navigation Header */}
            <header className="relative z-20 border-b border-border/50 backdrop-blur-xl bg-background/70 sticky top-0">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/comunidades')}
                            className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-1 px-2.5 rounded-lg hover:bg-muted"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span>Comunidades</span>
                        </button>
                        <div className="h-4 w-px bg-border/60" />
                        <div className="flex items-center gap-2">
                            <span className="font-heading font-extrabold text-base sm:text-lg tracking-tight">FINIX</span>
                            <span className="bg-gradient-to-r from-amber-500 to-amber-300 text-black text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm">
                                CREATOR
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {isCreator ? (
                            <Link
                                to="/comunidades/crear"
                                className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-extrabold text-xs px-3.5 py-2 rounded-xl shadow-lg shadow-amber-500/20 transition-all hover:scale-105"
                            >
                                <Crown className="w-3.5 h-3.5 fill-black" />
                                <span>Crear Comunidad</span>
                            </Link>
                        ) : (
                            <button
                                onClick={handleCheckoutCreator}
                                disabled={loadingCheckout}
                                className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-black font-extrabold text-xs px-4 py-2 rounded-xl shadow-lg shadow-amber-500/20 transition-all hover:scale-105 disabled:opacity-50"
                            >
                                {loadingCheckout ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                    <Crown className="w-3.5 h-3.5 fill-black" />
                                )}
                                <span>Convertirme en Creator</span>
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="relative z-10 flex-1 flex flex-col">
                {/* ── 1. HERO SECTION ── */}
                <section className="pt-12 pb-16 sm:pt-20 sm:pb-24 px-4 sm:px-6 max-w-6xl mx-auto w-full text-center">
                    {/* Status notification for active creators */}
                    {isCreator && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-8 max-w-2xl mx-auto p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-4 text-left shadow-lg backdrop-blur-md"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                                    <Crown className="w-5 h-5 fill-amber-400" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                                        ¡Tu perfil de Creator está activo y verificado!
                                    </h4>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Tenés acceso ilimitado para fundar comunidades, monetizar salas y moderar miembros.
                                    </p>
                                </div>
                            </div>
                            <Link
                                to="/comunidades/crear"
                                className="shrink-0 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black px-3.5 py-2 rounded-xl shadow-md transition-all flex items-center gap-1"
                            >
                                <span>Crear ahora</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                        </motion.div>
                    )}

                    {/* Pre-title badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-6 shadow-sm">
                        <Sparkles className="w-3.5 h-3.5 fill-amber-400" />
                        Finix Creator Program
                    </div>

                    {/* Main Headline */}
                    <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-heading font-black tracking-tight leading-[1.08] mb-6">
                        Monetizá tu conocimiento.{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-primary to-emerald-400 block sm:inline">
                            Liderá tu propia comunidad de inversores.
                        </span>
                    </h1>

                    <p className="max-w-3xl mx-auto text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed mb-10">
                        Creá un espacio exclusivo con salas privadas, compartí tesis con datos bursátiles en tiempo real y cobrá suscripciones mensuales recurrentes sin ocuparte de la cobranza manual.
                    </p>

                    {/* Hero CTAs */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
                        {isCreator ? (
                            <Link
                                to="/comunidades/crear"
                                className="w-full sm:w-auto h-14 px-8 rounded-2xl font-extrabold text-base flex items-center justify-center gap-3 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-300 text-black shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
                            >
                                <Crown className="w-5 h-5 fill-black" />
                                <span>Crear mi Comunidad</span>
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        ) : (
                            <button
                                onClick={handleCheckoutCreator}
                                disabled={loadingCheckout}
                                className="w-full sm:w-auto h-14 px-8 rounded-2xl font-extrabold text-base flex items-center justify-center gap-3 bg-gradient-to-r from-amber-500 via-emerald-500 to-teal-500 hover:from-amber-400 hover:to-emerald-400 text-black shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                            >
                                {loadingCheckout ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Crown className="w-5 h-5 fill-black" />
                                )}
                                <span>Empezar como Creador</span>
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        )}

                        <a
                            href="#calculadora"
                            className="w-full sm:w-auto h-14 px-7 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 border border-border/80 bg-card/60 hover:bg-muted backdrop-blur-md transition-all hover:border-primary/50"
                        >
                            <Sliders className="w-4 h-4 text-primary" />
                            <span>Calcular mis ingresos potenciales</span>
                        </a>
                    </div>

                    {/* Micro Proof Badges */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto pt-4 border-t border-border/40">
                        <div className="p-3.5 rounded-2xl bg-card/40 border border-border/50 backdrop-blur-sm text-left">
                            <div className="flex items-center gap-2 text-amber-400 mb-1">
                                <Crown className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase tracking-wider">Insignia Oficial</span>
                            </div>
                            <p className="text-xs text-muted-foreground">Badge dorado de Creador Verificado en toda la red.</p>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-card/40 border border-border/50 backdrop-blur-sm text-left">
                            <div className="flex items-center gap-2 text-emerald-400 mb-1">
                                <Coins className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase tracking-wider">Cobros en ARS</span>
                            </div>
                            <p className="text-xs text-muted-foreground">Elegís si querés renovar automáticamente antes de pagar.</p>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-card/40 border border-border/50 backdrop-blur-sm text-left">
                            <div className="flex items-center gap-2 text-cyan-400 mb-1">
                                <BarChart3 className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase tracking-wider">Datos en Vivo</span>
                            </div>
                            <p className="text-xs text-muted-foreground">Balances y gráficos integrados en tus publicaciones.</p>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-card/40 border border-border/50 backdrop-blur-sm text-left">
                            <div className="flex items-center gap-2 text-purple-400 mb-1">
                                <ShieldCheck className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase tracking-wider">Todo Finix PRO</span>
                            </div>
                            <p className="text-xs text-muted-foreground">Acceso total a las 5 secciones de análisis y mercados.</p>
                        </div>
                    </div>
                </section>

                {/* ── 2. INTERACTIVE EARNINGS CALCULATOR ── */}
                <section id="calculadora" className="py-16 sm:py-20 px-4 sm:px-6 bg-muted/20 border-y border-border/50 relative">
                    <div className="max-w-5xl mx-auto">
                        <div className="text-center max-w-2xl mx-auto mb-12">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-3">
                                <DollarSign className="w-3.5 h-3.5" />
                                Simulador de Ingresos Recurrentes
                            </div>
                            <h2 className="text-2xl sm:text-4xl font-heading font-extrabold tracking-tight">
                                Calculá el potencial mensual de tu comunidad
                            </h2>
                            <p className="text-sm text-muted-foreground mt-2">
                                Ajustá el número estimado de suscriptores y la cuota mensual para ver tus ingresos netos proyectados.
                            </p>
                        </div>

                        <div className="grid lg:grid-cols-12 gap-8 items-center bg-card/80 border border-border/70 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
                            {/* Sliders (Left Column) */}
                            <div className="lg:col-span-7 space-y-8">
                                {/* Slider 1: Miembros */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <label className="text-sm font-bold flex items-center gap-2">
                                            <Users className="w-4 h-4 text-primary" />
                                            <span>Miembros suscriptores</span>
                                        </label>
                                        <span className="text-xl font-extrabold text-foreground bg-muted/80 px-3.5 py-1 rounded-xl border border-border">
                                            {memberCount.toLocaleString('es-AR')}
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min="10"
                                        max="1000"
                                        step="10"
                                        value={memberCount}
                                        onChange={e => setMemberCount(Number(e.target.value))}
                                        className="w-full h-2.5 bg-muted rounded-lg appearance-none cursor-pointer accent-emerald-500"
                                    />
                                    <div className="flex justify-between text-[11px] text-muted-foreground mt-1.5 font-medium">
                                        <span>10 miembros</span>
                                        <span>250</span>
                                        <span>500</span>
                                        <span>1.000 miembros</span>
                                    </div>
                                </div>

                                {/* Slider 2: Cuota Mensual */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <label className="text-sm font-bold flex items-center gap-2">
                                            <Coins className="w-4 h-4 text-amber-400" />
                                            <span>Cuota mensual por suscriptor</span>
                                        </label>
                                        <span className="text-xl font-extrabold text-amber-400 bg-amber-500/10 px-3.5 py-1 rounded-xl border border-amber-500/30">
                                            ${monthlyFee.toLocaleString('es-AR')} ARS
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min="3000"
                                        max="60000"
                                        step="1000"
                                        value={monthlyFee}
                                        onChange={e => setMonthlyFee(Number(e.target.value))}
                                        className="w-full h-2.5 bg-muted rounded-lg appearance-none cursor-pointer accent-amber-400"
                                    />
                                    <div className="flex justify-between text-[11px] text-muted-foreground mt-1.5 font-medium">
                                        <span>$3.000 ARS</span>
                                        <span>$20.000 ARS</span>
                                        <span>$40.000 ARS</span>
                                        <span>$60.000 ARS</span>
                                    </div>
                                </div>

                                <div className="p-4 rounded-2xl bg-muted/40 border border-border/50 text-xs text-muted-foreground space-y-1.5">
                                    <div className="flex items-center gap-1.5 text-foreground font-semibold">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                        Cobros automáticos recurrentes cada 30 días
                                    </div>
                                    <p>
                                        Finix gestiona la cobranza automática vía Mercado Pago. Si el pago de un miembro falla, el sistema gestiona los reintentos y suspende el acceso al canal VIP sin que tengas que intervenir.
                                    </p>
                                </div>
                            </div>

                            {/* Results Card (Right Column) */}
                            <div className="lg:col-span-5 bg-gradient-to-br from-card via-card/90 to-background border-2 border-emerald-500/40 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                                    <Crown className="w-36 h-36 text-amber-400" />
                                </div>

                                <div className="relative z-10 space-y-6">
                                    <div>
                                        <span className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                                            Ingresos Mensuales Estimados
                                        </span>
                                        <div className="mt-2 flex items-baseline gap-2">
                                            <span className="text-3xl sm:text-4xl font-heading font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                                                ${grossMonthlyArs.toLocaleString('es-AR')}
                                            </span>
                                            <span className="text-xs font-semibold text-muted-foreground">ARS / mes</span>
                                        </div>
                                        <p className="text-xs font-semibold text-emerald-400/90 mt-1 flex items-center gap-1">
                                            <Sparkles className="w-3 h-3" /> Aprox. ~${estimatedUsdMonthly.toLocaleString('en-US')} USD mensuales
                                        </p>
                                    </div>

                                    <div className="pt-4 border-t border-border/50 space-y-2">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-muted-foreground">Proyección anual:</span>
                                            <span className="font-extrabold text-foreground">
                                                ${grossAnnualArs.toLocaleString('es-AR')} ARS
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-muted-foreground">Retención promedio Finix:</span>
                                            <span className="font-extrabold text-emerald-400">92% mensual</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-muted-foreground">Costo de hosting/servidores:</span>
                                            <span className="font-extrabold text-foreground">$0 (incluido)</span>
                                        </div>
                                    </div>

                                    <div className="pt-2">
                                        <button
                                            onClick={handleCheckoutCreator}
                                            disabled={loadingCheckout}
                                            className="w-full py-3.5 px-4 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                                        >
                                            {loadingCheckout ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Crown className="w-4 h-4 fill-black" />
                                            )}
                                            <span>Empezar a monetizar</span>
                                            <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── 3. SIX PILLARS (SUPERPODERES DEL CREADOR) ── */}
                <section className="py-16 sm:py-24 px-4 sm:px-6 max-w-6xl mx-auto w-full">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 mb-3">
                            <Sparkles className="w-3.5 h-3.5" />
                            Infraestructura Dedicada
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-heading font-extrabold tracking-tight">
                            Todo lo que necesitás para escalar tu comunidad financiera
                        </h2>
                        <p className="text-sm sm:text-base text-muted-foreground mt-3">
                            Diseñado específicamente para el mercado financiero: olvídate de lidiar con bots de Telegram o transferencias desordenadas por WhatsApp.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Pillar 1 */}
                        <div className="p-7 rounded-3xl bg-card border border-border/60 hover:border-amber-500/40 transition-all hover:shadow-xl hover:-translate-y-1 group">
                            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-5 group-hover:scale-110 transition-transform">
                                <Crown className="w-6 h-6 fill-amber-400" />
                            </div>
                            <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                                <span>Insignia Verificada</span>
                            </h3>
                            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                Tu perfil se destaca en discusiones, comentarios y rankings con el sello dorado oficial de Finix Creator, otorgándote autoridad institucional inmediata.
                            </p>
                        </div>

                        {/* Pillar 2 */}
                        <div className="p-7 rounded-3xl bg-card border border-border/60 hover:border-primary/40 transition-all hover:shadow-xl hover:-translate-y-1 group">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-5 group-hover:scale-110 transition-transform">
                                <Layers className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold mb-2">Canales Públicos y Salas VIP</h3>
                            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                Organizá tu comunidad por temáticas: Renta Variable, Cedears, Opciones, Cripto o Renta Fija. Restringí el acceso a tus mejores tesis solo para miembros pagos.
                            </p>
                        </div>

                        {/* Pillar 3 */}
                        <div className="p-7 rounded-3xl bg-card border border-border/60 hover:border-emerald-500/40 transition-all hover:shadow-xl hover:-translate-y-1 group">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-5 group-hover:scale-110 transition-transform">
                                <BarChart3 className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold mb-2">Tesis con Datos Bursátiles</h3>
                            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                Publicá análisis enlazando directamente los tickers de Finix. Tus suscriptores pueden consultar gráficos, balances y ratios de tus recomendaciones sin salir del hilo.
                            </p>
                        </div>

                        {/* Pillar 4 */}
                        <div className="p-7 rounded-3xl bg-card border border-border/60 hover:border-cyan-500/40 transition-all hover:shadow-xl hover:-translate-y-1 group">
                            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-5 group-hover:scale-110 transition-transform">
                                <Coins className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold mb-2">Cobro Recurrente Mercado Pago</h3>
                            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                Suscripciones mensuales automáticas con tarjetas argentinas y saldo en cuenta. Vos te dedicás a analizar y Finix se ocupa de procesar los pagos.
                            </p>
                        </div>

                        {/* Pillar 5 */}
                        <div className="p-7 rounded-3xl bg-card border border-border/60 hover:border-purple-500/40 transition-all hover:shadow-xl hover:-translate-y-1 group">
                            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-5 group-hover:scale-110 transition-transform">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold mb-2">Portafolio Auditado en Vivo</h3>
                            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                Mostrá la evolución real de tu cartera a tus miembros. Cero capturas manipuladas: transparencia total con métricas de Alpha, Beta y Sharpe Ratio.
                            </p>
                        </div>

                        {/* Pillar 6 */}
                        <div className="p-7 rounded-3xl bg-card border border-border/60 hover:border-blue-500/40 transition-all hover:shadow-xl hover:-translate-y-1 group">
                            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-5 group-hover:scale-110 transition-transform">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold mb-2">Moderación y Filtros Anti-Spam</h3>
                            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                Asigná moderadores de confianza, fijá mensajes importantes y expulsá cuentas sospechosas con un solo toque para mantener un ambiente profesional.
                            </p>
                        </div>
                    </div>
                </section>

                {/* ── 4. COMPARISON TABLE: FINIX VS OTRAS PLATAFORMAS ── */}
                <section className="py-16 sm:py-20 px-4 sm:px-6 bg-card/40 border-y border-border/50">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-2xl sm:text-3xl font-heading font-extrabold tracking-tight">
                                ¿Por qué los analistas prefieren Finix a WhatsApp o Telegram?
                            </h2>
                            <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                                Comparativa directa entre Finix Creator y las alternativas informales.
                            </p>
                        </div>

                        <div className="overflow-x-auto rounded-3xl border border-border/70 bg-card shadow-xl">
                            <table className="w-full text-left text-xs sm:text-sm border-collapse">
                                <thead>
                                    <tr className="border-b border-border/60 bg-muted/40">
                                        <th className="p-4 sm:p-5 font-bold text-muted-foreground">Característica</th>
                                        <th className="p-4 sm:p-5 font-extrabold text-amber-400 bg-amber-500/5 border-x border-border/40">
                                            Finix Creator
                                        </th>
                                        <th className="p-4 sm:p-5 font-medium text-muted-foreground">Telegram / Discord</th>
                                        <th className="p-4 sm:p-5 font-medium text-muted-foreground">Grupos de WhatsApp</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/40 font-medium">
                                    <tr>
                                        <td className="p-4 sm:p-5 text-foreground font-semibold">Cobro automático recurrente mensual</td>
                                        <td className="p-4 sm:p-5 bg-amber-500/5 border-x border-border/40 text-emerald-400 font-bold flex items-center gap-1.5">
                                            <Check className="w-4 h-4 text-emerald-400 stroke-[3]" /> Sí (Mercado Pago)
                                        </td>
                                        <td className="p-4 sm:p-5 text-muted-foreground">Manual por transferencia</td>
                                        <td className="p-4 sm:p-5 text-muted-foreground">Manual uno por uno</td>
                                    </tr>
                                    <tr>
                                        <td className="p-4 sm:p-5 text-foreground font-semibold">Expulsión automática si no abona</td>
                                        <td className="p-4 sm:p-5 bg-amber-500/5 border-x border-border/40 text-emerald-400 font-bold flex items-center gap-1.5">
                                            <Check className="w-4 h-4 text-emerald-400 stroke-[3]" /> 100% Automático
                                        </td>
                                        <td className="p-4 sm:p-5 text-muted-foreground">Tenés que hacerlo a mano</td>
                                        <td className="p-4 sm:p-5 text-muted-foreground">Tenés que hacerlo a mano</td>
                                    </tr>
                                    <tr>
                                        <td className="p-4 sm:p-5 text-foreground font-semibold">Cotizaciones bursátiles y gráficos integrados</td>
                                        <td className="p-4 sm:p-5 bg-amber-500/5 border-x border-border/40 text-emerald-400 font-bold flex items-center gap-1.5">
                                            <Check className="w-4 h-4 text-emerald-400 stroke-[3]" /> Sí, en vivo
                                        </td>
                                        <td className="p-4 sm:p-5 text-muted-foreground">No, requiere bots externos</td>
                                        <td className="p-4 sm:p-5 text-muted-foreground">Inexistente</td>
                                    </tr>
                                    <tr>
                                        <td className="p-4 sm:p-5 text-foreground font-semibold">Verificación de identidad oficial</td>
                                        <td className="p-4 sm:p-5 bg-amber-500/5 border-x border-border/40 text-emerald-400 font-bold flex items-center gap-1.5">
                                            <Check className="w-4 h-4 text-emerald-400 stroke-[3]" /> Insignia dorada
                                        </td>
                                        <td className="p-4 sm:p-5 text-muted-foreground">Cualquiera puede clonarte</td>
                                        <td className="p-4 sm:p-5 text-muted-foreground">Sin verificación</td>
                                    </tr>
                                    <tr>
                                        <td className="p-4 sm:p-5 text-foreground font-semibold">Acceso a todas las herramientas PRO</td>
                                        <td className="p-4 sm:p-5 bg-amber-500/5 border-x border-border/40 text-emerald-400 font-bold flex items-center gap-1.5">
                                            <Check className="w-4 h-4 text-emerald-400 stroke-[3]" /> Incluido 100%
                                        </td>
                                        <td className="p-4 sm:p-5 text-muted-foreground">No aplica</td>
                                        <td className="p-4 sm:p-5 text-muted-foreground">No aplica</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                {/* ── 5. PRICING & CHECKOUT CARD ── */}
                <section className="py-16 sm:py-24 px-4 sm:px-6 max-w-4xl mx-auto w-full">
                    <div className="relative rounded-3xl p-8 sm:p-12 border-2 border-amber-500/50 bg-gradient-to-b from-card via-card to-background shadow-[0_0_60px_hsl(45_95%_50%/0.15)] overflow-hidden">
                        {/* Corner Ribbon */}
                        <div className="absolute top-0 right-0">
                            <div className="bg-gradient-to-l from-amber-500 to-amber-400 text-black text-[11px] font-black uppercase tracking-widest px-8 py-1.5 rotate-45 translate-x-7 translate-y-4 shadow-md">
                                PLAN CREADOR
                            </div>
                        </div>

                        <div className="max-w-2xl">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30 mb-4">
                                <Crown className="w-3.5 h-3.5 fill-amber-400" /> Membresía Todo Incluido
                            </div>

                            <h3 className="text-2xl sm:text-4xl font-heading font-black tracking-tight mb-3">
                                Comenzá hoy como Finix Creator
                            </h3>
                            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-6">
                                Creá tu comunidad, atraé miembros y cobrá cuotas mensuales con el respaldo de una plataforma institucional.
                            </p>

                            <div className="flex items-baseline gap-2 mb-6">
                                <span className="text-4xl sm:text-5xl font-black text-foreground">
                                    ${creatorPrice.toLocaleString('es-AR')}
                                </span>
                                <span className="text-sm font-semibold text-muted-foreground">ARS / mes</span>
                                <span className="ml-2 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                                    Precio mensual
                                </span>
                            </div>

                            {/* Features list */}
                            <div className="grid sm:grid-cols-2 gap-3 mb-8">
                                <div className="flex items-center gap-2 text-xs sm:text-sm font-medium">
                                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                                    <span>Creación de comunidades públicas y privadas</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs sm:text-sm font-medium">
                                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                                    <span>Cobro mensual automático a suscriptores</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs sm:text-sm font-medium">
                                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                                    <span>Insignia de Creador Verificado</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs sm:text-sm font-medium">
                                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                                    <span>Todo lo de Finix PRO (Mercados, DCF, etc.)</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs sm:text-sm font-medium">
                                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                                    <span>Publicación de tesis con datos auditados</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs sm:text-sm font-medium">
                                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                                    <span>Cancelación en 1 clic desde Configuración</span>
                                </div>
                            </div>

                            {/* Primary Action Button */}
                            {isCreator ? (
                                <Link
                                    to="/comunidades/crear"
                                    className="w-full sm:w-auto h-14 px-8 rounded-2xl font-extrabold text-base flex items-center justify-center gap-3 bg-gradient-to-r from-amber-500 to-amber-400 text-black shadow-xl shadow-amber-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                >
                                    <Crown className="w-5 h-5 fill-black" />
                                    <span>Tu plan está activo: Crear Comunidad</span>
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            ) : (
                                <button
                                    onClick={handleCheckoutCreator}
                                    disabled={loadingCheckout}
                                    className="w-full sm:w-auto h-14 px-8 rounded-2xl font-extrabold text-base flex items-center justify-center gap-3 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-300 hover:from-amber-400 hover:to-amber-200 text-black shadow-xl shadow-amber-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
                                >
                                    {loadingCheckout ? (
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span>Conectando con Mercado Pago...</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <Crown className="w-5 h-5 fill-black" />
                                            <span>
                                                {user ? 'Suscribirme al Plan Creador' : 'Iniciar sesión para suscribirme'}
                                            </span>
                                            <ArrowRight className="w-4 h-4" />
                                        </div>
                                    )}
                                </button>
                            )}

                            <p className="text-[11px] text-muted-foreground mt-3 flex items-center gap-1.5">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                Antes de pagar elegís si querés un mes sin renovación o el cobro automático mensual.
                            </p>
                        </div>
                    </div>
                </section>

                {/* ── 6. FREQUENTLY ASKED QUESTIONS (FAQ) ── */}
                <section className="py-16 sm:py-20 px-4 sm:px-6 max-w-4xl mx-auto w-full">
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-muted text-muted-foreground mb-3">
                            <HelpCircle className="w-3.5 h-3.5" /> Dudas habituales
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-heading font-extrabold tracking-tight">
                            Preguntas Frecuentes
                        </h2>
                    </div>

                    <div className="space-y-3">
                        {faqs.map((faq, idx) => {
                            const isOpen = openFaq === idx;
                            return (
                                <div
                                    key={idx}
                                    className="rounded-2xl border border-border/60 bg-card overflow-hidden transition-colors"
                                >
                                    <button
                                        onClick={() => setOpenFaq(isOpen ? null : idx)}
                                        className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 font-bold text-sm sm:text-base hover:text-primary transition-colors"
                                    >
                                        <span>{faq.q}</span>
                                        <ChevronRight
                                            className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                                                isOpen ? 'rotate-90 text-primary' : 'text-muted-foreground'
                                            }`}
                                        />
                                    </button>
                                    <AnimatePresence>
                                        {isOpen && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="px-4 sm:px-5 pb-5 text-xs sm:text-sm text-muted-foreground leading-relaxed border-t border-border/30 pt-3"
                                            >
                                                {faq.a}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })}
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="border-t border-border/40 py-8 px-4 sm:px-6 text-center text-xs text-muted-foreground bg-muted/20">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <span className="font-heading font-bold text-foreground">FINIX</span>
                        <span>• Finanzas inteligentes para inversores modernos</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link to="/pro" className="hover:text-foreground transition-colors">Planes y Precios</Link>
                        <Link to="/comunidades" className="hover:text-foreground transition-colors">Comunidades</Link>
                        <Link to="/legal/terms" className="hover:text-foreground transition-colors">Términos</Link>
                        <Link to="/legal/privacy" className="hover:text-foreground transition-colors">Privacidad</Link>
                    </div>
                </div>
            </footer>
            <SubscriptionRenewalChoice
                open={renewalChoiceOpen}
                planName="Creador"
                monthlyPrice={creatorPrice.toLocaleString('es-AR')}
                busy={loadingCheckout}
                error={checkoutError}
                onClose={() => { setRenewalChoiceOpen(false); setCheckoutError(null); }}
                onConfirm={(autoRenew) => { void confirmCreatorCheckout(autoRenew); }}
            />
        </div>
    );
}
