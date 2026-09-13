import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { formatCurrency } from '../lib/utils';
import { Link, useNavigate } from 'react-router-dom';
import {
    ArrowUpRight,
    ArrowDownRight,
    ChevronRight,
    Flame,
    Users,
    Compass,
    Newspaper,
} from 'lucide-react';
import SocialFeed from '../components/SocialFeed';
import { StoriesRail } from '@/components/stories/StoriesRail';
import { motion, AnimatePresence } from 'framer-motion';
import { TopGainersCard } from '@/components/TopGainersCard';
import { TopLosersCard } from '@/components/TopLosersCard';
import { CalendarPreviewCard } from '@/components/CalendarPreviewCard';

interface MarketTicker {
    symbol: string;
    price: number;
    change: number;
    changePercent?: number;
}

const FEED_TABS = [
    { key: 'general', label: 'General', icon: Compass },
    { key: 'following', label: 'Siguiendo', icon: Users },
    { key: 'finix_oficial', label: 'Finix', icon: Flame },
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
                        className={`relative items-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2 rounded-xl text-[12px] sm:text-[13px] font-semibold transition-all select-none flex-1 justify-center whitespace-nowrap ${tab.key === 'finix_oficial' ? 'hidden sm:flex' : 'flex'}`}
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

/* ── Feed Memory Cache for Instant Loading ──────────────────────── */
const feedMemoryCache: Record<string, any[]> = {};

function getCachedFeed(tab: string) {
    if (feedMemoryCache[tab] && feedMemoryCache[tab].length > 0) {
        return feedMemoryCache[tab];
    }
    if (typeof window !== 'undefined') {
        try {
            const raw = sessionStorage.getItem(`finix_cached_feed_${tab}`);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    feedMemoryCache[tab] = parsed;
                    return parsed;
                }
            }
        } catch {}
    }
    return [];
}

