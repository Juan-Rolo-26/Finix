import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { resolveMediaUrl } from '@/lib/mediaUrl';
import { formatCurrency } from '../lib/utils';
import { Link, useNavigate } from 'react-router-dom';
import {
    TrendingUp, TrendingDown,
    Award,
    ArrowUpRight,
    ArrowDownRight,
    ChevronRight,
    Flame,
    Users,
    BarChart2,
    Newspaper,
} from 'lucide-react';
import SocialFeed from '../components/SocialFeed';
import { StoriesRail } from '@/components/stories/StoriesRail';
import { motion, AnimatePresence } from 'framer-motion';

interface User {
    id: string;
    username: string;
    avatarUrl?: string;
    winRate?: number;
    totalReturn?: number;
}

interface MarketTicker {
    symbol: string;
    price: number;
    change: number;
    changePercent?: number;
}

function formatPercent(value?: number | null, fractionDigits = 1) {
    if (typeof value !== 'number' || Number.isNaN(value)) return '--';
    return `${value > 0 ? '+' : ''}${value.toFixed(fractionDigits)}%`;
}



const FEED_TABS = [
    { key: 'forYou', label: 'Para vos', icon: Flame },
    { key: 'following', label: 'Siguiendo', icon: Users },
    { key: 'trending', label: 'Tendencias', icon: BarChart2 },
] as const;

type FeedTab = typeof FEED_TABS[number]['key'];

/* ── Symbol Logo ────────────────────────────────────────────────── */
/**
 * Resolves a TradingView-style symbol (e.g. "NASDAQ:TSLA") to the company
 * logo URL from TradingView's public CDN, with a coloured-letter fallback.
 */
import { SymbolLogo } from '@/components/SymbolLogo';

function TickerItem({ t }: { t: MarketTicker }) {
    const val = t.changePercent ?? t.change;
    const isUp = val >= 0;
    const sym = t.symbol.split(':').pop() || t.symbol;
    const label = sym === 'BTCUSD' ? 'BTC' : sym === 'ETHUSD' ? 'ETH' : sym.replace('USD', '');

    return (
        <div className="flex items-center gap-2.5 px-4 py-2.5 border-r border-border/40 last:border-r-0 flex-shrink-0 hover:bg-muted/30 transition-colors cursor-pointer">
            <SymbolLogo symbol={t.symbol} size={26} />
            <div className="flex flex-col">
                <span className="text-[10.5px] font-bold tracking-widest uppercase" style={{ color: 'hsl(var(--muted-foreground))' }}>{label}</span>
                <span className="text-[12px] font-bold num text-foreground">{formatCurrency(t.price, 'USD')}</span>
            </div>
            <span className="flex items-center gap-0.5 text-[11px] font-bold num ml-auto"
                style={{ color: isUp ? 'hsl(142 70% 45%)' : 'hsl(0 68% 56%)' }}>
                {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {isUp ? '+' : ''}{val.toFixed(2)}%
            </span>
        </div>
    );
}

function MarketTicker({ tickers }: { tickers: MarketTicker[] }) {
    if (tickers.length === 0) return null;
    return (
        <div className="rounded-2xl overflow-hidden flex-shrink-0"
            style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.5)' }}>
            <div className="flex overflow-x-auto scrollbar-hide">
                {/* Live indicator */}
                <div className="flex items-center gap-2 px-4 py-2 border-r flex-shrink-0" style={{ borderColor: 'hsl(var(--border) / 0.4)' }}>
                    <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                    </span>
                    <span className="text-[9.5px] font-bold tracking-widest uppercase text-emerald-500">Live</span>
                </div>
                {tickers.map(t => <TickerItem key={t.symbol} t={t} />)}
            </div>
        </div>
    );
}

