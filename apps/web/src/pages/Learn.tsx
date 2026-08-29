import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    BookOpen,
    TrendingUp,
    BarChart2,
    Shield,
    Globe,
    Coins,
    ChevronRight,
    Sparkles,
} from 'lucide-react';

const categories = [
    {
        id: 'basics',
        icon: BookOpen,
        color: 'hsl(215 90% 65%)',
        bg: 'hsl(215 90% 65% / 0.1)',
        title: 'Fundamentos',
        description: 'Conceptos esenciales para comenzar a invertir con confianza.',
        lessons: 8,
        badge: 'Recomendado',
    },
    {
        id: 'analysis',
        icon: BarChart2,
        color: 'hsl(152 70% 42%)',
        bg: 'hsl(152 70% 42% / 0.1)',
        title: 'Análisis Técnico',
        description: 'Aprende a leer gráficas, patrones y señales del mercado.',
        lessons: 12,
        badge: null,
    },
    {
        id: 'stocks',
        icon: TrendingUp,
        color: 'hsl(38 90% 52%)',
        bg: 'hsl(38 90% 52% / 0.1)',
        title: 'Acciones & ETFs',
        description: 'Cómo seleccionar, valorar y gestionar posiciones en acciones.',
        lessons: 10,
        badge: null,
    },
    {
        id: 'crypto',
        icon: Coins,
        color: 'hsl(38 90% 52%)',
        bg: 'hsl(38 90% 52% / 0.1)',
        title: 'Criptomonedas',
        description: 'Blockchain, DeFi, tokenomics y cómo gestionar el riesgo cripto.',
        lessons: 9,
        badge: 'Nuevo',
    },
    {
        id: 'risk',
        icon: Shield,
        color: 'hsl(0 70% 58%)',
        bg: 'hsl(0 70% 58% / 0.1)',
        title: 'Gestión de Riesgo',
        description: 'Stop loss, position sizing y cómo preservar tu capital.',
        lessons: 7,
        badge: null,
    },
    {
        id: 'macro',
        icon: Globe,
        color: 'hsl(270 60% 62%)',
        bg: 'hsl(270 60% 62% / 0.1)',
        title: 'Macro & Economía',
        description: 'Tasas de interés, inflación y cómo el contexto macro mueve mercados.',
        lessons: 6,
        badge: null,
    },
];

const cardVariants = {
    hidden: { opacity: 0, y: 10 },
    show: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.06, duration: 0.28, ease: 'easeOut' },
    } as const),
};

export default function Learn() {
    return (
        <div className="page-enter max-w-4xl mx-auto px-4 py-6 w-full">
            {/* Hero */}
            <div className="rounded-[22px] overflow-hidden mb-8 relative p-6 md:p-10"
                style={{
                    background: 'var(--gradient-hero)',
                    border: '1px solid hsl(var(--border) / 0.5)',
                }}>
                <div className="absolute inset-0 pointer-events-none" style={{ background: 'var(--gradient-primary-glow)' }} />
                <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full border text-[11px] font-bold uppercase tracking-wider"
                        style={{ background: 'hsl(var(--primary) / 0.1)', borderColor: 'hsl(var(--primary) / 0.2)', color: 'hsl(var(--primary))' }}>
                        <Sparkles className="w-3 h-3" />
                        Educación financiera
                    </div>
                    <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-2">
                        Aprendé a invertir mejor
                    </h1>
                    <p className="text-[14px] leading-relaxed max-w-lg" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        Contenido curado para traders de todos los niveles. Desde fundamentos hasta estrategias avanzadas.
                    </p>
                    <div className="flex items-center gap-4 mt-5 text-[12px] font-semibold" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        <span>📚 52 lecciones</span>
                        <span>·</span>
                        <span>⏱ A tu ritmo</span>
                        <span>·</span>
                        <span>✅ Gratis</span>
                    </div>
                </div>
            </div>

            {/* Category grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((cat, i) => {
                    const Icon = cat.icon;
                    return (
                        <motion.div
                            key={cat.id}
                            custom={i}
                            variants={cardVariants}
                            initial="hidden"
                            animate="show"
                        >
                            <Link
                                to={`/learn/${cat.id}`}
                                className="block rounded-[18px] border border-border/40 bg-card/65 p-5 transition-all hover:border-border/80 hover:bg-card/90 hover:-translate-y-1 hover:shadow-card group"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div
                                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                                        style={{ background: cat.bg }}
                                    >
                                        <Icon className="w-5 h-5" style={{ color: cat.color }} />
                                    </div>
                                    {cat.badge && (
                                        <span
                                            className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border"
                                            style={{
                                                background: 'hsl(var(--primary) / 0.08)',
                                                borderColor: 'hsl(var(--primary) / 0.2)',
                                                color: 'hsl(var(--primary))',
                                            }}
                                        >
                                            {cat.badge}
                                        </span>
                                    )}
                                </div>
                                <h3 className="font-bold text-[14.5px] mb-1.5 group-hover:text-primary transition-colors">
                                    {cat.title}
                                </h3>
                                <p className="text-[12.5px] leading-relaxed mb-4" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                    {cat.description}
                                </p>
                                <div className="flex items-center justify-between">
                                    <span className="text-[11.5px] font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                        {cat.lessons} lecciones
                                    </span>
                                    <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" style={{ color: 'hsl(var(--muted-foreground))' }} />
                                </div>
                            </Link>
                        </motion.div>
                    );
                })}
            </div>

            {/* CTA */}
            <div className="mt-8 text-center py-8 rounded-[18px] border border-border/30"
                style={{ background: 'hsl(var(--card) / 0.3)' }}>
                <p className="text-[13px] font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    ¿Querés profundizar más? Explorá las publicaciones de la comunidad
                </p>
                <Link
                    to="/explore"
                    className="inline-flex items-center gap-2 mt-3 px-5 py-2.5 rounded-xl font-semibold text-[13px] transition-all hover:shadow-glow"
                    style={{
                        background: 'hsl(var(--primary))',
                        color: 'hsl(var(--primary-foreground))',
                    }}
                >
                    Explorar comunidad
                    <ChevronRight className="w-4 h-4" />
                </Link>
            </div>
        </div>
    );
}
