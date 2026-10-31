import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { cn } from '@/lib/utils';

export interface TickerAsset {
    symbol: string;
    label: string;
    category: 'dolar' | 'argentina' | 'eeuu' | 'cedear' | 'commodities' | 'crypto' | 'indices';
    price: string;
    numericPrice?: number;
    change: number;
    currency?: 'ARS' | 'USD';
}

// ─── 40 CURATED FINANCIAL ASSETS (ARGENTINA + WALL STREET + DIVISAS + COMMODITIES + CRIPTO) ───
export const DEFAULT_NEWS_TICKER_ITEMS: TickerAsset[] = [
    // ── Divisas & Referencias Macro ──
    { symbol: 'DÓLAR BLUE', label: 'Informal', category: 'dolar', price: '$1.560,00', change: 0.0 },
    { symbol: 'DÓLAR MEP', label: 'Bolsa AL30', category: 'dolar', price: '$1.565,70', change: 0.4 },
    { symbol: 'DÓLAR CCL', label: 'Cable', category: 'dolar', price: '$1.652,40', change: 1.1 },
    { symbol: 'DÓLAR OFICIAL', label: 'BNA', category: 'dolar', price: '$1.560,00', change: -0.04 },
    { symbol: 'DÓLAR MAYORISTA', label: 'BCRA', category: 'dolar', price: '$1.536,00', change: -0.06 },
    { symbol: 'RIESGO PAÍS', label: 'EMBI+ Arg', category: 'indices', price: '763 pb', change: -1.4 },

    // ── Índices Bursátiles ──
    { symbol: 'S&P MERVAL', label: 'BYMA Líder', category: 'indices', price: '1.845.210', change: 1.2 },
    { symbol: 'S&P 500', label: 'Wall Street', category: 'indices', price: '5.812,40', change: 0.4 },
    { symbol: 'NASDAQ 100', label: 'Tecnología', category: 'indices', price: '20.340,10', change: 0.6 },
    { symbol: 'DOW JONES', label: 'Industrial', category: 'indices', price: '42.114,40', change: -0.2 },

    // ── Acciones Argentinas Líderes (BYMA & ADRs) ──
    { symbol: 'GGAL', label: 'Grupo Galicia', category: 'argentina', price: '$5.430,00', change: -2.6 },
    { symbol: 'YPFD', label: 'YPF S.A.', category: 'argentina', price: '$7.735,00', change: -2.0 },
    { symbol: 'PAMP', label: 'Pampa Energía', category: 'argentina', price: '$4.767,50', change: -3.5 },
    { symbol: 'BMA', label: 'Banco Macro', category: 'argentina', price: '$9.955,00', change: -1.4 },
    { symbol: 'ALUA', label: 'Aluar', category: 'argentina', price: '$841,50', change: -2.4 },
    { symbol: 'TXAR', label: 'Ternium Argentina', category: 'argentina', price: '$726,00', change: -1.2 },
    { symbol: 'BYMA', label: 'Bolsas y Mercados', category: 'argentina', price: '$214,50', change: -3.7 },
    { symbol: 'CEPU', label: 'Central Puerto', category: 'argentina', price: '$1.754,00', change: -4.0 },
    { symbol: 'TGSU2', label: 'Transportadora Gas Sur', category: 'argentina', price: '$7.745,00', change: -6.7 },
    { symbol: 'TRAN', label: 'Transener', category: 'argentina', price: '$2.166,00', change: -3.3 },
    { symbol: 'SUPV', label: 'Banco Supervielle', category: 'argentina', price: '$2.149,00', change: -3.1 },
    { symbol: 'EDN', label: 'Edenor', category: 'argentina', price: '$1.320,00', change: -3.6 },
    { symbol: 'CRES', label: 'Cresud', category: 'argentina', price: '$1.647,00', change: -0.2 },
    { symbol: 'LOMA', label: 'Loma Negra', category: 'argentina', price: '$3.000,00', change: -1.2 },
    { symbol: 'VALO', label: 'Banco de Valores', category: 'argentina', price: '$506,00', change: -1.4 },
    { symbol: 'TECO2', label: 'Telecom Argentina', category: 'argentina', price: '$3.535,00', change: -3.3 },
    { symbol: 'BBAR', label: 'BBVA Argentina', category: 'argentina', price: '$6.435,00', change: -2.1 },

    // ── CEDEARs & Acciones Globales Más Operadas ──
    { symbol: 'MELI', label: 'Mercado Libre', category: 'cedear', price: 'USD 1.634,50', change: -1.5 },
    { symbol: 'NVDA', label: 'Nvidia Corp', category: 'cedear', price: 'USD 205,72', change: -3.7 },
    { symbol: 'AAPL', label: 'Apple Inc', category: 'cedear', price: 'USD 232,40', change: 0.2 },
    { symbol: 'MSFT', label: 'Microsoft', category: 'cedear', price: 'USD 428,15', change: -0.4 },
    { symbol: 'AMZN', label: 'Amazon', category: 'cedear', price: 'USD 187,60', change: -0.3 },
    { symbol: 'GOOGL', label: 'Alphabet', category: 'cedear', price: 'USD 169,80', change: 0.8 },
    { symbol: 'META', label: 'Meta Platforms', category: 'cedear', price: 'USD 582,10', change: 0.5 },
    { symbol: 'TSLA', label: 'Tesla Inc', category: 'cedear', price: 'USD 260,40', change: -1.1 },
    { symbol: 'VIST', label: 'Vista Energy', category: 'cedear', price: 'USD 69,71', change: -2.6 },
    { symbol: 'GLOB', label: 'Globant', category: 'cedear', price: 'USD 182,50', change: -0.4 },

    // ── Criptomonedas & Commodities ──
    { symbol: 'BITCOIN', label: 'BTC/USD', category: 'crypto', price: 'USD 68.450', change: 2.3 },
    { symbol: 'ETHEREUM', label: 'ETH/USD', category: 'crypto', price: 'USD 2.520', change: 1.9 },
    { symbol: 'PETRÓLEO WTI', label: 'Crudo WTI', category: 'commodities', price: 'USD 103,94', change: 1.9 },
    { symbol: 'ORO', label: 'Onza Troy', category: 'commodities', price: 'USD 2.748', change: 0.6 },
];

