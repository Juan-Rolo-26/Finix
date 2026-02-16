import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';
import TradingViewWidget from '../components/TradingViewWidget';
import { useAuthStore } from '../stores/authStore';
import { formatCurrency } from '../lib/utils';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, MessageSquare, Heart, Share2, MoreHorizontal, ArrowUpRight } from 'lucide-react';

export default function Dashboard() {
    const { user } = useAuthStore();
    const [tickers, setTickers] = useState<any[]>([]);
    const [posts, setPosts] = useState<any[]>([]);
    const [loadingPosts, setLoadingPosts] = useState(true);
    const [postContent, setPostContent] = useState('');
    const [isPosting, setIsPosting] = useState(false);

    useEffect(() => {
        apiFetch('/market/tickers')
            .then((res) => res.json())
            .then((data) => {
                setTickers(Array.isArray(data) ? data : []);
            })
            .catch(() => {
                setTickers([]);
            });

        // Fetch posts from API
        apiFetch('/posts')
            .then(res => res.json())
            .then(data => {
                const list = Array.isArray(data) ? data : data.posts || [];
                setPosts(list);
                setLoadingPosts(false);
            })
            .catch(() => {
                setPosts([]);
                setLoadingPosts(false);
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

    const extractTickers = (content: string) => {
        const matches = content.match(/\$[A-Za-z][A-Za-z0-9]{0,9}/g) || [];
        return Array.from(new Set(matches.map((t) => t.toUpperCase())));
    };

    const handleCreatePost = async () => {
        const trimmed = postContent.trim();
        if (!trimmed) return;
        setIsPosting(true);
        try {
            const tickers = extractTickers(trimmed);
            const res = await apiFetch('/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: trimmed, tickers }),
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Error al publicar');
            }
            setPosts((prev) => [data, ...prev]);
            setPostContent('');
        } catch (error: any) {
            alert(error.message || 'Error al publicar');
        } finally {
            setIsPosting(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-heading font-bold">Hola, {user?.username} 👋</h1>
                    <p className="text-muted-foreground">Aquí está tu resumen del mercado hoy.</p>
                </div>
                <div className="flex gap-3">
                    <Link to="/portfolio">
                        <Button className="bg-primary text-black font-bold shadow-glow hover:shadow-intense transition-all">
                            + Nuevo Trade
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

                    {/* Create Post */}
                    <Card className="p-4 border-border/50 bg-secondary/10">
                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold shrink-0">
                                {user?.username?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div className="flex-1 space-y-3">
                                <input
                                    placeholder="¿Qué estás analizando hoy? (ej. $BTC soporte en 42k...)"
                                    className="w-full bg-transparent border-none focus:ring-0 text-lg placeholder:text-muted-foreground/50"
                                    value={postContent}
                                    onChange={(e) => setPostContent(e.target.value)}
                                />
                                <div className="flex justify-between items-center pt-2 border-t border-border/30">
                                    <div className="flex gap-2">
                                        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary h-8 px-2">
                                            <span className="mr-2">📷</span> Gráfico
                                        </Button>
                                    </div>
                                    <Button size="sm" className="rounded-full font-bold px-6" onClick={handleCreatePost} disabled={isPosting || !postContent.trim()}>
                                        {isPosting ? 'Publicando...' : 'Publicar'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Feed */}
                    {/* Feed */}
                    <div className="space-y-6">
                        {loadingPosts ? (
                            <div className="text-center py-10">Cargando posts...</div>
                        ) : posts.length === 0 ? (
                            <div className="text-center py-10 text-muted-foreground">No hay posts aún. ¡Sé el primero en compartir algo!</div>
                        ) : (
                            posts.map((post) => (
                                <Card key={post.id} className="border-border/50 overflow-hidden bg-secondary/5">
                                    <div className="p-4 md:p-6 pb-0">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                                                    {post.author.username[0].toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-bold text-sm">{post.author.username}</h4>
                                                        {post.author.isInfluencer && (
                                                            <span className="px-1.5 py-0.5 rounded bg-primary/20 text-primary text-[10px] font-bold uppercase">Pro</span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">
                                                        {new Date(post.createdAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreHorizontal className="w-4 h-4" />
                                            </Button>
                                        </div>
                                        <div className="space-y-3">
                                            <p className="text-sm md:text-base leading-relaxed">
                                                {post.content}
                                            </p>
                                            {post.tickers?.includes('$AAPL') && (
                                                <div className="h-[300px] md:h-[400px] w-full bg-black/40 rounded-xl border border-border/30 overflow-hidden">
                                                    <TradingViewWidget symbol="NASDAQ:AAPL" autosize={true} />
                                                </div>
                                            )}
                                            {post.tickers?.includes('$BTC') && (
                                                <div className="h-[300px] md:h-[400px] w-full bg-black/40 rounded-xl border border-border/30 overflow-hidden">
                                                    <TradingViewWidget symbol="BITSTAMP:BTCUSD" autosize={true} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="p-3 md:p-4 mt-2 flex gap-1 md:gap-6 text-sm text-muted-foreground border-t border-border/30 bg-secondary/10">
                                        <Button variant="ghost" size="sm" className="gap-2 hover:text-red-400 hover:bg-red-400/10">
                                            <Heart className="w-4 h-4" /> {post.likes?.length || 0}
                                        </Button>
                                        <Button variant="ghost" size="sm" className="gap-2 hover:text-blue-400 hover:bg-blue-400/10">
                                            <MessageSquare className="w-4 h-4" /> {post.comments?.length || 0}
                                        </Button>
                                        <Button variant="ghost" size="sm" className="gap-2 hover:text-green-400 hover:bg-green-400/10 ml-auto">
                                            <Share2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>

                </div>

                {/* Right Sidebar */}
                <div className="space-y-6 hidden lg:block">
                    <Card className="p-5 border-border/50 bg-secondary/10">
                        <h3 className="font-bold mb-4 font-heading flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-primary" /> Tendencias
                        </h3>
                        <ul className="space-y-4">
                            {trending.length === 0 ? (
                                <li className="text-sm text-muted-foreground">Sin tendencias aún.</li>
                            ) : (
                                trending.map((item) => (
                                    <li key={item.ticker} className="flex justify-between items-center text-sm group cursor-pointer hover:bg-white/5 p-2 -mx-2 rounded transition-colors">
                                        <span className="font-mono font-medium group-hover:text-primary transition-colors">{item.ticker}</span>
                                        <span className="font-medium text-emerald-400">{item.count} menciones</span>
                                    </li>
                                ))
                            )}
                        </ul>
                    </Card>

                    <div className="p-5 rounded-xl bg-gradient-to-br from-indigo-900/40 via-purple-900/40 to-background border border-indigo-500/20 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-indigo-500/10 blur-xl group-hover:bg-indigo-500/20 transition-all duration-500" />
                        <div className="relative">
                            <h3 className="font-bold text-lg mb-2 text-white">Acceso Premium</h3>
                            <p className="text-sm text-indigo-200/80 mb-4 leading-relaxed">
                                Señales de trading en tiempo real, análisis on-chain y acceso al grupo privado de Discord.
                            </p>
                            <Button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white border-0 shadow-lg shadow-indigo-500/20">
                                Mejorar Plan <ArrowUpRight className="w-4 h-4 ml-1" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
