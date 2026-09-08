import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, MessageSquare, Share2, TrendingUp, Verified, ArrowRight, Hash } from 'lucide-react';

const mockPosts = [
    {
        user: 'Carlos Ruiz', handle: '@carlosruiz', avatar: 'C', verified: true,
        time: '2m', community: 'Value Investing',
        content: 'AAPL rompió resistencia clave en $195. El volumen acompaña. ¿Qué piensan? 📈',
        asset: 'AAPL', change: '+2.4%', up: true, likes: 234, comments: 45
    },
    {
        user: 'Ana García', handle: '@anagarcia', avatar: 'A', verified: false,
        time: '8m', community: 'ETFs',
        content: 'Diversificación con ETFs: SPY vs QQQ. Resultados de mi backtest del último año 👇',
        asset: 'SPY', change: '+1.2%', up: true, likes: 156, comments: 28
    },
    {
        user: 'Luis Torres', handle: '@luistorres', avatar: 'L', verified: true,
        time: '15m', community: 'Macro',
        content: 'La FED mantuvo tasas. El mercado reacciona positivamente. Análisis completo 🧵',
        asset: 'DXY', change: '-0.3%', up: false, likes: 892, comments: 134
    },
];

const trending = ['#FED', '#AAPL', '#ETFs', '#BTC', '#Argentina'];

export default function CommunitySection() {
    return (
        <section id="comunidad" className="py-24 md:py-32 relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 pointer-events-none">
                <motion.div
                    className="absolute top-0 right-0 w-96 h-96 rounded-full"
                    style={{ background: 'radial-gradient(circle, hsl(152 80% 42% / 0.06) 0%, transparent 70%)' }}
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 10, repeat: Infinity }}
                />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid lg:grid-cols-2 gap-16 items-center">

                    {/* Left: Content */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/8 mb-6">
                            <span className="text-xs font-semibold text-primary uppercase tracking-wide">Sección 1 · Comunidad</span>
                        </div>
                        <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight mb-6">
                            Invertí{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">
                                acompañado.
                            </span>
                        </h2>
                        <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                            Finix conecta a inversores, creadores y comunidades en un mismo lugar. Compartí ideas, descubrí nuevas perspectivas y aprendé de personas que siguen los mismos mercados que vos.
                        </p>

                        {/* Trending topics */}
                        <div className="mb-8">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Trending ahora</p>
                            <div className="flex flex-wrap gap-2">
                                {trending.map(t => (
                                    <motion.span
                                        key={t}
                                        className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-secondary/60 border border-border/30 text-sm font-semibold text-foreground/80 hover:border-primary/40 hover:text-primary cursor-pointer transition-all"
                                        whileHover={{ scale: 1.05 }}
                                    >
                                        <Hash className="w-3 h-3" />
                                        {t.replace('#', '')}
                                    </motion.span>
                                ))}
                            </div>
                        </div>

                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Link
                                to="/"
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary/10 border border-primary/30 text-primary font-semibold hover:bg-primary hover:text-primary-foreground transition-all"
                            >
                                Explorar comunidades
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </motion.div>
                    </motion.div>

                    {/* Right: Feed preview */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                        className="relative"
                    >
                        {/* Feed header */}
                        <div className="bg-card/60 backdrop-blur-xl border border-border/40 rounded-2xl overflow-hidden shadow-elevated">
                            <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-primary" />
                                    <span className="text-sm font-semibold">Feed de inversores</span>
                                </div>
                                <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                    En vivo
                                </span>
                            </div>

                            <div className="p-4 space-y-3">
                                {mockPosts.map((post, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 16 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.45, delay: i * 0.12 }}
                                        whileHover={{ scale: 1.01, borderColor: 'hsl(152 80% 42% / 0.3)' }}
                                        className="p-4 rounded-xl bg-background/40 border border-border/20 cursor-pointer transition-all"
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/60 to-emerald-400/60 flex items-center justify-center text-sm font-bold text-black">
                                                    {post.avatar}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-sm font-semibold">{post.user}</span>
                                                        {post.verified && <Verified className="w-3.5 h-3.5 text-primary" />}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">{post.community} · {post.time}</p>
                                                </div>
                                            </div>
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${post.up ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                                                {post.asset} {post.change}
                                            </span>
                                        </div>
                                        <p className="text-sm text-foreground/80 leading-relaxed mb-3">{post.content}</p>
                                        <div className="flex items-center gap-5 text-muted-foreground">
                                            <button className="flex items-center gap-1.5 text-xs hover:text-red-400 transition-colors">
                                                <Heart className="w-3.5 h-3.5" /> {post.likes}
                                            </button>
                                            <button className="flex items-center gap-1.5 text-xs hover:text-primary transition-colors">
                                                <MessageSquare className="w-3.5 h-3.5" /> {post.comments}
                                            </button>
                                            <button className="flex items-center gap-1.5 text-xs hover:text-blue-400 transition-colors">
                                                <Share2 className="w-3.5 h-3.5" /> Compartir
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
