import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Minus, Zap, Crown, ArrowRight, Star } from 'lucide-react';

type BillingPeriod = 'monthly' | 'annual';

const plans = [
    {
        id: 'basic',
        name: 'Basic',
        priceMonthly: 0,
        priceAnnual: 0,
        desc: 'Para descubrir Finix y formar parte de la comunidad.',
        badge: null,
        badgeStyle: '',
        btnLabel: 'Empezar gratis',
        btnStyle: 'border border-border hover:border-primary/40 text-foreground hover:text-primary',
        features: [
            'Perfil de inversor',
            'Feed social',
            'Publicaciones y comentarios',
            'Likes y reacciones',
            'Seguir usuarios',
            'Unirse a comunidades',
            'Participar en comunidades',
            'Notificaciones sociales',
        ],
        icon: Star,
        gradient: 'from-secondary/60 to-secondary/30',
        highlighted: false,
    },
    {
        id: 'pro',
        name: 'Pro',
        priceMonthly: 9.99,
        priceAnnual: 7.99,
        desc: 'Para quienes quieren llevar su experiencia financiera al siguiente nivel.',
        badge: 'MÁS POPULAR',
        badgeStyle: 'bg-primary/15 text-primary border-primary/25',
        btnLabel: 'Probar Finix Pro',
        btnStyle: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow hover:shadow-intense',
        features: [
            'Todo de Basic',
            'Noticias financieras',
            'Mercados y cotizaciones',
            'Gráficos interactivos',
            'Watchlists personalizadas',
            'Alertas de precio',
            'Portfolio avanzado',
            'Métricas financieras',
            'Datos históricos',
            'Finix AI',
            'Herramientas de análisis',
        ],
        icon: Zap,
        gradient: 'from-primary/15 to-emerald-500/5',
        highlighted: true,
    },
    {
        id: 'creator',
        name: 'Creator',
        priceMonthly: 19.99,
        priceAnnual: 15.99,
        desc: 'Para quienes quieren crear y monetizar comunidades dentro de Finix.',
        badge: null,
        badgeStyle: '',
        btnLabel: 'Empezar como creador',
        btnStyle: 'bg-gradient-to-r from-amber-500 to-orange-400 text-black font-bold hover:shadow-[0_0_30px_hsl(38_90%_52%_/_0.4)]',
        features: [
            'Todo de Basic',
            'Crear comunidades',
            'Comunidades privadas y pagas',
            'Suscripciones de miembros',
            'Contenido exclusivo',
            'Posts exclusivos',
            'Gestión de miembros',
            'Moderadores',
            'Analytics detallado',
            'Dashboard de ingresos',
            'Gestión de suscriptores',
        ],
        icon: Crown,
        gradient: 'from-amber-500/12 to-orange-500/5',
        highlighted: false,
    },
];

const comparisonRows = [
    { feature: 'Perfil de inversor', basic: true, pro: true, creator: true },
    { feature: 'Feed social', basic: true, pro: true, creator: true },
    { feature: 'Comunidades (unirse)', basic: true, pro: true, creator: true },
    { feature: 'Noticias financieras', basic: false, pro: true, creator: true },
    { feature: 'Mercados y cotizaciones', basic: false, pro: true, creator: true },
    { feature: 'Watchlist y alertas', basic: false, pro: true, creator: true },
    { feature: 'Portfolio avanzado', basic: false, pro: true, creator: true },
    { feature: 'Finix AI', basic: false, pro: true, creator: true },
    { feature: 'Crear comunidades', basic: false, pro: false, creator: true },
    { feature: 'Comunidades pagas', basic: false, pro: false, creator: true },
    { feature: 'Dashboard de ingresos', basic: false, pro: false, creator: true },
];

