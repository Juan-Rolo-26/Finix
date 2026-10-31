import { useState, useEffect, lazy, Suspense } from 'react';
import { apiFetch } from '@/lib/api';
import { DesktopNavigation } from '@/components/DesktopNavigation';
import { HomeAnnouncementBanner } from '@/components/rava-home/HomeAnnouncementBanner';
import { MarketTableCard } from '@/components/rava-home/MarketTableCard';
import { FinvizHomeHeatmapCard } from '@/components/rava-home/FinvizHomeHeatmapCard';
import { FeaturedFinixNewsCard } from '@/components/rava-home/FeaturedFinixNewsCard';
import { USStocksTabsCard } from '@/components/rava-home/USStocksTabsCard';
import { MarketAgendaCarouselCard } from '@/components/rava-home/MarketAgendaCarouselCard';
import { PromoAccountCard } from '@/components/rava-home/PromoAccountCard';
import { TechnicalSignalsCard } from '@/components/rava-home/TechnicalSignalsCard';
import { CorporateBondsCard } from '@/components/rava-home/CorporateBondsCard';
import { FinixNewsletterBanner } from '@/components/rava-home/FinixNewsletterBanner';
import { RavaMobileView } from '@/components/rava-home/RavaMobileView';
import { FloatingSupportPill } from '@/components/rava-home/FloatingSupportPill';
import { FinixHomeFooter } from '@/components/rava-home/FinixHomeFooter';
import { useGlobalSearchState } from '@/hooks/useGlobalSearchState';
import {
    DEFAULT_DOLLARS,
    TOP_GAINERS_ARG,
    TOP_LOSERS_ARG,
    CRYPTO_DATA,
    CRYPTO_BOLSA_DATA,
    GENERAL_STOCKS_ARG,
    LETRAS_BONOS_PESOS,
    CEDEARS_LIST,
    ADRS_ARGENTINOS,
    BONOS_BOPREAL,
    BONOS_DOLLAR_LINKED,
    type MarketTickerRow,
} from '@/components/rava-home/rava-market-data';
import { DollarSign, Flame, TrendingDown, Coins, Bookmark, BarChart2 } from 'lucide-react';

const GlobalSearch = lazy(() =>
    import('@/components/GlobalSearch').then((module) => ({ default: module.GlobalSearch }))
);

