import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export default function FinalCTASection() {
    return (
        <section className="py-32 relative overflow-hidden">
            {/* Animated background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-background" />

                {/* Large orbs */}
                <motion.div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[700px] rounded-full"
                    style={{ background: 'radial-gradient(ellipse, hsl(152 80% 42% / 0.12) 0%, hsl(215 90% 65% / 0.06) 40%, transparent 70%)' }}
                    animate={{ scale: [1, 1.1, 1], rotate: [0, 5, 0] }}
                    transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full"
                    style={{ background: 'radial-gradient(circle, hsl(215 90% 65% / 0.1) 0%, transparent 70%)' }}
                    animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
                    transition={{ duration: 10, repeat: Infinity }}
                />
                <motion.div
                    className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full"
                    style={{ background: 'radial-gradient(circle, hsl(152 80% 42% / 0.12) 0%, transparent 70%)' }}
                    animate={{ x: [0, -30, 0], y: [0, 20, 0] }}
                    transition={{ duration: 12, repeat: Infinity }}
                />

                {/* Floating financial lines */}
                <svg className="absolute inset-0 w-full h-full opacity-[0.04]" preserveAspectRatio="none">
                    <motion.line
                        x1="0" y1="40%" x2="100%" y2="60%"
                        stroke="hsl(152 80% 42%)" strokeWidth="1"
                        animate={{ y1: ['38%', '42%', '38%'], y2: ['58%', '62%', '58%'] }}
                        transition={{ duration: 8, repeat: Infinity }}
                    />
                    <motion.line
                        x1="0" y1="55%" x2="100%" y2="45%"
                        stroke="hsl(215 90% 65%)" strokeWidth="1"
                        animate={{ y1: ['53%', '57%', '53%'], y2: ['43%', '47%', '43%'] }}
                        transition={{ duration: 10, repeat: Infinity }}
                    />
                </svg>

                {/* Grid */}
                <div
                    className="absolute inset-0 opacity-[0.025]"
                    style={{
                        backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
                        backgroundSize: '80px 80px',
                    }}
                />
            </div>

            <div className="w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 relative z-10 text-center">
                {/* Small label */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/8 mb-8"
                >
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-xs font-semibold text-primary">Únete hoy · Es gratis</span>
                </motion.div>

                {/* Headline */}
                <motion.h2
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                    className="text-6xl sm:text-7xl lg:text-8xl font-extrabold tracking-tight leading-[1.05] mb-10"
                >
                    El mercado nunca se detiene.{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-emerald-400 to-brand">
                        Vos tampoco.
                    </span>
                </motion.h2>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="text-2xl 2xl:text-3xl text-muted-foreground leading-relaxed mb-16 max-w-4xl mx-auto"
                >
                    Entrá a Finix y empezá a construir tu propia experiencia financiera. Comunidad, mercados, herramientas y más.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8"
                >
                    <motion.div className="relative group" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary to-emerald-400 rounded-2xl blur-lg opacity-50 group-hover:opacity-80 transition-opacity" />
                        <Link
                            to="/auth"
                            className="relative flex items-center justify-center gap-3 px-12 py-5 rounded-2xl bg-primary text-primary-foreground font-bold text-xl shadow-glow hover:shadow-intense transition-all"
                        >
                            Crear cuenta gratis
                            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </motion.div>

                    <motion.a
                        href="#precios"
                        onClick={e => { e.preventDefault(); document.querySelector('#precios')?.scrollIntoView({ behavior: 'smooth' }); }}
                        className="flex items-center gap-3 px-10 py-5 rounded-2xl border border-border hover:border-primary/40 text-muted-foreground hover:text-foreground font-semibold text-xl transition-all cursor-pointer"
                        whileHover={{ scale: 1.02 }}
                    >
                        Ver planes
                    </motion.a>
                </motion.div>

                <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 }}
                    className="text-sm text-muted-foreground"
                >
                    Gratis para empezar · Sin tarjeta de crédito · Cancelá cuando quieras
                </motion.p>
            </div>
        </section>
    );
}