/* ── Main Dashboard ─────────────────────────────────────────────── */
export default function Dashboard() {
    const navigate = useNavigate();
    const [topGainers, setTopGainers] = useState<any[]>([]);
    const [isGainersLoading, setIsGainersLoading] = useState<boolean>(true);
    const [isGainersError, setIsGainersError] = useState<boolean>(false);
    const [gainersStale, setGainersStale] = useState<boolean>(false);
    const [gainersDate, setGainersDate] = useState<string>('');

    const [topLosers, setTopLosers] = useState<any[]>([]);
    const [isLosersLoading, setIsLosersLoading] = useState<boolean>(true);
    const [isLosersError, setIsLosersError] = useState<boolean>(false);
    const [losersStale, setLosersStale] = useState<boolean>(false);
    const [losersDate, setLosersDate] = useState<string>('');

    const [activeTab, setActiveTab] = useState<FeedTab>('general');
    const [posts, setPosts] = useState<any[]>(() => getCachedFeed('general'));
    const [isFeedLoading, setIsFeedLoading] = useState<boolean>(() => getCachedFeed('general').length === 0);

    // Map UI tabs to backend sort values
    const tabToSort: Record<FeedTab, string> = {
        general: 'general',
        following: 'following',
        finix_oficial: 'finix_oficial',
    };

    const fetchTopGainers = () => {
        setIsGainersLoading(true);
        setIsGainersError(false);
        apiFetch('/market/rankings/top-gainers')
            .then(r => {
                if (!r.ok) throw new Error('Failed to load top gainers');
                return r.json();
            })
            .then((data: any) => {
                const list = Array.isArray(data?.items) ? data.items : [];
                setTopGainers(list);
                setGainersStale(Boolean(data?.isStale));
                setGainersDate(data?.date || '');
            })
            .catch(() => {
                setIsGainersError(true);
            })
            .finally(() => {
                setIsGainersLoading(false);
            });
    };

    const fetchTopLosers = () => {
        setIsLosersLoading(true);
        setIsLosersError(false);
        apiFetch('/market/rankings/top-losers')
            .then(r => {
                if (!r.ok) throw new Error('Failed to load top losers');
                return r.json();
            })
            .then((data: any) => {
                const list = Array.isArray(data?.items) ? data.items : [];
                setTopLosers(list);
                setLosersStale(Boolean(data?.isStale));
                setLosersDate(data?.date || '');
            })
            .catch(() => {
                setIsLosersError(true);
            })
            .finally(() => {
                setIsLosersLoading(false);
            });
    };

    useEffect(() => {
        fetchTopGainers();
        fetchTopLosers();
    }, []);

    // Fetch posts when tab changes with instant cache and background revalidation
    useEffect(() => {
        let isMounted = true;
        const sort = tabToSort[activeTab];
        const cached = getCachedFeed(activeTab);

        if (cached.length > 0) {
            setPosts(cached);
            setIsFeedLoading(false);
        } else {
            setPosts([]);
            setIsFeedLoading(true);
        }

        apiFetch(`/posts/feed?sort=${sort}&limit=20`)
            .then(r => r.json())
            .then(data => {
                if (!isMounted) return;
                const list = Array.isArray(data) ? data : (data?.posts ?? []);
                setPosts(list);
                feedMemoryCache[activeTab] = list;
                try {
                    sessionStorage.setItem(`finix_cached_feed_${activeTab}`, JSON.stringify(list));
                } catch {}
            })
            .catch(() => {
                if (!isMounted) return;
                if (cached.length === 0) setPosts([]);
            })
            .finally(() => {
                if (isMounted) setIsFeedLoading(false);
            });

        return () => { isMounted = false; };
    }, [activeTab]);


    return (
        <div className="page-enter w-full max-w-[1920px] mx-auto px-4 py-6 md:px-6 xl:px-8">
            {/* 
              Responsive Grid:
              - Mobile/Tablet: 1 column
              - Desktop (lg): 2 columns (Feed + Right Sidebar)
              - Ultrawide (2xl): 3 columns (Feed + Market + Connect/News) for perfect full-width distribution
            */}
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] 2xl:grid-cols-[minmax(0,1fr)_340px_340px] gap-6 xl:gap-8 items-start">

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
                                    isLoading={isFeedLoading}
                                    onPostCreated={(newPost) => {
                                        const next = [newPost, ...posts];
                                        setPosts(next);
                                        feedMemoryCache[activeTab] = next;
                                        try {
                                            sessionStorage.setItem(`finix_cached_feed_${activeTab}`, JSON.stringify(next));
                                        } catch {}
                                    }}
                                />
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>

                {/* ── Middle Column (or joined in Right on lg) ── */}
                <aside className="hidden lg:flex flex-col gap-5 sticky top-6 self-start max-h-[calc(100vh-2rem)] overflow-y-auto scrollbar-hide">

                    {/* Mejores Rendimientos (S&P 500 Top Gainers) */}
                    <TopGainersCard
                        items={topGainers}
                        isLoading={isGainersLoading}
                        isError={isGainersError}
                        isStale={gainersStale}
                        date={gainersDate}
                        onRetry={fetchTopGainers}
                    />

                    {/* Peores Rendimientos (S&P 500 Top Losers) on lg only (on 2xl it lives in right aside) */}
                    <div className="2xl:hidden">
                        <TopLosersCard
                            items={topLosers}
                            isLoading={isLosersLoading}
                            isError={isLosersError}
                            isStale={losersStale}
                            date={losersDate}
                            onRetry={fetchTopLosers}
                        />
                    </div>

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

                    {/* Calendario Finix */}
                    <CalendarPreviewCard />

                    {/* Enlaces de información y legales colocados debajo de Calendario */}
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11.5px] font-medium px-2 pt-1 pb-4" style={{ color: 'hsl(var(--muted-foreground) / 0.65)' }}>
                        <Link to="/about" className="hover:text-primary transition-colors">Sobre Finix</Link>
                        <span className="opacity-30">·</span>
                        <Link to="/help" className="hover:text-primary transition-colors">Ayuda</Link>
                        <span className="opacity-30">·</span>
                        <Link to="/terms" className="hover:text-primary transition-colors">Términos</Link>
                        <span className="opacity-30">·</span>
                        <Link to="/privacy" className="hover:text-primary transition-colors">Privacidad</Link>
                        <span className="opacity-30">·</span>
                        <Link to="/cookies" className="hover:text-primary transition-colors">Cookies</Link>
                        <div className="w-full mt-1.5 text-[10.5px] opacity-40">© 2026 Finix Network Inc.</div>
                    </div>
                </aside>

                {/* ── Right Column (2xl only) ── */}
                <aside className="hidden 2xl:flex flex-col gap-5 sticky top-6 self-start max-h-[calc(100vh-2rem)] overflow-y-auto scrollbar-hide">

                    {/* Peores Rendimientos (S&P 500 Top Losers) — AL LADO Y DEL MISMO TAMAÑO */}
                    <TopLosersCard
                        items={topLosers}
                        isLoading={isLosersLoading}
                        isError={isLosersError}
                        isStale={losersStale}
                        date={losersDate}
                        onRetry={fetchTopLosers}
                    />

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
                </aside>

            </div>
        </div>
    );
}
