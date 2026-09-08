import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Users, TrendingUp, DollarSign, BarChart3, FileText, Crown } from 'lucide-react';

const stats = [
    { icon: Users, label: 'Miembros', value: '2,340', change: '+12%', up: true },
    { icon: Users, label: 'Nuevos (mes)', value: '184', change: '+8%', up: true },
    { icon: DollarSign, label: 'Ingresos / mes', value: '$1.840', change: '+15%', up: true },
    { icon: FileText, label: 'Posts publicados', value: '156', change: '+22%', up: true },
    { icon: TrendingUp, label: 'Engagement', value: '68%', change: '+4%', up: true },
    { icon: BarChart3, label: 'Suscripciones activas', value: '184', change: '+18%', up: true },
];

export default function CreatorsSection() {
    return (
        <section id="creadores" className="py-24 md:py-32 relative overflow-hidden bg-secondary/10">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
                <motion.div
                    className="absolute -top-40 right-0 w-[600px] h-[600px] rounded-full"
                    style={{ background: 'radial-gradient(circle, hsl(152 80% 42% / 0.07) 0%, transparent 65%)' }}
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 12, repeat: Infinity }}
                />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid lg:grid-cols-2 gap-16 items-center">

                    {/* Left: Text */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-500/25 bg-amber-500/8 mb-6">
                            <Crown className="w-3.5 h-3.5 text-amber-400" />
                            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wide">Finix Creator</span>
                        </div>

                        <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight mb-6">
                            Tu comunidad.{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">
                                Tu conocimiento.
                            </span>{' '}
                            Tu negocio.
                        </h2>

                        <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                            Creá una comunidad alrededor de lo que sabés, compartí contenido exclusivo y construí una audiencia dentro de Finix. Monetizá tu experiencia financiera.
                        </p>

                        {/* Revenue simulator */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                            className="p-6 rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/8 to-orange-500/5 mb-8 relative overflow-hidden"
                        >
                            <div className="absolute top-3 right-3 text-2xs text-amber-400/60 font-semibold">Ejemplo ilustrativo</div>
                            <div className="flex flex-col gap-2 text-center">
                                <div className="flex items-center justify-center gap-3">
                                    <div className="text-center">
                                        <p className="text-2xl font-extrabold text-foreground">100</p>
                                        <p className="text-xs text-muted-foreground">miembros</p>
                                    </div>
                                    <span className="text-2xl text-muted-foreground font-light">×</span>
                                    <div className="text-center">
                                        <p className="text-2xl font-extrabold text-foreground">USD 10</p>
                                        <p className="text-xs text-muted-foreground">por mes</p>
                                    </div>
                                </div>
                                <div className="h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
                                <div className="text-center">
                                    <p className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">
                                        USD 1.000/mes
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">antes de comisión de plataforma</p>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Link
                                to="/"
                                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-400 text-black font-bold text-sm shadow-[0_0_30px_hsl(38_90%_52%_/_0.3)] hover:shadow-[0_0_40px_hsl(38_90%_52%_/_0.5)] transition-all"
                            >
                                Convertite en creador
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </motion.div>
                    </motion.div>

                    {/* Right: Creator dashboard */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="bg-card/70 backdrop-blur-xl border border-border/40 rounded-2xl overflow-hidden shadow-elevated">
                            {/* Header */}
                            <div className="flex items-center justify-between px-4 py-3 border-b border-border/30 bg-gradient-to-r from-amber-500/5 to-orange-500/5">
                                <div className="flex items-center gap-2">
                                    <Crown className="w-4 h-4 text-amber-400" />
                                    <span className="text-sm font-semibold">Dashboard Creator</span>
                                </div>
                                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/25 text-amber-400">
                                    Mi comunidad · Value Pro
                                </span>
                            </div>

                            {/* Stats grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4">
                                {stats.map((s, i) => {
                                    const Icon = s.icon;
                                    return (
                                        <motion.div
                                            key={s.label}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            whileInView={{ opacity: 1, scale: 1 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: i * 0.08 }}
                                            className="p-3 rounded-xl bg-secondary/40 border border-border/20 hover:border-amber-500/20 transition-colors"
                                        >
                                            <div className="flex items-center gap-1.5 mb-2">
                                                <Icon className="w-3.5 h-3.5 text-amber-400" />
                                                <span className="text-2xs font-semibold text-muted-foreground">{s.label}</span>
                                            </div>
                                            <p className="text-lg font-extrabold text-foreground">{s.value}</p>
                                            <span className="text-2xs font-bold text-emerald-400">{s.change} este mes</span>
                                        </motion.div>
                                    );
                                })}
                            </div>

                            {/* Revenue bar */}
                            <div className="px-4 pb-4">
                                <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/8 border border-amber-500/15">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-semibold text-muted-foreground">Progreso mensual</span>
                                        <span className="text-xs font-bold text-amber-400">$1.840 / $2.000</span>
                                    </div>
                                    <div className="w-full h-2 bg-black/20 rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full"
                                            initial={{ width: 0 }}
                                            whileInView={{ width: '92%' }}
                                            viewport={{ once: true }}
                                            transition={{ duration: 1.2, delay: 0.3 }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
