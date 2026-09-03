import { useEffect, useState, useCallback } from 'react';
import { Bitcoin, Globe, MapPin, TrendingUp, BarChart2, RefreshCw, Zap, Clock, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '@/lib/api';
import { cn } from '@/lib/utils';

interface NewsItem {
    id: number;
    title: string;
    summary: string;
    url: string;
    image?: string;
    source: string;
    sentiment?: string;
    publishedAt: string;
}

const SECTIONS = [
    { slug: 'cripto', label: 'Cripto', icon: Bitcoin, color: 'hsl(35 95% 55%)' },
    { slug: 'argentina', label: 'Argentina', icon: MapPin, color: 'hsl(215 95% 55%)' },
    { slug: 'global', label: 'Global', icon: Globe, color: 'hsl(190 95% 45%)' },
    { slug: 'economia', label: 'Economía', icon: TrendingUp, color: 'hsl(145 75% 45%)' },
    { slug: 'acciones', label: 'Acciones', icon: BarChart2, color: 'hsl(270 85% 60%)' },
] as const;

type SectionSlug = typeof SECTIONS[number]['slug'];

function formatRelativeTime(value?: string) {
    if (!value) return '';
    const date = new Date(value);
    if (isNaN(date.getTime())) return '';
    const diff = Math.floor((Date.now() - date.getTime()) / 60000);
    if (diff < 1) return 'Hace instantes';
    if (diff < 60) return `Hace ${diff}m`;
    const h = Math.floor(diff / 60);
    if (h < 24) return `Hace ${h}h`;
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
}

function sentimentDot(s?: string) {
    if (s === 'positive') return { bg: 'hsl(145 75% 45% / 0.15)', color: 'hsl(145 75% 45%)', label: 'Positivo', icon: '▲' };
    if (s === 'negative') return { bg: 'hsl(0 85% 55% / 0.15)', color: 'hsl(0 85% 60%)', label: 'Negativo', icon: '▼' };
    return null;
}

// ─── Cards ───────────────────────────────────────────────────────────────────

function HeroNewsCard({ item }: { item: NewsItem }) {
    const dot = sentimentDot(item.sentiment);
    return (
        <a
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="group relative flex flex-col rounded-[24px] overflow-hidden border min-h-[360px] lg:min-h-[460px] transition-all"
            style={{ borderColor: 'hsl(var(--border) / 0.3)', background: 'hsl(var(--card))' }}
        >
            <div className="absolute inset-0">
                {item.image ? (
                    <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                    />
                ) : (
                    <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, hsl(var(--primary)/0.2), hsl(var(--secondary)))' }} />
                )}
                {/* Gradient overlay to make text readable */}
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, hsl(0 0% 0% / 0.9) 0%, hsl(0 0% 0% / 0.4) 40%, transparent 100%)' }} />
            </div>

            <div className="relative flex flex-col flex-1 justify-end p-6 lg:p-10 text-white z-10 w-full lg:w-4/5 pt-32">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                    <span className="font-bold text-[11px] lg:text-xs uppercase tracking-widest px-3 py-1.5 rounded-full backdrop-blur-md"
                        style={{ background: 'hsl(var(--primary) / 0.8)', color: '#fff' }}>
                        {item.source}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs font-medium opacity-90">
                        <Clock className="w-3.5 h-3.5" />
                        {formatRelativeTime(item.publishedAt)}
                    </span>
                    {dot && (
                        <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full backdrop-blur-md border"
                            style={{ background: dot.bg, color: dot.color, borderColor: dot.color }}>
                            {dot.icon} {dot.label}
                        </span>
                    )}
                </div>

                <h2 className="text-2xl md:text-3xl lg:text-4xl font-black leading-[1.1] mb-4 group-hover:text-primary transition-colors text-white text-balance shadow-black/80 drop-shadow-sm">
                    {item.title}
                </h2>

                {item.summary && (
                    <p className="text-sm md:text-base leading-relaxed opacity-80 line-clamp-2 md:line-clamp-3 max-w-3xl font-medium text-white/90 shadow-black/80 drop-shadow-sm">
                        {item.summary}
                    </p>
                )}
            </div>
        </a>
    );
}