export default function FinixHome() {
    const { isSearchOpen, openSearch, closeSearch } = useGlobalSearchState();
    const [dollars, setDollars] = useState<MarketTickerRow[]>(DEFAULT_DOLLARS);
    const [crypto, setCrypto] = useState<MarketTickerRow[]>(CRYPTO_DATA);
    const [cryptoBolsa, setCryptoBolsa] = useState<MarketTickerRow[]>(CRYPTO_BOLSA_DATA);
    const [topGainers, setTopGainers] = useState<MarketTickerRow[]>(TOP_GAINERS_ARG);
    const [topLosers, setTopLosers] = useState<MarketTickerRow[]>(TOP_LOSERS_ARG);
    const [generalStocks, setGeneralStocks] = useState<MarketTickerRow[]>(GENERAL_STOCKS_ARG);
    const [adrs, setAdrs] = useState<MarketTickerRow[]>(ADRS_ARGENTINOS);
    const [cedears, setCedears] = useState<MarketTickerRow[]>(CEDEARS_LIST);

    // Fetch live market data (Dólar, BYMA, Crypto, Crypto Bolsa, Cedears, ADRs) on mount & periodic polling
    useEffect(() => {
        let isMounted = true;

        const fetchLiveData = () => {
            // 1. Fetch live dollar rates from API
            apiFetch('/market/dolar/rates')
                .then((res) => res.json())
                .then((rates: any[]) => {
                    if (!isMounted || !Array.isArray(rates) || rates.length === 0) return;

                    const findRate = (id: string) => rates.find((r) => r.id === id);

                    const blue = findRate('blue');
                    const mep = findRate('mep');
                    const ccl = findRate('ccl');
                    const oficial = findRate('oficial');
                    const mayorista = findRate('mayorista');
                    const tarjeta = findRate('tarjeta');
                    const cripto = findRate('cripto');

                    const updated: MarketTickerRow[] = [
                        {
                            symbol: 'BLUE',
                            last: blue?.sell ?? 1560.0,
                            dayChangePct: typeof blue?.variation === 'number' ? blue.variation : 0.0,
                            monthChangePct: 1.8,
                            yearChangePct: 6.2,
                        },
                        {
                            symbol: 'MEP (BOLSA)',
                            last: mep?.sell ?? 1565.70,
                            dayChangePct: typeof mep?.variation === 'number' ? mep.variation : 0.4,
                            monthChangePct: 1.3,
                            yearChangePct: 5.5,
                        },
                        {
                            symbol: 'CCL',
                            last: ccl?.sell ?? 1652.40,
                            dayChangePct: typeof ccl?.variation === 'number' ? ccl.variation : 1.1,
                            monthChangePct: 2.3,
                            yearChangePct: 8.7,
                        },
                        {
                            symbol: 'OFICIAL',
                            last: oficial?.sell ?? 1560.0,
                            dayChangePct: typeof oficial?.variation === 'number' ? oficial.variation : -0.04,
                            monthChangePct: 1.3,
                            yearChangePct: 5.4,
                        },
                        {
                            symbol: 'MAYORISTA',
                            last: mayorista?.sell ?? 1536.0,
                            dayChangePct: typeof mayorista?.variation === 'number' ? mayorista.variation : -0.06,
                            monthChangePct: 1.4,
                            yearChangePct: 5.6,
                        },
                        {
                            symbol: 'TARJETA',
                            last: tarjeta?.sell ?? 2028.0,
                            dayChangePct: typeof tarjeta?.variation === 'number' ? tarjeta.variation : 0.0,
                            monthChangePct: 1.3,
                            yearChangePct: 5.4,
                        },
                        {
                            symbol: 'CRIPTO',
                            last: cripto?.sell ?? 1651.94,
                            dayChangePct: typeof cripto?.variation === 'number' ? cripto.variation : 0.11,
                            monthChangePct: 2.4,
                            yearChangePct: 8.2,
                        },
                    ];

                    setDollars(updated);
                })
                .catch(() => {});

            // 2. Fetch real-time quotes for Argentine stocks (Panel Líder y General BYMA)
            const ARG_SYMBOLS = [
                'BCBA:GGAL', 'BCBA:YPFD', 'BCBA:PAMP', 'BCBA:BMA', 'BCBA:ALUA', 'BCBA:TXAR',
                'BCBA:BYMA', 'BCBA:CEPU', 'BCBA:TGSU2', 'BCBA:TRAN', 'BCBA:SUPV', 'BCBA:EDN',
                'BCBA:CRES', 'BCBA:LOMA', 'BCBA:VALO', 'BCBA:TECO2', 'BCBA:BBAR', 'BCBA:MIRG',
                'BCBA:COME', 'BCBA:MORI', 'BCBA:MOLA', 'BCBA:AGRO', 'BCBA:SEMI', 'BCBA:BOLT',
                'BCBA:IRSA', 'BCBA:BHIP', 'BCBA:TGNO4', 'BCBA:AUSO', 'BCBA:SAMI', 'BCBA:LEDE'
            ];

            apiFetch(`/market/quotes?symbols=${ARG_SYMBOLS.join(',')}`)
                .then((res) => res.json())
                .then((quotes: any[]) => {
                    if (!isMounted || !Array.isArray(quotes) || quotes.length === 0) return;

                    const validQuotes: MarketTickerRow[] = quotes
                        .filter((q) => q.price !== null && typeof q.price === 'number')
                        .map((q) => {
                            const cleanSym = (q.symbol || q.inputSymbol || '').replace(/^BCBA:/, '');
                            return {
                                symbol: cleanSym,
                                last: q.price,
                                dayChangePct: typeof q.change === 'number' ? q.change : 0,
                            };
                        });

                    if (validQuotes.length === 0) return;

                    // Rank by dayChangePct
                    const sorted = [...validQuotes].sort((a, b) => (b.dayChangePct ?? 0) - (a.dayChangePct ?? 0));
                    const gainers = sorted.slice(0, 10);
                    const losers = [...validQuotes].sort((a, b) => (a.dayChangePct ?? 0) - (b.dayChangePct ?? 0)).slice(0, 10);

                    setTopGainers(gainers);
                    setTopLosers(losers);

                    // Update General Stocks with live prices
                    setGeneralStocks((prev) =>
                        prev.map((item) => {
                            const match = validQuotes.find((vq) => vq.symbol === item.symbol);
                            if (match) {
                                return {
                                    ...item,
                                    last: match.last,
                                    dayChangePct: match.dayChangePct,
                                };
                            }
                            return item;
                        })
                    );
                })
                .catch(() => {});

            // 3. Fetch crypto quotes from market dashboard + LINK
            Promise.all([
                apiFetch('/market/dashboard').then((r) => r.json()).catch(() => null),
                apiFetch('/market/quotes?symbols=CRYPTO:LINKUSD').then((r) => r.json()).catch(() => []),
            ]).then(([dash, linkQuotes]) => {
                if (!isMounted) return;
                const linkQuote = Array.isArray(linkQuotes) && linkQuotes[0]?.price ? linkQuotes[0] : null;

                if (dash?.sections?.crypto && Array.isArray(dash.sections.crypto)) {
                    setCrypto((prev) =>
                        prev.map((item) => {
                            const match = dash.sections.crypto.find(
                                (c: any) =>
                                    (c.id && c.id.toLowerCase() === item.symbol.toLowerCase()) ||
                                    (c.symbol && c.symbol.toUpperCase().includes(item.symbol.toUpperCase())) ||
                                    (c.label && c.label.toLowerCase() === (item.name || '').toLowerCase())
                            );
                            if (match && typeof match.price === 'number') {
                                return {
                                    ...item,
                                    last: match.price,
                                    dayChangePct: typeof match.change === 'number' ? match.change : item.dayChangePct,
                                };
                            }
                            if (item.symbol === 'LINK' && linkQuote && typeof linkQuote.price === 'number') {
                                return {
                                    ...item,
                                    last: linkQuote.price,
                                    dayChangePct: typeof linkQuote.change === 'number' ? linkQuote.change : item.dayChangePct,
                                };
                            }
                            return item;
                        })
                    );
                }
            }).catch(() => {});

            // 4. Fetch Crypto Bolsa quotes (BITO, GBTC, ETHE, LTCN, COIN, MSTR)
            apiFetch('/market/quotes?symbols=BITO,GBTC,ETHE,LTCN,COIN,MSTR')
                .then((res) => res.json())
                .then((quotes: any[]) => {
                    if (!isMounted || !Array.isArray(quotes)) return;
                    const map = new Map<string, { price: number; change: number }>();
                    quotes.forEach((q) => {
                        const sym = (q.inputSymbol || q.symbol || '').replace(/^[A-Z0-9]+:/, '');
                        if (sym && typeof q.price === 'number') {
                            map.set(sym, { price: q.price, change: typeof q.change === 'number' ? q.change : 0 });
                        }
                    });

                    setCryptoBolsa((prev) =>
                        prev.map((item) => {
                            const key = item.symbol.replace(/_US$/, '');
                            const match = map.get(key);
                            if (match) {
                                return {
                                    ...item,
                                    last: match.price,
                                    dayChangePct: match.change,
                                };
                            }
                            return item;
                        })
                    );
                })
                .catch(() => {});

            // 5. Fetch live Cedears from BYMA
            apiFetch('/market/cedears')
                .then((res) => res.json())
                .then((list: any[]) => {
                    if (!isMounted || !Array.isArray(list) || list.length === 0) return;
                    const cedearMap = new Map<string, any>();
                    list.forEach((c) => {
                        if (c.ticker) cedearMap.set(c.ticker.toUpperCase(), c);
                    });

                    setCedears((prev) =>
                        prev.map((item) => {
                            const match = cedearMap.get(item.symbol.toUpperCase());
                            if (match && typeof match.cedearPriceArs === 'number') {
                                return {
                                    ...item,
                                    last: match.cedearPriceArs,
                                    dayChangePct: typeof match.cedearChangePct === 'number' ? match.cedearChangePct : item.dayChangePct,
                                    name: match.name || item.name,
                                };
                            }
                            return item;
                        })
                    );
                })
                .catch(() => {});

            // 6. Fetch Argentine ADRs in USD
            const ADR_SYMBOLS = ['GGAL', 'YPF', 'BMA', 'PAM', 'MELI', 'GLOB', 'CEPU', 'CRESY', 'SUPV', 'EDN', 'TGS', 'VIST', 'BBAR', 'LOMA', 'TECO', 'IRS', 'BIOX', 'DESP'];
            apiFetch(`/market/quotes?symbols=${ADR_SYMBOLS.join(',')}`)
                .then((res) => res.json())
                .then((quotes: any[]) => {
                    if (!isMounted || !Array.isArray(quotes)) return;
                    const map = new Map<string, { price: number; change: number }>();
                    quotes.forEach((q) => {
                        const sym = (q.inputSymbol || q.symbol || '').replace(/^[A-Z0-9]+:/, '');
                        if (sym && typeof q.price === 'number') {
                            map.set(sym, { price: q.price, change: typeof q.change === 'number' ? q.change : 0 });
                        }
                    });

                    setAdrs((prev) =>
                        prev.map((item) => {
                            const match = map.get(item.symbol);
                            if (match) {
                                return {
                                    ...item,
                                    last: match.price,
                                    dayChangePct: match.change,
                                };
                            }
                            return item;
                        })
                    );
                })
                .catch(() => {});
        };

        // Instant fetch on mount
        fetchLiveData();

        // Periodic live refresh every 30 seconds
        const timer = setInterval(fetchLiveData, 30000);

        return () => {
            isMounted = false;
            clearInterval(timer);
        };
    }, []);

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20 selection:text-primary">
            {/* Unified Modern Finix Navigation Bar */}
            <DesktopNavigation onOpenSearch={openSearch} />

            {/* Main Content Area */}
            <main className="flex-1 max-w-[1440px] w-full mx-auto px-2.5 sm:px-4 md:px-6 py-4">
                {/* ─── 1. RAVA MOBILE VIEW (MOBILE PHONES ONLY) ─── */}
                <RavaMobileView
                    dollars={dollars}
                    crypto={crypto}
                    cryptoBolsa={cryptoBolsa}
                    topGainers={topGainers}
                    topLosers={topLosers}
                    generalStocks={generalStocks}
                    adrs={adrs}
                    cedears={cedears}
                />

                {/* ─── 2. DESKTOP / TABLET VIEW (3-COLUMN RAVA-INSPIRED FLOW) ─── */}
                <div className="hidden md:block space-y-5">
                    {/* Top Carousel Announcement Banner */}
                    <HomeAnnouncementBanner />

                    {/* 3-COLUMN RAVA-INSPIRED FLOW (ZERO WHITE GAPS / HOLES) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 items-start">
                        {/* Column 1 (Left - 3 cols on lg): Dólar, Lo mejor, Lo peor, Acciones General, ADRs, Promo */}
                        <div className="md:col-span-1 lg:col-span-3 space-y-4">
                            <MarketTableCard
                                title="Dólar"
                                icon={<DollarSign className="w-4 h-4" />}
                                data={dollars}
                                viewAllHref="/market"
                            />
                            <MarketTableCard
                                title="Lo mejor de Argentina"
                                icon={<Flame className="w-4 h-4 text-emerald-500" />}
                                data={topGainers}
                                viewAllHref="/mercado/mejores-rendimientos"
                            />
                            <MarketTableCard
                                title="Lo peor de Argentina"
                                icon={<TrendingDown className="w-4 h-4 text-rose-500" />}
                                data={topLosers}
                                viewAllHref="/mercado/mejores-rendimientos"
                            />
                            <MarketTableCard
                                title="Acciones General"
                                data={generalStocks}
                                maxHeight="520px"
                                searchable
                                viewAllHref="/market"
                            />
                            <MarketTableCard
                                title="ADR's argentinos"
                                data={adrs}
                                maxHeight="420px"
                                searchable
                                viewAllHref="/market"
                            />
                            <PromoAccountCard />
                        </div>

                        {/* Column 2 (Center - 6 cols on lg): Noticias, US Stocks, Mapa de Calor, Señales, ONs */}
                        <div className="md:col-span-2 lg:col-span-6 space-y-4 md:order-first lg:order-none">
                            <FeaturedFinixNewsCard />
                            <USStocksTabsCard />
                            <FinvizHomeHeatmapCard />
                            <TechnicalSignalsCard />
                            <CorporateBondsCard />
                        </div>

                        {/* Column 3 (Right - 3 cols on lg): Agenda Semanal, Criptomonedas, Cedears, Bonos */}
                        <div className="md:col-span-1 lg:col-span-3 space-y-4">
                            <MarketAgendaCarouselCard />
                            <MarketTableCard
                                title="Criptomonedas"
                                icon={<Coins className="w-4 h-4 text-amber-500" />}
                                data={crypto}
                                viewAllHref="/market"
                            />
                            <MarketTableCard
                                title="Criptomonedas Bolsa"
                                icon={<BarChart2 className="w-4 h-4 text-primary" />}
                                data={cryptoBolsa}
                                viewAllHref="/market"
                            />
                            <MarketTableCard
                                title="Cedears"
                                icon={<Bookmark className="w-4 h-4 text-emerald-500" />}
                                data={cedears}
                                maxHeight="320px"
                                searchable
                                viewAllHref="/market"
                            />
                            <MarketTableCard
                                title="Letras / Bonos en Pesos"
                                data={LETRAS_BONOS_PESOS}
                                maxHeight="260px"
                                searchable
                                viewAllHref="/market"
                            />
                            <MarketTableCard
                                title="Bonos Bopreal"
                                data={BONOS_BOPREAL}
                                viewAllHref="/market"
                            />
                            <MarketTableCard
                                title="Bonos Dollar-linked & CER"
                                data={BONOS_DOLLAR_LINKED}
                                maxHeight="260px"
                                searchable
                                viewAllHref="/market"
                            />
                        </div>
                    </div>

                    {/* NEWSLETTER SUBSCRIPTION BANNER */}
                    <FinixNewsletterBanner />
                </div>
            </main>

            {/* Global Search Dialog */}
            {isSearchOpen && (
                <Suspense fallback={null}>
                    <GlobalSearch isOpen onClose={closeSearch} />
                </Suspense>
            )}

            {/* Floating Support (WhatsApp) and Scroll-to-top */}
            <FloatingSupportPill />

            {/* Rava-inspired Finix Footer */}
            <FinixHomeFooter />
        </div>
    );
}
