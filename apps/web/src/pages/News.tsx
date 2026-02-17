import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ExternalLink, TrendingUp, Clock, Globe, BarChart2, Zap, AlertTriangle } from 'lucide-react';
import { useTranslation } from '@/i18n';

interface NewsItem {
    id: string;
    headline: string;
    summary: string;
    source: string;
    url: string;
    datetime: number; // Unix timestamp
    category: string;
    related: string;
    image: string;
    sentiment?: 'Positive' | 'Negative' | 'Neutral';
    impact?: 'High' | 'Medium' | 'Low';
}

export default function News() {
    const t = useTranslation();
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'positive' | 'negative' | 'neutral'>('all');

    useEffect(() => {
        const fetchNews = async () => {
            setLoading(true);
            try {
                const res = await apiFetch('/market/news?category=general');
                if (res.ok) {
                    const data = await res.json();
                    setNews(data);
                } else {
                    // Fallback to sample data if API fails or is not ready
                    setNews(SAMPLE_NEWS);
                }
            } catch (error) {
                console.error('Error fetching news:', error);
                setNews(SAMPLE_NEWS);
            } finally {
                setLoading(false);
            }
        };

        fetchNews();
    }, []);

    const formatTime = (timestamp: number) => {
        const date = new Date(timestamp * 1000);
        const now = new Date();
        const diff = Math.floor((now.getTime() - date.getTime()) / 1000); // seconds

        if (diff < 60) return t.time.justNow;
        if (diff < 3600) return t.time.minutesAgo.replace('{{count}}', Math.floor(diff / 60).toString());
        if (diff < 86400) return t.time.hoursAgo.replace('{{count}}', Math.floor(diff / 3600).toString());
        return t.time.daysAgo.replace('{{count}}', Math.floor(diff / 86400).toString());
    };

    const filteredNews = news.filter(item => {
        if (filter === 'all') return true;
        return item.sentiment?.toLowerCase() === filter;
    });

    const getSentimentColor = (sentiment?: string) => {
        switch (sentiment?.toLowerCase()) {
            case 'positive': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            case 'negative': return 'bg-red-500/10 text-red-400 border-red-500/20';
            default: return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
        }
    };

    const getImpactIcon = (impact?: string) => {
        switch (impact) {
            case 'High': return <Zap className="w-3 h-3 text-yellow-400" />;
            case 'Medium': return <Activity className="w-3 h-3 text-blue-400" />;
            default: return <Clock className="w-3 h-3 text-gray-400" />;
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-16">
            {/* Header */}
            <div>
                <h1 className="text-4xl font-heading font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">
                    {t.news.title}
                </h1>
                <p className="text-muted-foreground text-lg max-w-2xl">
                    {t.news.subtitle}
                </p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 p-1 bg-secondary/30 rounded-lg w-fit border border-border/50">
                <span className="px-3 text-sm font-medium text-muted-foreground">
                    {t.news.sentiment.label}
                </span>
                {(['all', 'positive', 'neutral', 'negative'] as const).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-3 py-1.5 text-sm rounded-md transition-all ${filter === f
                            ? 'bg-primary text-primary-foreground font-medium shadow-sm'
                            : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                            }`}
                    >
                        {f === 'all' && t.news.sentiment.all}
                        {f === 'positive' && t.news.sentiment.positive}
                        {f === 'neutral' && t.news.sentiment.neutral}
                        {f === 'negative' && t.news.sentiment.negative}
                    </button>
                ))}
            </div>

            {/* News Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    // Skeletons
                    Array.from({ length: 9 }).map((_, i) => (
                        <Card key={i} className="flex flex-col h-[320px] overflow-hidden border-border/40">
                            <Skeleton className="h-48 w-full" />
                            <div className="p-4 space-y-3 flex-1">
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-3 w-full" />
                                <Skeleton className="h-3 w-5/6" />
                            </div>
                        </Card>
                    ))
                ) : filteredNews.length > 0 ? (
                    filteredNews.map((item) => (
                        <Card key={item.id} className="group flex flex-col overflow-hidden bg-card/40 border-border/40 hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/5">
                            {/* Image & Overlay */}
                            <div className="relative h-48 overflow-hidden">
                                <img
                                    src={item.image}
                                    alt={item.headline}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1611974765270-ca1258634369?q=80&w=2064&auto=format&fit=crop';
                                    }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                                    <Badge variant="secondary" className="bg-black/40 backdrop-blur-sm border-white/10 text-white text-xs">
                                        {item.source}
                                    </Badge>
                                    <span className="text-xs text-gray-300 font-medium bg-black/40 px-2 py-0.5 rounded backdrop-blur-sm">
                                        {formatTime(item.datetime)}
                                    </span>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-4 flex flex-col flex-1 gap-3">
                                {/* Tags */}
                                <div className="flex flex-wrap gap-2">
                                    <Badge variant="outline" className={`text-[10px] px-2 py-0.5 h-auto ${getSentimentColor(item.sentiment)}`}>
                                        {item.sentiment === 'Positive' ? <TrendingUp className="w-3 h-3 mr-1" /> : item.sentiment === 'Negative' ? <TrendingUp className="w-3 h-3 mr-1 rotate-180" /> : <BarChart2 className="w-3 h-3 mr-1" />}
                                        {item.sentiment === 'Positive' ? t.news.sentiment.positive : item.sentiment === 'Negative' ? t.news.sentiment.negative : t.news.sentiment.neutral}
                                    </Badge>
                                    <Badge variant="outline" className="text-[10px] px-2 py-0.5 h-auto border-border/40 text-muted-foreground">
                                        {item.category}
                                    </Badge>
                                    {item.impact && (
                                        <Badge variant="outline" className="text-[10px] px-2 py-0.5 h-auto border-yellow-500/20 text-yellow-500/80">
                                            {getImpactIcon(item.impact)}
                                            <span className="ml-1">
                                                {item.impact === 'High' ? t.news.impact.high : item.impact === 'Medium' ? t.news.impact.medium : t.news.impact.low}
                                            </span>
                                        </Badge>
                                    )}
                                </div>

                                <h3 className="font-bold text-lg leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                                    {item.headline}
                                </h3>

                                <p className="text-sm text-muted-foreground line-clamp-3 mb-2 flex-1">
                                    {item.summary}
                                </p>

                                <Button asChild variant="ghost" size="sm" className="w-full justify-between items-center text-xs mt-auto group/btn hover:bg-primary/10 hover:text-primary">
                                    <a href={item.url} target="_blank" rel="noopener noreferrer">
                                        {t.news.readFull}
                                        <ExternalLink className="w-3 h-3 ml-2 transition-transform group-hover/btn:translate-x-1" />
                                    </a>
                                </Button>
                            </div>
                        </Card>
                    ))
                ) : (
                    <div className="col-span-full py-12 text-center text-muted-foreground bg-secondary/10 rounded-xl border border-dashed border-border/50">
                        <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>{t.news.noNews}</p>
                    </div>
                )}
            </div>
            {!loading && news.length > 0 && (
                <div className="flex justify-center pt-8">
                    <Button variant="outline" className="gap-2 w-full md:w-auto">
                        <Globe className="w-4 h-4" />
                        {t.news.moreNews}
                    </Button>
                </div>
            )}
        </div>
    );
}

// Minimal Sample Data for Fallback
const SAMPLE_NEWS: NewsItem[] = [
    {
        id: '1',
        headline: 'Bitcoin Surges Past $65k as Institutional Interest Grows',
        summary: 'Major financial institutions are increasing their exposure to cryptocurrency, driving Bitcoin prices to new yearly highs.',
        source: 'CryptoDaily',
        url: '#',
        datetime: Math.floor(Date.now() / 1000) - 3600,
        category: 'Crypto',
        related: 'BTC',
        image: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?q=80&w=2069&auto=format&fit=crop',
        sentiment: 'Positive',
        impact: 'High'
    },
    {
        id: '2',
        headline: 'Fed Chair Powell Hints at Rate Cuts later this year',
        summary: 'In his latest testimony, Jerome Powell suggested that the Federal Reserve may begin easing monetary policy if inflation continues to cool.',
        source: 'FinancePro',
        url: '#',
        datetime: Math.floor(Date.now() / 1000) - 7200,
        category: 'Economy',
        related: 'USD',
        image: 'https://images.unsplash.com/photo-1611974765270-ca1258634369?q=80&w=2064&auto=format&fit=crop',
        sentiment: 'Positive',
        impact: 'High'
    },
    {
        id: '3',
        headline: 'Tech Stocks Rally Ahead of Earnings Season',
        summary: 'Investors remain optimistic about AI-driven growth as major tech giants prepare to report quarterly earnings.',
        source: 'MarketWatch',
        url: '#',
        datetime: Math.floor(Date.now() / 1000) - 18000,
        category: 'Stocks',
        related: 'NASDAQ',
        image: 'https://images.unsplash.com/photo-1611974765270-ca1258634369?q=80&w=2064&auto=format&fit=crop',
        sentiment: 'Neutral',
        impact: 'Medium'
    }
];

function Activity(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
    )
}
