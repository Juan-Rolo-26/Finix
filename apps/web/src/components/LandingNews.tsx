import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Clock } from 'lucide-react';

interface NewsItem {
    id: string;
    title: string;
    summary: string;
    url: string;
    imageUrl?: string;
    source: { name: string };
    category?: { name: string; slug: string };
    publishedAt: string;
}

export default function LandingNews() {
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const res = await apiFetch('/news?limit=3');
                if (res.ok) {
                    const data = await res.json();
                    setNews(Array.isArray(data) ? data : []);
                }
            } catch (err) {
                console.error('Failed to fetch news', err);
            } finally {
                setLoading(false);
            }
        };
        fetchNews();
    }, []);

    if (loading || news.length === 0) {
        return null; // Si no hay noticias, no muestra nada
    }

    return (
        <div className="w-full max-w-6xl mx-auto px-6 py-12 lg:py-20 relative z-10">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-foreground">Últimas Noticias</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {news.map((item) => (
                    <a
                        key={item.id}
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="group flex flex-col bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl overflow-hidden hover:border-primary/50 transition-all hover:shadow-lg hover:-translate-y-1"
                    >
                        {item.imageUrl && (
                            <div className="h-48 w-full overflow-hidden">
                                <img
                                    src={item.imageUrl}
                                    alt={item.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                            </div>
                        )}
                        <div className="p-5 flex flex-col flex-1">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                                    {item.category?.name || 'Noticia'}
                                </span>
                                <span className="text-muted-foreground/50">•</span>
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {new Date(item.publishedAt).toLocaleDateString()}
                                </span>
                            </div>
                            <h3 className="font-bold text-foreground leading-snug mb-2 group-hover:text-primary transition-colors">
                                {item.title}
                            </h3>
                            {item.summary && (
                                <p className="text-sm text-muted-foreground line-clamp-2 mt-auto">
                                    {item.summary}
                                </p>
                            )}
                        </div>
                    </a>
                ))}
            </div>
        </div>
    );
}
