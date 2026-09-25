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
                        className="relative flex items-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2 rounded-xl text-[12px] sm:text-[13px] font-semibold transition-colors select-none flex-1 justify-center whitespace-nowrap"
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
            className="rounded-2xl overflow-hidden shrink-0"
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

/* ── Dynamic News Headlines Card ────────────────────────────────── */
interface HeadlineItem {
    id: string;
    slotId?: string;
    slotKey?: string;
    title: string;
    description?: string;
    imageUrl?: string;
    url?: string;
    sourceName: string;
    publishedAt?: string;
    category: string;
    categorySlug: string;
    categoryColor: string;
}

function formatHeadlineTime(dateStr?: string) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const diffMin = Math.floor((Date.now() - d.getTime()) / 60000);
    if (diffMin < 1) return 'Hace instantes';
    if (diffMin < 60) return `Hace ${diffMin}m`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `Hace ${diffH}h`;
    const diffD = Math.floor(diffH / 24);
    if (diffD === 1) return 'Ayer';
    if (diffD < 7) return `Hace ${diffD}d`;
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
}

function HeadlinesCard({
    headlines,
    isLoading,
    onNavigate,
}: {
    headlines: HeadlineItem[];
    isLoading: boolean;
    onNavigate: (path: string) => void;
}) {
    return (
        <SideCard
            index={2}
            title="Titulares del día"
            icon={<Newspaper className="w-4 h-4" />}
            iconColor="hsl(215 90% 65%)"
            iconBg="hsl(215 90% 65% / 0.15)"
            to="/news"
            toLabel="Noticias"
        >
            <div className="px-5 pb-5 pt-1">
                {isLoading ? (
                    <div className="space-y-4 py-2">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="animate-pulse space-y-2">
                                <div className="h-2.5 bg-muted/60 rounded w-16" />
                                <div className="h-3.5 bg-muted/80 rounded w-full" />
                                <div className="h-2.5 bg-muted/40 rounded w-24" />
                            </div>
                        ))}
                    </div>
                ) : headlines.length === 0 ? (
                    <div className="py-6 text-center flex flex-col items-center justify-center">
                        <Newspaper className="w-8 h-8 text-muted-foreground/30 mb-2" />
                        <p className="text-[12.5px] font-semibold text-muted-foreground">Sin titulares publicados</p>
                        <p className="text-[11px] text-muted-foreground/60 mt-0.5">El contenido se publica desde el panel editorial.</p>
                        <button
                            onClick={() => onNavigate('/news')}
                            className="mt-3 px-3 py-1.5 rounded-lg text-xs font-semibold bg-secondary/80 hover:bg-secondary text-foreground transition-colors"
                        >
                            Ver sección Noticias
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3.5">
                        {headlines.slice(0, 3).map((item) => (
                            <div
                                key={item.id}
                                className="flex flex-col gap-1 cursor-pointer hover:opacity-80 transition-opacity group"
                                onClick={() => {
                                    if (item.slotId) {
                                        apiFetch(`/news/slots/${item.slotId}/click`, { method: 'POST' }).catch(() => {});
                                    }
                                    if (item.categorySlug) {
                                        onNavigate(`/news?category=${item.categorySlug}`);
                                    } else {
                                        onNavigate('/news');
                                    }
                                }}
                            >
                                <span
                                    className="text-[10px] font-bold tracking-wider uppercase transition-opacity"
                                    style={{ color: item.categoryColor || 'hsl(var(--primary))' }}
                                >
                                    {item.category}
                                </span>
                                <h4 className="text-[13px] font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-2">
                                    {item.title}
                                </h4>
                                <span className="text-[11px]" style={{ color: 'hsl(var(--muted-foreground) / 0.5)' }}>
                                    {formatHeadlineTime(item.publishedAt)}{item.sourceName ? ` · ${item.sourceName}` : ''}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </SideCard>
    );
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

    const [headlines, setHeadlines] = useState<HeadlineItem[]>([]);
    const [isHeadlinesLoading, setIsHeadlinesLoading] = useState<boolean>(true);

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

    const fetchHeadlines = () => {
        setIsHeadlinesLoading(true);
        apiFetch('/news/slots/headlines?limit=3')
            .then(r => r.ok ? r.json() : [])
            .then(data => {
                if (Array.isArray(data)) setHeadlines(data);
            })
            .catch(() => {})
            .finally(() => {
                setIsHeadlinesLoading(false);
            });
    };

    useEffect(() => {
        fetchTopGainers();
        fetchTopLosers();
        fetchHeadlines();
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
                <aside className="hidden lg:flex flex-col gap-5 sticky top-6 z-10 self-start max-h-[calc(100vh-2rem)] overflow-y-auto overscroll-contain scrollbar-hide">

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
                        <HeadlinesCard
                            headlines={headlines}
                            isLoading={isHeadlinesLoading}
                            onNavigate={navigate}
                        />
                    </div>

                    {/* Calendario Finix */}
                    <CalendarPreviewCard />

                    {/* Enlaces de información y legales en columna media solo cuando la columna 2xl está oculta */}
                    <div className="2xl:hidden">
                        <DashboardFooter />
                    </div>
                </aside>

                {/* ── Right Column (2xl only) ── */}
                <aside className="hidden 2xl:flex flex-col gap-5 sticky top-6 z-10 self-start max-h-[calc(100vh-2rem)] overflow-y-auto overscroll-contain scrollbar-hide">

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
                    <HeadlinesCard
                        headlines={headlines}
                        isLoading={isHeadlinesLoading}
                        onNavigate={navigate}
                    />

                    {/* Botones de Telegram, Instagram y enlaces directamente debajo de Noticias */}
                    <DashboardFooter />
                </aside>

            </div>
        </div>
    );
}

function DashboardFooter() {
    return (
        <div className="flex flex-col items-center justify-center text-center gap-2.5 px-2 pt-1 pb-4 shrink-0" style={{ color: 'hsl(var(--muted-foreground) / 0.65)' }}>
            {/* Redes Sociales / Comunidad */}
            <div className="flex items-center justify-center gap-2 pt-0.5">
                <a
                    href="https://t.me/Finixcomunidad"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 hover:bg-sky-500/20 hover:text-sky-300 transition-all text-[11.5px] font-semibold shadow-2xs cursor-pointer"
                    title="Comunidad oficial en Telegram"
                >
                    <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                    </svg>
                    <span>Telegram</span>
                </a>
                <a
                    href="https://instagram.com/finixarg_"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400 hover:bg-pink-500/20 hover:text-pink-300 transition-all text-[11.5px] font-semibold shadow-2xs cursor-pointer"
                    title="Instagram oficial"
                >
                    <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                    <span>Instagram</span>
                </a>
            </div>

            {/* Enlaces de información y legales */}
            <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-[11px] font-medium text-center">
                <Link to="/about" className="hover:text-primary transition-colors">Sobre Finix</Link>
                <span className="opacity-30">·</span>
                <Link to="/help" className="hover:text-primary transition-colors">Ayuda</Link>
                <span className="opacity-30">·</span>
                <Link to="/terms" className="hover:text-primary transition-colors">Términos</Link>
                <span className="opacity-30">·</span>
                <Link to="/privacy" className="hover:text-primary transition-colors">Privacidad</Link>
                <span className="opacity-30">·</span>
                <Link to="/cookies" className="hover:text-primary transition-colors">Cookies</Link>
            </div>

            <div className="w-full text-center text-[10.5px] opacity-50 font-medium">© 2026 Finix Network Inc.</div>
        </div>
    );
}