/* ── Feed Tabs ──────────────────────────────────────────────────── */
function FeedTabs({ active, onChange }: { active: FeedTab; onChange: (t: FeedTab) => void }) {
    return (
        <div className="flex items-center gap-1 p-1 rounded-2xl"
            style={{ background: 'hsl(var(--secondary) / 0.45)' }}>
            {FEED_TABS.map((tab) => {
                const isActive = tab.key === active;
                const Icon = tab.icon;
                return (
                    <button
                        key={tab.key}
                        onClick={() => onChange(tab.key)}
                        className={`relative items-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2 rounded-xl text-[12px] sm:text-[13px] font-semibold transition-all select-none flex-1 justify-center whitespace-nowrap ${tab.key === 'forYou' ? 'hidden sm:flex' : 'flex'}`}
                        style={{
                            color: isActive ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
                            background: isActive ? 'hsl(var(--card))' : 'transparent',
                            boxShadow: isActive ? '0 1px 8px hsl(220 42% 3% / 0.2)' : 'none',
                        }}
                    >
                        {isActive && (
                            <motion.div
                                layoutId="tab-bg"
                                className="absolute inset-0 rounded-xl"
                                style={{ background: 'hsl(var(--card))', zIndex: 0 }}
                                initial={false}
                                transition={{ type: 'spring', stiffness: 380, damping: 34 }}
                            />
                        )}
                        <Icon className="w-3.5 h-3.5 relative z-10 shrink-0" style={{ color: isActive ? 'hsl(var(--primary))' : undefined }} />
                        <span className="relative z-10 tracking-tight">{tab.label}</span>
                    </button>
                );
            })}
        </div>
    );
}

/* ── Sidebar asset row ──────────────────────────────────────────── */
function AssetRow({ item, onClick }: { item: any; onClick: () => void }) {
    const isUp = item.change >= 0;
    const sym = item.symbol?.split(':').pop() ?? item.symbol;
    return (
        <button
            onClick={onClick}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all hover:bg-white/[0.04] group"
        >
            <div className="flex items-center gap-2.5">
                <SymbolLogo symbol={item.symbol ?? sym} size={32} />
                <div className="text-left">
                    <p className="text-[12.5px] font-semibold leading-tight group-hover:text-primary transition-colors">{sym}</p>
                    <p className="text-[10px] font-medium" style={{ color: 'hsl(var(--muted-foreground) / 0.5)' }}>
                        Vol {item.volume ? (item.volume / 1_000_000).toFixed(1) + 'M' : '--'}
                    </p>
                </div>
            </div>
            <div className="text-right">
                <p className="text-[12.5px] font-bold num">{formatCurrency(item.price, 'USD')}</p>
                <div className="flex items-center justify-end gap-0.5 mt-0.5">
                    {isUp ? <TrendingUp className="w-2.5 h-2.5" style={{ color: 'hsl(142 70% 45%)' }} /> : <TrendingDown className="w-2.5 h-2.5" style={{ color: 'hsl(0 68% 56%)' }} />}
                    <span className="text-[10.5px] font-bold num" style={{ color: isUp ? 'hsl(142 70% 45%)' : 'hsl(0 68% 56%)' }}>
                        {item.change > 0 ? '+' : ''}{item.change.toFixed(2)}%
                    </span>
                </div>
            </div>
        </button>
    );
}

/* ── Sidebar card shell ─────────────────────────────────────────── */
function SideCard({ title, icon, iconColor, iconBg, to, toLabel, children, index }: {
    title: string;
    icon: React.ReactNode;
    iconColor: string;
    iconBg: string;
    to?: string;
    toLabel?: string;
    children: React.ReactNode;
    index: number;
}) {
    return (
        <motion.div
            custom={index}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0, transition: { delay: index * 0.08, duration: 0.35, ease: 'easeOut' } }}
            className="rounded-2xl overflow-hidden"
            style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.5)' }}
        >
            <div className="flex items-center justify-between px-4 pt-4 pb-3">
                <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: iconBg }}>
                        <span style={{ color: iconColor }}>{icon}</span>
                    </div>
                    <h3 className="text-[13px] font-bold">{title}</h3>
                </div>
                {to && (
                    <Link to={to}
                        className="text-[11.5px] font-semibold flex items-center gap-0.5 transition-colors"
                        style={{ color: 'hsl(var(--primary) / 0.6)' }}
                        onMouseEnter={e => (e.currentTarget.style.color = 'hsl(var(--primary))')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'hsl(var(--primary) / 0.6)')}
                    >
                        {toLabel ?? 'Ver todo'}<ChevronRight className="w-3 h-3" />
                    </Link>
                )}
            </div>
            <div className="pb-2">{children}</div>
        </motion.div>
    );
}

