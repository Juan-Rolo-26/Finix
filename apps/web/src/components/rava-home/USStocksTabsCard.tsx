import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Globe } from 'lucide-react';
import { US_STOCKS_DATA, type MarketTickerRow } from './rava-market-data';
import { formatNumberAr, formatPct } from './MarketTableCard';
import { cn } from '@/lib/utils';
import { apiFetch } from '@/lib/api';

const TABS = [
    { key: 'principal', label: 'Principal' },
    { key: 'dow30', label: '30 del Dow' },
    { key: 'etfs', label: "ETF's" },
    { key: 'adrs', label: "ADR's" },
    { key: 'varias', label: 'Varias' },
];

const ALL_US_SYMBOLS = [
    'NVDA', 'AAPL', 'MSFT', 'AMZN', 'GOOGL', 'META', 'TSLA', 'SPY', 'QQQ', 'AVGO', 'AMD', 'NFLX',
    'JPM', 'PG', 'UNH', 'HD', 'V', 'DIS', 'KO', 'CSCO', 'BA', 'CAT', 'MCD', 'IBM',
    'DIA', 'IWM', 'XLF', 'XLK', 'GLD', 'SLV', 'ARKK', 'SMH',
    'GGAL', 'YPF', 'BMA', 'PAM', 'MELI', 'GLOB', 'CEPU', 'CRESY', 'SUPV', 'EDN', 'TGS', 'VIST',
    'INTC', 'PLTR', 'COIN', 'BABA', 'PYPL', 'CRM'
];

export function USStocksTabsCard() {
    const [activeTab, setActiveTab] = useState('principal');
    const [liveData, setLiveData] = useState<Record<string, MarketTickerRow[]>>(US_STOCKS_DATA);
    const navigate = useNavigate();

    useEffect(() => {
        let isMounted = true;

        const fetchQuotes = () => {
            apiFetch(`/market/quotes?symbols=${ALL_US_SYMBOLS.join(',')}`)
                .then((res) => res.json())
                .then((quotes: any[]) => {
                    if (!isMounted || !Array.isArray(quotes) || quotes.length === 0) return;

                    const quotesMap = new Map<string, { price: number; change: number }>();
                    quotes.forEach((q) => {
                        const sym = (q.inputSymbol || q.symbol || '').replace(/^[A-Z0-9]+:/, '');
                        if (sym && typeof q.price === 'number') {
                            quotesMap.set(sym, { price: q.price, change: typeof q.change === 'number' ? q.change : 0 });
                        }
                    });

                    setLiveData((prev) => {
                        const updated: Record<string, MarketTickerRow[]> = {};
                        for (const key of Object.keys(prev)) {
                            updated[key] = prev[key].map((item) => {
                                const match = quotesMap.get(item.symbol);
                                if (match) {
                                    return {
                                        ...item,
                                        last: match.price,
                                        dayChangePct: match.change,
                                    };
                                }
                                return item;
                            });
                        }
                        return updated;
                    });
                })
                .catch(() => {});
        };

        // Fetch immediately on mount
        fetchQuotes();

        // Refresh periodically in real time
        const interval = setInterval(fetchQuotes, 30000);
        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, []);

    const data: MarketTickerRow[] = liveData[activeTab] || liveData.principal;

    return (
        <div className="bg-card text-card-foreground rounded-xl border border-border/80 shadow-sm overflow-hidden flex flex-col">
            {/* Header with Title and Tabs */}
            <div className="border-b border-border/60 bg-muted/20">
                <div className="flex items-center justify-between px-3.5 py-2.5">
                    <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-primary" />
                        <h3 className="text-[0.875rem] font-bold text-primary tracking-tight select-none">
                            Acciones/ETF en EE. UU.
                        </h3>
                    </div>
                    <button
                        onClick={() => navigate('/market')}
                        className="text-muted-foreground hover:text-primary transition-colors p-0.5 rounded"
                        aria-label="Ver mercado EE. UU."
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>

                {/* Sub-tabs — Ultra-slim, minimal full-width distributed buttons */}
                <div className="px-2 py-1 border-t border-border/40 bg-muted/15">
                    <div className="grid grid-cols-5 gap-1 w-full">
                        {TABS.map((tab) => {
                            const isSelected = activeTab === tab.key;
                            return (
                                <button
                                    key={tab.key}
                                    type="button"
                                    data-theme-ignore
                                    onClick={() => setActiveTab(tab.key)}
                                    className={cn(
                                        'w-full h-[22px] max-h-[22px] px-1 text-[0.6875rem] font-semibold leading-none rounded-md transition-all flex items-center justify-center cursor-pointer border select-none',
                                        isSelected
                                            ? 'bg-emerald-600 text-white font-bold border-emerald-600 shadow-2xs dark:bg-emerald-500 dark:border-emerald-500 text-white-force'
                                            : 'bg-card/80 hover:bg-card text-muted-foreground hover:text-foreground border-border/70 hover:border-border'
                                    )}
                                    style={isSelected ? { color: '#ffffff' } : undefined}
                                >
                                    <span className="truncate leading-none" style={isSelected ? { color: '#ffffff' } : undefined}>{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto overflow-y-auto max-h-[260px] scrollbar-thin">
                <table className="w-full border-collapse text-left text-xs">
                    <thead>
                        <tr className="border-b border-border/60 bg-[#ebebeb] dark:bg-[#222222]">
                            <th className="px-3 py-1.5 text-[0.6875rem] font-bold text-[#666666] dark:text-[#888888] tracking-wider uppercase">
                                ESPECIE
                            </th>
                            <th className="px-3 py-1.5 text-[0.6875rem] font-bold text-[#666666] dark:text-[#888888] tracking-wider uppercase text-right">
                                ÚLTIMO
                            </th>
                            <th className="px-3 py-1.5 text-[0.6875rem] font-bold text-[#666666] dark:text-[#888888] tracking-wider uppercase text-right">
                                % DÍA
                            </th>
                            <th className="px-3 py-1.5 text-[0.6875rem] font-bold text-[#666666] dark:text-[#888888] tracking-wider uppercase text-right">
                                % MES
                            </th>
                            <th className="px-3 py-1.5 text-[0.6875rem] font-bold text-[#666666] dark:text-[#888888] tracking-wider uppercase text-right">
                                % AÑO
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, idx) => (
                            <tr
                                key={row.symbol || idx}
                                onClick={() => navigate(`/market?symbol=${encodeURIComponent(row.symbol)}`)}
                                className="group odd:bg-transparent even:bg-[#f6f7f9] dark:even:bg-white/[0.03] hover:bg-[#eaf1f7] dark:hover:bg-white/[0.07] cursor-pointer transition-colors border-none"
                            >
                                <td className="px-3 py-1.5 text-[0.75rem] font-bold text-foreground group-hover:text-primary transition-colors">
                                    {row.symbol}
                                </td>
                                <td className="px-3 py-1.5 text-[0.75rem] font-mono tabular-nums text-foreground font-semibold text-right">
                                    {formatNumberAr(row.last, 2)}
                                </td>
                                <td className="px-3 py-1.5 text-[0.75rem] font-mono tabular-nums text-right">
                                    {formatPct(row.dayChangePct)}
                                </td>
                                <td className="px-3 py-1.5 text-[0.75rem] font-mono tabular-nums text-right">
                                    {formatPct(row.monthChangePct)}
                                </td>
                                <td className="px-3 py-1.5 text-[0.75rem] font-mono tabular-nums text-right">
                                    {formatPct(row.yearChangePct)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
