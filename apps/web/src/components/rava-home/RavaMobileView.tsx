import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    DollarSign,
    Flame,
    Briefcase,
    Coins,
    FileSpreadsheet,
    Bookmark,
} from 'lucide-react';
import { HomeAnnouncementBanner } from './HomeAnnouncementBanner';
import { FeaturedFinixNewsCard } from './FeaturedFinixNewsCard';
import { MarketTableCard, formatNumberAr, formatPct } from './MarketTableCard';
import { FinvizHomeHeatmapCard } from './FinvizHomeHeatmapCard';
import { USStocksTabsCard } from './USStocksTabsCard';
import { CorporateBondsCard } from './CorporateBondsCard';
import { FinixNewsletterBanner } from './FinixNewsletterBanner';
import {
    TOP_GAINERS_ARG,
    TOP_LOSERS_ARG,
    GENERAL_STOCKS_ARG,
    ADRS_ARGENTINOS,
    CEDEARS_LIST,
    LETRAS_BONOS_PESOS,
    BONOS_BOPREAL,
    BONOS_DOLLAR_LINKED,
    CRYPTO_BOLSA_DATA,
    type MarketTickerRow,
} from './rava-market-data';

interface RavaMobileViewProps {
    dollars: MarketTickerRow[];
    crypto: MarketTickerRow[];
    cryptoBolsa?: MarketTickerRow[];
    topGainers?: MarketTickerRow[];
    topLosers?: MarketTickerRow[];
    generalStocks?: MarketTickerRow[];
    adrs?: MarketTickerRow[];
    cedears?: MarketTickerRow[];
}

const MOBILE_CATEGORIES = [
    { id: 'todos', label: 'Todos' },
    { id: 'dolar', label: 'Dólar' },
    { id: 'noticias', label: 'Noticias' },
    { id: 'acciones', label: 'Acciones' },
    { id: 'cedears', label: 'Cedears' },
    { id: 'bonos', label: 'Bonos & ONs' },
    { id: 'cripto', label: 'Cripto' },
];