export default function PricingSection() {
    const [billing, setBilling] = useState<BillingPeriod>('monthly');

    return (
        <section id="precios" className="py-24 md:py-32 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
                <motion.div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[700px] rounded-full"
                    style={{ background: 'radial-gradient(ellipse, hsl(152 80% 42% / 0.05) 0%, transparent 65%)' }}
                />
            </div>

            <div className="relative z-10 w-full max-w-[1920px] mx-auto px-6 sm:px-10 lg:px-16">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-12"
                >
                    <h2 className="text-5xl sm:text-6xl font-extrabold tracking-tight leading-tight mb-6">
                        Elegí cómo vivir{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">Finix.</span>
                    </h2>
                    <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-10">
                        Empezá gratis. Crece cuando estés listo.
                    </p>

                    {/* Billing toggle */}
                    <div className="inline-flex items-center gap-1 p-1 rounded-full bg-secondary/60 border border-border/40">
                        <button
                            onClick={() => setBilling('monthly')}
                            className={`px-6 py-2 rounded-full text-base font-semibold transition-all ${billing === 'monthly' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            Mensual
                        </button>
                        <button
                            onClick={() => setBilling('annual')}
                            className={`px-6 py-2 rounded-full text-base font-semibold transition-all flex items-center gap-2 ${billing === 'annual' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            Anual
                            <span className="text-xs font-bold px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400">−20%</span>
                        </button>
                    </div>
                </motion.div>

                {/* Pricing cards */}
                <div className="grid md:grid-cols-3 gap-6 mb-20">
                    {plans.map((plan, i) => {
                        const Icon = plan.icon;
                        const price = billing === 'monthly' ? plan.priceMonthly : plan.priceAnnual;
                        return (
                            <motion.div
                                key={plan.id}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: i * 0.12 }}
                                whileHover={{ y: -6 }}
                                className={`relative p-6 rounded-2xl border bg-gradient-to-br ${plan.gradient} backdrop-blur-sm transition-all duration-300 ${plan.highlighted ? 'border-primary/40 shadow-glow' : 'border-border/40 hover:border-primary/25'}`}
                            >
                                {/* Highlight ring */}
                                {plan.highlighted && (
                                    <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-primary/20 to-emerald-400/10 -z-10 blur-sm" />
                                )}

                                {/* Badge */}
                                {plan.badge && (
                                    <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-2xs font-extrabold border ${plan.badgeStyle}`}>
                                        {plan.badge}
                                    </div>
                                )}

                                {/* Icon & name */}
                                <div className="flex items-center gap-3 mb-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${plan.highlighted ? 'bg-primary/20 border border-primary/30' : 'bg-secondary/60 border border-border/30'}`}>
                                        <Icon className={`w-6 h-6 ${plan.highlighted ? 'text-primary' : 'text-foreground/60'}`} />
                                    </div>
                                    <div>
                                        <p className="font-extrabold text-xl text-foreground">{plan.name}</p>
                                        {plan.id === 'creator' && (
                                            <p className="text-sm text-amber-400 font-semibold">Finix Creator</p>
                                        )}
                                    </div>
                                </div>

                                {/* Price */}
                                <div className="mb-3">
                                    {price === 0 ? (
                                        <p className="text-4xl font-extrabold text-foreground">Gratis</p>
                                    ) : (
                                        <div className="flex items-end gap-1">
                                            <span className="text-sm font-semibold text-muted-foreground">USD</span>
                                            <span className="text-4xl font-extrabold text-foreground">{price.toFixed(2)}</span>
                                            <span className="text-sm text-muted-foreground mb-1">/ mes</span>
                                        </div>
                                    )}
                                    {billing === 'annual' && price > 0 && (
                                        <p className="text-xs text-emerald-400 font-semibold mt-1">Facturado anualmente · ahorrás 20%</p>
                                    )}
                                </div>

                                <p className="text-sm text-muted-foreground mb-6 leading-relaxed">{plan.desc}</p>

                                {/* CTA */}
                                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="mb-6">
                                    <Link
                                        to="/auth"
                                        className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl font-semibold text-base transition-all ${plan.btnStyle}`}
                                    >
                                        {plan.btnLabel}
                                        <ArrowRight className="w-5 h-5" />
                                    </Link>
                                </motion.div>

                                {/* Features */}
                                <ul className="space-y-2.5">
                                    {plan.features.map(f => (
                                        <li key={f} className="flex items-start gap-2 text-xs text-foreground/75">
                                            <Check className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                                            {f}
                                        </li>
                                    ))}
                                </ul>

                                {/* Creator commission note */}
                                {plan.id === 'creator' && (
                                    <p className="mt-4 text-2xs text-muted-foreground border-t border-border/30 pt-3 leading-relaxed">
                                        * Finix cobra una comisión sobre las suscripciones y compras realizadas dentro de la plataforma. El porcentaje es configurable y se informará antes de activar pagos reales.
                                    </p>
                                )}
                            </motion.div>
                        );
                    })}
                </div>

                {/* Comparison table */}
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="overflow-x-auto rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm"
                >
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border/30">
                                <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Funcionalidad</th>
                                {['Basic', 'Pro', 'Creator'].map(h => (
                                    <th key={h} className="px-6 py-4 text-sm font-bold text-center text-foreground">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {comparisonRows.map((row, i) => (
                                <motion.tr
                                    key={row.feature}
                                    initial={{ opacity: 0, x: -10 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.04 }}
                                    className="border-b border-border/15 last:border-0 hover:bg-primary/3 transition-colors"
                                >
                                    <td className="px-6 py-3 text-sm text-foreground/80">{row.feature}</td>
                                    {[row.basic, row.pro, row.creator].map((v, j) => (
                                        <td key={j} className="px-6 py-3 text-center">
                                            {v
                                                ? <Check className="w-4 h-4 text-primary mx-auto" />
                                                : <Minus className="w-4 h-4 text-muted-foreground/30 mx-auto" />
                                            }
                                        </td>
                                    ))}
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </motion.div>

                {/* Payment note */}
                <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="text-center text-xs text-muted-foreground mt-6"
                >
                    Los pagos con tarjeta serán habilitados próximamente vía Stripe y Mercado Pago. Actualmente podés registrarte y explorar la plataforma de forma gratuita.
                </motion.p>
            </div>
        </section>
    );
}