/* ── Main Dashboard ─────────────────────────────────────────────── */
export default function Dashboard() {
    const navigate = useNavigate();
    const [topAssets, setTopAssets] = useState<any[]>([]);
    const [topTraders, setTopTraders] = useState<User[]>([]);
    const [posts, setPosts] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<FeedTab>('forYou');

    useEffect(() => {
        apiFetch('/market/tickers')
            .then(r => r.json())
            .then((data: any) => {
                const list = Array.isArray(data) ? data : [];
                const sorted = [...list].sort((a: any, b: any) => Math.abs(b.change) - Math.abs(a.change));
                setTopAssets(sorted.slice(0, 6));
            })
            .catch(() => { });

        apiFetch('/users/top-traders')
            .then(r => r.json())
            .then(data => setTopTraders(Array.isArray(data) ? data : []))
            .catch(() => { });

        apiFetch('/posts')
            .then(r => r.json())
            .then(data => setPosts(Array.isArray(data) ? data : data?.posts ?? []))
            .catch(() => { });
    }, []);

    return (
        <div className="page-enter w-full max-w-[1920px] mx-auto px-4 py-6 md:px-6 xl:px-8">
            {/* 
              Responsive Grid:
              - Mobile/Tablet: 1 column
              - Desktop (lg): 2 columns (Feed + Right Sidebar)
              - Ultrawide (2xl): 3 columns (Feed + Market + Connect/News) for perfect full-width distribution
            */}
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] 2xl:grid-cols-[minmax(0,1fr)_340px_340px] gap-6 xl:gap-8">

                {/* ── Left Column: Main Feed ── */}
                <div className="space-y-4 min-w-0 max-w-[800px] w-full mx-auto 2xl:mx-0 2xl:max-w-none">

                    {/* Top stories */}
                    <StoriesRail />

                    {/* Main Feed Container */}
                    <div className="rounded-2xl border transition-all duration-300"
                        style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border) / 0.5)', boxShadow: '0 4px 20px hsl(0 0% 0% / 0.1)' }}>
                        <div className="p-3 pb-0 border-b" style={{ borderColor: 'hsl(var(--border) / 0.4)' }}>
                            <FeedTabs active={activeTab} onChange={setActiveTab} />
                        </div>
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                transition={{ duration: 0.18 }}
                                className="p-4"
                            >
                                <SocialFeed
                                    initialPosts={posts}
                                    onPostCreated={(newPost) => setPosts([newPost, ...posts])}
                                />
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>

                {/* ── Middle Column (or joined in Right on lg) ── */}
                <aside className="hidden lg:flex flex-col gap-5">


                    {/* Trending Assets */}
                    <SideCard
                        index={0}
                        title="Mejores rendimientos"
                        icon={<TrendingUp className="w-4 h-4" />}
                        iconColor="hsl(142 70% 50%)"
                        iconBg="hsl(142 70% 45% / 0.15)"
                        to="/market"
                        toLabel="Ver todos"
                    >
                        {topAssets.length === 0 ? (
                            <p className="px-5 pb-4 text-[13px]" style={{ color: 'hsl(var(--muted-foreground))' }}>Sin datos disponibles</p>
                        ) : (
                            <div className="px-2 pb-2">
                                {topAssets.map(item => (
                                    <AssetRow
                                        key={item.symbol}
                                        item={item}
                                        onClick={() => navigate(`/market?symbol=${item.symbol}`)}
                                    />
                                ))}
                            </div>
                        )}
                    </SideCard>

                    {/* News / Pulse (lg only, moved to right on 2xl) */}
                    <div className="2xl:hidden">
                        <SideCard
                            index={2}
                            title="Noticias y pulso"
                            icon={<Newspaper className="w-4 h-4" />}
                            iconColor="hsl(215 90% 65%)"
                            iconBg="hsl(215 90% 65% / 0.15)"
                            to="/news"
                            toLabel="Abrir"
                        >
                            <div className="px-5 pb-4 pt-1">
                                <p className="text-[13px] leading-relaxed mb-3" style={{ color: 'hsl(var(--muted-foreground) / 0.8)' }}>
                                    Mercados, cripto y economía. Mantente un paso adelante.
                                </p>
                                <button onClick={() => navigate('/news')} className="w-full py-2.5 rounded-xl text-[12.5px] font-bold text-white transition-all hover:opacity-90"
                                    style={{ background: 'linear-gradient(135deg, hsl(215 90% 55%), hsl(280 65% 55%))' }}>
                                    Leer titulares
                                </button>
                            </div>
                        </SideCard>
                    </div>

                    {/* Eventos Económicos */}
                    <SideCard
                        index={3}
                        title="Calendario Económico"
                        icon={<Award className="w-4 h-4" />}
                        iconColor="hsl(280 65% 60%)"
                        iconBg="hsl(280 65% 60% / 0.15)"
                        to="/market"
                        toLabel="Ver calendario"
                    >
                        <div className="px-5 pb-5 pt-1 space-y-4">
                            {[
                                { time: '10:30', flag: '🇺🇸', event: 'Índice de Precios al Consumidor (IPC)', impact: 'Alto', color: 'hsl(0 80% 60%)' },
                                { time: '12:00', flag: '🇪🇺', event: 'Declaraciones de Lagarde (BCE)', impact: 'Medio', color: 'hsl(38 90% 55%)' },
                                { time: '15:15', flag: '🇺🇸', event: 'Producción Industrial mensual', impact: 'Medio', color: 'hsl(38 90% 55%)' }
                            ].map((evt, j) => (
                                <div key={j} className="flex items-start gap-3 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate('/market')}>
                                    <span className="text-[11.5px] font-bold text-foreground mt-0.5">{evt.time}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5 mb-0.5">
                                            <span>{evt.flag}</span>
                                            <span className="text-[9.5px] font-bold tracking-wider uppercase" style={{ color: evt.color }}>Impacto {evt.impact}</span>
                                        </div>
                                        <p className="text-[13px] font-medium leading-snug truncate" style={{ color: 'hsl(var(--foreground) / 0.8)' }}>
                                            {evt.event}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </SideCard>

                </aside>

                {/* ── Right Column (2xl only) ── */}
                <aside className="hidden 2xl:flex flex-col gap-5">

                    {/* Top Traders */}
                    <SideCard
                        index={1}
                        title="Top Inversores"
                        icon={<Award className="w-4 h-4" />}
                        iconColor="hsl(38 100% 55%)"
                        iconBg="hsl(38 100% 55% / 0.15)"
                        to="/explore"
                        toLabel="Ránking"
                    >
                        {topTraders.length === 0 ? (
                            <p className="px-5 pb-4 text-[13px]" style={{ color: 'hsl(var(--muted-foreground))' }}>No hay traders disponibles</p>
                        ) : (
                            <div className="px-2 pb-2">
                                {topTraders.slice(0, 6).map((trader, i) => {
                                    const isUp = (trader.totalReturn ?? 0) >= 0;
                                    const rankColors = ['hsl(38 100% 55%)', 'hsl(220 14% 70%)', 'hsl(30 70% 50%)'];
                                    return (
                                        <button
                                            key={trader.id}
                                            onClick={() => navigate(`/profile/${trader.username}`)}
                                            className="w-full flex items-center justify-between gap-3 px-3 py-3 rounded-xl transition-all hover:bg-white/[0.04] group"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <span className="text-[11.5px] font-black w-5 text-center flex-shrink-0" style={{ color: rankColors[i] ?? 'hsl(var(--muted-foreground))' }}>
                                                    {i + 1}
                                                </span>
                                                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-background shadow-sm"
                                                    style={{ background: 'hsl(var(--primary) / 0.15)' }}>
                                                    {trader.avatarUrl
                                                        ? <img src={resolveMediaUrl(trader.avatarUrl)} alt={trader.username} className="w-full h-full object-cover" />
                                                        : <div className="w-full h-full flex items-center justify-center text-[12px] font-bold" style={{ color: 'hsl(var(--primary))' }}>
                                                            {trader.username[0].toUpperCase()}
                                                        </div>
                                                    }
                                                </div>
                                                <div className="min-w-0 text-left">
                                                    <p className="text-[13.5px] font-bold truncate group-hover:text-primary transition-colors">{trader.username}</p>
                                                    <p className="text-[11px] font-medium" style={{ color: 'hsl(var(--muted-foreground) / 0.6)' }}>
                                                        {formatPercent(trader.winRate, 0)} acierto
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="text-[12.5px] font-black num flex-shrink-0 px-2 py-1 rounded-lg"
                                                style={{ background: isUp ? 'hsl(142 70% 45% / 0.12)' : 'hsl(0 68% 56% / 0.12)', color: isUp ? 'hsl(142 70% 50%)' : 'hsl(0 68% 60%)' }}>
                                                {isUp ? '+' : ''}{formatPercent(trader.totalReturn)}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </SideCard>

                    {/* Dedicated News Card for 2xl */}
                    <SideCard
                        index={2}
                        title="Titulares del día"
                        icon={<Newspaper className="w-4 h-4" />}
                        iconColor="hsl(215 90% 65%)"
                        iconBg="hsl(215 90% 65% / 0.15)"
                        to="/news"
                        toLabel="Noticias"
                    >
                        <div className="px-5 pb-5 pt-1 space-y-4">
                            <div className="flex flex-col gap-1.5 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate('/news')}>
                                <span className="text-[10px] font-bold tracking-wider uppercase" style={{ color: 'hsl(280 65% 65%)' }}>MARKETS</span>
                                <h4 className="text-[13.5px] font-semibold leading-snug">El S&P 500 alcanza nuevo máximo histórico impulsado por tech</h4>
                                <span className="text-[11px]" style={{ color: 'hsl(var(--muted-foreground) / 0.5)' }}>Hace 2h · Bloomberg</span>
                            </div>
                            <div className="flex flex-col gap-1.5 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate('/news')}>
                                <span className="text-[10px] font-bold tracking-wider uppercase" style={{ color: 'hsl(38 88% 52%)' }}>CRYPTO</span>
                                <h4 className="text-[13.5px] font-semibold leading-snug">Bitcoin consolida sobre resistencia clave, analistas prevén rally</h4>
                                <span className="text-[11px]" style={{ color: 'hsl(var(--muted-foreground) / 0.5)' }}>Hace 5h · CoinDesk</span>
                            </div>
                            <div className="flex flex-col gap-1.5 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate('/news')}>
                                <span className="text-[10px] font-bold tracking-wider uppercase" style={{ color: 'hsl(200 90% 60%)' }}>ECONOMÍA</span>
                                <h4 className="text-[13.5px] font-semibold leading-snug">La Fed sugiere un recorte de tasas más leve en la próxima reunión</h4>
                                <span className="text-[11px]" style={{ color: 'hsl(var(--muted-foreground) / 0.5)' }}>Hace 8h · Reuters</span>
                            </div>
                            <div className="flex flex-col gap-1.5 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate('/news')}>
                                <span className="text-[10px] font-bold tracking-wider uppercase" style={{ color: 'hsl(350 75% 65%)' }}>EMPRESAS</span>
                                <h4 className="text-[13.5px] font-semibold leading-snug">Nvidia anuncia resultados trimestrales récord y sorprende al mercado</h4>
                                <span className="text-[11px]" style={{ color: 'hsl(var(--muted-foreground) / 0.5)' }}>Hace 11h · WSJ</span>
                            </div>
                        </div>
                    </SideCard>

                    <div className="flex flex-wrap gap-x-4 gap-y-2 text-[11px] font-medium px-2 mt-2" style={{ color: 'hsl(var(--muted-foreground) / 0.45)' }}>
                        <Link to="/about" className="hover:text-primary/70 transition-colors">Sobre Finix</Link>
                        <Link to="/help" className="hover:text-primary/70 transition-colors">Ayuda</Link>
                        <Link to="/terms" className="hover:text-primary/70 transition-colors">Términos</Link>
                        <Link to="/privacy" className="hover:text-primary/70 transition-colors">Privacidad</Link>
                        <Link to="/cookies" className="hover:text-primary/70 transition-colors">Cookies</Link>
                        <div className="w-full mt-2 text-[10.5px]">© 2026 Finix Network Inc.</div>
                    </div>
                </aside>

            </div>
        </div>
    );
}