interface NewsMarketTickerProps {
    onSelectAsset?: (symbol: string) => void;
}

export function NewsMarketTicker({ onSelectAsset }: NewsMarketTickerProps) {
    const navigate = useNavigate();
    const [items, setItems] = useState<TickerAsset[]>(DEFAULT_NEWS_TICKER_ITEMS);

    // Cotizaciones en tiempo real en vivo del backend (Dólar, BYMA, Wall Street, Cripto)
    useEffect(() => {
        let isMounted = true;

        const updateLiveData = () => {
            // 1. Fetch live dollar rates
            apiFetch('/market/dolar/rates')
                .then((r) => r.json())
                .then((rates: any[]) => {
                    if (!isMounted || !Array.isArray(rates)) return;
                    setItems((prev) =>
                        prev.map((item) => {
                            if (item.category !== 'dolar') return item;
                            const dMatch = rates.find((d: any) =>
                                (item.symbol.includes('MEP') && d.id === 'mep') ||
                                (item.symbol.includes('CCL') && d.id === 'ccl') ||
                                (item.symbol.includes('BLUE') && d.id === 'blue') ||
                                (item.symbol.includes('MAYORISTA') && d.id === 'mayorista') ||
                                (item.symbol.includes('OFICIAL') && d.id === 'oficial')
                            );
                            if (dMatch && typeof dMatch.sell === 'number') {
                                return {
                                    ...item,
                                    price: `$${dMatch.sell.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                                    change: typeof dMatch.variation === 'number' ? dMatch.variation : item.change,
                                };
                            }
                            return item;
                        })
                    );
                })
                .catch(() => {});

            // 2. Fetch live quotes from dashboard (commodities, crypto, indexes, global)
            apiFetch('/market/dashboard')
                .then((r) => r.json())
                .then((data: any) => {
                    if (!isMounted || !data) return;

                    setItems((prevItems) => {
                        return prevItems.map((item) => {
                            if (data.sections) {
                                for (const secKey of Object.keys(data.sections)) {
                                    const secList = data.sections[secKey];
                                    if (!Array.isArray(secList)) continue;
                                    const match = secList.find((s: any) =>
                                        s.symbol?.includes(item.symbol) ||
                                        item.symbol.includes(s.symbol?.replace(/^[A-Z]+:/, ''))
                                    );
                                    if (match && typeof match.price === 'number' && Number.isFinite(match.price)) {
                                        const isUsd = match.currency === 'USD' || item.price.startsWith('USD');
                                        const formattedPrice = isUsd
                                            ? `USD ${match.price.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                            : `$${match.price.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                                        return {
                                            ...item,
                                            price: formattedPrice,
                                            change: typeof match.change === 'number' ? match.change : item.change,
                                        };
                                    }
                                }
                            }
                            return item;
                        });
                    });
                })
                .catch(() => {});
        };

        updateLiveData();
        const interval = setInterval(updateLiveData, 30000);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, []);

    // Duplicamos los elementos exactamente para permitir un bucle infinito continuo e impecable
    const marqueeItems = [...items, ...items];

    const handleItemClick = (asset: TickerAsset) => {
        if (onSelectAsset) {
            onSelectAsset(asset.symbol);
        } else {
            navigate('/market');
        }
    };

    return (
        <aside
            aria-label="Cinta de cotizaciones en tiempo real"
            className="w-full bg-card/95 border-b border-border/80 backdrop-blur-md sticky top-0 z-20 overflow-hidden shadow-2xs select-none"
        >
            <div className="flex items-center h-9 sm:h-10 relative">
                {/* ── Fixed Left Pill: MERCADOS EN VIVO ── */}
                <div className="flex items-center gap-2 pl-3 sm:pl-4 pr-3 py-1 bg-card border-r border-border/70 shrink-0 z-10 shadow-xs">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                    <span className="text-[10px] sm:text-[10.5px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                        Mercados en vivo
                    </span>
                </div>

                {/* ── Ticker Sliding Track ── */}
                <div className="relative flex-1 overflow-hidden h-full flex items-center">
                    {/* Gradient Fade Edges for Professional Editorial Finish */}
                    <div className="ticker-fade-left" />
                    <div className="ticker-fade-right" />

                    <div
                        className="ticker-track flex items-center gap-2 sm:gap-3 pl-2"
                        style={{
                            animationDuration: '85s',
                            animationTimingFunction: 'linear',
                            animationIterationCount: 'infinite',
                        }}
                    >
                        {marqueeItems.map((item, idx) => {
                            const isPositive = item.change >= 0;
                            return (
                                <button
                                    key={`${item.symbol}-${idx}`}
                                    type="button"
                                    onClick={() => handleItemClick(item)}
                                    title={`Filtrar noticias de ${item.symbol} (${item.label})`}
                                    className="group inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-muted/40 hover:bg-muted/80 border border-border/60 hover:border-border transition-all cursor-pointer whitespace-nowrap shrink-0 text-left"
                                >
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[11px] font-extrabold text-foreground group-hover:text-primary transition-colors tracking-tight">
                                            {item.symbol}
                                        </span>
                                        <span className="text-[11px] font-mono font-bold text-foreground/90 tabular-nums">
                                            {item.price}
                                        </span>
                                    </div>

                                    <div
                                        className={cn(
                                            "inline-flex items-center gap-0.5 text-[10px] font-bold font-mono tabular-nums",
                                            isPositive
                                                ? "text-emerald-600 dark:text-emerald-400"
                                                : "text-rose-600 dark:text-rose-400"
                                        )}
                                    >
                                        {isPositive ? (
                                            <TrendingUp className="w-2.5 h-2.5" />
                                        ) : (
                                            <TrendingDown className="w-2.5 h-2.5" />
                                        )}
                                        <span>
                                            {isPositive ? '+' : ''}
                                            {item.change.toFixed(1)}%
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ── Fixed Right CTA: Ir a Mercados ── */}
                <div className="hidden md:flex items-center pl-2 pr-3 sm:pr-4 py-1 bg-card border-l border-border/70 shrink-0 z-10 shadow-xs">
                    <button
                        type="button"
                        onClick={() => navigate('/market')}
                        className="inline-flex items-center gap-1 text-[10.5px] font-bold text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                        title="Abrir terminal completa de mercados"
                    >
                        <span>Terminal</span>
                        <ArrowUpRight className="w-3 h-3" />
                    </button>
                </div>
            </div>
        </aside>
    );
}
