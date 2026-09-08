import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Newspaper, BarChart3, Crown, ArrowRight } from 'lucide-react';

const pillars = [
    {
        icon: Users,
        title: 'Comunidad',
        desc: 'Conectate con inversores que piensan como vos. Seguí perfiles, compartí ideas y aprendé colectivamente.',
        gradient: 'from-primary/15 to-emerald-500/5',
        iconBg: 'bg-primary/15 border-primary/20',
        iconColor: 'text-primary',
        delay: 0,
    },
    {
        icon: Newspaper,
        title: 'Información',
        desc: 'Entendé qué está pasando en los mercados. Noticias curadas, análisis y contexto financiero en tiempo real.',
        gradient: 'from-blue-500/12 to-cyan-500/5',
        iconBg: 'bg-blue-500/15 border-blue-500/20',
        iconColor: 'text-blue-400',
        delay: 0.1,
    },
    {
        icon: BarChart3,
        title: 'Herramientas',
        desc: 'Analizá tus inversiones con gráficos, métricas y watchlists. Decisiones informadas con datos reales.',
        gradient: 'from-brand/12 to-blue-500/5',
        iconBg: 'bg-brand/15 border-brand/20',
        iconColor: 'text-brand',
        delay: 0.2,
    },
    {
        icon: Crown,
        title: 'Creadores',
        desc: 'Construí y monetizá tu comunidad. Compartí contenido exclusivo y generá ingresos con tu conocimiento.',
        gradient: 'from-amber-500/12 to-orange-500/5',
        iconBg: 'bg-amber-500/15 border-amber-500/20',
        iconColor: 'text-amber-400',
        delay: 0.3,
    },
];

export default function WhyFinixSection() {
    return (
        <section id="por-que-finix" className="py-24 md:py-32 relative overflow-hidden bg-secondary/10">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/15 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/15 to-transparent" />
            </div>

            <div className="w-full max-w-[1920px] mx-auto px-6 sm:px-10 lg:px-16 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight mb-6">
                        Todo lo que necesitás para vivir el mercado,{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">
                            en un solo lugar.
                        </span>
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Finix une cuatro pilares que normalmente están dispersos en docenas de plataformas.
                    </p>
                </motion.div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                    {pillars.map((p) => {
                        const Icon = p.icon;
                        return (
                            <motion.div
                                key={p.title}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: p.delay }}
                                whileHover={{ y: -8, scale: 1.02 }}
                                className={`group relative p-6 rounded-2xl border border-border/40 bg-gradient-to-br ${p.gradient} backdrop-blur-sm hover:border-primary/25 transition-all duration-300 text-center`}
                            >
                                <div className="absolute inset-0 rounded-2xl bg-primary/3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="relative">
                                    <motion.div
                                        className={`w-14 h-14 rounded-2xl ${p.iconBg} border flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform`}
                                        whileHover={{ rotate: 5 }}
                                        transition={{ type: 'spring', stiffness: 300 }}
                                    >
                                        <Icon className={`w-7 h-7 ${p.iconColor}`} />
                                    </motion.div>
                                    <h3 className="text-lg font-bold text-foreground mb-3 group-hover:text-primary transition-colors">{p.title}</h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Final CTA mini */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="text-center"
                >
                    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                        <Link
                            to="/auth"
                            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-primary/10 border border-primary/30 text-primary font-bold hover:bg-primary hover:text-primary-foreground transition-all hover:shadow-glow"
                        >
                            Empezar gratis
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
}
