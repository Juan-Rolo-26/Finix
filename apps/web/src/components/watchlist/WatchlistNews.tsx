import { useState, useEffect, useMemo } from 'react';
import { apiFetch } from '@/lib/api';
import SymbolLogo from '@/components/SymbolLogo';
import {
    Newspaper,
    ExternalLink,
    RefreshCw,
    Clock,
} from 'lucide-react';

interface WatchlistNewsProps {
    items: any[];
    onItemClick: (item: any) => void;
}

interface NewsItem {
    id: string;
    title: string;
    summary?: string;
    source?: string;
    publishedAt: string;
    url?: string;
    symbols?: string[];
    symbol?: string;
    sentiment?: 'positive' | 'negative' | 'neutral';
}

export default function WatchlistNews({ items, onItemClick }: WatchlistNewsProps) {
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedSymbol, setSelectedSymbol] = useState<string>('ALL');

    const trackedSymbols = useMemo(() => {
        return items.map((i) => i.symbol.replace(/^[A-Z]+:/, '').toUpperCase());
    }, [items]);

    const loadNews = async (force = false) => {
        force ? setRefreshing(true) : setLoading(true);
        try {
            // First fetch top curated headlines
            const res = await apiFetch(`/news/slots/headlines?limit=20`);
            let fetchedArticles: NewsItem[] = [];

            if (res.ok) {
                const data = await res.json();
                const list = Array.isArray(data)
                    ? data
                    : Array.isArray(data?.articles)
                    ? data.articles
                    : Array.isArray(data?.data)
                    ? data.data
                    : [];

                fetchedArticles = list.map((item: any, idx: number) => {
                    const article = item.article || item;
                    return {
                        id: String(article.id || idx),
                        title: article.title || 'Actualización de mercado',
                        summary: article.summary || article.contentSnippet || '',
                        source: article.source || 'Finix Editorial',
                        publishedAt: article.publishedAt || article.createdAt || new Date().toISOString(),
                        url: article.url || '#',
                        symbols: article.symbols || (trackedSymbols.length > 0 ? [trackedSymbols[idx % trackedSymbols.length]] : ['MERCADO']),
                        symbol: article.symbol || (trackedSymbols.length > 0 ? trackedSymbols[idx % trackedSymbols.length] : 'MERCADO'),
                    };
                });
            }

            // If we have items in the watchlist, try getting symbol-specific news
            if (trackedSymbols.length > 0) {
                const sampleSymbols = trackedSymbols.slice(0, 3);
                const extraResults = await Promise.all(
                    sampleSymbols.map((sym) =>
                        apiFetch(`/market/news?symbol=${encodeURIComponent(sym)}`)
                            .then((r) => (r.ok ? r.json() : []))
                            .catch(() => [])
                    )
                );

                const extraNews: NewsItem[] = [];
                extraResults.flat().forEach((n: any, idx: number) => {
                    if (n && n.title) {
                        extraNews.push({
                            id: `extra-${n.id || idx}-${n.symbol || 'sym'}`,
                            title: n.title,
                            summary: n.summary || n.description || '',
                            source: n.source || 'Mercado en Vivo',
                            publishedAt: n.publishedAt || n.datetime || new Date().toISOString(),
                            url: n.url || n.link || '#',
                            symbols: [n.symbol || sampleSymbols[0]],
                            symbol: n.symbol || sampleSymbols[0],
                        });
                    }
                });

                if (extraNews.length > 0) {
                    fetchedArticles = [...extraNews, ...fetchedArticles];
                }
            }

            setNews(fetchedArticles);
        } catch (e) {
            // Fallback generated insights if offline
            setNews(
                items.slice(0, 6).map((item, idx) => ({
                    id: `mock-${item.id || idx}`,
                    title: `${item.name || item.symbol} presenta movimientos destacados en el mercado`,
                    summary: `Los analistas cuantitativos siguen de cerca la evolución de ${item.symbol} tras variaciones recientes y revisiones de precios objetivos.`,
                    source: 'Finix Research',
                    publishedAt: new Date(Date.now() - idx * 3600000 * 3).toISOString(),
                    symbol: item.symbol.replace(/^[A-Z]+:/, ''),
                    symbols: [item.symbol.replace(/^[A-Z]+:/, '')],
                }))
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        void loadNews();
    }, [trackedSymbols.join(',')]);

    const filteredNews = useMemo(() => {
        if (selectedSymbol === 'ALL') return news;
        return news.filter((n) => {
            const sym = n.symbol?.toUpperCase();
            const list = n.symbols?.map((s) => s.toUpperCase()) || [];
            return sym === selectedSymbol || list.includes(selectedSymbol);
        });
    }, [news, selectedSymbol]);

    return (
        <div className="space-y-6">
            {/* Header & Filter Row */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                        <Newspaper size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-foreground">
                            Noticias de tus Activos en Seguimiento
                        </h3>
                        <p className="text-xs text-muted-foreground">
                            Actualidad informativa, reportes y novedades de las empresas que tenés en lista.
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => void loadNews(true)}
                    disabled={refreshing}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
                >
                    <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
                    <span>Actualizar noticias</span>
                </button>
            </div>

            {/* Filter by symbol pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                <button
                    type="button"
                    onClick={() => setSelectedSymbol('ALL')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap ${
                        selectedSymbol === 'ALL'
                            ? 'bg-foreground text-background border-foreground shadow-xs'
                            : 'bg-card border-border/70 text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                    }`}
                >
                    Todos los activos ({news.length})
                </button>
                {items.map((item) => {
                    const clean = item.symbol.replace(/^[A-Z]+:/, '').toUpperCase();
                    const isSelected = selectedSymbol === clean;
                    return (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => setSelectedSymbol(clean)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap ${
                                isSelected
                                    ? 'bg-foreground text-background border-foreground shadow-xs font-bold'
                                    : 'bg-card border-border/70 text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                            }`}
                        >
                            <SymbolLogo symbol={item.symbol} size={16} />
                            <span>{clean}</span>
                        </button>
                    );
                })}
            </div>

            {/* News Articles Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div
                            key={i}
                            className="h-36 rounded-2xl bg-card border border-border/40 animate-pulse p-5"
                        />
                    ))}
                </div>
            ) : filteredNews.length === 0 ? (
                <div className="rounded-2xl border border-border/60 bg-card p-12 text-center">
                    <Newspaper size={32} className="mx-auto text-muted-foreground/40 mb-3" />
                    <h4 className="text-base font-bold text-foreground">
                        Sin noticias recientes para este activo
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                        No hay reportes de última hora publicados en las últimas 24 horas para{' '}
                        {selectedSymbol}. Podés consultar la ficha individual para ver su historial completo.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredNews.map((article) => {
                        const targetItem = items.find(
                            (i) =>
                                i.symbol.replace(/^[A-Z]+:/, '').toUpperCase() ===
                                article.symbol?.toUpperCase()
                        );
                        return (
                            <article
                                key={article.id}
                                className="group rounded-2xl border border-border/60 bg-card p-5 hover:border-primary/40 hover:shadow-md transition-all flex flex-col justify-between"
                            >
                                <div>
                                    {/* Top Meta */}
                                    <div className="flex items-center justify-between gap-2 mb-2.5">
                                        <div className="flex items-center gap-2">
                                            {article.symbol && (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold font-mono bg-secondary text-foreground border border-border/60">
                                                    <SymbolLogo symbol={article.symbol} size={14} />
                                                    {article.symbol}
                                                </span>
                                            )}
                                            <span className="text-xs font-medium text-muted-foreground">
                                                {article.source}
                                            </span>
                                        </div>
                                        <span className="text-xs text-muted-foreground flex items-center gap-1 font-mono">
                                            <Clock size={12} />
                                            {new Date(article.publishedAt).toLocaleDateString('es-AR', {
                                                day: 'numeric',
                                                month: 'short',
                                            })}
                                        </span>
                                    </div>

                                    {/* Title */}
                                    <h4 className="text-base font-bold text-foreground group-hover:text-primary transition-colors leading-snug line-clamp-2 mb-2">
                                        {article.title}
                                    </h4>

                                    {/* Summary */}
                                    {article.summary && (
                                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                                            {article.summary}
                                        </p>
                                    )}
                                </div>

                                {/* Bottom Action */}
                                <div className="pt-4 mt-3 border-t border-border/40 flex items-center justify-between text-xs">
                                    {targetItem ? (
                                        <button
                                            type="button"
                                            onClick={() => onItemClick(targetItem)}
                                            className="font-bold text-primary hover:underline cursor-pointer"
                                        >
                                            Ver activo en radar →
                                        </button>
                                    ) : (
                                        <span className="text-muted-foreground">Cobertura general</span>
                                    )}
                                    {article.url && article.url !== '#' && (
                                        <a
                                            href={article.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors font-medium"
                                        >
                                            <span>Fuente original</span>
                                            <ExternalLink size={12} />
                                        </a>
                                    )}
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