function GridNewsCard({ item }: { item: NewsItem }) {
    const dot = sentimentDot(item.sentiment);
    return (
        <a
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="group flex flex-col gap-3 rounded-[20px] border p-1 border-border/40 transition-all hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5"
            style={{ background: 'hsl(var(--card) / 0.4)', backdropFilter: 'blur(12px)' }}
        >
            {item.image && (
                <div className="w-full h-48 rounded-[16px] overflow-hidden relative shrink-0">
                    <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                    />
                    <div className="absolute top-3 left-3">
                        <span className="font-bold text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-lg backdrop-blur-md shadow-lg"
                            style={{ background: 'hsl(var(--card)/0.85)', color: 'hsl(var(--foreground))' }}>
                            {item.source}
                        </span>
                    </div>
                </div>
            )}
            <div className="flex-1 flex flex-col p-3 pt-1">
                <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="flex items-center gap-1.5 text-[11px] font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        <Clock className="w-3.5 h-3.5 opacity-70" />
                        {formatRelativeTime(item.publishedAt)}
                    </span>
                    {dot && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                            style={{ background: dot.bg, color: dot.color }}>
                            {dot.icon}
                        </span>
                    )}
                </div>
                <h3 className="text-[15px] font-bold leading-snug line-clamp-3 mb-2 group-hover:text-primary transition-colors text-balance">
                    {item.title}
                </h3>
            </div>
        </a>
    );
}

function ListNewsCard({ item }: { item: NewsItem }) {
    const dot = sentimentDot(item.sentiment);
    return (
        <a
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="group flex flex-col sm:flex-row gap-4 p-4 rounded-2xl border transition-all hover:border-primary/30"
            style={{ borderColor: 'hsl(var(--border) / 0.4)', background: 'transparent', boxShadow: 'inset 0 1px 0 0 hsl(100 100% 100% / 0.02)' }}
        >
            {item.image && (
                <div className="shrink-0 w-full sm:w-36 h-48 sm:h-28 rounded-[14px] overflow-hidden border border-border/20">
                    <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                        onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                    />
                </div>
            )}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-2 text-[11px]">
                    <span className="font-bold uppercase tracking-wider text-primary">
                        {item.source}
                    </span>
                    <span style={{ color: 'hsl(var(--muted-foreground)/0.5)' }}>•</span>
                    <span className="flex items-center gap-1 font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        <Clock className="w-3 h-3" />
                        {formatRelativeTime(item.publishedAt)}
                    </span>
                    {dot && (
                        <span className="ml-auto flex items-center gap-0.5 font-bold text-[10px] px-1.5 py-0.5 rounded"
                            style={{ background: dot.bg, color: dot.color }}>
                            {dot.icon} {dot.label}
                        </span>
                    )}
                </div>
                <h3 className="text-base font-bold leading-snug line-clamp-2 mb-1.5 group-hover:text-primary transition-colors text-balance">
                    {item.title}
                </h3>
                {item.summary && (
                    <p className="text-[13px] leading-relaxed line-clamp-2 max-w-4xl"
                        style={{ color: 'hsl(var(--muted-foreground))' }}>
                        {item.summary}
                    </p>
                )}
            </div>
            <div className="hidden sm:flex items-center justify-center pl-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-border/50 group-hover:border-primary group-hover:bg-primary/5 transition-all">
                    <ChevronRight className="w-4 h-4 group-hover:text-primary" style={{ color: 'hsl(var(--muted-foreground))' }} />
                </div>
            </div>
        </a>
    );
}

// ─── Main ────────────────────────────────────────────────────────────────────