export function RavaMobileView({
    dollars,
    crypto,
    cryptoBolsa = CRYPTO_BOLSA_DATA,
    topGainers = TOP_GAINERS_ARG,
    topLosers = TOP_LOSERS_ARG,
    generalStocks = GENERAL_STOCKS_ARG,
    adrs = ADRS_ARGENTINOS,
    cedears = CEDEARS_LIST,
}: RavaMobileViewProps) {
    const navigate = useNavigate();
    const [selectedCategory, setSelectedCategory] = useState('todos');

    // Tab state for Top Gainers / Losers
    const [gainersTab, setGainersTab] = useState<'gainers' | 'losers'>('gainers');

    // Tab state for Argentine Equities (Líder / General / ADRs)
    const [equityTab, setEquityTab] = useState<'lider' | 'general' | 'adrs'>('lider');

    // Tab state for Fixed Income (Pesos / ONs / Bopreal / CER)
    const [bondsTab, setBondsTab] = useState<'pesos' | 'ons' | 'bopreal' | 'cer'>('pesos');

    // Tab state for Crypto (Global / Bolsa)
    const [cryptoTab, setCryptoTab] = useState<'global' | 'bolsa'>('global');

    // Live Ticker items for top ribbon
    const topRibbonItems = useMemo(() => {
        const blue = dollars.find((d) => d.symbol === 'BLUE') || { symbol: 'BLUE', last: 1565.0, dayChangePct: 0.6 };
        const mep = dollars.find((d) => d.symbol.includes('MEP')) || { symbol: 'MEP', last: 1573.1, dayChangePct: -0.1 };
        const ccl = dollars.find((d) => d.symbol === 'CCL') || { symbol: 'CCL', last: 1665.4, dayChangePct: 0.4 };
        const btc = crypto.find((c) => c.symbol === 'BTC') || { symbol: 'BTC', last: 68450, dayChangePct: 2.1 };

        return [
            { label: 'Dólar Blue', price: `$${formatNumberAr(blue.last, 0)}`, pct: blue.dayChangePct },
            { label: 'Dólar MEP', price: `$${formatNumberAr(mep.last, 2)}`, pct: mep.dayChangePct },
            { label: 'Dólar CCL', price: `$${formatNumberAr(ccl.last, 2)}`, pct: ccl.dayChangePct },
            { label: 'S&P Merval', price: '1.845.210', pct: 1.2 },
            { label: 'Riesgo País', price: '763 pb', pct: -1.4 },
            { label: 'Bitcoin', price: `US$ ${formatNumberAr(btc.last, 0)}`, pct: btc.dayChangePct },
        ];
    }, [dollars, crypto]);

    const activeEquityData = useMemo(() => {
        if (equityTab === 'lider') return topGainers;
        if (equityTab === 'general') return generalStocks;
        return adrs;
    }, [equityTab, topGainers, generalStocks, adrs]);

    return (
        <div className="w-full space-y-3.5 pb-8 block md:hidden select-none">
            {/* ─── 1. RAVA MOBILE TOP LIVE TICKER STRIP ─── */}
            <div className="-mx-2.5 px-2.5 bg-muted/40 dark:bg-[#07191d]/90 border-y border-border/60 overflow-x-auto scrollbar-hide py-1.5 shadow-2xs">
                <div className="flex items-center gap-3 w-max">
                    {topRibbonItems.map((item, idx) => {
                        const isPos = (item.pct ?? 0) >= 0;
                        return (
                            <div
                                key={idx}
                                className="flex items-center gap-1.5 text-[11px] font-medium whitespace-nowrap pr-2 border-r border-border/40 last:border-r-0"
                            >
                                <span className="text-muted-foreground text-[10.5px]">{item.label}</span>
                                <span className="font-mono font-bold text-foreground text-[11.5px]">{item.price}</span>
                                <span
                                    className={`inline-flex items-center font-mono font-bold text-[10.5px] ${
                                        isPos
                                            ? 'text-[#15803d] dark:text-[#22c55e]'
                                            : 'text-[#b91c1c] dark:text-[#ef4444]'
                                    }`}
                                >
                                    {isPos ? '+' : ''}
                                    {formatNumberAr(item.pct, 1)}%
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ─── 2. RAVA MOBILE CATEGORY SELECTOR PILLS ─── */}
            <div className="-mx-2.5 px-2.5 overflow-x-auto scrollbar-hide py-0.5">
                <div className="inline-flex items-center bg-muted/40 dark:bg-muted/20 rounded-lg p-0.5 border border-border/50 gap-0.5 w-max">
                    {MOBILE_CATEGORIES.map((cat) => {
                        const isSelected = selectedCategory === cat.id;
                        return (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`h-6 px-2.5 rounded-[4px] text-[11px] font-medium transition-all cursor-pointer whitespace-nowrap ${
                                    isSelected
                                        ? 'bg-emerald-600 text-white dark:bg-emerald-600 dark:text-white font-semibold shadow-2xs'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                                }`}
                            >
                                {cat.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ─── 3. ANNOUNCEMENT QUOTE BANNER ─── */}
            {(selectedCategory === 'todos' || selectedCategory === 'noticias') && (
                <HomeAnnouncementBanner />
            )}

            {/* ─── 4. FEATURED FINANCIAL NEWS ─── */}
            {(selectedCategory === 'todos' || selectedCategory === 'noticias') && (
                <FeaturedFinixNewsCard />
            )}

            {/* ─── 5. DÓLARES TABLE (RAVA STYLE COMPACT) ─── */}
            {(selectedCategory === 'todos' || selectedCategory === 'dolar') && (
                <MarketTableCard
                    title="Dólar"
                    icon={<DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                    data={dollars}
                    viewAllHref="/market"
                    maxHeight="280px"
                />
            )}

            {/* ─── 6. LO MEJOR Y LO PEOR (COMPACT TABS ON MOBILE) ─── */}
            {(selectedCategory === 'todos' || selectedCategory === 'acciones') && (
                <div className="bg-card text-card-foreground rounded-xl border border-border/80 shadow-xs overflow-hidden flex flex-col">
                    {/* Header with Alzas / Bajas tabs */}
                    <div className="flex items-center justify-between px-3 py-2 border-b border-border/60 bg-muted/20">
                        <div className="flex items-center gap-1.5">
                            <Flame className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            <h3 className="text-[13px] font-bold text-primary tracking-tight">Rendimientos Argentina</h3>
                        </div>

                        {/* Segmented Switcher */}
                        <div className="inline-flex items-center bg-muted/40 dark:bg-muted/20 rounded-md p-0.5 border border-border/50 gap-0.5">
                            <button
                                onClick={() => setGainersTab('gainers')}
                                className={`h-5 px-2 rounded-[3px] text-[10.5px] font-medium transition-all ${
                                    gainersTab === 'gainers'
                                        ? 'bg-emerald-600 text-white font-semibold shadow-2xs'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                Alzas (+)
                            </button>
                            <button
                                onClick={() => setGainersTab('losers')}
                                className={`h-5 px-2 rounded-[3px] text-[10.5px] font-medium transition-all ${
                                    gainersTab === 'losers'
                                        ? 'bg-rose-600 text-white font-semibold shadow-2xs'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                Bajas (-)
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto max-h-[260px] scrollbar-thin">
                        <table className="w-full border-collapse text-left text-xs">
                            <thead>
                                <tr className="border-b border-border/60 bg-[#ebebeb] dark:bg-[#222222]">
                                    <th className="px-3 py-1.5 text-[11px] font-bold text-[#666666] dark:text-[#888888] uppercase">ESPECIE</th>
                                    <th className="px-3 py-1.5 text-[11px] font-bold text-[#666666] dark:text-[#888888] uppercase text-right">ÚLTIMO</th>
                                    <th className="px-3 py-1.5 text-[11px] font-bold text-[#666666] dark:text-[#888888] uppercase text-right">% DÍA</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(gainersTab === 'gainers' ? topGainers : topLosers).map((row, idx) => (
                                    <tr
                                        key={row.symbol || idx}
                                        onClick={() => navigate(`/market?symbol=${encodeURIComponent(row.symbol)}`)}
                                        className="even:bg-[#f6f7f9] dark:even:bg-white/[0.03] hover:bg-[#eaf1f7] dark:hover:bg-white/[0.07] cursor-pointer transition-colors"
                                    >
                                        <td className="px-3 py-1.5 text-[12px] font-bold text-foreground">{row.symbol}</td>
                                        <td className="px-3 py-1.5 text-[12px] font-mono tabular-nums text-foreground font-semibold text-right">
                                            {formatNumberAr(row.last, 2)}
                                        </td>
                                        <td className="px-3 py-1.5 text-[12px] font-mono tabular-nums text-right">
                                            {formatPct(row.dayChangePct)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ─── 7. ACCIONES BYMA (TABS: PANEL LÍDER / GENERAL / ADRS) ─── */}
            {(selectedCategory === 'todos' || selectedCategory === 'acciones') && (
                <div className="bg-card text-card-foreground rounded-xl border border-border/80 shadow-xs overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between px-3 py-2 border-b border-border/60 bg-muted/20">
                        <div className="flex items-center gap-1.5">
                            <Briefcase className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            <h3 className="text-[13px] font-bold text-primary tracking-tight">Acciones BYMA</h3>
                        </div>

                        {/* Sub-panel tabs */}
                        <div className="inline-flex items-center bg-muted/40 dark:bg-muted/20 rounded-md p-0.5 border border-border/50 gap-0.5">
                            <button
                                onClick={() => setEquityTab('lider')}
                                className={`h-5 px-2 rounded-[3px] text-[10.5px] font-medium transition-all ${
                                    equityTab === 'lider'
                                        ? 'bg-emerald-600 text-white font-semibold shadow-2xs'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                Líderes
                            </button>
                            <button
                                onClick={() => setEquityTab('general')}
                                className={`h-5 px-2 rounded-[3px] text-[10.5px] font-medium transition-all ${
                                    equityTab === 'general'
                                        ? 'bg-emerald-600 text-white font-semibold shadow-2xs'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                General
                            </button>
                            <button
                                onClick={() => setEquityTab('adrs')}
                                className={`h-5 px-2 rounded-[3px] text-[10.5px] font-medium transition-all ${
                                    equityTab === 'adrs'
                                        ? 'bg-emerald-600 text-white font-semibold shadow-2xs'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                ADRs
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto max-h-[260px] scrollbar-thin">
                        <table className="w-full border-collapse text-left text-xs">
                            <thead>
                                <tr className="border-b border-border/60 bg-[#ebebeb] dark:bg-[#222222]">
                                    <th className="px-3 py-1.5 text-[11px] font-bold text-[#666666] dark:text-[#888888] uppercase">ESPECIE</th>
                                    <th className="px-3 py-1.5 text-[11px] font-bold text-[#666666] dark:text-[#888888] uppercase text-right">ÚLTIMO</th>
                                    <th className="px-3 py-1.5 text-[11px] font-bold text-[#666666] dark:text-[#888888] uppercase text-right">% DÍA</th>
                                    <th className="px-3 py-1.5 text-[11px] font-bold text-[#666666] dark:text-[#888888] uppercase text-right">% MES</th>
                                </tr>
                            </thead>
                            <tbody>
                                {activeEquityData.map((row, idx) => (
                                    <tr
                                        key={row.symbol || idx}
                                        onClick={() => navigate(`/market?symbol=${encodeURIComponent(row.symbol)}`)}
                                        className="even:bg-[#f6f7f9] dark:even:bg-white/[0.03] hover:bg-[#eaf1f7] dark:hover:bg-white/[0.07] cursor-pointer transition-colors"
                                    >
                                        <td className="px-3 py-1.5 text-[12px] font-bold text-foreground">{row.symbol}</td>
                                        <td className="px-3 py-1.5 text-[12px] font-mono tabular-nums text-foreground font-semibold text-right">
                                            {formatNumberAr(row.last, 2)}
                                        </td>
                                        <td className="px-3 py-1.5 text-[12px] font-mono tabular-nums text-right">
                                            {formatPct(row.dayChangePct)}
                                        </td>
                                        <td className="px-3 py-1.5 text-[12px] font-mono tabular-nums text-right">
                                            {formatPct(row.monthChangePct)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ─── 8. CEDEARS TABLE ─── */}
            {(selectedCategory === 'todos' || selectedCategory === 'cedears') && (
                <MarketTableCard
                    title="Cedears"
                    icon={<Bookmark className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                    data={cedears}
                    maxHeight="260px"
                    searchable
                    viewAllHref="/market"
                />
            )}

            {/* ─── 9. US STOCKS & FINVIZ HEATMAP ─── */}
            {(selectedCategory === 'todos' || selectedCategory === 'acciones' || selectedCategory === 'cedears') && (
                <>
                    <USStocksTabsCard />
                    <FinvizHomeHeatmapCard />
                </>
            )}

            {/* ─── 10. BONOS Y OBLIGACIONES NEGOCIABLES (TABS) ─── */}
            {(selectedCategory === 'todos' || selectedCategory === 'bonos') && (
                <div className="bg-card text-card-foreground rounded-xl border border-border/80 shadow-xs overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between px-3 py-2 border-b border-border/60 bg-muted/20">
                        <div className="flex items-center gap-1.5">
                            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            <h3 className="text-[13px] font-bold text-primary tracking-tight">Renta Fija & Bonos</h3>
                        </div>

                        {/* Segmented tabs */}
                        <div className="inline-flex items-center bg-muted/40 dark:bg-muted/20 rounded-md p-0.5 border border-border/50 gap-0.5">
                            <button
                                onClick={() => setBondsTab('pesos')}
                                className={`h-5 px-1.5 rounded-[3px] text-[10.5px] font-medium transition-all ${
                                    bondsTab === 'pesos'
                                        ? 'bg-emerald-600 text-white font-semibold shadow-2xs'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                Pesos
                            </button>
                            <button
                                onClick={() => setBondsTab('ons')}
                                className={`h-5 px-1.5 rounded-[3px] text-[10.5px] font-medium transition-all ${
                                    bondsTab === 'ons'
                                        ? 'bg-emerald-600 text-white font-semibold shadow-2xs'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                ONs
                            </button>
                            <button
                                onClick={() => setBondsTab('bopreal')}
                                className={`h-5 px-1.5 rounded-[3px] text-[10.5px] font-medium transition-all ${
                                    bondsTab === 'bopreal'
                                        ? 'bg-emerald-600 text-white font-semibold shadow-2xs'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                Bopreal
                            </button>
                            <button
                                onClick={() => setBondsTab('cer')}
                                className={`h-5 px-1.5 rounded-[3px] text-[10.5px] font-medium transition-all ${
                                    bondsTab === 'cer'
                                        ? 'bg-emerald-600 text-white font-semibold shadow-2xs'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                CER
                            </button>
                        </div>
                    </div>

                    {bondsTab === 'ons' ? (
                        <CorporateBondsCard />
                    ) : (
                        <div className="overflow-x-auto max-h-[260px] scrollbar-thin">
                            <table className="w-full border-collapse text-left text-xs">
                                <thead>
                                    <tr className="border-b border-border/60 bg-[#ebebeb] dark:bg-[#222222]">
                                        <th className="px-3 py-1.5 text-[11px] font-bold text-[#666666] dark:text-[#888888] uppercase">ESPECIE</th>
                                        <th className="px-3 py-1.5 text-[11px] font-bold text-[#666666] dark:text-[#888888] uppercase text-right">ÚLTIMO</th>
                                        <th className="px-3 py-1.5 text-[11px] font-bold text-[#666666] dark:text-[#888888] uppercase text-right">% DÍA</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(bondsTab === 'pesos'
                                        ? LETRAS_BONOS_PESOS
                                        : bondsTab === 'bopreal'
                                        ? BONOS_BOPREAL
                                        : BONOS_DOLLAR_LINKED
                                    ).map((row, idx) => (
                                        <tr
                                            key={row.symbol || idx}
                                            onClick={() => navigate(`/market?symbol=${encodeURIComponent(row.symbol)}`)}
                                            className="even:bg-[#f6f7f9] dark:even:bg-white/[0.03] hover:bg-[#eaf1f7] dark:hover:bg-white/[0.07] cursor-pointer transition-colors"
                                        >
                                            <td className="px-3 py-1.5 text-[12px] font-bold text-foreground">{row.symbol}</td>
                                            <td className="px-3 py-1.5 text-[12px] font-mono tabular-nums text-foreground font-semibold text-right">
                                                {formatNumberAr(row.last, 2)}
                                            </td>
                                            <td className="px-3 py-1.5 text-[12px] font-mono tabular-nums text-right">
                                                {formatPct(row.dayChangePct)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ─── 11. CRIPTOMONEDAS (TABS: GLOBAL / BOLSA) ─── */}
            {(selectedCategory === 'todos' || selectedCategory === 'cripto') && (
                <div className="bg-card text-card-foreground rounded-xl border border-border/80 shadow-xs overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between px-3 py-2 border-b border-border/60 bg-muted/20">
                        <div className="flex items-center gap-1.5">
                            <Coins className="w-4 h-4 text-amber-500" />
                            <h3 className="text-[13px] font-bold text-primary tracking-tight">Criptomonedas</h3>
                        </div>

                        <div className="inline-flex items-center bg-muted/40 dark:bg-muted/20 rounded-md p-0.5 border border-border/50 gap-0.5">
                            <button
                                onClick={() => setCryptoTab('global')}
                                className={`h-5 px-2 rounded-[3px] text-[10.5px] font-medium transition-all ${
                                    cryptoTab === 'global'
                                        ? 'bg-emerald-600 text-white font-semibold shadow-2xs'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                Global (USD)
                            </button>
                            <button
                                onClick={() => setCryptoTab('bolsa')}
                                className={`h-5 px-2 rounded-[3px] text-[10.5px] font-medium transition-all ${
                                    cryptoTab === 'bolsa'
                                        ? 'bg-emerald-600 text-white font-semibold shadow-2xs'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                Bolsa (ARS)
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto max-h-[260px] scrollbar-thin">
                        <table className="w-full border-collapse text-left text-xs">
                            <thead>
                                <tr className="border-b border-border/60 bg-[#ebebeb] dark:bg-[#222222]">
                                    <th className="px-3 py-1.5 text-[11px] font-bold text-[#666666] dark:text-[#888888] uppercase">CRIPTO</th>
                                    <th className="px-3 py-1.5 text-[11px] font-bold text-[#666666] dark:text-[#888888] uppercase text-right">ÚLTIMO</th>
                                    <th className="px-3 py-1.5 text-[11px] font-bold text-[#666666] dark:text-[#888888] uppercase text-right">% DÍA</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(cryptoTab === 'global' ? crypto : cryptoBolsa).map((row, idx) => (
                                    <tr
                                        key={row.symbol || idx}
                                        onClick={() => navigate(`/market?symbol=${encodeURIComponent(row.symbol)}`)}
                                        className="even:bg-[#f6f7f9] dark:even:bg-white/[0.03] hover:bg-[#eaf1f7] dark:hover:bg-white/[0.07] cursor-pointer transition-colors"
                                    >
                                        <td className="px-3 py-1.5 text-[12px] font-bold text-foreground">{row.symbol}</td>
                                        <td className="px-3 py-1.5 text-[12px] font-mono tabular-nums text-foreground font-semibold text-right">
                                            {typeof row.last === 'number'
                                                ? formatNumberAr(row.last, row.last >= 1000 ? 0 : 2)
                                                : row.last}
                                        </td>
                                        <td className="px-3 py-1.5 text-[12px] font-mono tabular-nums text-right">
                                            {formatPct(row.dayChangePct)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ─── 12. NEWSLETTER SUBSCRIPTION BANNER ─── */}
            <FinixNewsletterBanner />
        </div>
    );
}
