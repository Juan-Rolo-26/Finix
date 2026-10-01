import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Sparkles, BookmarkPlus, Gem, HeartPulse, TrendingUp, Leaf, Loader2, Star, Check } from 'lucide-react';
import SymbolLogo from '@/components/SymbolLogo';

interface WatchlistIdeasSectionProps {
    onAddSymbol: (symbol: string, name?: string) => void;
}

const CATEGORY_ICONS: Record<string, any> = {
    UNDERVALUED: Gem,
    HEALTH: HeartPulse,
    GROWTH: TrendingUp,
    DIVIDEND: Leaf,
};

export default function WatchlistIdeasSection({ onAddSymbol }: WatchlistIdeasSectionProps) {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [followingCategory, setFollowingCategory] = useState<string | null>(null);

    const loadIdeas = async () => {
        setLoading(true);
        try {
            const res = await apiFetch('/watchlist/ideas');
            if (res.ok) {
                setData(await res.json());
            }
        } catch {
            // best effort
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadIdeas();
    }, []);

    const handleToggleFollow = async (categoryKey: string) => {
        setFollowingCategory(categoryKey);
        try {
            const res = await apiFetch('/watchlist/ideas/follow', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ category: categoryKey }),
            });
            if (res.ok) {
                const resData = await res.json();
                setData((prev: any) => ({
                    ...prev,
                    categories: prev.categories.map((c: any) =>
                        c.key === categoryKey ? { ...c, isFollowed: resData.isFollowed } : c
                    ),
                }));
            }
        } catch {
            // best effort
        } finally {
            setFollowingCategory(null);
        }
    };

    if (loading) {
        return (
            <div className="rounded-3xl border border-border/60 bg-card/60 p-8 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                <span className="text-xs text-muted-foreground">Cargando ideas de mercado calculadas por Finix...</span>
            </div>
        );
    }

    const categories = data?.categories || [];

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                    <h3 className="text-lg font-black tracking-tight text-foreground flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-emerald-500" />
                        Ideas para explorar
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Listas dinámicas conectadas con el screener cuantitativo de Finix. Cada lista aplica reglas objetivas sin dictaminar recomendaciones.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categories.map((cat: any) => {
                    const Icon = CATEGORY_ICONS[cat.key] || Sparkles;
                    const isFollowed = Boolean(cat.isFollowed);
                    const isToggling = followingCategory === cat.key;

                    return (
                        <div
                            key={cat.key}
                            className="rounded-3xl border border-border/60 bg-card/70 backdrop-blur-md p-5 flex flex-col justify-between shadow-xs hover:border-emerald-500/30 transition-all"
                        >
                            <div>
                                <div className="flex items-start justify-between gap-3 mb-2">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-black text-foreground">{cat.title}</h4>
                                            <span className="text-[10px] text-muted-foreground font-semibold">
                                                {cat.count} resultados detectados
                                            </span>
                                        </div>
                                    </div>

                                    {/* Botón seguir lista de ideas (PRO) */}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={isToggling}
                                        onClick={() => handleToggleFollow(cat.key)}
                                        className={`rounded-xl h-8 px-2.5 text-xs font-bold gap-1.5 transition-all ${isFollowed
                                                ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                                : 'border-border/60 text-muted-foreground hover:text-foreground'
                                            }`}
                                    >
                                        {isToggling ? (
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        ) : isFollowed ? (
                                            <Check className="w-3.5 h-3.5" />
                                        ) : (
                                            <Star className="w-3.5 h-3.5" />
                                        )}
                                        <span>{isFollowed ? 'Siguiendo' : 'Seguir idea'}</span>
                                    </Button>
                                </div>

                                <p className="text-xs text-muted-foreground leading-relaxed mb-2">{cat.description}</p>

                                <div className="rounded-xl bg-secondary/40 border border-border/40 p-2.5 mb-3 text-[11px] text-muted-foreground">
                                    <b className="text-foreground">Regla cuantitativa:</b> {cat.criteria}
                                </div>

                                {/* Items de la idea */}
                                <div className="space-y-1.5">
                                    {cat.items.map((item: any) => (
                                        <div
                                            key={item.symbol}
                                            className="flex items-center justify-between p-2 rounded-xl bg-background/50 border border-border/40 text-xs"
                                        >
                                            <div className="flex items-center gap-2">
                                                <SymbolLogo symbol={item.symbol} size={24} />
                                                <div>
                                                    <span className="font-bold text-foreground font-mono">{item.symbol}</span>
                                                    <span className="text-[10px] text-muted-foreground ml-1.5 line-clamp-1 hidden sm:inline">
                                                        {item.name}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                                    {item.metricLabel}: {item.metricValue}
                                                </span>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => onAddSymbol(item.symbol, item.name)}
                                                    className="h-7 px-2 rounded-lg text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-secondary gap-1"
                                                    title="Agregar a mi lista"
                                                >
                                                    <BookmarkPlus className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
