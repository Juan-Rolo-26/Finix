import { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, X, Sparkles, Zap, Shield, ChevronLeft, Loader2, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { apiFetch } from '@/lib/api';

export default function Pricing() {
    const navigate = useNavigate();
    const user = useAuthStore(s => s.user);
    const syncFromSession = useAuthStore(s => s.syncFromSession);
    const [searchParams] = useSearchParams();
    const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
    const [paymentStatus, setPaymentStatus] = useState<string | null>(searchParams.get('status'));

    useEffect(() => {
        const status = searchParams.get('status');
        if (status === 'approved') {
            setPaymentStatus('approved');
            syncFromSession().catch(() => {});
        } else if (status === 'failure') {
            setPaymentStatus('failure');
        } else if (status === 'pending') {
            setPaymentStatus('pending');
        }
    }, [searchParams, syncFromSession]);

    const handleUpgrade = async (planType: 'PRO' | 'Creador') => {
        if (!user) {
            navigate(`/auth?redirect=${encodeURIComponent('/pricing')}&plan=${planType}`);
            return;
        }
        
        setLoadingPlan(planType);
        
        const endpoint = planType === 'PRO' 
            ? '/mercadopago/checkout/pro' 
            : '/mercadopago/checkout/creator';

        try {
            const res = await apiFetch(endpoint, { method: 'POST' });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Error al conectar con Mercado Pago');
            }
            const data = await res.json();
            const checkoutUrl = data.init_point || data.sandbox_init_point || data.url;
            if (checkoutUrl) {
                window.location.href = checkoutUrl;
            } else {
                throw new Error('No se recibió la URL de checkout de Mercado Pago');
            }
        } catch (error: any) {
            alert(error.message || 'Ocurrió un error inesperado al conectar con Mercado Pago.');
            setLoadingPlan(null);
        }
    };
    const [prices, setPrices] = useState({ pro: 8500, creator: 29900 });

    useEffect(() => {
        apiFetch('/mercadopago/config')
            .then(res => res.json())
            .then(data => {
                if (data.proPriceArs || data.creatorPriceArs) {
                    setPrices({
                        pro: data.proPriceArs || 8500,
                        creator: data.creatorPriceArs || 29900,
                    });
                }
            })
            .catch(() => {});
    }, []);

    const plans = [
        {
            name: 'Free',
            price: '$0',
            description: 'Para empezar a descubrir el mundo de las finanzas.',
            features: [
                'Perfil público y feed social',
                'Seguir a otros inversores',
                'Unite a comunidades gratuitas',
                'Ver portafolios públicos',
            ],
            missingFeatures: [
                'Cotizaciones en tiempo real',
                'Análisis técnico avanzado',
                'Noticias del mercado sin límites',
                'Creación de comunidades',
            ],
            buttonText: !user ? 'Crear cuenta gratis' : 'Tu plan actual',
            buttonVariant: 'outline' as const,
            highlight: false,
        },
        {
            name: 'PRO',
            price: `$${prices.pro.toLocaleString('es-AR')}`,
            period: ' ARS/mes',
            description: 'Para inversores que quieren maximizar sus retornos.',
            features: [
                'Todo lo del plan Free',
                'Portafolios múltiples avanzados',
                'Cotizaciones en tiempo real (Mercados)',
                'Alertas y señales exclusivas por Gmail',
                'Noticias financieras sin límites',
                'Filtros y análisis técnico avanzado',
                'Cobro mensual automático al mismo precio fijo',
                'Cancelación en 1 clic desde Configuración > Suscripción',
                'Soporte prioritario',
            ],
            missingFeatures: [
                'Creación de comunidades propias',
                'Monetización de contenido',
            ],
            buttonText: 'Mejorar a PRO',
            buttonVariant: 'default' as const,
            highlight: true,
            icon: Sparkles,
        },
        {
            name: 'Creador',
            price: `$${prices.creator.toLocaleString('es-AR')}`,
            period: ' ARS/mes',
            description: 'Para líderes de opinión y analistas profesionales.',
            features: [
                'Todo lo del plan PRO',
                'Creación de comunidades propias',
                'Herramientas de moderación',
                'Monetización de contenido y análisis',
                'Insignia de Creador Verificado',
                'Métricas detalladas de audiencia',
                'Cobro mensual automático al mismo precio fijo',
                'Cancelación en 1 clic desde Configuración > Suscripción',
            ],
            missingFeatures: [],
            buttonText: 'Empezar como Creador',
            buttonVariant: 'secondary' as const,
            highlight: false,
            icon: Zap,
        },
    ];

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0 pointer-events-none z-0">
                <div
                    className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full opacity-30"
                    style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.4) 0%, transparent 70%)', filter: 'blur(80px)' }}
                />
                <div
                    className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full opacity-20"
                    style={{ background: 'radial-gradient(circle, hsl(160 80% 50% / 0.4) 0%, transparent 70%)', filter: 'blur(80px)' }}
                />
            </div>

            <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-12 flex-1 flex flex-col">
                <nav className="mb-12">
                    <Link to="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Volver
                    </Link>
                </nav>

                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h1 className="text-4xl md:text-6xl font-heading font-extrabold tracking-tight mb-6">
                        Desbloqueá todo tu <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">potencial financiero</span>
                    </h1>
                    <p className="text-lg text-muted-foreground">
                        Elegí el plan que mejor se adapte a tu nivel de inversión. Empezá gratis y mejorá cuando estés listo para el siguiente nivel.
                    </p>
                </div>

                {paymentStatus === 'approved' && (
                    <div className="max-w-2xl mx-auto mb-8 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-emerald-400 animate-in fade-in">
                        <CheckCircle2 className="w-5 h-5 shrink-0" />
                        <div>
                            <h4 className="font-bold text-sm">¡Pago procesado con éxito en Mercado Pago!</h4>
                            <p className="text-xs text-emerald-400/80 mt-0.5">Tu membresía ha sido activada. Ya tenés acceso a todas las funciones premium de Finix.</p>
                        </div>
                    </div>
                )}
                {paymentStatus === 'failure' && (
                    <div className="max-w-2xl mx-auto mb-8 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-red-400 animate-in fade-in">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <div>
                            <h4 className="font-bold text-sm">El pago no pudo completarse</h4>
                            <p className="text-xs text-red-400/80 mt-0.5">La operación fue rechazada o cancelada en Mercado Pago. Podés intentar nuevamente.</p>
                        </div>
                    </div>
                )}
                {paymentStatus === 'pending' && (
                    <div className="max-w-2xl mx-auto mb-8 p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 flex items-center gap-3 text-yellow-400 animate-in fade-in">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <div>
                            <h4 className="font-bold text-sm">Pago pendiente de acreditación</h4>
                            <p className="text-xs text-yellow-400/80 mt-0.5">Mercado Pago está procesando tu pago. Tu suscripción se activará automáticamente al acreditarse.</p>
                        </div>
                    </div>
                )}

                <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto w-full items-stretch">
                    {plans.map((plan, idx) => {
                        const Icon = plan.icon;
                        return (
                            <motion.div
                                key={plan.name}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1, duration: 0.5 }}
                                className={`relative rounded-3xl p-8 flex flex-col ${
                                    plan.highlight 
                                    ? 'bg-card border-2 border-primary shadow-[0_0_40px_hsl(var(--primary)/0.2)] scale-105 z-10' 
                                    : 'bg-card/50 border border-border/50 backdrop-blur-sm'
                                }`}
                            >
                                {plan.highlight && (
                                    <div className="absolute -top-4 inset-x-0 flex justify-center">
                                        <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1.5">
                                            <Shield className="w-3.5 h-3.5" />
                                            Recomendado
                                        </span>
                                    </div>
                                )}

                                <div className="mb-6">
                                    <div className="flex items-center gap-2 mb-2">
                                        {Icon && <Icon className="w-5 h-5 text-primary" />}
                                        <h3 className="text-xl font-bold">{plan.name}</h3>
                                    </div>
                                    <p className="text-sm text-muted-foreground min-h-[40px]">{plan.description}</p>
                                </div>

                                <div className="mb-6">
                                    <div className="flex items-end gap-1">
                                        <span className="text-4xl font-extrabold">{plan.price}</span>
                                        {plan.period && <span className="text-muted-foreground font-medium mb-1">{plan.period}</span>}
                                    </div>
                                    {plan.name !== 'Free' && (
                                        <p className="text-[11px] font-semibold text-emerald-400 mt-1 flex items-center gap-1">
                                            <Sparkles className="w-3 h-3 shrink-0" /> Cobro mensual automático a precio fijo
                                        </p>
                                    )}
                                </div>

                                <button 
                                    disabled={Boolean(user && plan.name === 'Free') || loadingPlan === plan.name}
                                    onClick={() => {
                                        if (plan.name === 'Free') {
                                            if (!user) {
                                                navigate('/auth?mode=register');
                                            }
                                        } else {
                                            handleUpgrade(plan.name as 'PRO' | 'Creador');
                                        }
                                    }}
                                    style={
                                        plan.name === 'PRO'
                                            ? { background: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #0d9488 100%)', color: '#ffffff' }
                                            : plan.name === 'Creador'
                                                ? { background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#ffffff' }
                                                : { color: 'hsl(var(--foreground))' }
                                    }
                                    className={`w-full h-14 px-6 rounded-2xl font-extrabold text-[15px] sm:text-base mb-8 flex items-center justify-center gap-2.5 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                                        plan.name === 'PRO'
                                            ? 'shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.01] active:scale-[0.99] border border-emerald-400/40'
                                            : plan.name === 'Creador'
                                                ? 'border-2 border-emerald-500/50 hover:border-emerald-400 shadow-xl shadow-slate-950/30 hover:scale-[1.01] active:scale-[0.99]'
                                                : 'border-2 border-border/90 bg-card hover:bg-muted text-foreground shadow-sm hover:border-primary/50 hover:shadow-md active:scale-[0.99]'
                                    }`}
                                >
                                    {loadingPlan === plan.name ? (
                                        <div className="flex items-center justify-center gap-2" style={{ color: '#ffffff' }}>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span className="font-bold">Conectando...</span>
                                        </div>
                                    ) : (!user && plan.name !== 'Free') ? (
                                        <div className="flex items-center justify-center gap-2" style={{ color: '#ffffff' }}>
                                            <span className="font-extrabold" style={{ color: '#ffffff' }}>Iniciar sesión para comprar</span>
                                            <ArrowRight className="w-4 h-4 stroke-[2.5]" style={{ color: '#ffffff' }} />
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center gap-2" style={{ color: plan.name === 'Free' ? 'inherit' : '#ffffff' }}>
                                            <span className="font-extrabold" style={{ color: plan.name === 'Free' ? 'inherit' : '#ffffff' }}>{plan.buttonText}</span>
                                            <ArrowRight className="w-4 h-4 stroke-[2.5]" style={{ color: plan.name === 'Free' ? 'inherit' : '#ffffff' }} />
                                        </div>
                                    )}
                                </button>

                                <div className="space-y-4 flex-1">
                                    {plan.features.map(feature => (
                                        <div key={feature} className="flex items-start gap-3">
                                            <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                                                <Check className="w-3 h-3 text-primary" />
                                            </div>
                                            <span className="text-sm font-medium">{feature}</span>
                                        </div>
                                    ))}
                                    
                                    {plan.missingFeatures.map(feature => (
                                        <div key={feature} className="flex items-start gap-3 opacity-50">
                                            <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                                                <X className="w-3 h-3 text-muted-foreground" />
                                            </div>
                                            <span className="text-sm text-muted-foreground line-through">{feature}</span>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Transparency and Recurring Billing Banner */}
                <div className="max-w-4xl mx-auto mt-12 w-full p-6 rounded-3xl border border-border/50 bg-card/40 backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-primary">
                            <Shield className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                                Cobro mensual recurrente automático con precio protegido
                            </h4>
                            <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
                                Tu cuota mensual se cobra automáticamente cada mes conservando el mismo precio convenido sin aumentos sorpresivos. Podés dar de baja tu plan PRO o Creador en cualquier momento con un solo clic desde <strong>Configuración &gt; Suscripción</strong>.
                            </p>
                        </div>
                    </div>
                    {user && (
                        <Link to="/settings" className="shrink-0 w-full md:w-auto">
                            <button className="w-full md:w-auto px-4 py-2.5 rounded-xl border border-border hover:bg-muted text-xs font-semibold transition-colors">
                                Gestionar en Configuración
                            </button>
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}
