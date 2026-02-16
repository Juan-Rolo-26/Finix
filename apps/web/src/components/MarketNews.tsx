import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Newspaper, ExternalLink, TrendingUp, Search, Building2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { Input } from './ui/input';

interface NewsItem {
    title: string;
    link: string;
    publishedAt: string;
    source: string;
    summary: string;
    image?: string;
}

interface MarketNewsProps {
    symbol?: string;
}

export default function MarketNews({ symbol }: MarketNewsProps) {
    const [news, setNews] = useState<NewsItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedSymbol, setSelectedSymbol] = useState(symbol || '');
    const [searchInput, setSearchInput] = useState(symbol || '');

    const loadNews = async (sym = '') => {
        setIsLoading(true);
        try {
            const url = sym
                ? `/market/news?symbol=${encodeURIComponent(sym)}`
                : '/market/news';
            const response = await apiFetch(url);
            if (response.ok) {
                const data = await response.json();
                setNews(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error('[MarketNews] Failed to load news:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // When the prop changes, update the selected symbol
        if (symbol) {
            setSelectedSymbol(symbol);
            setSearchInput(symbol);
        }
    }, [symbol]);

    useEffect(() => {
        loadNews(selectedSymbol);
    }, [selectedSymbol]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setSelectedSymbol(searchInput.trim().toUpperCase());
    };

    const clearFilter = () => {
        setSelectedSymbol('');
        setSearchInput('');
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) return `Hace ${diffMins} min`;
        if (diffHours < 24) return `Hace ${diffHours}h`;
        if (diffDays < 7) return `Hace ${diffDays}d`;

        return date.toLocaleDateString('es-AR', {
            day: 'numeric',
            month: 'short',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
    };

    const popularSymbols = ['AAPL', 'TSLA', 'NVDA', 'BTC', 'ETH', 'SPY', 'QQQ'];

    return (
        <div className="space-y-6">
            <Card className="border-primary/20 bg-gradient-to-br from-card to-card/50">
                <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2 text-2xl">
                                {symbol ? (
                                    <>
                                        <Building2 className="w-7 h-7 text-primary" />
                                        Noticias de {symbol}
                                    </>
                                ) : (
                                    <>
                                        <Newspaper className="w-7 h-7 text-primary" />
                                        Noticias del Mercado
                                    </>
                                )}
                            </CardTitle>
                            <CardDescription className="text-base mt-2">
                                {symbol
                                    ? `Últimas noticias específicas de ${symbol}`
                                    : 'Últimas noticias de inversiones, mercados y activos financieros'}
                            </CardDescription>
                        </div>
                        <Badge variant="outline" className="border-primary/40 text-primary">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            Live
                        </Badge>
                    </div>

                    {/* Search and Filters */}
                    <div className="mt-6 space-y-3">
                        <form onSubmit={handleSearch} className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    type="text"
                                    placeholder="Buscar noticias por símbolo (ej: AAPL, BTC, TSLA)..."
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <Button type="submit" size="default">
                                Buscar
                            </Button>
                            {selectedSymbol && (
                                <Button type="button" variant="outline" onClick={clearFilter}>
                                    Limpiar
                                </Button>
                            )}
                        </form>

                        <div className="flex flex-wrap gap-2">
                            <span className="text-sm text-muted-foreground self-center">Popular:</span>
                            {popularSymbols.map(symbol => (
                                <Button
                                    key={symbol}
                                    size="sm"
                                    variant={selectedSymbol === symbol ? 'default' : 'outline'}
                                    onClick={() => {
                                        setSelectedSymbol(symbol);
                                        setSearchInput(symbol);
                                    }}
                                >
                                    {symbol}
                                </Button>
                            ))}
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="px-5 pb-5">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                        </div>
                    ) : news.length === 0 ? (
                        <div className="text-center py-12">
                            <Newspaper className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                            <p className="text-muted-foreground">
                                {selectedSymbol
                                    ? `No se encontraron noticias para ${selectedSymbol}`
                                    : 'No hay noticias disponibles en este momento'}
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {news.map((item, idx) => (
                                <a
                                    key={`${item.link}-${idx}`}
                                    href={item.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group"
                                >
                                    <Card className="h-full transition-all hover:shadow-lg hover:border-primary/50 hover:-translate-y-1 overflow-hidden bg-secondary/20">
                                        {item.image && (
                                            <div className="relative h-48 overflow-hidden bg-muted">
                                                <img
                                                    src={item.image}
                                                    alt={item.title}
                                                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).style.display = 'none';
                                                    }}
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                            </div>
                                        )}
                                        <CardContent className="p-4 space-y-2">
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Badge variant="secondary" className="text-xs">
                                                    {item.source}
                                                </Badge>
                                                <span>•</span>
                                                <span>{formatDate(item.publishedAt)}</span>
                                            </div>

                                            <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                                                {item.title}
                                            </h3>

                                            <p className="text-xs text-muted-foreground line-clamp-2">
                                                {item.summary}
                                            </p>

                                            <div className="flex items-center gap-1 text-xs text-primary pt-1">
                                                Leer más
                                                <ExternalLink className="w-3 h-3" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </a>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="border-primary/20 bg-gradient-to-br from-card to-card/50">
                <CardHeader>
                    <CardTitle className="text-lg">Fuentes de Noticias</CardTitle>
                    <CardDescription>
                        Accede directamente a las principales fuentes de noticias financieras
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {[
                            { name: 'Yahoo Finance', url: 'https://finance.yahoo.com' },
                            { name: 'Bloomberg', url: 'https://www.bloomberg.com/markets' },
                            { name: 'Reuters', url: 'https://www.reuters.com/markets/' },
                            { name: 'MarketWatch', url: 'https://www.marketwatch.com' },
                            { name: 'CNBC', url: 'https://www.cnbc.com/world/?region=world' },
                            { name: 'Financial Times', url: 'https://www.ft.com' },
                            { name: 'WSJ', url: 'https://www.wsj.com/news/markets' },
                            { name: 'Investing.com', url: 'https://www.investing.com/news' }
                        ].map(source => (
                            <a
                                key={source.name}
                                href={source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-secondary/20 hover:bg-secondary/40 hover:border-primary/50 transition-all group"
                            >
                                <span className="text-sm font-medium">{source.name}</span>
                                <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            </a>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
