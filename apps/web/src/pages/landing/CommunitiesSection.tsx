import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Users, Star } from 'lucide-react';

const communities = [
    {
        name: 'Value Investing',
        desc: 'Análisis fundamental y empresas con ventajas competitivas duraderas.',
        members: '3.2k',
        badge: 'TOP',
        badgeColor: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
        gradient: 'from-amber-500/10 to-orange-500/5',
        avatarBg: 'from-amber-500 to-orange-400',
        letter: 'V',
        category: 'Inversión',
    },
    {
        name: 'Tecnología',
        desc: 'Empresas tech, semiconductores, IA y el futuro de la industria.',
        members: '2.8k',
        badge: 'HOT',
        badgeColor: 'bg-red-500/15 text-red-400 border-red-500/20',
        gradient: 'from-blue-500/10 to-cyan-500/5',
        avatarBg: 'from-blue-500 to-cyan-400',
        letter: 'T',
        category: 'Tech',
    },
    {
        name: 'ETFs',
        desc: 'Inversión indexada, diversificación y estrategias pasivas de largo plazo.',
        members: '1.9k',
        badge: 'NUEVO',
        badgeColor: 'bg-primary/15 text-primary border-primary/20',
        gradient: 'from-primary/10 to-emerald-500/5',
        avatarBg: 'from-primary to-emerald-400',
        letter: 'E',
        category: 'Indexados',
    },
    {
        name: 'Mercado Argentino',
        desc: 'BYMA, cedears, bonos y economía local. El mercado de cerca.',
        members: '4.1k',
        badge: 'POPULAR',
        badgeColor: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
        gradient: 'from-sky-500/10 to-blue-500/5',
        avatarBg: 'from-sky-500 to-blue-400',
        letter: 'A',
        category: 'Argentina',
    },
    {
        name: 'Macro',
        desc: 'Política monetaria, inflación, tasas y su impacto en los mercados.',
        members: '1.5k',
        badge: '',
        badgeColor: '',
        gradient: 'from-purple-500/10 to-pink-500/5',
        avatarBg: 'from-purple-500 to-pink-400',
        letter: 'M',
        category: 'Economía',
    },
    {
        name: 'Trading',
        desc: 'Análisis técnico, patrones de precio y estrategias de corto plazo.',
        members: '2.3k',
        badge: '',
        badgeColor: '',
        gradient: 'from-orange-500/10 to-red-500/5',
        avatarBg: 'from-orange-500 to-red-400',
        letter: 'T',
        category: 'Trading',
    },
];

export default function CommunitiesSection() {
    return (
        <section id="comunidades" className="py-24 md:py-32 relative overflow-hidden bg-secondary/10">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/8 mb-6">
                        <Users className="w-3.5 h-3.5 text-primary" />
                        <span className="text-xs font-semibold text-primary uppercase tracking-wide">Sección 2 · Comunidades</span>
                    </div>
                    <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight mb-6">
                        Encontrá tu lugar en{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">Finix.</span>
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Comunidades creadas por y para inversores. Cada una con su cultura, temas y nivel de profundidad.
                    </p>
                </motion.div>

                {/* Communities grid */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
                    {communities.map((c, i) => (
                        <motion.div
                            key={c.name}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: i * 0.08 }}
                            whileHover={{ y: -6, scale: 1.01 }}
                            className={`relative group p-5 rounded-2xl border border-border/40 bg-gradient-to-br ${c.gradient} bg-card/50 backdrop-blur-sm hover:border-primary/30 transition-all duration-300 cursor-pointer overflow-hidden`}
                        >
                            {/* Hover glow */}
                            <div className="absolute inset-0 rounded-2xl bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="relative flex items-start gap-4">
                                <motion.div
                                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${c.avatarBg} flex items-center justify-center text-base font-extrabold text-white shadow-md flex-shrink-0`}
                                    whileHover={{ scale: 1.15, rotate: 5 }}
                                    transition={{ type: 'spring', stiffness: 350 }}
                                >
                                    {c.letter}
                                </motion.div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">{c.name}</h3>
                                        {c.badge && (
                                            <span className={`text-2xs font-bold px-2 py-0.5 rounded-full border ${c.badgeColor}`}>
                                                {c.badge}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed mb-3">{c.desc}</p>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <Users className="w-3 h-3" />
                                            <span>{c.members} miembros</span>
                                        </div>
                                        <span className="text-xs text-muted-foreground bg-secondary/60 border border-border/30 px-2 py-0.5 rounded-full">
                                            {c.category}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Stars */}
                            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Star className="w-4 h-4 text-primary/60" />
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center"
                >
                    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                        <Link
                            to="/"
                            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border border-border hover:border-primary/40 bg-card/50 text-foreground font-semibold hover:text-primary transition-all hover:shadow-glow"
                        >
                            Explorar todas las comunidades
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
}
