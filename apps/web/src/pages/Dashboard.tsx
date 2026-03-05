import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { formatCurrency } from '../lib/utils';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { TrendingUp, Plus, Award } from 'lucide-react';
import SocialFeed from '../components/SocialFeed';

interface User {
    id: string;
    username: string;
    avatarUrl?: string;
    winRate?: number;
    totalReturn?: number;
}

export default function Dashboard() {
    const navigate = useNavigate();
    const [topAssets, setTopAssets] = useState<any[]>([]);
    const [topTraders, setTopTraders] = useState<User[]>([]);
    const [posts, setPosts] = useState<any[]>([]);

    useEffect(() => {
        // Fetch top assets (using tickers sorted by change)
        apiFetch('/market/tickers')
            .then((res) => res.json())
            .then((data) => {
                let list = Array.isArray(data) ? data : [];
                // Sort by highest change
                list.sort((a, b) => b.change - a.change);
                setTopAssets(list.slice(0, 3));
            })
            .catch(() => setTopAssets([]));

        // Fetch Top Traders
        apiFetch('/users/top-traders')
            .then(res => res.json())
            .then(data => {
                setTopTraders(Array.isArray(data) ? data : []);
            })
            .catch(() => setTopTraders([]));

        // Fetch posts from API
        apiFetch('/posts')
            .then(res => res.json())
            .then(data => {
                const list = Array.isArray(data) ? data : data.posts || [];
                setPosts(list);
            })
            .catch(() => setPosts([]));
    }, []);

    return (
        <div className="p-4 md:p-6 lg:p-8 animate-in fade-in duration-500 w-full max-w-6xl mx-auto pt-2">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">

                {/* Main Content (Feed) */}
                <div className="space-y-6">

                    {/* Stories Bar (Top Traders) */}
                    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                        {/* Own story / Add */}
                        <div className="flex flex-col items-center gap-1.5 cursor-pointer flex-shrink-0" onClick={() => navigate('/explore?create=true')}>
                            <div className="w-16 h-16 rounded-full border-2 border-primary border-dashed p-1 flex items-center justify-center bg-primary/10 hover:bg-primary/20 transition-colors">
                                <Plus className="w-6 h-6 text-primary" />
                            </div>
                            <span className="text-[11px] font-medium text-muted-foreground">Post Story</span>
                        </div>

                        {topTraders.map((trader) => (
                            <div key={trader.id} className="flex flex-col items-center gap-1.5 cursor-pointer flex-shrink-0 group" onClick={() => navigate(`/${trader.username}`)}>
                                <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-primary to-emerald-400 group-hover:scale-105 transition-transform">
                                    <div className="w-full h-full rounded-full border-2 border-background overflow-hidden bg-secondary flex items-center justify-center">
                                        {trader.avatarUrl ? (
                                            <img src={trader.avatarUrl} alt={trader.username} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-xl font-bold uppercase">{trader.username[0]}</span>
                                        )}
                                    </div>
                                </div>
                                <span className="text-[11px] font-medium text-muted-foreground w-16 truncate text-center group-hover:text-foreground transition-colors">{trader.username}</span>
                            </div>
                        ))}
                    </div>

                    {/* Filter / Tabs ? */}
                    {/* Unified Social Feed */}
                    <SocialFeed initialPosts={posts} onPostCreated={(newPost) => setPosts([newPost, ...posts])} />

                </div>

                {/* Right Sidebar */}
                <div className="space-y-6 hidden lg:block">

                    {/* Trending Assets */}
                    <Card className="p-5 bg-card border-border/40 rounded-2xl">
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="font-bold flex items-center gap-2 text-sm">
                                <TrendingUp className="w-4 h-4 text-primary" /> Trending Assets
                            </h3>
                            <Link to="/market" className="text-xs text-primary font-medium hover:underline">See all</Link>
                        </div>
                        <ul className="space-y-4">
                            {topAssets.length === 0 ? (
                                <li className="text-sm text-muted-foreground">No data</li>
                            ) : (
                                topAssets.map((item) => (
                                    <li key={item.symbol} className="flex justify-between items-center group cursor-pointer" onClick={() => navigate(`/market?symbol=${item.symbol}`)}>
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-primary font-bold text-xs">
                                                {item.symbol}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold leading-tight group-hover:text-primary transition-colors">{item.symbol}</p>
                                                <p className="text-[11px] text-muted-foreground">Vol: {item.volume ? (item.volume / 1000).toFixed(1) + 'k' : '--'} posts</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold">{formatCurrency(item.price, 'USD')}</p>
                                            <p className={`text-[11px] font-medium ${item.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {item.change > 0 ? '+' : ''}{item.change.toFixed(2)}%
                                            </p>
                                        </div>
                                    </li>
                                ))
                            )}
                        </ul>
                    </Card>

                    {/* Top Traders */}
                    <Card className="p-5 bg-[#0e1613] border-border/40 rounded-2xl">
                        <h3 className="font-bold mb-5 flex items-center gap-2 text-sm">
                            <Award className="w-4 h-4 text-emerald-400" /> Top Traders
                        </h3>
                        <ul className="space-y-4">
                            {topTraders.length === 0 ? (
                                <li className="text-sm text-muted-foreground">No traders found</li>
                            ) : (
                                topTraders.slice(0, 3).map((trader) => (
                                    <li key={trader.id} className="flex justify-between items-center cursor-pointer group" onClick={() => navigate(`/${trader.username}`)}>
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full overflow-hidden bg-secondary">
                                                {trader.avatarUrl ? (
                                                    <img src={trader.avatarUrl} alt={trader.username} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full bg-primary/20 flex items-center justify-center font-bold text-primary text-xs">
                                                        {trader.username[0].toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold leading-tight group-hover:text-primary transition-colors">{trader.username}</p>
                                                <p className="text-[11px] text-muted-foreground">{trader.winRate ? trader.winRate.toFixed(0) : '--'}% Win Rate</p>
                                            </div>
                                        </div>
                                        <div className="px-3 py-1 rounded-full border border-border/50 text-[11px] font-medium hover:bg-white/5 transition-colors">
                                            Follow
                                        </div>
                                    </li>
                                ))
                            )}
                        </ul>
                    </Card>

                    {/* Footer Links */}
                    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[10px] text-muted-foreground/60 w-full">
                        <Link to="/about" className="hover:text-primary transition-colors">About</Link>
                        <span>•</span>
                        <Link to="/help" className="hover:text-primary transition-colors">Help</Link>
                        <span>•</span>
                        <Link to="/terms" className="hover:text-primary transition-colors">Terms</Link>
                        <span>•</span>
                        <Link to="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
                        <div className="w-full text-center mt-1">© 2024 Finix Network</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
