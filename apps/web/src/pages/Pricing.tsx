import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, X, Sparkles, Zap, Shield, ChevronLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';
import { apiFetch } from '@/lib/api';

export default function Pricing() {
    const user = useAuthStore(s => s.user);
    const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

    const handleUpgrade = async (planType: 'PRO' | 'Creador') => {
        if (!user) {
            alert('Debes iniciar sesión para mejorar tu plan.');
            return;
        }
        
        setLoadingPlan(planType);
        
        const endpoint = planType === 'PRO' 
            ? '/stripe/subscriptions/pro/checkout' 
            : '/stripe/subscriptions/creator/checkout';

        try {
            const res = await apiFetch(endpoint, { method: 'POST' });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Error al conectar con la pasarela de pago');
            }
            const { url } = await res.json();
            if (url) {
                window.location.href = url;
            }
        } catch (error: any) {
            alert(error.message || 'Ocurrió un error inesperado.');
            setLoadingPlan(null);
        }
    };
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
            buttonText: 'Tu plan actual',
            buttonVariant: 'outline' as const,
            highlight: false,
        },
        {
            name: 'PRO',
            price: '$5.00',
            period: '/mes',
            description: 'Para inversores que quieren maximizar sus retornos.',
            features: [
                'Todo lo del plan Free',
                'Portafolios múltiples avanzados',
                'Cotizaciones en tiempo real (Mercados)',
                'Noticias financieras sin límites',
                'Filtros y análisis técnico avanzado',
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
            price: '$24.99',
            period: '/mes',
            description: 'Para líderes de opinión y analistas profesionales.',
            features: [
                'Todo lo del plan PRO',
                'Creación de comunidades propias',
                'Herramientas de moderación',
                'Monetización de contenido y análisis',
                'Insignia de Creador Verificado',
                'Métricas detalladas de audiencia',
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

                                <div className="mb-8">
                                    <div className="flex items-end gap-1">
                                        <span className="text-4xl font-extrabold">{plan.price}</span>
                                        {plan.period && <span className="text-muted-foreground font-medium mb-1">{plan.period}</span>}
                                    </div>
                                </div>

                                <Button 
                                    variant={plan.buttonVariant} 
                                    size="lg" 
                                    className={`w-full mb-8 font-bold ${plan.highlight ? 'shadow-glow' : ''}`}
                                    disabled={plan.name === 'Free' || loadingPlan === plan.name}
                                    onClick={() => {
                                        if (plan.name !== 'Free') {
                                            handleUpgrade(plan.name as 'PRO' | 'Creador');
                                        }
                                    }}
                                >
                                    {loadingPlan === plan.name ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Conectando...
                                        </>
                                    ) : plan.buttonText}
                                </Button>

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
            </div>
        </div>
    );
}
