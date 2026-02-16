import { useState, useEffect } from 'react';
import {
    Newspaper, TrendingUp, Globe, Building2, Bitcoin, DollarSign,
    BarChart3, ArrowRight, ExternalLink, Filter, Sparkles, Clock,
    TrendingDown, Minus
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';

interface NewsItem {
    id: string;
    title: string;
    titleOriginal?: string;
    summary: string;
    url: string;
    image?: string;
    source: string;
    category?: string;
    categorySlug?: string;
    sentiment?: string;
    sentimentScore?: number;
    impactLevel?: string;
    tickers?: string[];
    publishedAt: string;
    wasTranslated?: boolean;
}

interface NewsCategory {
    id: string;
    name: string;
    slug: string;
    icon: any;
    color: string;
}

export default function NewsPageEnhanced() {
    const [allNews, setAllNews] = useState<NewsItem[]>([]);
    const [categories, setCategories] = useState<NewsCategory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedSentiment, setSelectedSentiment] = useState<string | null>(null);

    const iconMap: Record<string, any> = {
        'Building2': Building2,
        'DollarSign': DollarSign,
        'Globe': Globe,
        'BarChart3': BarChart3,
        'Bitcoin': Bitcoin,
        'Newspaper': Newspaper,
        'TrendingUp': TrendingUp,
    };

    useEffect(() => {
        loadCategories();
        loadNews();
    }, [selectedCategory, selectedSentiment]);

    const loadCategories = async () => {
        try {
            const response = await apiFetch('/news/categories');
            if (response.ok) {
                const data = await response.json();
                setCategories(data.map((cat: any) => ({
                    id: cat.id,
                    name: cat.name,
                    slug: cat.slug,
                    icon: iconMap[cat.icon] || Newspaper,
                    color: cat.color || '#6366f1',
                })));
            }
        } catch (error) {
            console.error('[News] Failed to load categories:', error);
        }
    };

    const loadNews = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (selectedCategory !== 'all') {
                params.append('category', selectedCategory);
            }
            if (selectedSentiment) {
                params.append('sentiment', selectedSentiment);
            }
            params.append('limit', '50');

            const response = await apiFetch(`/news?${params.toString()}`);
            if (response.ok) {
                const data = await response.json();
                setAllNews(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error('[News] Failed to load news:', error);
        } finally {
            setIsLoading(false);
        }
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

    const getSentimentIcon = (sentiment?: string) => {
        switch (sentiment) {
            case 'positive':
                return <TrendingUp className="w-4 h-4 text-green-500" />;
            case 'negative':
                return <TrendingDown className="w-4 h-4 text-red-500" />;
            default:
                return <Minus className="w-4 h-4 text-gray-500" />;
        }
    };

    const getImpactBadge = (impactLevel?: string) => {
        const variants: Record<string, { color: string; label: string }> = {
            high: { color: 'bg-red-500/10 text-red-500 border-red-500/20', label: 'Alto Impacto' },
            medium: { color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20', label: 'Impacto Medio' },
            low: { color: 'bg-gray-500/10 text-gray-500 border-gray-500/20', label: 'Bajo Impacto' },
        };

        if (!impactLevel || !variants[impactLevel]) return null;

        return (
            <Badge variant="outline" className={`text-xs ${variants[impactLevel].color}`}>
                {variants[impactLevel].label}
            </Badge>
        );
    };

    const getCategoryStats = (slug: string) => {
        if (slug === 'all') return allNews.length;
        return allNews.filter(news => news.categorySlug === slug).length;
    };

    const displayCategories = [
        {
            id: 'all',
            name: 'Todas',
            slug: 'all',
            icon: Newspaper,
            color: '#10b981',
        },
        ...categories,
    ];

    return (
        <div className="w-full space-y-8 pb-16">
            {/* Header */}
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-5xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                            Noticias Financieras
                        </h1>
                        <p className="text-muted-foreground mt-3 text-lg">
                            Últimas noticias de mercados globales con análisis de sentimiento y traducción automática
                        </p>
                    </div>
                    <Sparkles className="w-16 h-16 text-primary/60" />
                </div>

                {/* Sentiment Filter */}
                <div className="flex gap-2 items-center">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Sentimiento:</span>
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant={selectedSentiment === null ? 'default' : 'outline'}
                            onClick={() => setSelectedSentiment(null)}
                        >
                            Todos
                        </Button>
                        <Button
                            size="sm"
                            variant={selectedSentiment === 'positive' ? 'default' : 'outline'}
                            onClick={() => setSelectedSentiment('positive')}
                            className="gap-1"
                        >
                            <TrendingUp className="w-3 h-3" />
                            Positivo
                        </Button>
                        <Button
                            size="sm"
                            variant={selectedSentiment === 'neutral' ? 'default' : 'outline'}
                            onClick={() => setSelectedSentiment('neutral')}
                            className="gap-1"
                        >
                            <Minus className="w-3 h-3" />
                            Neutral
                        </Button>
                        <Button
                            size="sm"
                            variant={selectedSentiment === 'negative' ? 'default' : 'outline'}
                            onClick={() => setSelectedSentiment('negative')}
                            className="gap-1"
                        >
                            <TrendingDown className="w-3 h-3" />
                            Negativo
                        </Button>
                    </div>
                </div>

                {/* Category Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {displayCategories.map((category) => {
                        const Icon = category.icon;
                        const count = getCategoryStats(category.slug);

                        return (
                            <Card
                                key={category.id}
                                className={`cursor-pointer transition-all hover:scale-105 border-2 ${selectedCategory === category.slug
                                        ? 'border-primary shadow-lg'
                                        : 'border-transparent hover:border-primary/50'
                                    }`}
                                onClick={() => setSelectedCategory(category.slug)}
                            >
                                <CardContent className="p-4">
                                    <div
                                        className="w-12 h-12 rounded-lg flex items-center justify-center mb-3"
                                        style={{ backgroundColor: `${category.color}20` }}
                                    >
                                        <Icon className="w-6 h-6" style={{ color: category.color }} />
                                    </div>
                                    <div className="text-2xl font-bold">{count}</div>
                                    <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                        {category.name}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>

            {/* News Grid */}
            <Card className="border-primary/20 bg-gradient-to-br from-card to-card/50">
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div>
                            <CardTitle className="text-2xl flex items-center gap-2">
                                <Newspaper className="w-6 h-6 text-primary" />
                                {displayCategories.find(c => c.slug === selectedCategory)?.name || 'Noticias'}
                            </CardTitle>
                            <CardDescription className="text-base mt-2">
                                Mostrando {allNews.length} noticias
                                {selectedSentiment && ` con sentimiento ${selectedSentiment}`}
                            </CardDescription>
                        </div>
                        <Badge variant="outline" className="border-primary/40 text-primary">
                            <Clock className="w-3 h-3 mr-1" />
                            Actualizado
                        </Badge>
                    </div>
                </CardHeader>

                <CardContent className="px-5 pb-5">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                        </div>
                    ) : allNews.length === 0 ? (
                        <div className="text-center py-20">
                            <Newspaper className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                            <p className="text-muted-foreground text-lg">
                                No hay noticias disponibles en esta categoría
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Featured News (First 2) */}
                            {allNews.slice(0, 2).length > 0 && (
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                                        <Sparkles className="w-4 h-4" />
                                        Destacadas
                                    </h3>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        {allNews.slice(0, 2).map((item) => (
                                            <a
                                                key={item.id}
                                                href={item.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="group"
                                            >
                                                <Card className="h-full transition-all hover:shadow-xl hover:border-primary/50 hover:-translate-y-1 overflow-hidden bg-secondary/20">
                                                    {item.image && (
                                                        <div className="relative h-64 overflow-hidden bg-muted">
                                                            <img
                                                                src={item.image}
                                                                alt={item.title}
                                                                className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                                                onError={(e) => {
                                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                                }}
                                                            />
                                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                                                            <div className="absolute bottom-4 left-4 right-4 flex gap-2">
                                                                <Badge variant="secondary">{item.source}</Badge>
                                                                {item.wasTranslated && (
                                                                    <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
                                                                        Traducido
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                    <CardContent className="p-5 space-y-3">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                                <Clock className="w-3 h-3" />
                                                                <span>{formatDate(item.publishedAt)}</span>
                                                            </div>
                                                            {getSentimentIcon(item.sentiment)}
                                                            {getImpactBadge(item.impactLevel)}
                                                        </div>

                                                        <h3 className="font-bold text-lg leading-tight line-clamp-3 group-hover:text-primary transition-colors">
                                                            {item.title}
                                                        </h3>

                                                        <p className="text-sm text-muted-foreground line-clamp-3">
                                                            {item.summary}
                                                        </p>

                                                        {item.tickers && item.tickers.length > 0 && (
                                                            <div className="flex gap-1 flex-wrap">
                                                                {item.tickers.slice(0, 5).map(ticker => (
                                                                    <Badge key={ticker} variant="outline" className="text-xs">
                                                                        {ticker}
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        )}

                                                        <div className="flex items-center gap-2 text-sm text-primary pt-2">
                                                            Leer artículo completo
                                                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Regular News Grid */}
                            {allNews.slice(2).length > 0 && (
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                                        <Newspaper className="w-4 h-4" />
                                        Más Noticias
                                    </h3>
                                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {allNews.slice(2).map((item) => (
                                            <a
                                                key={item.id}
                                                href={item.url}
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
                                                            {item.wasTranslated && (
                                                                <div className="absolute top-2 right-2">
                                                                    <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 text-xs">
                                                                        Traducido
                                                                    </Badge>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                    <CardContent className="p-4 space-y-2">
                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                                                            <Badge variant="secondary" className="text-xs">
                                                                {item.source}
                                                            </Badge>
                                                            <span>•</span>
                                                            <Clock className="w-3 h-3" />
                                                            <span>{formatDate(item.publishedAt)}</span>
                                                            {getSentimentIcon(item.sentiment)}
                                                        </div>

                                                        <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                                                            {item.title}
                                                        </h3>

                                                        <p className="text-xs text-muted-foreground line-clamp-2">
                                                            {item.summary}
                                                        </p>

                                                        {item.tickers && item.tickers.length > 0 && (
                                                            <div className="flex gap-1 flex-wrap">
                                                                {item.tickers.slice(0, 3).map(ticker => (
                                                                    <Badge key={ticker} variant="outline" className="text-xs">
                                                                        {ticker}
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        )}

                                                        <div className="flex items-center gap-1 text-xs text-primary pt-1">
                                                            Leer más
                                                            <ExternalLink className="w-3 h-3" />
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
