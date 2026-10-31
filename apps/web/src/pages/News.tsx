import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    RefreshCw,
    Newspaper,
    GraduationCap,
    ExternalLink,
    Clock,
    Search,
    Radio,
    Sparkles,
    ArrowUpRight,
    Flame,
} from 'lucide-react';
import { isProUser, useAuthStore } from '@/stores/authStore';
import { apiFetch } from '@/lib/api';
import type { NewsSlotData } from '@/components/news/NewsCard';
import { formatRelativeTime } from '@/components/news/NewsCard';
import { resolveNewsImage, handleNewsImageError } from '@/lib/newsImage';
import { ProGate } from '@/components/ProGate';
import { InvestorQuote } from '@/components/common/InvestorQuote';
import { NewsMarketTicker } from '@/components/news/NewsMarketTicker';
import { isEducationEnabled } from '@/lib/featureFlags';
import { cn } from '@/lib/utils';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface NewsCategory {
    id: string;
    name: string;
    slug: string;
    color?: string;
    icon?: string;
    image?: string;
    displayOrder: number;
}

interface CategoryData {
    category: { id: string; name: string; slug: string; color?: string; icon?: string };
    slots: NewsSlotData[];
}

export default function NewsPage() {
    const navigate = useNavigate();
    const user = useAuthStore((s) => s.user);

    const [categories, setCategories] = useState<NewsCategory[]>([]);
    const [selectedSlug, setSelectedSlug] = useState<string>('');
    const [categoryData, setCategoryData] = useState<CategoryData | null>(null);
    const [categoriesLoading, setCategoriesLoading] = useState(true);
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
    const activeRequest = useRef<AbortController | null>(null);

    const isPro = isProUser(user);

    // Load categories from API
    useEffect(() => {
        if (!isPro) {
            setCategoriesLoading(false);
            return;
        }
        const request = new AbortController();
        setCategoriesLoading(true);
        apiFetch('/news/slots/categories', { signal: request.signal, cache: 'no-store' })
            .then((r) => {
                if (!r.ok) throw new Error('Error al cargar categorías');
                return r.json();
            })
            .then((data) => {
                if (request.signal.aborted) return;
                const cats: NewsCategory[] = Array.isArray(data) ? data : [];
                setCategories(cats);
                if (cats.length > 0) setSelectedSlug(cats[0].slug);
            })
            .catch(() => {
                if (!request.signal.aborted) setError('No se pudieron cargar las categorías');
            })
            .finally(() => {
                if (!request.signal.aborted) setCategoriesLoading(false);
            });
        return () => request.abort();
    }, [isPro]);

    // Load slots for selected category
    const loadSlots = useCallback(async (slug: string, background = false) => {
        if (background && activeRequest.current) return;
        activeRequest.current?.abort();
        const request = new AbortController();
        activeRequest.current = request;
        setSlotsLoading(true);
        setError(null);
        try {
            const res = await apiFetch(`/news/slots/category/${encodeURIComponent(slug)}`, {
                signal: request.signal,
                cache: 'no-store',
            });
            if (!res.ok) throw new Error('Error al cargar slots');
            const data = await res.json();
            if (data.category?.slug !== slug || !Array.isArray(data.slots)) throw new Error('Respuesta de noticias inválida');
            if (!request.signal.aborted) {
                setCategoryData(data);
                setLastUpdated(new Date());
            }
        } catch {
            if (!request.signal.aborted) {
                setError(
                    background
                        ? 'No se pudo actualizar. Se conservan las últimas noticias; volveremos a intentarlo.'
                        : 'No se pudo cargar el contenido. Intentá de nuevo.'
                );
                if (!background) setCategoryData(null);
            }
        } finally {
            if (!request.signal.aborted) setSlotsLoading(false);
            if (activeRequest.current === request) activeRequest.current = null;
        }
    }, []);

    useEffect(() => {
        if (!isPro || !selectedSlug) return;
        void loadSlots(selectedSlug);
        const refresh = () => {
            if (document.visibilityState === 'visible') void loadSlots(selectedSlug, true);
        };
        const refreshTimer = window.setInterval(refresh, 5 * 60 * 1000);
        window.addEventListener('focus', refresh);
        window.addEventListener('online', refresh);
        document.addEventListener('visibilitychange', refresh);
        return () => {
            window.clearInterval(refreshTimer);
            window.removeEventListener('focus', refresh);
            window.removeEventListener('online', refresh);
            document.removeEventListener('visibilitychange', refresh);
            activeRequest.current?.abort();
            activeRequest.current = null;
        };
    }, [isPro, selectedSlug, loadSlots]);

    // Click tracking
    const handleClickTracking = useCallback((slotId: string) => {
        apiFetch(`/news/slots/${slotId}/click`, { method: 'POST' }).catch(() => {});
    }, []);

    // Active articles filtered and sorted
    const activeSlots = useMemo(() => {
        const slots = (categoryData?.slots || [])
            .filter((s) => s.isActive && Boolean(s.article))
            .sort((a, b) => a.position - b.position);

        if (!searchQuery.trim()) return slots;

        const q = searchQuery.toLowerCase().trim();
        return slots.filter((s) => {
            const title = s.article?.title?.toLowerCase() || '';
            const desc = s.article?.description?.toLowerCase() || '';
            const src = s.article?.sourceName?.toLowerCase() || '';
            return title.includes(q) || desc.includes(q) || src.includes(q);
        });
    }, [categoryData, searchQuery]);

    // PRO Gate
    if (!isPro && !categoriesLoading) {
        return (
            <div className="min-h-[calc(100vh-60px)] flex flex-col flex-1 bg-background">
                <ProGate
                    section="news"
                    buttonText="Activar Finix PRO"
                    onUpgrade={() => navigate('/pro')}
                />
            </div>
        );
    }

    const selectedCat = categories.find((c) => c.slug === selectedSlug);
    const leadArticle = activeSlots[0];
    const secondaryArticles = activeSlots.slice(1, 4);
    const wireArticles = activeSlots.slice(0, 7);
    const gridArticles = activeSlots.slice(4);

    return (
        <div className="min-h-screen bg-background text-foreground pb-16 selection:bg-primary/20">
            {/* ── 1. REAL-TIME CONTINUOUS MARKET TICKER TAPE (40 ASSETS) ── */}
            <NewsMarketTicker onSelectAsset={(sym) => setSearchQuery(sym)} />

            <div className="w-full max-w-[1780px] 2xl:max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 pt-4 sm:pt-6 space-y-5">
                {/* ── 2. EDITORIAL MASTHEAD & SEARCH BAR ── */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-3 border-b border-border/80">
                    <div>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mb-1.5">
                            <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
                            <span>Cable Editorial & Finanzas</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                            Noticias de Mercados
                        </h1>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 max-w-xl">
                            Cobertura financiera continua de Wall Street, Argentina, dólar, bonos soberanos y balances corporativos.
                        </p>
                    </div>

                    <div className="flex items-center gap-2.5 sm:self-end">
                        <div className="relative w-full sm:w-64">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Buscar noticia o activo..."
                                className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs sm:text-sm bg-card border border-border/80 focus:border-primary focus:outline-none text-foreground placeholder:text-muted-foreground transition-all shadow-2xs"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                                >
                                    ✕
                                </button>
                            )}
                        </div>

                        <button
                            onClick={() => selectedSlug && loadSlots(selectedSlug, Boolean(categoryData))}
                            disabled={slotsLoading}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs sm:text-sm font-semibold text-foreground transition-all cursor-pointer shadow-2xs shrink-0"
                            title={`Última actualización: ${lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                        >
                            <RefreshCw className={cn("w-3.5 h-3.5", slotsLoading && "animate-spin text-primary")} />
                            <span className="hidden sm:inline">Actualizar</span>
                        </button>
                    </div>
                </div>

                {/* ── 3. CATEGORY SWITCHER (NO-SCROLL RESPONSIVE WRAPPED CLOUD) ── */}
                <div className="w-full py-1">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        {categoriesLoading ? (
                            Array.from({ length: 10 }, (_, i) => (
                                <div key={i} className="h-7 w-24 rounded-full bg-muted/60 animate-pulse" />
                            ))
                        ) : (
                            categories.map((cat) => {
                                const isActive = cat.slug === selectedSlug;
                                const catColor = cat.color || '#10b981';
                                return (
                                    <button
                                        key={cat.slug}
                                        data-theme-ignore
                                        onClick={() => {
                                            if (cat.slug !== selectedSlug) {
                                                setSelectedSlug(cat.slug);
                                                setCategoryData(null);
                                            }
                                        }}
                                        className={cn(
                                            "group inline-flex items-center gap-1.5 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full text-xs font-semibold transition-all duration-150 cursor-pointer select-none border whitespace-nowrap shadow-2xs",
                                            isActive
                                                ? "bg-emerald-600 text-white font-bold border-emerald-600 shadow-xs dark:bg-emerald-500 dark:border-emerald-500 text-white-force"
                                                : "bg-card hover:bg-muted text-muted-foreground hover:text-foreground border-border/80 hover:border-foreground/20"
                                        )}
                                        style={isActive ? { color: '#ffffff' } : undefined}
                                    >
                                        <span
                                            className={cn(
                                                "w-2 h-2 rounded-full shrink-0 transition-transform duration-150",
                                                isActive ? "bg-white scale-110" : "opacity-80 group-hover:scale-110"
                                            )}
                                            style={!isActive ? { backgroundColor: catColor } : undefined}
                                        />
                                        <span style={isActive ? { color: '#ffffff' } : undefined}>{cat.name}</span>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* ── ERROR ALERT ── */}
                {error && (
                    <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-500 text-xs sm:text-sm">
                        <span>{error}</span>
                        <button
                            onClick={() => selectedSlug && loadSlots(selectedSlug, Boolean(categoryData))}
                            className="shrink-0 font-bold underline hover:no-underline"
                        >
                            Reintentar
                        </button>
                    </div>
                )}

                {/* ── LOADING SKELETON ── */}
                {slotsLoading && !categoryData ? (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-pulse">
                        <div className="lg:col-span-8 h-96 rounded-2xl bg-muted/50 border border-border/60" />
                        <div className="lg:col-span-4 space-y-4">
                            <div className="h-28 rounded-xl bg-muted/50 border border-border/60" />
                            <div className="h-28 rounded-xl bg-muted/50 border border-border/60" />
                            <div className="h-28 rounded-xl bg-muted/50 border border-border/60" />
                        </div>
                    </div>
                ) : activeSlots.length === 0 ? (
                    /* ── EMPTY STATE ── */
                    <div className="text-center py-20 px-4 rounded-2xl border border-dashed border-border/80 bg-card/50">
                        <Newspaper className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
                        <h3 className="text-base font-bold text-foreground">
                            {searchQuery ? `No hay noticias para "${searchQuery}"` : `Sin noticias publicadas en ${selectedCat?.name || 'esta categoría'}`}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                            {searchQuery ? 'Probá buscando con otro término o limpiá el filtro.' : 'Nuestro equipo editorial actualizará esta sección pronto con novedades de mercado.'}
                        </p>
                    </div>
                ) : (
                    <>
                        {/* ── 4. ASYMMETRIC EDITORIAL HERO (FULL-VIEWPORT MAGAZINE HERO) ── */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:h-[calc(100vh-250px)] lg:min-h-[480px] lg:max-h-[620px]">
                            {/* LEAD STORY (HERO - Col-span 7 / 8) */}
                            {leadArticle && leadArticle.article && (
                                <a
                                    href={leadArticle.article.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    data-theme-ignore
                                    onClick={() => handleClickTracking(leadArticle.id)}
                                    className="lg:col-span-7 xl:col-span-8 group rounded-2xl border border-border/80 bg-slate-950 hover:border-primary/50 transition-all duration-300 overflow-hidden relative flex flex-col justify-end shadow-xs hover:shadow-md cursor-pointer h-[380px] sm:h-[440px] lg:h-full"
                                >
                                    <img
                                        src={resolveNewsImage(leadArticle.article.title, selectedCat?.name, leadArticle.article.imageUrl)}
                                        alt={leadArticle.article.title}
                                        onError={(e) => handleNewsImageError(e, leadArticle.article!.title, selectedCat?.name)}
                                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                    />
                                    {/* Multistage gradient for pristine contrast & readability */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 via-45% to-black/20" />

                                    {/* Badges on Hero Cover */}
                                    <div className="absolute top-3 left-3 sm:top-5 sm:left-5 flex items-center gap-2 z-10">
                                        <span className="px-2.5 py-1 rounded-md text-[10.5px] font-black uppercase tracking-wider bg-emerald-500 text-slate-950 shadow-sm">
                                            {leadArticle.article.sourceName || 'Finix Wire'}
                                        </span>
                                        {selectedCat && (
                                            <span
                                                data-theme-ignore
                                                style={{ color: '#ffffff' }}
                                                className="px-2.5 py-1 rounded-md text-[10.5px] font-extrabold text-white bg-slate-900/80 backdrop-blur-md border border-white/30 shadow-sm"
                                            >
                                                {selectedCat.name}
                                            </span>
                                        )}
                                    </div>

                                    {/* Hero Text Over Image */}
                                    <div data-theme-ignore className="relative z-10 p-4 sm:p-6 lg:p-7 flex flex-col justify-end text-white space-y-2.5">
                                        <span className="text-[11px] font-bold tracking-wider text-emerald-400 flex items-center gap-1.5 uppercase">
                                            <Flame className="w-3.5 h-3.5" />
                                            NOTICIA PRINCIPAL
                                        </span>
                                        <h2
                                            data-theme-ignore
                                            style={{ color: '#ffffff', textShadow: '0 2px 12px rgba(0,0,0,0.85)' }}
                                            className="text-xl sm:text-2xl lg:text-3xl font-black leading-tight tracking-tight text-white group-hover:text-emerald-300 transition-colors line-clamp-3 text-white-force"
                                        >
                                            {leadArticle.article.title}
                                        </h2>
                                        <p
                                            data-theme-ignore
                                            style={{ color: 'rgba(255,255,255,0.92)', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}
                                            className="text-xs sm:text-sm text-slate-100 font-normal leading-relaxed line-clamp-2 max-w-3xl"
                                        >
                                            {leadArticle.article.description || 'Seguimiento del impacto macroeconómico, divisas, renta variable y bonos soberanos con análisis en tiempo real.'}
                                        </p>

                                        <div data-theme-ignore className="flex items-center justify-between text-xs text-slate-200 pt-3 border-t border-white/20">
                                            <div className="flex items-center gap-1.5 font-medium" style={{ color: '#e2e8f0' }}>
                                                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                                                <span>{formatRelativeTime(leadArticle.article.publishedAt) || 'Reciente'}</span>
                                            </div>
                                            <span className="text-emerald-400 font-bold inline-flex items-center gap-1 group-hover:underline">
                                                Leer noticia completa <ArrowUpRight className="w-3.5 h-3.5" />
                                            </span>
                                        </div>
                                    </div>
                                </a>
                            )}

                            {/* SECONDARY STORIES (Col-span 5 / 4) */}
                            <div className="lg:col-span-5 xl:col-span-4 flex flex-col justify-between gap-3 h-full">
                                <div className="flex items-center justify-between px-1">
                                    <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                        Historias Destacadas
                                    </h3>
                                    <span className="text-[11px] text-muted-foreground font-semibold">Edición Digital</span>
                                </div>

                                <div className="flex-1 flex flex-col justify-between gap-2.5 min-h-0">
                                    {secondaryArticles.map((slot) => {
                                        if (!slot.article) return null;
                                        return (
                                            <a
                                                key={slot.id}
                                                href={slot.article.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={() => handleClickTracking(slot.id)}
                                                className="group p-2.5 sm:p-3 rounded-2xl border border-border/80 bg-card hover:bg-muted/40 hover:border-primary/40 transition-all shadow-2xs flex gap-3.5 items-center cursor-pointer flex-1 min-h-0"
                                            >
                                                <div className="w-20 h-20 sm:w-24 sm:h-full max-h-24 rounded-xl overflow-hidden shrink-0 bg-slate-900 border border-border/60 relative">
                                                    <img
                                                        src={resolveNewsImage(slot.article.title, selectedCat?.name, slot.article.imageUrl)}
                                                        alt={slot.article.title}
                                                        onError={(e) => handleNewsImageError(e, slot.article!.title, selectedCat?.name)}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                    />
                                                </div>

                                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                                                            {slot.article.sourceName || 'Mercados'}
                                                        </span>
                                                        <span className="text-muted-foreground text-[10px]">·</span>
                                                        <span className="text-[10px] text-muted-foreground">
                                                            {formatRelativeTime(slot.article.publishedAt) || 'Hoy'}
                                                        </span>
                                                    </div>
                                                    <h4 className="text-xs sm:text-sm font-bold text-foreground leading-snug tracking-tight group-hover:text-primary transition-colors line-clamp-2 mb-1">
                                                        {slot.article.title}
                                                    </h4>
                                                    {slot.article.description && (
                                                        <p className="text-[11px] text-muted-foreground line-clamp-1">
                                                            {slot.article.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </a>
                                        );
                                    })}
                                </div>

                                {/* LIVE WIRE TEASER CARD */}
                                <div className="p-2.5 sm:p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 shrink-0">
                                    <div className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2">
                                            <span className="relative flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                                            </span>
                                            <span className="font-bold text-foreground">Alertas de Mercado Finix</span>
                                        </div>
                                        <span className="text-[10.5px] font-semibold text-emerald-600 dark:text-emerald-400">En tiempo real</span>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground mt-1">
                                        Actualizaciones instantáneas del mercado local e internacional cada 5 minutos.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* ── 5. LIVE WIRE / CABLE DE NOTICIAS AL INSTANTE (INVESTING.COM STYLE) ── */}
                        <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs">
                            <div className="flex items-center justify-between pb-3 mb-3 border-b border-border/60">
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-foreground">
                                        Cable de Noticias al Instante
                                    </h3>
                                </div>
                                <span className="text-xs text-muted-foreground font-medium">
                                    {wireArticles.length} cables recibidos
                                </span>
                            </div>

                            <div className="divide-y divide-border/50">
                                {wireArticles.map((slot) => {
                                    if (!slot.article) return null;
                                    return (
                                        <a
                                            key={slot.id}
                                            href={slot.article.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={() => handleClickTracking(slot.id)}
                                            className="group py-2.5 flex items-start sm:items-center justify-between gap-3 text-xs hover:text-primary transition-colors cursor-pointer"
                                        >
                                            <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-muted text-muted-foreground shrink-0 mt-0.5 sm:mt-0">
                                                    {slot.article.publishedAt
                                                        ? new Date(slot.article.publishedAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
                                                        : '11:00'}
                                                </span>
                                                <span className="text-[10.5px] font-bold uppercase text-emerald-600 dark:text-emerald-400 shrink-0">
                                                    {slot.article.sourceName || 'Wire'}
                                                </span>
                                                <span className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                                                    {slot.article.title}
                                                </span>
                                            </div>
                                            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </a>
                                    );
                                })}
                            </div>
                        </div>

                        {/* ── 6. MARKET NEWS GRID (SEEKING ALPHA / ALPHASPREAD STYLE) ── */}
                        {gridArticles.length > 0 && (
                            <div className="space-y-4 pt-2">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-base sm:text-lg font-black text-foreground tracking-tight">
                                        Más Noticias de Mercados & Inversiones
                                    </h3>
                                    <span className="text-xs text-muted-foreground font-semibold">
                                        {gridArticles.length} publicaciones adicionales
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                                    {gridArticles.map((slot) => {
                                        if (!slot.article) return null;
                                        return (
                                            <a
                                                key={slot.id}
                                                href={slot.article.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={() => handleClickTracking(slot.id)}
                                                className="group rounded-2xl border border-border/80 bg-card hover:border-primary/50 hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between cursor-pointer"
                                            >
                                                <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-900">
                                                    <img
                                                        src={resolveNewsImage(slot.article.title, selectedCat?.name, slot.article.imageUrl)}
                                                        alt={slot.article.title}
                                                        onError={(e) => handleNewsImageError(e, slot.article!.title, selectedCat?.name)}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                    />
                                                    <span
                                                        data-theme-ignore
                                                        style={{ color: '#ffffff' }}
                                                        className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded text-[10px] font-bold bg-black/75 backdrop-blur-md text-white border border-white/30 shadow-xs"
                                                    >
                                                        {slot.article.sourceName || 'Finix'}
                                                    </span>
                                                </div>

                                                <div className="p-4 flex-1 flex flex-col justify-between">
                                                    <div>
                                                        <h4 className="text-sm font-bold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors mb-2">
                                                            {slot.article.title}
                                                        </h4>
                                                        {slot.article.description && (
                                                            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                                                {slot.article.description}
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-3 mt-3 border-t border-border/60 font-medium">
                                                        <div className="flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            <span>{formatRelativeTime(slot.article.publishedAt) || 'Reciente'}</span>
                                                        </div>
                                                        <span className="text-primary font-semibold flex items-center gap-0.5 group-hover:underline">
                                                            Leer ↗
                                                        </span>
                                                    </div>
                                                </div>
                                            </a>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* ── 7. KEY FINANCIAL CONCEPTS SHORTCUTS ── */}
                {isEducationEnabled() && (
                    <div className="rounded-2xl p-4 sm:p-5 bg-card border border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2">
                            <GraduationCap className="w-4 h-4 text-emerald-500" />
                            <span className="font-bold text-foreground">Aprender más sobre el mercado:</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <Link
                                to="/educativa/macroeconomia/inflacion-y-tasas-de-interes"
                                className="px-3 py-1.5 rounded-lg bg-muted/60 hover:bg-muted border border-border/80 text-foreground font-medium transition-colors"
                            >
                                Inflación y Tasas Fed
                            </Link>
                            <Link
                                to="/educativa/fundamentos/que-son-los-cedears"
                                className="px-3 py-1.5 rounded-lg bg-muted/60 hover:bg-muted border border-border/80 text-foreground font-medium transition-colors"
                            >
                                CEDEARs y Dólar CCL
                            </Link>
                            <Link
                                to="/educativa/fundamentos/que-son-los-etfs"
                                className="px-3 py-1.5 rounded-lg bg-muted/60 hover:bg-muted border border-border/80 text-foreground font-medium transition-colors"
                            >
                                ETFs (SPY / QQQ)
                            </Link>
                        </div>
                    </div>
                )}

                {/* ── 8. INVESTOR WISDOM QUOTE ── */}
                <InvestorQuote investorId="howard-marks" showBackToTop />
            </div>
        </div>
    );
}
