import { motion } from 'framer-motion';
import { Users, TrendingUp, Globe, BarChart3 } from 'lucide-react';

const pillars = [
    { icon: Users, label: 'Comunidad', value: '+2.000', desc: 'Inversores activos' },
    { icon: TrendingUp, label: 'Creadores', value: '+85', desc: 'Creadores de contenido' },
    { icon: Globe, label: 'Comunidades', value: '+40', desc: 'Comunidades de inversión' },
    { icon: BarChart3, label: 'Mercados', value: '500+', desc: 'Activos disponibles' },
];

export default function SocialProofSection() {
    return (
        <section id="producto" className="py-20 relative overflow-hidden border-y border-border/20">
            <div className="absolute inset-0 bg-gradient-to-r from-background via-secondary/30 to-background pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-14"
                >
                    <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-3">
                        Una nueva forma de vivir las finanzas.
                    </p>
                    <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                        Todo lo que necesitás, en un solo lugar.
                    </h2>
                </motion.div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    {pillars.map((p, i) => {
                        const Icon = p.icon;
                        return (
                            <motion.div
                                key={p.label}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: i * 0.1 }}
                                whileHover={{ y: -4, scale: 1.02 }}
                                className="relative group p-6 rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm hover:border-primary/30 hover:bg-card/80 transition-all duration-300 text-center"
                            >
                                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="relative">
                                    <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                        <Icon className="w-6 h-6 text-primary" />
                                    </div>
                                    <p className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400 mb-1">
                                        {p.value}
                                    </p>
                                    <p className="text-sm font-semibold text-foreground mb-0.5">{p.label}</p>
                                    <p className="text-xs text-muted-foreground">{p.desc}</p>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Ticker strip */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 }}
                    className="mt-12 flex flex-wrap justify-center gap-3"
                >
                    {['Value Investing', 'ETFs', 'Tecnología', 'Macro', 'Dividendos', 'Criptomonedas', 'Mercado Argentino', 'Trading'].map(tag => (
                        <span key={tag} className="px-4 py-1.5 rounded-full text-xs font-semibold bg-secondary/60 border border-border/30 text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors cursor-pointer">
                            {tag}
                        </span>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
