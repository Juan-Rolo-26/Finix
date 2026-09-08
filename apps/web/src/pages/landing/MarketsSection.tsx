import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    TrendingUp, TrendingDown, ArrowRight, Lock,
    Eye, BarChart2, Star, Zap
} from 'lucide-react';

const ChartMini = ({ up = true, points }: { up?: boolean; points: string }) => {
    const color = up ? '#22c55e' : '#ef4444';
    return (
        <svg viewBox="0 0 80 28" className="w-20 h-7" preserveAspectRatio="none">
            <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
};

const assets = [
    { symbol: 'AAPL', name: 'Apple Inc.', price: '$191.24', change: '+2.4%', vol: '$8.2B', cap: '$2.97T', up: true, pts: '0,20 15,16 30,12 45,14 60,8 75,4', locked: false },
    { symbol: 'TSLA', name: 'Tesla Inc.', price: '$182.50', change: '-1.8%', vol: '$3.1B', cap: '$580B', up: false, pts: '0,6 15,10 30,14 45,12 60,18 75,22', locked: false },
    { symbol: 'NVDA', name: 'Nvidia Corp.', price: '???', change: '??%', vol: '???', cap: '???', up: true, pts: '0,22 15,18 30,14 45,10 60,6 75,2', locked: true },
    { symbol: 'BTC', name: 'Bitcoin', price: '$67,450', change: '+5.7%', vol: '$24.1B', cap: '$1.32T', up: true, pts: '0,18 15,14 30,10 45,12 60,6 75,2', locked: false },
    { symbol: 'GLD', name: 'Gold ETF', price: '???', change: '??%', vol: '???', cap: '???', up: true, pts: '0,20 15,16 30,12 45,8 60,10 75,6', locked: true },
];

export default function MarketsSection() {
    return (
        <section id="mercados" className="py-24 md:py-32 relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute inset-0 pointer-events-none">
                <motion.div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full"
                    style={{ background: 'radial-gradient(ellipse, hsl(215 90% 65% / 0.06) 0%, transparent 70%)' }}
                />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid lg:grid-cols-2 gap-16 items-center">

                    {/* Left: Dashboard mockup */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="bg-card/70 backdrop-blur-xl border border-border/40 rounded-2xl overflow-hidden shadow-elevated">
                            {/* Header */}
                            <div className="flex items-center justify-between px-4 py-3 border-b border-border/30 bg-secondary/30">
                                <div className="flex items-center gap-2">
                                    <BarChart2 className="w-4 h-4 text-primary" />
                                    <span className="text-sm font-semibold">Mercados</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground">Watchlist</span>
                                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-brand/10 text-brand border border-brand/20 flex items-center gap-1">
                                        <Zap className="w-2.5 h-2.5" /> FINIX PRO
                                    </span>
                                </div>
                            </div>

                            {/* Column headers */}
                            <div className="grid grid-cols-5 gap-2 px-4 py-2 text-2xs font-semibold text-muted-foreground border-b border-border/20">
                                <span>Activo</span>
                                <span className="text-right">Precio</span>
                                <span className="text-right">Cambio</span>
                                <span className="text-right hidden sm:block">Gráfico</span>
                                <span className="text-right hidden sm:block">Vol.</span>
                            </div>

                            {/* Asset rows */}
                            {assets.map((a, i) => (
                                <motion.div
                                    key={a.symbol}
                                    initial={{ opacity: 0, x: -10 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1 }}
                                    className={`grid grid-cols-5 gap-2 px-4 py-3 border-b border-border/10 last:border-0 items-center transition-all ${a.locked ? 'opacity-50 cursor-not-allowed select-none' : 'hover:bg-primary/3 cursor-pointer'}`}
                                >
                                    <div className="flex items-center gap-2">
                                        <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${a.up ? 'from-primary/30 to-emerald-400/20' : 'from-red-500/30 to-rose-400/20'} flex items-center justify-center text-2xs font-extrabold`}>
                                            {a.symbol[0]}
                                        </div>
                                        <div className="hidden sm:block">
                                            <p className="text-xs font-bold">{a.symbol}</p>
                                            <p className="text-2xs text-muted-foreground truncate max-w-[60px]">{a.name}</p>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        {a.locked
                                            ? <span className="flex items-center justify-end gap-1 text-xs text-muted-foreground"><Lock className="w-3 h-3" /> Pro</span>
                                            : <span className="text-xs font-bold tabular-nums">{a.price}</span>
                                        }
                                    </div>

                                    <div className="text-right">
                                        {a.locked
                                            ? <span className="text-xs text-muted-foreground blur-sm select-none">+?.??%</span>
                                            : <span className={`text-xs font-bold flex items-center justify-end gap-0.5 ${a.up ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {a.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                                {a.change}
                                            </span>
                                        }
                                    </div>

                                    <div className="hidden sm:flex justify-end">
                                        {a.locked
                                            ? <div className="w-20 h-7 rounded bg-secondary/40 flex items-center justify-center"><Lock className="w-3 h-3 text-muted-foreground" /></div>
                                            : <ChartMini up={a.up} points={a.pts} />
                                        }
                                    </div>

                                    <div className="hidden sm:block text-right">
                                        {a.locked
                                            ? <span className="text-2xs text-muted-foreground blur-sm select-none">$?.?B</span>
                                            : <span className="text-2xs text-muted-foreground">{a.vol}</span>
                                        }
                                    </div>
                                </motion.div>
                            ))}

                            {/* Unlock CTA */}
                            <div className="p-4 bg-gradient-to-r from-brand/5 via-primary/5 to-brand/5 border-t border-brand/10">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Lock className="w-4 h-4 text-brand" />
                                        <span className="text-xs text-muted-foreground">Desbloquea datos completos con Finix Pro</span>
                                    </div>
                                    <span className="text-xs font-bold text-brand">↑ Upgrade</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Right: Text */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand/20 bg-brand/8 mb-6">
                            <Zap className="w-3.5 h-3.5 text-brand" />
                            <span className="text-xs font-semibold text-brand uppercase tracking-wide">FINIX PRO · Mercados</span>
                        </div>

                        <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight mb-6">
                            Los mercados,{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand to-primary">
                                entendidos
                            </span>{' '}
                            de otra manera.
                        </h2>

                        <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                            Accedé a información financiera, cotizaciones, gráficos y herramientas para analizar los mercados desde un solo lugar. Sin dispersión. Todo en Finix.
                        </p>

                        <div className="space-y-4 mb-10">
                            {[
                                { icon: BarChart2, label: 'Cotizaciones en tiempo real', desc: 'Precios actualizados de acciones, ETFs, cripto y más.' },
                                { icon: Eye, label: 'Watchlist personalizada', desc: 'Seguí los activos que te importan y recibí alertas.' },
                                { icon: Star, label: 'Métricas financieras avanzadas', desc: 'P/E, Market Cap, EPS, dividendos y mucho más.' },
                            ].map(item => {
                                const Icon = item.icon;
                                return (
                                    <motion.div
                                        key={item.label}
                                        className="flex items-start gap-3"
                                        initial={{ opacity: 0, x: 10 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: 0.2 }}
                                    >
                                        <div className="w-9 h-9 rounded-lg bg-brand/10 border border-brand/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <Icon className="w-4 h-4 text-brand" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-foreground">{item.label}</p>
                                            <p className="text-xs text-muted-foreground">{item.desc}</p>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>

                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Link
                                to="/"
                                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-brand to-primary text-white font-bold text-sm shadow-intense hover:shadow-[0_0_40px_hsl(215_90%_65%_/_0.35)] transition-all"
                            >
                                Conocer Finix Pro
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
