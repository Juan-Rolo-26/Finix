import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Newspaper, Clock } from 'lucide-react';

const news = [
    {
        cat: 'Mercados', catColor: 'bg-primary/15 text-primary border-primary/20',
        title: 'La Fed mantiene las tasas: el mercado reacciona con optimismo',
        source: 'Reuters', time: 'Hace 2h',
        img: 'M',
    },
    {
        cat: 'Empresas', catColor: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
        title: 'Apple alcanza nuevo récord histórico tras resultados trimestrales',
        source: 'Bloomberg', time: 'Hace 4h',
        img: 'E',
    },
    {
        cat: 'Tecnología', catColor: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
        title: 'Nvidia supera expectativas: ingresos de IA baten todos los records',
        source: 'CNBC', time: 'Hace 5h',
        img: 'T',
    },
    {
        cat: 'Argentina', catColor: 'bg-sky-500/15 text-sky-400 border-sky-500/20',
        title: 'El MERVAL sube 3% impulsado por cedears de tecnología',
        source: 'Infobae', time: 'Hace 6h',
        img: 'A',
    },
    {
        cat: 'Economía', catColor: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
        title: 'Inflación de EE.UU. cede al 2.9%, la más baja en tres años',
        source: 'WSJ', time: 'Hace 8h',
        img: 'Ec',
    },
    {
        cat: 'Cripto', catColor: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
        title: 'Bitcoin consolida por encima de $65k: análisis semanal',
        source: 'CoinDesk', time: 'Hace 10h',
        img: 'C',
    },
];

export default function NewsSection() {
    return (
        <section id="noticias" className="py-24 md:py-32 relative overflow-hidden bg-secondary/10">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/15 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/15 to-transparent" />
            </div>

            <div className="w-full max-w-[1920px] mx-auto px-6 sm:px-10 lg:px-16 relative z-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/8 mb-6">
                        <Newspaper className="w-3.5 h-3.5 text-primary" />
                        <span className="text-xs font-semibold text-primary uppercase tracking-wide">Sección 4 · Noticias</span>
                    </div>
                    <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight mb-6">
                        Todo lo que mueve el{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">mercado.</span>
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Las noticias financieras más importantes, organizadas por categoría. Nada que se te escape.
                    </p>
                </motion.div>

                {/* News grid */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
                    {news.map((n, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.45, delay: i * 0.08 }}
                            whileHover={{ y: -5, scale: 1.01 }}
                            className="group relative p-5 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm hover:border-primary/25 transition-all duration-300 cursor-pointer overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/4 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />

                            <div className="relative">
                                {/* Image placeholder */}
                                <div className="w-full h-28 rounded-xl bg-gradient-to-br from-secondary to-secondary/40 border border-border/20 flex items-center justify-center mb-4 overflow-hidden">
                                    <span className="text-4xl font-extrabold text-muted-foreground/20">{n.img}</span>
                                </div>

                                <div className="flex items-center justify-between mb-3">
                                    <span className={`text-2xs font-bold px-2 py-0.5 rounded-full border ${n.catColor}`}>
                                        {n.cat}
                                    </span>
                                    <div className="flex items-center gap-1 text-2xs text-muted-foreground">
                                        <Clock className="w-3 h-3" />
                                        {n.time}
                                    </div>
                                </div>

                                <h3 className="text-sm font-bold text-foreground leading-snug mb-3 group-hover:text-primary transition-colors line-clamp-2">
                                    {n.title}
                                </h3>

                                <div className="flex items-center justify-between">
                                    <span className="text-2xs font-semibold text-muted-foreground">{n.source}</span>
                                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* CTA */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="text-center"
                >
                    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                        <Link
                            to="/auth"
                            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border border-border hover:border-primary/40 bg-card/50 text-foreground font-semibold hover:text-primary transition-all"
                        >
                            Ver todas las noticias
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
}
