import { useEffect, useState, useCallback } from 'react';
import { Bitcoin, Globe, MapPin, TrendingUp, BarChart2, ExternalLink, RefreshCw } from 'lucide-react';
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
    { slug: 'cripto',    label: 'Cripto',    icon: Bitcoin,    color: '#f59e0b' },
    { slug: 'argentina', label: 'Argentina', icon: MapPin,     color: '#3b82f6' },
    { slug: 'global',    label: 'Global',    icon: Globe,      color: '#06b6d4' },
    { slug: 'economia',  label: 'Economía',  icon: TrendingUp, color: '#10b981' },
    { slug: 'acciones',  label: 'Acciones',  icon: BarChart2,  color: '#a855f7' },
] as const;

type SectionSlug = typeof SECTIONS[number]['slug'];

function formatRelativeTime(value?: string) {
    if (!value) return '';
    const date = new Date(value);
    if (isNaN(date.getTime())) return '';
    const diff = Math.floor((Date.now() - date.getTime()) / 60000);
    if (diff < 1) return 'Ahora';
    if (diff < 60) return `${diff}m`;
    const h = Math.floor(diff / 60);
    if (h < 24) return `${h}h`;
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
}

function sentimentDot(s?: string) {
    if (s === 'positive') return { bg: '#10b98118', color: '#10b981', label: '▲' };
    if (s === 'negative') return { bg: '#ef444418', color: '#ef4444', label: '▼' };
    return null;
}

function NewsCard({ item }: { item: NewsItem }) {
    const dot = sentimentDot(item.sentiment);
    return (
        <a
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="group flex gap-3 rounded-2xl border p-3 transition-all hover:border-primary/30"
            style={{ borderColor: 'hsl(var(--border) / 0.5)', background: 'hsl(var(--card) / 0.3)' }}
        >
            {item.image && (
                <div className="shrink-0 w-20 h-20 rounded-xl overflow-hidden"
                    style={{ background: 'hsl(var(--secondary))' }}>
                    <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                    />
                </div>
            )}
            <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center gap-2 text-[11px]"
                    style={{ color: 'hsl(var(--muted-foreground))' }}>
                    <span className="font-semibold uppercase tracking-wide truncate max-w-[120px]">
                        {item.source}
                    </span>
                    <span>·</span>
                    <span className="shrink-0">{formatRelativeTime(item.publishedAt)}</span>
                    {dot && (
                        <span
                            className="ml-auto shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                            style={{ background: dot.bg, color: dot.color }}
                        >
                            {dot.label}
                        </span>
                    )}
                </div>
                <h3 className="text-sm font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                    {item.title}
                </h3>
                {item.summary && (
                    <p className="text-xs leading-relaxed line-clamp-2"
                        style={{ color: 'hsl(var(--muted-foreground))' }}>
                        {item.summary}
                    </p>
                )}
            </div>
            <ExternalLink
                className="shrink-0 w-3.5 h-3.5 mt-0.5 opacity-0 group-hover:opacity-60 transition-opacity"
                style={{ color: 'hsl(var(--primary))' }}
            />
        </a>
    );
}

function SkeletonCard() {
    return (
        <div className="flex gap-3 rounded-2xl p-3 animate-pulse"
            style={{ background: 'hsl(var(--secondary))' }}>
            <div className="w-20 h-20 rounded-xl shrink-0"
                style={{ background: 'hsl(var(--border))' }} />
            <div className="flex-1 space-y-2 pt-1">
                <div className="h-2.5 rounded w-1/3"
                    style={{ background: 'hsl(var(--border))' }} />
                <div className="h-3.5 rounded w-5/6"
                    style={{ background: 'hsl(var(--border))' }} />
                <div className="h-3 rounded w-2/3"
                    style={{ background: 'hsl(var(--border))' }} />
            </div>
        </div>
    );
}

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

    return (
        <div className="mx-auto max-w-3xl px-4 py-6 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black tracking-tight">Noticias</h1>
                    <p className="text-sm mt-0.5"
                        style={{ color: 'hsl(var(--muted-foreground))' }}>
                        Actualizadas automáticamente desde los principales diarios
                    </p>
                </div>
                <button
                    onClick={() => fetchSection(activeSection, true)}
                    disabled={isLoading}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
                    style={{
                        background: 'hsl(var(--secondary))',
                        color: 'hsl(var(--muted-foreground))',
                        border: '1px solid hsl(var(--border))',
                    }}
                >
                    <RefreshCw className={cn('w-3.5 h-3.5', isLoading && 'animate-spin')} />
                    Actualizar
                </button>
            </div>

            {/* Section tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {SECTIONS.map(s => {
                    const Icon = s.icon;
                    const active = activeSection === s.slug;
                    return (
                        <button
                            key={s.slug}
                            onClick={() => setActiveSection(s.slug)}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all shrink-0"
                            style={{
                                background: active ? `${s.color}18` : 'hsl(var(--secondary))',
                                border: `1.5px solid ${active ? s.color + '66' : 'hsl(var(--border))'}`,
                                color: active ? s.color : 'hsl(var(--muted-foreground))',
                            }}
                        >
                            <Icon className="w-4 h-4" />
                            {s.label}
                        </button>
                    );
                })}
            </div>

            {/* News list */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeSection}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                >
                    {isLoading || news === undefined ? (
                        <div className="space-y-2.5">
                            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
                        </div>
                    ) : news.length === 0 ? (
                        <div className="text-center py-16 space-y-3">
                            <section.icon
                                className="w-12 h-12 mx-auto opacity-20"
                                style={{ color: section.color }}
                            />
                            <p className="font-semibold"
                                style={{ color: 'hsl(var(--muted-foreground))' }}>
                                No hay noticias de {section.label} aún
                            </p>
                            <p className="text-sm"
                                style={{ color: 'hsl(var(--muted-foreground) / 0.6)' }}>
                                Las noticias se actualizan automáticamente cada 10 minutos
                            </p>
                            <button
                                onClick={() => fetchSection(activeSection, true)}
                                className="text-sm font-semibold px-4 py-2 rounded-xl mt-2"
                                style={{
                                    background: `${section.color}18`,
                                    color: section.color,
                                    border: `1px solid ${section.color}44`,
                                }}
                            >
                                Buscar noticias ahora
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-2.5">
                            <p className="text-xs px-1"
                                style={{ color: 'hsl(var(--muted-foreground) / 0.6)' }}>
                                {news.length} artículos · {section.label}
                            </p>
                            {news.map(item => (
                                <NewsCard key={item.id} item={item} />
                            ))}
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