export default function News() {
    const [activeSection, setActiveSection] = useState<SectionSlug>('cripto');
    const [newsMap, setNewsMap] = useState<Partial<Record<SectionSlug, NewsItem[]>>>({});
    const [loadingSet, setLoadingSet] = useState<Set<SectionSlug>>(new Set());

    const fetchSection = useCallback(async (slug: SectionSlug, force = false) => {
        if (!force && newsMap[slug] !== undefined) return;
        setLoadingSet(prev => new Set(prev).add(slug));
        try {
            const res = await apiFetch(`/news?category=${slug}&limit=30`);
            if (res.ok) {
                const data = await res.json();
                setNewsMap(prev => ({ ...prev, [slug]: Array.isArray(data) ? data : [] }));
            }
        } catch { } finally {
            setLoadingSet(prev => {
                const next = new Set(prev);
                next.delete(slug);
                return next;
            });
        }
    }, [newsMap]);

    useEffect(() => {
        fetchSection(activeSection);
    }, [activeSection]);

    const section = SECTIONS.find(s => s.slug === activeSection)!;
    const news = newsMap[activeSection];
    const isLoading = loadingSet.has(activeSection);

    // Derived content splits
    const heroNews = news?.[0];
    const gridNews = news?.slice(1, 4) || [];
    const restNews = news?.slice(4) || [];

    return (
        <div className="page-enter mx-auto w-full max-w-[1400px] p-4 md:p-6 lg:p-8 space-y-8 pb-32">
            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6"
                style={{ borderBottom: '1px solid hsl(var(--border) / 0.5)', paddingBottom: '24px' }}>
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border border-primary/20 shadow-lg shadow-primary/10"
                            style={{ background: 'linear-gradient(135deg, hsl(var(--primary)/0.2), hsl(var(--secondary)))' }}>
                            <Zap className="w-5 h-5 text-primary drop-shadow-sm" />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>
                            Central de <br className="md:hidden" />Noticias
                        </h1>
                    </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-3 lg:gap-4 overflow-x-auto scrollbar-hide">
                    {/* Navigation Pills */}
                    <div className="flex bg-secondary/30 p-1.5 rounded-[18px] border border-border/40 shrink-0">
                        {SECTIONS.map(s => {
                            const Icon = s.icon;
                            const active = activeSection === s.slug;
                            return (
                                <button
                                    key={s.slug}
                                    onClick={() => setActiveSection(s.slug)}
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all relative"
                                    style={{
                                        color: active ? s.color : 'hsl(var(--muted-foreground))',
                                    }}
                                >
                                    {active && (
                                        <motion.div
                                            layoutId="newsletterTab"
                                            className="absolute inset-0 rounded-xl"
                                            style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                                        />
                                    )}
                                    <Icon className="w-4 h-4 z-10" />
                                    <span className="z-10">{s.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    <button
                        onClick={() => fetchSection(activeSection, true)}
                        disabled={isLoading}
                        className="flex shrink-0 items-center justify-center w-12 h-12 rounded-[18px] transition-all bg-card border border-border/50 hover:bg-muted"
                        title="Actualizar"
                    >
                        <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} style={{ color: 'hsl(var(--muted-foreground))' }} />
                    </button>
                </div>
            </div>

            {/* ── Content Area ── */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeSection}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="flex flex-col gap-8"
                >
                    {/* ── Loading / Empty States ── */}
                    {isLoading || news === undefined ? (
                        <div className="space-y-6">
                            <div className="w-full h-[400px] rounded-[24px] bg-secondary/40 animate-pulse border border-border/30" />
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {[1, 2, 3].map(i => <div key={i} className="h-64 rounded-[20px] bg-secondary/40 animate-pulse border border-border/30" />)}
                            </div>
                        </div>
                    ) : news.length === 0 ? (
                        <div className="text-center py-24 space-y-4">
                            <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center border border-border"
                                style={{ background: 'hsl(var(--card))' }}>
                                <section.icon className="w-8 h-8 opacity-40" style={{ color: section.color }} />
                            </div>
                            <h2 className="text-xl font-bold">No hay titulares en este momento</h2>
                            <p className="text-sm max-w-sm mx-auto" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                Nuestro escáner se encuentra refrescando el panorama general para <b>{section.label}</b>.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* ── Top Level Grid ── */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                                {/* Featured Hero Image */}
                                {heroNews && (
                                    <div className="lg:col-span-8 h-full">
                                        <HeroNewsCard item={heroNews} />
                                    </div>
                                )}
                                {/* Secondary Cards (Top stories grid) */}
                                {gridNews.length > 0 && (
                                    <div className="lg:col-span-4 flex flex-col gap-6">
                                        {gridNews.map(item => (
                                            <GridNewsCard key={item.id} item={item} />
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* ── Remaining News List ── */}
                            {restNews.length > 0 && (
                                <div className="mt-8 pt-8 space-y-4" style={{ borderTop: '1px dashed hsl(var(--border))' }}>
                                    <h3 className="text-lg font-black tracking-tight mb-6">Más historias</h3>
                                    <div className="flex flex-col gap-3">
                                        {restNews.map(item => (
                                            <ListNewsCard key={item.id} item={item} />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
