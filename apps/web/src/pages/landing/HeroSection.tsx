import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import {
    ArrowRight, Users,
    MessageSquare, Heart, BarChart2, Bell
} from 'lucide-react';

// ---------- Floating mock UI cards ----------

const ChartLine = ({ up = true }: { up?: boolean }) => {
    const color = up ? '#22c55e' : '#ef4444';
    const pts = up
        ? '0,40 20,35 40,28 60,32 80,20 100,15 120,10 140,5'
        : '0,10 20,15 40,12 60,22 80,28 100,35 120,40 140,45';
    return (
        <svg viewBox="0 0 140 50" className="w-full h-8" preserveAspectRatio="none">
            <defs>
                <linearGradient id={`g${up}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <polygon points={`0,50 ${pts} 140,50`} fill={`url(#g${up})`} />
        </svg>
    );
};

const AssetCard = ({
    symbol, name, price, change, up, delay
}: { symbol: string; name: string; price: string; change: string; up: boolean; delay: number }) => (
    <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
        className="relative bg-card/80 backdrop-blur-xl border border-border/40 rounded-2xl p-4 shadow-elevated min-w-[170px]"
    >
        <div className="flex items-center justify-between mb-3">
            <div>
                <p className="text-xs font-bold text-foreground">{symbol}</p>
                <p className="text-xs text-muted-foreground">{name}</p>
            </div>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${up ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                {change}
            </span>
        </div>
        <p className="text-base font-extrabold text-foreground mb-2">{price}</p>
        <ChartLine up={up} />
    </motion.div>
);

const PostCard = ({ delay }: { delay: number }) => (
    <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
        className="bg-card/80 backdrop-blur-xl border border-border/40 rounded-2xl p-4 shadow-elevated max-w-[240px]"
    >
        <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center text-xs font-bold text-black">M</div>
            <div>
                <p className="text-xs font-semibold">María López</p>
                <p className="text-xs text-muted-foreground">Value Investing · 3m</p>
            </div>
        </div>
        <p className="text-xs text-foreground/80 leading-relaxed mb-3">
            AAPL rompió resistencia en $195. Buen momento para revisar el portfolio 📈
        </p>
        <div className="flex items-center gap-4 text-muted-foreground">
            <button className="flex items-center gap-1 text-xs hover:text-red-400 transition-colors"><Heart className="w-3 h-3" /> 234</button>
            <button className="flex items-center gap-1 text-xs hover:text-primary transition-colors"><MessageSquare className="w-3 h-3" /> 45</button>
        </div>
    </motion.div>
);

const MarketPulse = ({ delay }: { delay: number }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay }}
        className="bg-card/80 backdrop-blur-xl border border-border/40 rounded-2xl p-4 shadow-elevated"
    >
        <div className="flex items-center gap-2 mb-3">
            <BarChart2 className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold">Mercados ahora</span>
            <span className="ml-auto w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>
        {[
            { label: 'S&P 500', val: '+1.2%', up: true },
            { label: 'Nasdaq', val: '+0.8%', up: true },
            { label: 'BTC', val: '-0.4%', up: false },
        ].map(r => (
            <div key={r.label} className="flex items-center justify-between py-1.5 border-b border-border/20 last:border-0">
                <span className="text-xs text-muted-foreground">{r.label}</span>
                <span className={`text-xs font-bold ${r.up ? 'text-emerald-400' : 'text-red-400'}`}>{r.val}</span>
            </div>
        ))}
    </motion.div>
);

const NotifBubble = ({ delay }: { delay: number }) => (
    <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay }}
        className="bg-card/90 backdrop-blur-xl border border-primary/20 rounded-xl px-3 py-2 shadow-glow flex items-center gap-2"
    >
        <Bell className="w-3.5 h-3.5 text-primary" />
        <span className="text-xs font-medium">TSLA superó tu alerta de precio</span>
    </motion.div>
);

// ---------- Mouse parallax container ----------

