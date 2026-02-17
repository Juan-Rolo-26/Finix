import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '../stores/authStore';
import { formatCurrency } from '../lib/utils';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, ArrowUpRight } from 'lucide-react';
import SocialFeed from '../components/SocialFeed';
import { useTranslation } from '@/i18n';

export default function Dashboard() {
    const { user } = useAuthStore();
    const t = useTranslation();
    const [tickers, setTickers] = useState<any[]>([]);
    const [posts, setPosts] = useState<any[]>([]);

    useEffect(() => {
        apiFetch('/market/tickers')
            .then((res) => res.json())
            .then((data) => {
                setTickers(Array.isArray(data) ? data : []);
            })
            .catch(() => {
                setTickers([]);
            });

        // Fetch posts from API - Initial Load
        apiFetch('/posts')
            .then(res => res.json())
            .then(data => {
                const list = Array.isArray(data) ? data : data.posts || [];
                setPosts(list);
            })
            .catch(() => {
                setPosts([]);
            });
    }, []);

    const trending = useMemo(() => {
        const counts = new Map<string, number>();
        for (const post of posts) {
            const raw = typeof post.tickers === 'string' ? post.tickers : '';
            raw.split(',')
                .map((t: string) => t.trim())
                .filter(Boolean)
                .forEach((ticker: string) => {
                    counts.set(ticker, (counts.get(ticker) || 0) + 1);
                });
        }
        return Array.from(counts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([ticker, count]) => ({ ticker, count }));
    }, [posts]);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-heading font-bold">{t.dashboard.welcome} {user?.username} 👋</h1>
                    <p className="text-muted-foreground">{t.dashboard.subtitle}</p>
                </div>
                <div className="flex gap-3">
                    <Link to="/portfolio">
                        <Button className="bg-primary text-black font-bold shadow-glow hover:shadow-intense transition-all">
                            {t.dashboard.newTrade}
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Ticker Tape */}
                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                        {tickers.map(t => (
                            <Card key={t.symbol} className="min-w-[160px] p-4 bg-secondary/30 border-border/50 hover:border-primary/30 transition-colors cursor-pointer group">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-bold font-heading">{t.symbol}</span>
                                    <div className={`p-1 rounded bg-background/50 ${t.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {t.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingUp className="w-3 h-3 rotate-180" />}
                                    </div>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-lg font-mono font-medium">{formatCurrency(t.price, 'USD')}</span>
                                </div>
                                <span className={`text-xs ${t.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {t.change > 0 ? '+' : ''}{t.change.toFixed(2)}%
                                </span>
                            </Card>
                        ))}
                    </div>

                    {/* Unified Social Feed */}
                    <SocialFeed initialPosts={posts} onPostCreated={(newPost) => setPosts([newPost, ...posts])} />

                </div>

                {/* Right Sidebar */}
                <div className="space-y-6 hidden lg:block">
                    <Card className="p-5 border-border/50 bg-secondary/10">
                        <h3 className="font-bold mb-4 font-heading flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-primary" /> {t.dashboard.trends}
                        </h3>
                        <ul className="space-y-4">
                            {trending.length === 0 ? (
                                <li className="text-sm text-muted-foreground">{t.dashboard.noTrends}</li>
                            ) : (
                                trending.map((item) => (
                                    <li key={item.ticker} className="flex justify-between items-center text-sm group cursor-pointer hover:bg-white/5 p-2 -mx-2 rounded transition-colors">
                                        <span className="font-mono font-medium group-hover:text-primary transition-colors">{item.ticker}</span>
                                        <span className="font-medium text-emerald-400">{item.count} {t.dashboard.mentions}</span>
                                    </li>
                                ))
                            )}
                        </ul>
                    </Card>

                    <div className="p-5 rounded-xl bg-gradient-to-br from-indigo-900/40 via-purple-900/40 to-background border border-indigo-500/20 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-indigo-500/10 blur-xl group-hover:bg-indigo-500/20 transition-all duration-500" />
                        <div className="relative">
                            <h3 className="font-bold text-lg mb-2 text-white">{t.dashboard.premium.title}</h3>
                            <p className="text-sm text-indigo-200/80 mb-4 leading-relaxed">
                                {t.dashboard.premium.desc}
                            </p>
                            <Button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white border-0 shadow-lg shadow-indigo-500/20">
                                {t.dashboard.premium.btn} <ArrowUpRight className="w-4 h-4 ml-1" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
