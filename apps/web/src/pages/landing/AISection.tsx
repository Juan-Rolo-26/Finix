import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Bot, Send, Sparkles, AlertCircle } from 'lucide-react';

const demoConversations = [
    {
        q: '¿Qué pasó hoy con NVIDIA?',
        a: 'NVIDIA cerró con una suba del +4.2%, impulsada por resultados trimestrales que superaron las expectativas. Sus ingresos por IA alcanzaron $18.4B (+265% interanual). El mercado reaccionó positivamente.',
    },
    {
        q: 'Analizá mi portfolio.',
        a: 'Tu portfolio muestra una concentración del 65% en tecnología (AAPL, MSFT, NVDA). Diversificación moderada. Rendimiento YTD: +18.3%. Considerá exposición a sectores defensivos para reducir volatilidad.',
    },
    {
        q: '¿Qué sectores están creciendo?',
        a: 'En el último mes los sectores con mayor rendimiento son: Inteligencia Artificial (+12%), Energía (+8.4%), Ciberseguridad (+7.1%) y Salud (+4.8%). El sector financiero se mantiene neutral.',
    },
];

export default function AISection() {
    const [activeIdx, setActiveIdx] = useState(0);
    const [displayedA, setDisplayedA] = useState('');
    const [typing, setTyping] = useState(false);

    useEffect(() => {
        setDisplayedA('');
        setTyping(true);
        const answer = demoConversations[activeIdx].a;
        let i = 0;
        const interval = setInterval(() => {
            if (i <= answer.length) {
                setDisplayedA(answer.slice(0, i));
                i++;
            } else {
                clearInterval(interval);
                setTyping(false);
            }
        }, 18);
        return () => clearInterval(interval);
    }, [activeIdx]);

    return (
        <section id="finix-ai" className="py-24 md:py-32 relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 pointer-events-none">
                <motion.div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] rounded-full"
                    style={{ background: 'radial-gradient(ellipse, hsl(152 80% 42% / 0.05) 0%, hsl(215 90% 65% / 0.04) 40%, transparent 70%)' }}
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 10, repeat: Infinity }}
                />
                <div className="absolute inset-0 opacity-[0.025]" style={{
                    backgroundImage: `linear-gradient(hsl(215 90% 65%) 1px, transparent 1px), linear-gradient(90deg, hsl(215 90% 65%) 1px, transparent 1px)`,
                    backgroundSize: '40px 40px',
                }} />
            </div>

            <div className="w-full max-w-[1920px] mx-auto px-6 sm:px-10 lg:px-16 relative z-10">
                <div className="grid lg:grid-cols-2 gap-16 items-center">

                    {/* Left: Text */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/20 bg-gradient-to-r from-primary/10 to-brand/10 mb-6">
                            <Sparkles className="w-3.5 h-3.5 text-primary" />
                            <span className="text-xs font-semibold text-primary uppercase tracking-wide">FINIX AI · Beta</span>
                        </div>

                        <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight mb-6">
                            Tu próxima pregunta{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-emerald-400 to-brand">
                                financiera
                            </span>{' '}
                            empieza acá.
                        </h2>

                        <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                            Finix AI analiza el mercado, responde tus preguntas y te ayuda a entender qué está pasando. Información y análisis al instante, sin tecnicismos.
                        </p>

                        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/8 border border-amber-500/20 mb-8">
                            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                <span className="font-semibold text-amber-400">Nota importante:</span> Finix AI proporciona información y análisis de mercado. No constituye asesoramiento financiero personalizado. Consultá siempre a un profesional calificado antes de tomar decisiones de inversión.
                            </p>
                        </div>

                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Link
                                to="/auth"
                                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-primary to-brand text-white font-bold text-sm shadow-intense hover:shadow-[0_0_40px_hsl(152_80%_42%_/_0.35)] transition-all"
                            >
                                Probá Finix AI
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </motion.div>
                    </motion.div>

                    {/* Right: Chat UI */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="bg-card/70 backdrop-blur-xl border border-border/40 rounded-2xl overflow-hidden shadow-elevated">
                            {/* Chat header */}
                            <div className="flex items-center gap-3 px-4 py-3 border-b border-border/30 bg-gradient-to-r from-primary/5 to-brand/5">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center shadow-glow">
                                    <Bot className="w-4 h-4 text-black" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold">Finix AI</p>
                                    <p className="text-2xs text-muted-foreground flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                                        Activo · Beta
                                    </p>
                                </div>
                                <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20">
                                    <Sparkles className="w-3 h-3 text-primary" />
                                    <span className="text-2xs font-bold text-primary">FINIX PRO</span>
                                </div>
                            </div>

                            {/* Quick questions */}
                            <div className="px-4 pt-4 pb-2">
                                <p className="text-2xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Preguntas de ejemplo</p>
                                <div className="flex flex-wrap gap-2">
                                    {demoConversations.map((c, i) => (
                                        <motion.button
                                            key={i}
                                            onClick={() => setActiveIdx(i)}
                                            className={`text-2xs px-3 py-1.5 rounded-full border transition-all font-medium truncate max-w-[160px] ${activeIdx === i ? 'bg-primary/15 border-primary/30 text-primary' : 'bg-secondary/40 border-border/30 text-muted-foreground hover:border-primary/20 hover:text-foreground'}`}
                                            whileHover={{ scale: 1.03 }}
                                            whileTap={{ scale: 0.97 }}
                                        >
                                            {c.q}
                                        </motion.button>
                                    ))}
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="p-4 space-y-3 min-h-[220px]">
                                {/* User message */}
                                <motion.div
                                    key={`q-${activeIdx}`}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex justify-end"
                                >
                                    <div className="bg-primary/15 border border-primary/20 rounded-2xl rounded-br-sm px-4 py-2.5 max-w-[75%]">
                                        <p className="text-sm text-foreground">{demoConversations[activeIdx].q}</p>
                                    </div>
                                </motion.div>

                                {/* AI response */}
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={`a-${activeIdx}`}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        className="flex items-start gap-2"
                                    >
                                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary/20 to-brand/20 border border-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <Bot className="w-3.5 h-3.5 text-primary" />
                                        </div>
                                        <div className="bg-secondary/50 border border-border/30 rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[80%]">
                                            <p className="text-sm text-foreground/90 leading-relaxed">
                                                {displayedA}
                                                {typing && <span className="inline-block w-0.5 h-4 bg-primary ml-0.5 animate-pulse" />}
                                            </p>
                                        </div>
                                    </motion.div>
                                </AnimatePresence>
                            </div>

                            {/* Input */}
                            <div className="px-4 pb-4">
                                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary/40 border border-border/30">
                                    <input
                                        className="flex-1 text-sm bg-transparent outline-none text-muted-foreground placeholder:text-muted-foreground/60"
                                        placeholder="Preguntá sobre mercados, activos, estrategias..."
                                        readOnly
                                    />
                                    <motion.button
                                        className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center flex-shrink-0"
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                    >
                                        <Send className="w-3.5 h-3.5 text-primary-foreground" />
                                    </motion.button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