export default function HeroSection() {
    const containerRef = useRef<HTMLDivElement>(null);
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const springX = useSpring(mouseX, { stiffness: 80, damping: 20 });
    const springY = useSpring(mouseY, { stiffness: 80, damping: 20 });
    const rotateX = useTransform(springY, [-300, 300], [4, -4]);
    const rotateY = useTransform(springX, [-300, 300], [-4, 4]);

    const handleMouseMove = (e: React.MouseEvent) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        mouseX.set(e.clientX - rect.left - rect.width / 2);
        mouseY.set(e.clientY - rect.top - rect.height / 2);
    };

    return (
        <section id="inicio" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
            {/* Background */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-background" />
                {/* Large glowing orbs */}
                <motion.div
                    className="absolute top-1/4 left-1/4 w-[700px] h-[700px] rounded-full pointer-events-none"
                    style={{ background: 'radial-gradient(circle, hsl(152 80% 42% / 0.12) 0%, transparent 65%)' }}
                    animate={{ scale: [1, 1.15, 1], x: [0, 40, 0], y: [0, -30, 0] }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] rounded-full pointer-events-none"
                    style={{ background: 'radial-gradient(circle, hsl(215 90% 65% / 0.1) 0%, transparent 65%)' }}
                    animate={{ scale: [1.1, 1, 1.1], x: [0, -30, 0], y: [0, 40, 0] }}
                    transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
                />
                {/* Grid pattern */}
                <div
                    className="absolute inset-0 opacity-[0.04]"
                    style={{
                        backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
                        backgroundSize: '60px 60px',
                    }}
                />
            </div>

            {/* Main content */}
            <div className="relative z-10 w-full max-w-[1920px] mx-auto px-6 sm:px-10 lg:px-16 py-24 sm:py-32">
                <div className="grid lg:grid-cols-2 gap-16 items-center">

                    {/* Left: Text */}
                    <div className="text-center lg:text-left">
                        {/* Badge */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/25 bg-primary/8 mb-8"
                        >
                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                            <span className="text-xs font-semibold text-primary">Plataforma fintech de nueva generación</span>
                        </motion.div>

                        {/* Headline */}
                        <motion.h1
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                            className="text-6xl sm:text-7xl lg:text-8xl 2xl:text-[7rem] font-extrabold tracking-tight leading-[1.05] mb-8"
                        >
                            El lugar donde los{' '}
                            <span className="relative inline-block">
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-emerald-400 to-primary">
                                    inversores
                                </span>
                                <motion.span
                                    className="absolute -inset-2 bg-primary/15 blur-2xl rounded-full -z-10"
                                    animate={{ opacity: [0.5, 0.9, 0.5] }}
                                    transition={{ duration: 3, repeat: Infinity }}
                                />
                            </span>{' '}
                            se encuentran.
                        </motion.h1>

                        {/* Subheadline */}
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.35 }}
                            className="text-xl sm:text-2xl 2xl:text-3xl text-muted-foreground leading-relaxed mb-12 max-w-2xl mx-auto lg:mx-0"
                        >
                            Descubrí mercados, conectate con inversores, participá en comunidades y llevá tus decisiones financieras a otro nivel.
                        </motion.p>

                        {/* CTAs */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.45 }}
                            className="flex flex-col sm:flex-row gap-4 mb-6 justify-center lg:justify-start"
                        >
                            <motion.div className="relative group" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-emerald-400 rounded-xl blur opacity-40 group-hover:opacity-70 transition-opacity" />
                                <Link
                                    to="/auth"
                                    className="relative flex items-center justify-center gap-3 px-10 py-5 rounded-2xl bg-primary text-primary-foreground font-bold text-lg 2xl:text-xl shadow-glow hover:shadow-intense transition-all"
                                >
                                    Crear cuenta gratis
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </motion.div>
                            <motion.a
                                href="#producto"
                                onClick={e => { e.preventDefault(); document.querySelector('#producto')?.scrollIntoView({ behavior: 'smooth' }); }}
                                className="flex items-center justify-center gap-3 px-10 py-5 rounded-2xl border border-border hover:border-primary/40 text-foreground/80 hover:text-foreground font-semibold text-lg 2xl:text-xl transition-all hover:bg-white/4 cursor-pointer"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                Explorar Finix
                            </motion.a>
                        </motion.div>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="text-xs text-muted-foreground text-center lg:text-left"
                        >
                            Gratis para empezar · Sin tarjeta de crédito
                        </motion.p>

                        {/* Social proof avatars */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.7 }}
                            className="flex items-center gap-3 mt-8 justify-center lg:justify-start"
                        >
                            <div className="flex -space-x-2">
                                {['A', 'B', 'C', 'D', 'E'].map((l, i) => (
                                    <div key={i} className="w-8 h-8 rounded-full border-2 border-background bg-gradient-to-br from-primary/60 to-emerald-400/60 flex items-center justify-center text-xs font-bold text-black">
                                        {l}
                                    </div>
                                ))}
                            </div>
                            <div>
                                <p className="text-base 2xl:text-xl font-semibold">+2.000 inversores</p>
                                <p className="text-sm 2xl:text-base text-muted-foreground">ya forman parte de Finix</p>
                            </div>
                        </motion.div>
                    </div>

                    {/* Right: Floating UI */}
                    <motion.div
                        ref={containerRef}
                        className="relative hidden lg:block"
                        style={{ perspective: 1200 }}
                        onMouseMove={handleMouseMove}
                        onMouseLeave={() => { mouseX.set(0); mouseY.set(0); }}
                    >
                        <motion.div
                            style={{ rotateX, rotateY }}
                            className="relative w-full h-[600px] 2xl:h-[750px] transform scale-110"
                        >
                            {/* Asset cards */}
                            <div className="absolute top-0 left-0 space-y-3">
                                <AssetCard symbol="AAPL" name="Apple Inc." price="$191.24" change="+2.4%" up={true} delay={0.6} />
                                <AssetCard symbol="BTC" name="Bitcoin" change="+5.7%" price="$67,450" up={true} delay={0.75} />
                                <AssetCard symbol="TSLA" name="Tesla Inc." price="$182.50" change="-1.8%" up={false} delay={0.9} />
                            </div>

                            {/* Post card */}
                            <div className="absolute top-4 right-0">
                                <PostCard delay={0.8} />
                            </div>

                            {/* Market pulse */}
                            <div className="absolute bottom-8 right-0 w-52">
                                <MarketPulse delay={1.0} />
                            </div>

                            {/* Notif bubble */}
                            <div className="absolute bottom-4 left-4">
                                <NotifBubble delay={1.15} />
                            </div>

                            {/* Community users bubble */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 1.25 }}
                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card/90 backdrop-blur-xl rounded-2xl px-4 py-3 border border-border/40 shadow-elevated flex items-center gap-3"
                            >
                                <Users className="w-5 h-5 text-primary" />
                                <div>
                                    <p className="text-sm font-bold">Value Investing</p>
                                    <p className="text-xs text-muted-foreground">3.2k miembros · activo ahora</p>
                                </div>
                                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            </motion.div>

                            {/* Floating particles */}
                            {[0, 1, 2, 3, 4].map(i => (
                                <motion.div
                                    key={i}
                                    className="absolute w-1 h-1 rounded-full bg-primary/40"
                                    style={{
                                        top: `${20 + i * 15}%`,
                                        left: `${15 + i * 18}%`,
                                    }}
                                    animate={{ y: [0, -12, 0], opacity: [0.4, 0.8, 0.4] }}
                                    transition={{ duration: 3 + i, repeat: Infinity, delay: i * 0.6 }}
                                />
                            ))}
                        </motion.div>
                    </motion.div>
                </div>

                {/* Scroll indicator */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.3 }}
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
                >
                    <motion.div
                        animate={{ y: [0, 8, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-6 h-10 rounded-full border-2 border-primary/30 flex items-start justify-center p-1.5"
                    >
                        <div className="w-1.5 h-3 rounded-full bg-primary" />
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
}
