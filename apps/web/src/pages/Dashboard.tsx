import { type KeyboardEvent, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { formatCurrency } from '../lib/utils';
import { Link, useNavigate } from 'react-router-dom';
import { TrendingUp, Award, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import SocialFeed from '../components/SocialFeed';
import { StoriesRail } from '@/components/stories/StoriesRail';
import { motion } from 'framer-motion';

interface User {
    id: string;
    username: string;
    avatarUrl?: string;
    winRate?: number;
    totalReturn?: number;
}

function formatPercent(value?: number | null, fractionDigits = 1) {
    if (typeof value !== 'number' || Number.isNaN(value)) {
        return '--';
    }

    return `${value > 0 ? '+' : ''}${value.toFixed(fractionDigits)}%`;
}

function handleKeyboardAction(event: KeyboardEvent<HTMLElement>, action: () => void) {
    if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        action();
    }
}

const cardVariants = {
    hidden: { opacity: 0, y: 12 },
    show: (i: number) =>
    ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.07, duration: 0.36, ease: 'easeOut' },
    } as const),
};

export default function Dashboard() {
    const navigate = useNavigate();
    const [topAssets, setTopAssets] = useState<any[]>([]);
    const [topTraders, setTopTraders] = useState<User[]>([]);
    const [posts, setPosts] = useState<any[]>([]);

    useEffect(() => {
        apiFetch('/market/tickers')
            .then((res) => res.json())
            .then((data) => {
                let list = Array.isArray(data) ? data : [];
                list.sort((a, b) => b.change - a.change);
                setTopAssets(list.slice(0, 3));
            })
            .catch(() => setTopAssets([]));

        apiFetch('/users/top-traders')
            .then(res => res.json())
            .then(data => {
                setTopTraders(Array.isArray(data) ? data : []);
            })
            .catch(() => setTopTraders([]));

        apiFetch('/posts')
            .then(res => res.json())
            .then(data => {
                const list = Array.isArray(data) ? data : data.posts || [];
                setPosts(list);
            })
            .catch(() => setPosts([]));
    }, []);

    return (
        <div className="page-enter p-4 md:p-6 lg:p-8 w-full max-w-6xl mx-auto pt-2">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">

                {/* ── Main Feed ── */}
                <div className="space-y-4">
                    <StoriesRail />

                    {/* ── Mobile-only: Top Assets + Top Traders horizontal strips ── */}
                    <div className="lg:hidden space-y-3">


                        {/* Top Traders — horizontal scroll */}
                        {topTraders.length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 mb-2 px-0.5">
                                    <div className="w-6 h-6 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                        <Award className="w-3.5 h-3.5 text-amber-500" />
                                    </div>
                                    <span className="text-[13px] font-semibold tracking-tight">Top trades</span>
                                </div>
                                <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
                                    {topTraders.slice(0, 5).map((trader, index) => {
                                        const isUp = (trader.totalReturn ?? 0) >= 0;
                                        const rankColors = ['text-amber-500', 'text-slate-400', 'text-amber-700'];
                                        return (
                                            <motion.button
                                                key={trader.id}
                                                custom={index}
                                                variants={cardVariants}
                                                initial="hidden"
                                                animate="show"
                                                onClick={() => navigate(`/profile/${trader.username}`)}
                                                className="flex-shrink-0 flex flex-col items-center gap-2 rounded-2xl border border-border/50 bg-card/80 px-4 py-3 text-center transition-all active:scale-95"
                                                style={{ minWidth: '100px', boxShadow: '0 2px 8px hsl(220 42% 3% / 0.08)' }}
                                            >
                                                <div className="relative">
                                                    <div className="w-10 h-10 rounded-full overflow-hidden bg-primary/10 ring-1 ring-border/40">
                                                        {trader.avatarUrl ? (
                                                            <img src={trader.avatarUrl} alt={trader.username} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-[13px] font-bold text-primary">
                                                                {trader.username[0].toUpperCase()}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span className={`absolute -top-1 -left-1 text-[10px] font-black ${rankColors[index] ?? 'text-muted-foreground'}`}>
                                                        #{index + 1}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] font-semibold truncate w-full">{trader.username}</p>
                                                <span className={`data-pill ${isUp ? 'data-pill-up' : 'data-pill-down'}`}>
                                                    {isUp ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
                                                    {formatPercent(trader.totalReturn, 1)}
                                                </span>
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    <SocialFeed initialPosts={posts} onPostCreated={(newPost) => setPosts([newPost, ...posts])} />
                </div>

                {/* ── Right Sidebar ── */}
                <aside className="space-y-5 hidden lg:block">

                    {/* Trending Assets Card */}
                    <motion.div
                        custom={0}
                        variants={cardVariants}
                        initial="hidden"
                        animate="show"
                        className="rounded-[20px] border border-border/50 bg-card/70 backdrop-blur-sm overflow-hidden"
                        style={{ boxShadow: '0 2px 12px hsl(220 42% 3% / 0.06)' }}
                    >
                        {/* Card Header */}
                        <div className="flex items-center justify-between px-5 pt-5 pb-3">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                    <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                                </div>
                                <h3 className="text-[13px] font-semibold tracking-tight text-foreground">
                                    Mejor rendimiento
                                </h3>
                            </div>
                            <Link
                                to="/market"
                                className="text-[11px] font-semibold text-primary/60 hover:text-primary transition-colors flex items-center gap-0.5"
                            >
                                Ver todo
                                <ArrowUpRight className="w-3 h-3" />
                            </Link>
                        </div>

                        {/* Asset List */}
                        <div className="px-2 pb-2">
                            {topAssets.length === 0 ? (
                                <div className="px-3 py-4 text-[12px] text-muted-foreground">
                                    Sin datos disponibles
                                </div>
                            ) : (
                                topAssets.map((item) => {
                                    const isUp = item.change >= 0;
                                    return (
                                        <button
                                            key={item.symbol}
                                            type="button"
                                            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl group transition-all hover:bg-primary/5 fintech-row"
                                            onClick={() => navigate(`/market?symbol=${item.symbol}`)}
                                            onKeyDown={(e) => handleKeyboardAction(e, () => navigate(`/market?symbol=${item.symbol}`))}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-primary font-black text-[10px] tracking-wide flex-shrink-0">
                                                    {item.symbol.split(':').pop()?.slice(0, 4)}
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-[13px] font-semibold leading-tight group-hover:text-primary transition-colors">
                                                        {item.symbol.split(':').pop()}
                                                    </p>
                                                    <p className="text-[10px] text-muted-foreground/70 mt-0.5 num">
                                                        Vol {item.volume ? (item.volume / 1_000).toFixed(0) + 'k' : '--'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[13px] font-bold tracking-tight num">
                                                    {formatCurrency(item.price, 'USD')}
                                                </p>
                                                <span className={`data-pill mt-1 ${isUp ? 'data-pill-up' : 'data-pill-down'}`}>
                                                    {isUp
                                                        ? <ArrowUpRight className="w-2.5 h-2.5" />
                                                        : <ArrowDownRight className="w-2.5 h-2.5" />
                                                    }
                                                    {item.change > 0 ? '+' : ''}{item.change.toFixed(2)}%
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </motion.div>

                    {/* Top Traders Card */}
                    <motion.div
                        custom={1}
                        variants={cardVariants}
                        initial="hidden"
                        animate="show"
                        className="rounded-[20px] border border-border/50 bg-card/70 backdrop-blur-sm overflow-hidden"
                        style={{ boxShadow: '0 2px 12px hsl(220 42% 3% / 0.06)' }}
                    >
                        {/* Card Header */}
                        <div className="flex items-center gap-2 px-5 pt-5 pb-3">
                            <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                <Award className="w-3.5 h-3.5 text-amber-500" />
                            </div>
                            <h3 className="text-[13px] font-semibold tracking-tight text-foreground">
                                Top traders
                            </h3>
                        </div>

                        {/* Traders List */}
                        <div className="px-2 pb-2">
                            {topTraders.length === 0 ? (
                                <div className="mx-3 mb-3 rounded-xl border border-dashed border-border/50 bg-muted/20 px-4 py-5 text-center text-[12px] text-muted-foreground">
                                    No hay traders con rendimiento disponible.
                                </div>
                            ) : (
                                topTraders.slice(0, 3).map((trader, index) => {
                                    const isUp = (trader.totalReturn ?? 0) >= 0;
                                    const rankColors = ['text-amber-500', 'text-slate-400', 'text-amber-700'];

                                    return (
                                        <button
                                            key={trader.id}
                                            type="button"
                                            className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl transition-all hover:bg-primary/5 group fintech-row"
                                            onClick={() => navigate(`/profile/${trader.username}`)}
                                            onKeyDown={(e) => handleKeyboardAction(e, () => navigate(`/profile/${trader.username}`))}
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                {/* Rank */}
                                                <span className={`text-[11px] font-black w-4 text-right flex-shrink-0 ${rankColors[index] ?? 'text-muted-foreground'}`}>
                                                    {index + 1}
                                                </span>
                                                {/* Avatar */}
                                                <div className="w-8 h-8 shrink-0 rounded-full overflow-hidden bg-primary/10 ring-1 ring-border/40">
                                                    {trader.avatarUrl ? (
                                                        <img src={trader.avatarUrl} alt={trader.username} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-[11px] font-bold text-primary">
                                                            {trader.username[0].toUpperCase()}
                                                        </div>
                                                    )}
                                                </div>
                                                {/* Info */}
                                                <div className="min-w-0 text-left">
                                                    <p className="truncate text-[13px] font-semibold leading-tight group-hover:text-primary transition-colors">
                                                        {trader.username}
                                                    </p>
                                                    <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                                                        {formatPercent(trader.winRate, 0)} acierto
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="shrink-0 text-right">
                                                <span className={`data-pill ${isUp ? 'data-pill-up' : 'data-pill-down'}`}>
                                                    {isUp ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
                                                    {formatPercent(trader.totalReturn, 1)}
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </motion.div>

                    {/* Footer Links */}
                    <motion.div
                        custom={2}
                        variants={cardVariants}
                        initial="hidden"
                        animate="show"
                        className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-[10px] text-muted-foreground/50 w-full px-2"
                    >
                        <Link to="/about" className="hover:text-primary/70 transition-colors">Sobre Finix</Link>
                        <span className="text-border/50">·</span>
                        <Link to="/help" className="hover:text-primary/70 transition-colors">Ayuda</Link>
                        <span className="text-border/50">·</span>
                        <Link to="/terms" className="hover:text-primary/70 transition-colors">Términos</Link>
                        <span className="text-border/50">·</span>
                        <Link to="/privacy" className="hover:text-primary/70 transition-colors">Privacidad</Link>
                        <div className="w-full text-center mt-1 text-[9px]">© 2025 Finix Network</div>
                    </motion.div>
                </aside>
            </div>
        </div>
    );
}
