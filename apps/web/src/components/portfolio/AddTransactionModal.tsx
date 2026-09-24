import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { apiFetch } from '@/lib/api';
import { cn } from '@/lib/utils';
import BackButton from '@/components/BackButton';
import { SymbolLogo } from '@/components/SymbolLogo';
import { AlertCircle, Search, X, Loader2 } from 'lucide-react';

import { resolveAssetInfo } from '@/lib/tradingview';

interface AddTransactionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    portfolioId: string;
    onSuccess: () => void;
    initialSymbol?: string;
    mode?: 'BUY' | 'SELL';
    portfolioAssets?: { ticker: string; tipoActivo: string; cantidad: number }[];
}

interface AssetResult {
    symbol: string;
    name: string;
    type: string;
    exchange?: string;
    matchScore?: number;
}

const POPULAR_RECOMMENDATIONS: AssetResult[] = [
    { symbol: 'NASDAQ:AAPL', name: 'Apple Inc.', type: 'stock', exchange: 'NASDAQ' },
    { symbol: 'NASDAQ:MSFT', name: 'Microsoft Corp.', type: 'stock', exchange: 'NASDAQ' },
    { symbol: 'NASDAQ:GOOGL', name: 'Alphabet Class A', type: 'stock', exchange: 'NASDAQ' },
    { symbol: 'NASDAQ:AMZN', name: 'Amazon.com Inc.', type: 'stock', exchange: 'NASDAQ' },
    { symbol: 'NASDAQ:NVDA', name: 'NVIDIA Corp.', type: 'stock', exchange: 'NASDAQ' },
    { symbol: 'NASDAQ:TSLA', name: 'Tesla Inc.', type: 'stock', exchange: 'NASDAQ' },
    { symbol: 'NASDAQ:META', name: 'Meta Platforms Inc.', type: 'stock', exchange: 'NASDAQ' },
    { symbol: 'AMEX:SPY', name: 'SPDR S&P 500 ETF', type: 'etf', exchange: 'AMEX' },
];

const EXCLUDED_EXCHANGE_PREFIXES = ['PYTH', 'SPREADEX', 'CAPITALCOM', 'FX', 'OANDA', 'FOREX', 'CURRENCYCOM'];

const TRANSACTION_CURRENCY_FORMATTERS = {
    USD: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', currencyDisplay: 'symbol' }),
    ARS: new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', currencyDisplay: 'code' }),
} as const;

const normalizeAssetResults = (data: unknown): AssetResult[] => {
    if (!Array.isArray(data)) return [];
    const stripHtml = (value: string) => value.replace(/<[^>]*>/g, '').trim();

    const mapped = data.map((item: any) => {
        const rawSymbol = String(item?.symbol || item?.ticker || '').trim();
        const symbol = stripHtml(rawSymbol);
        if (!symbol) return null;
        const rawName = String(item?.name || item?.description || item?.full_name || symbol).trim();
        const name = stripHtml(rawName || symbol);
        let type = String(item?.type || item?.assetType || item?.contract || 'other').trim().toLowerCase();
        const rawExchange = String(item?.exchange || item?.exchange_name || '').trim();
        const exchange = stripHtml(rawExchange);

        const upperExchange = exchange.toUpperCase();
        if (EXCLUDED_EXCHANGE_PREFIXES.some(prefix => upperExchange.includes(prefix) || symbol.toUpperCase().startsWith(`${prefix}:`))) {
            return null;
        }

        const isArg = upperExchange === 'BYMA' || upperExchange === 'BCBA' || symbol.toUpperCase().includes('.BA');
        if (isArg && (type === 'dr' || type === 'fund' || type === 'stock' || type === 'cedear')) {
            type = 'cedear';
        } else if (type === 'fund' || /etf/i.test(name) || /SPY|QQQ|DIA|IWM/i.test(symbol)) {
            type = 'etf';
        }

        const matchScore = typeof item?.matchScore === 'number' ? item.matchScore : (typeof item?.score === 'number' ? item.score : undefined);
        return { symbol, name, type, exchange, matchScore } as AssetResult;
    });

    const valid = mapped.filter((item): item is AssetResult => Boolean(item));

    const getRank = (item: AssetResult) => {
        const ex = (item.exchange || '').toUpperCase();
        if (ex === 'AMEX' || ex === 'NYSE ARCA' || ex === 'NYSE' || ex === 'NASDAQ') return 1;
        if (ex === 'BCBA' || ex === 'BYMA') return 2;
        if (ex.includes('BINANCE') || ex.includes('COINBASE')) return 3;
        return 10;
    };

    return valid.sort((a, b) => getRank(a) - getRank(b));
};

const getAssetBadgeInfo = (type?: string, exchange?: string) => {
    const t = (type || '').toLowerCase();
    const ex = (exchange || '').toUpperCase();

    if (t === 'cedear' || ex === 'BCBA' || ex === 'BYMA') {
        return { label: 'CEDEAR', badgeCls: 'border-purple-500/30 bg-purple-500/10 text-purple-400' };
    }
    if (t === 'etf' || t === 'fund') {
        return { label: 'ETF', badgeCls: 'border-sky-500/30 bg-sky-500/10 text-sky-400' };
    }
    if (t === 'stock' || t === 'equity') {
        return { label: 'ACCIÓN', badgeCls: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' };
    }
    if (t === 'crypto') {
        return { label: 'CRIPTO', badgeCls: 'border-amber-500/30 bg-amber-500/10 text-amber-400' };
    }
    if (t === 'bond') {
        return { label: 'BONO', badgeCls: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-400' };
    }
    return { label: (type || 'OTRO').toUpperCase(), badgeCls: 'border-border/60 bg-muted/40 text-muted-foreground' };
};

const formatAssetType = (value?: string) => {
    if (!value) return 'OTRO';
    return value.replace(/_/g, ' ').toUpperCase();
};

const extractBaseSymbol = (symbol: string) => {
    const trimmed = symbol.trim();
    if (!trimmed) return '';
    const parts = trimmed.split(':');
    return parts[parts.length - 1] || trimmed;
};

const buildQuoteRequestCandidates = (symbol: string) => {
    const normalized = symbol.trim().toUpperCase();
    if (!normalized) return [];

    const candidates = [normalized];
    const exchangeMatch = normalized.match(/^([A-Z0-9._-]+):(.*)$/);

    if (exchangeMatch) {
        const [, exchange, ticker] = exchangeMatch;
        if (exchange === 'BYMA') {
            candidates.push(`BCBA:${ticker}`, ticker);
        } else if (exchange === 'BCBA') {
            candidates.push(`BYMA:${ticker}`, ticker);
        } else if (exchange === 'NYSE' || exchange === 'NYSE ARCA' || exchange === 'AMEX') {
            candidates.push(`AMEX:${ticker}`, `NYSE:${ticker}`, ticker);
        } else {
            candidates.push(ticker);
        }
    } else {
        candidates.push(`BCBA:${normalized}`, `BYMA:${normalized}`, `AMEX:${normalized}`, `NASDAQ:${normalized}`);
    }

    return Array.from(new Set(candidates));
};

const KNOWN_CEDEARS = new Set([
    'AAPL', 'NVDA', 'MELI', 'MSFT', 'AMZN', 'GOOGL', 'GOOG', 'TSLA', 'META',
    'SPY', 'QQQ', 'DIA', 'IWM', 'EEM', 'XLE', 'XLF', 'ARKK', 'IBIT',
    'AMD', 'INTC', 'TSM', 'AVGO', 'QCOM', 'MU', 'ARM',
    'KO', 'PEP', 'MCD', 'SBUX', 'WMT', 'COST', 'PG', 'NKE', 'HD', 'MDLZ',
    'NFLX', 'DIS', 'SPOT', 'UBER', 'ABNB', 'BKNG', 'CRM', 'ORCL', 'ADBE', 'CSCO', 'IBM', 'PLTR', 'SNOW', 'SHOP', 'BABA',
    'V', 'MA', 'PYPL', 'COIN', 'MSTR', 'JPM', 'BAC', 'WFC', 'C', 'GS', 'MS', 'BLK', 'BBD',
    'XOM', 'CVX', 'PBR', 'VIST', 'TS', 'VALE', 'GOLD', 'NEM', 'FCX', 'SLB', 'BP',
    'JNJ', 'PFE', 'LLY', 'UNH', 'ABT', 'MRK', 'BMY',
    'BA', 'CAT', 'GE', 'DE', 'LMT',
    'DESP', 'GLOB', 'BIOX', 'CAAP', 'BITF', 'HUT', 'HIVE',
]);

const isCedearSymbol = (symbol?: string) => {
    if (!symbol) return false;
    const s = symbol.toUpperCase();
    return s.startsWith('BCBA:') || s.startsWith('BYMA:') || s.includes('.BA');
};

const parseInputNumber = (value: string) => {
    if (value === undefined || value === null) return NaN;
    return Number(String(value).replace(',', '.'));
};

const getErrorMessage = async (response: Response) => {
    try {
        const data = await response.json();
        if (Array.isArray(data?.message)) {
            return data.message.join('\n');
        }
        if (typeof data?.message === 'string') {
            return data.message;
        }
    } catch {
        // noop
    }
    return null;
};

const parseTradingViewSymbolInput = (value: string): AssetResult | null => {
    const raw = value.trim().toUpperCase().replace(/\s+/g, '');
    const match = raw.match(/^([A-Z0-9._-]+):([A-Z0-9._/\-]+)$/);
    if (!match) return null;

    const exchange = match[1];
    const symbol = match[2];
    return {
        symbol: `${exchange}:${symbol}`,
        exchange,
        name: symbol,
        type: 'other',
        matchScore: 100,
    };
};

export function AddTransactionModal({ open, onOpenChange, portfolioId, onSuccess, initialSymbol, mode = 'BUY', portfolioAssets = [] }: AddTransactionModalProps) {
    const [step, setStep] = useState<'search' | 'details'>('search');

    // Search State
    const [searchQuery, setSearchQuery] = useState(initialSymbol || '');
    const [searchResults, setSearchResults] = useState<AssetResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);

    // Form State
    const [selectedAsset, setSelectedAsset] = useState<AssetResult | null>(null);
    const [baseAsset, setBaseAsset] = useState<AssetResult | null>(null);
    const [isCedear, setIsCedear] = useState(false);
    const [transactionType, setTransactionType] = useState<string>(mode);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [quantity, setQuantity] = useState('');
    const [price, setPrice] = useState('');
    const [priceLoading, setPriceLoading] = useState(false);
    const [priceError, setPriceError] = useState<string | null>(null);
    const [hasLivePrice, setHasLivePrice] = useState(false);
    const [fee, setFee] = useState('0');
    const [notes, setNotes] = useState('');
    const [currency, setCurrency] = useState('USD');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [cedearValuation, setCedearValuation] = useState<any>(null);

    const resetState = (nextQuery?: string) => {
        setStep('search');
        setSelectedAsset(null);
        setBaseAsset(null);
        setIsCedear(false);
        setCedearValuation(null);
        setSubmitError(null);
        setTransactionType(mode);
        setDate(new Date().toISOString().split('T')[0]);
        setQuantity('');
        setPrice('');
        setPriceLoading(false);
        setPriceError(null);
        setHasLivePrice(false);
        setFee('0');
        setNotes('');
        setCurrency('USD');
        setSearchResults([]);
        setIsSearching(false);
        setSearchQuery(nextQuery ?? '');
    };

    useEffect(() => {
        if (!open) {
            resetState(initialSymbol || '');
            return;
        }
        resetState(initialSymbol || '');

        if (initialSymbol) {
            const cleanInit = initialSymbol.replace(/^(BCBA|BYMA):/i, '').toUpperCase();
            const assetToSelect = portfolioAssets.find(
                a => a.ticker === initialSymbol || a.ticker.replace(/^(BCBA|BYMA):/i, '').toUpperCase() === cleanInit
            );
            if (assetToSelect) {
                const isCed = Boolean((assetToSelect as any).isCedear) || 
                    assetToSelect.tipoActivo?.toLowerCase() === 'cedear' || 
                    isCedearSymbol(assetToSelect.ticker) || 
                    KNOWN_CEDEARS.has(cleanInit);
                void handleSelectAsset({
                    symbol: assetToSelect.ticker,
                    name: assetToSelect.ticker,
                    type: isCed ? 'cedear' : assetToSelect.tipoActivo,
                    exchange: '',
                    matchScore: 100
                });
            } else {
                void handleSelectAsset({
                    symbol: initialSymbol,
                    name: initialSymbol,
                    type: isCedearSymbol(initialSymbol) || KNOWN_CEDEARS.has(cleanInit) ? 'cedear' : 'stock',
                    exchange: '',
                    matchScore: 100
                });
            }
        }
    }, [open, initialSymbol, mode, portfolioAssets]);

    // Debounced Search
    useEffect(() => {
        if (step !== 'search') return;

        const query = searchQuery.trim();
        if (query.length < 1) {
            setSearchResults([]);
            setIsSearching(false);
            setSearchError(null);
            return;
        }

        const controller = new AbortController();

        const timeoutId = setTimeout(async () => {
            setIsSearching(true);
            setSearchError(null);
            try {
                const res = await apiFetch(`/market/search?query=${encodeURIComponent(query)}`, { signal: controller.signal });
                if (!res.ok) throw new Error('Error buscando activos');

                const data = await res.json();
                const normalized = normalizeAssetResults(data);
                const manualSymbol = parseTradingViewSymbolInput(query);
                const combined = manualSymbol
                    ? [manualSymbol, ...normalized.filter((item) => item.symbol !== manualSymbol.symbol)]
                    : normalized;

                if (combined.length === 0) {
                    setSearchError('No se encontraron resultados.');
                } else {
                    setSearchResults(combined);
                }
            } catch (err: any) {
                if (err?.name !== 'AbortError') {
                    console.error(err);
                    setSearchResults([]);
                    setSearchError('Error al conectar con el servidor.');
                }
            } finally {
                if (!controller.signal.aborted) {
                    setIsSearching(false);
                }
            }
        }, 450);

        return () => {
            clearTimeout(timeoutId);
            controller.abort();
        };
    }, [searchQuery, step]);

    const fetchQuote = async (symbol: string) => {
        if (!symbol) return;
        setPriceLoading(true);
        setPriceError(null);
        setHasLivePrice(false);
        try {
            const candidates = buildQuoteRequestCandidates(symbol);

            for (const candidate of candidates) {
                const res = await apiFetch(`/market/quote?symbol=${encodeURIComponent(candidate)}`);
                if (!res.ok) {
                    continue;
                }

                const data = await res.json();
                if (typeof data?.price === 'number' && Number.isFinite(data.price) && data.price > 0) {
                    setPrice(String(data.price));
                    setHasLivePrice(true);
                    return;
                }
            }

            setPriceError('No se pudo obtener precio en vivo. Puedes ingresarlo manualmente.');
        } catch (err) {
            console.error(err);
            setPriceError('Error al conectar con el servidor. Puedes ingresar el precio manualmente.');
        } finally {
            setPriceLoading(false);
        }
    };

    const fetchCedearValuation = async (symbol: string) => {
        const clean = extractBaseSymbol(symbol);
        if (!clean) return;
        try {
            const res = await apiFetch(`/market/cedears/${clean}`);
            if (res.ok) {
                const data = await res.json();
                setCedearValuation(data);
                if (data.cedearPriceArs) {
                    setPrice(String(data.cedearPriceArs));
                    setHasLivePrice(true);
                }
            } else {
                setCedearValuation(null);
            }
        } catch {
            setCedearValuation(null);
        }
    };

    const handleSelectAsset = async (asset: AssetResult) => {
        setBaseAsset(asset);
        let effectiveAsset = asset;
        const clean = extractBaseSymbol(asset.symbol).toUpperCase();
        const cedearSelected = isCedearSymbol(asset.symbol) || asset.type.toLowerCase() === 'cedear';

        if (cedearSelected && !asset.symbol.toUpperCase().startsWith('BCBA:')) {
            effectiveAsset = {
                ...asset,
                symbol: `BCBA:${clean}`,
                exchange: 'BCBA',
                type: 'cedear',
            };
        }

        setSelectedAsset(effectiveAsset);
        setIsCedear(cedearSelected);
        setCurrency(cedearSelected ? 'ARS' : 'USD');
        setStep('details');
        setPrice('');
        setCedearValuation(null);
        if (cedearSelected) {
            await Promise.all([
                fetchQuote(effectiveAsset.symbol),
                fetchCedearValuation(clean),
            ]);
        } else {
            await fetchQuote(effectiveAsset.symbol);
        }
    };

    const handleCedearToggle = async (checked: boolean) => {
        if (!baseAsset) return;
        const base = extractBaseSymbol(baseAsset.symbol).toUpperCase();
        if (!base) return;
        if (checked) {
            const cedearAsset: AssetResult = {
                ...baseAsset,
                symbol: `BCBA:${base}`,
                exchange: 'BCBA',
                type: 'cedear',
            };
            setSelectedAsset(cedearAsset);
            setIsCedear(true);
            setCurrency('ARS');
            setPrice('');
            await Promise.all([
                fetchQuote(cedearAsset.symbol),
                fetchCedearValuation(base),
            ]);
        } else {
            setSelectedAsset(baseAsset);
            setIsCedear(false);
            setCurrency('USD');
            setPrice('');
            setCedearValuation(null);
            await fetchQuote(baseAsset.symbol);
        }
    };

    const handleRefreshPrice = async () => {
        if (!selectedAsset?.symbol) return;
        setPrice('');
        const base = extractBaseSymbol(selectedAsset.symbol).toUpperCase();
        if (isCedear && base) {
            await Promise.all([
                fetchQuote(selectedAsset.symbol),
                fetchCedearValuation(base),
            ]);
        } else {
            await fetchQuote(selectedAsset.symbol);
        }
    };

    const needsPrice = transactionType === 'BUY' || transactionType === 'SELL';
    const numericQuantity = parseInputNumber(quantity);
    const numericPrice = needsPrice ? parseInputNumber(price) : 0;

    const handleSubmit = async () => {
        if (!selectedAsset || !quantity) return;
        if (!Number.isFinite(numericQuantity) || numericQuantity <= 0) return;
        if (needsPrice && (!Number.isFinite(numericPrice) || numericPrice <= 0)) return;
        setIsSubmitting(true);
        setSubmitError(null);
        try {
            const payload = {
                assetTicker: selectedAsset.symbol,
                assetName: selectedAsset.name,
                assetType: isCedear ? 'CEDEAR' : selectedAsset.type,
                assetExchange: selectedAsset.exchange,
                type: transactionType,
                date,
                quantity: numericQuantity,
                price: numericPrice,
                fee: parseInputNumber(fee || '0'),
                currency: currency,
                notes: notes,
                updateCash: true
            };

            const response = await apiFetch(`/portfolios/${portfolioId}/transactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errMsg = await getErrorMessage(response);
                throw new Error(errMsg || 'Error al registrar la transacción');
            }

            onSuccess();
            onOpenChange(false);
            resetState(initialSymbol || '');
        } catch (error: any) {
            console.error('Error in AddTransactionModal:', error);
            setSubmitError(error?.message || 'Error al registrar la transacción');
        } finally {
            setIsSubmitting(false);
        }
    };

    const total = (numericQuantity || 0) * (numericPrice || 0);
    const trimmedQuery = searchQuery.trim();
    const isConfirmDisabled = isSubmitting || !quantity || (needsPrice && (priceLoading || !price));
    const cleanBase = baseAsset ? extractBaseSymbol(baseAsset.symbol).toUpperCase() : '';
    const canCedear = Boolean(
        baseAsset &&
        !isCedearSymbol(baseAsset.symbol) &&
        (/stock|etf|fund/i.test(baseAsset.type) ||
            /NASDAQ|NYSE|AMEX|ARCA/i.test(baseAsset.exchange || '') ||
            /^(NASDAQ|NYSE|AMEX|ARCA):/i.test(baseAsset.symbol) ||
            KNOWN_CEDEARS.has(cleanBase))
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[620px] max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden shadow-2xl">
                <DialogHeader className="p-6 pb-3 border-b border-border/40 shrink-0">
                    <DialogTitle>{step === 'search' ? 'Buscar Activo' : `Nueva Transacción: ${selectedAsset?.symbol}`}</DialogTitle>
                    <DialogDescription>
                        {step === 'search' ? 'Busca por ticker o nombre en TradingView (ej. AAPL, BTC)...' : 'Ingresa los detalles de la operación.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="p-6 pt-4 overflow-y-auto flex-1 min-h-0">
                    {step === 'search' ? (
                        mode === 'SELL' ? (
                            <div className="space-y-4">
                                <div className="text-sm text-foreground mb-4">Selecciona el activo de tu portafolio que deseas vender:</div>
                                <div className="max-h-[340px] overflow-y-auto overflow-x-hidden space-y-1.5 pr-1 -mr-1">
                                    {portfolioAssets.length === 0 ? (
                                        <div className="text-center text-muted-foreground py-6">
                                            No hay activos en este portafolio aún.
                                        </div>
                                    ) : portfolioAssets.filter(a => a.cantidad > 0).map((asset, index) => (
                                        <button
                                            key={`portfolio-asset-${asset.ticker}-${index}`}
                                            type="button"
                                            className="w-full max-w-full min-w-0 flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-muted/70 transition-colors text-left cursor-pointer border border-transparent hover:border-border/50"
                                            onClick={() => handleSelectAsset({
                                                symbol: asset.ticker,
                                                name: asset.ticker,
                                                type: asset.tipoActivo,
                                                exchange: '',
                                                matchScore: 100
                                            })}
                                        >
                                            <div className="min-w-0 flex-1">
                                                <div className="font-bold text-sm truncate">{asset.ticker}</div>
                                                <div className="text-xs text-muted-foreground mt-0.5 truncate">
                                                    Cantidad disponible: <span className="font-semibold text-foreground/80">{asset.cantidad.toFixed(4)}</span>
                                                </div>
                                            </div>
                                            <Badge variant="outline" className="text-[10px] font-bold uppercase shrink-0 px-2 py-0.5 ml-2">
                                                {formatAssetType(asset.tipoActivo)}
                                            </Badge>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="relative">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Buscar por ticker o nombre (ej: SPY, AAPL, BTC)..."
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        autoFocus
                                        className="pl-10 pr-9 text-base h-11 rounded-xl"
                                    />
                                    {searchQuery && (
                                        <button
                                            type="button"
                                            onClick={() => setSearchQuery('')}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded-md cursor-pointer"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>

                                {trimmedQuery.length === 0 ? (
                                    /* When empty: show recommendations */
                                    <div className="pt-1">
                                        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
                                            Activos Populares
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            {POPULAR_RECOMMENDATIONS.map((asset) => {
                                                const info = resolveAssetInfo(asset.symbol);
                                                return (
                                                    <button
                                                        key={asset.symbol}
                                                        type="button"
                                                        className="flex items-center gap-2.5 rounded-xl border border-border/70 p-2.5 text-left transition-colors hover:bg-muted/80 cursor-pointer min-w-0 overflow-hidden"
                                                        onClick={() => handleSelectAsset(asset)}
                                                    >
                                                        <SymbolLogo symbol={asset.symbol} size={28} className="shrink-0" />
                                                        <div className="min-w-0 flex-1">
                                                            <span className="font-bold text-[11px] block truncate">
                                                                {asset.exchange || 'NASDAQ' ? `${asset.exchange || 'NASDAQ'}:${info.ticker}` : info.ticker}
                                                            </span>
                                                            <div className="text-[10px] text-muted-foreground truncate">{asset.name}</div>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : (
                                    /* When searching: ONLY show search results */
                                    <div className="max-h-[360px] overflow-y-auto space-y-1.5 pr-2">
                                        {isSearching && (
                                            <div className="flex items-center justify-center gap-2 text-muted-foreground py-8">
                                                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                                <span className="text-sm">Buscando en TradingView...</span>
                                            </div>
                                        )}
                                        {!isSearching && searchError && (
                                            <div className="text-center text-red-500 py-6 text-sm">{searchError}</div>
                                        )}
                                        {!isSearching && !searchError && searchResults.map((asset, index) => {
                                            const info = resolveAssetInfo(asset.symbol);
                                            const badge = getAssetBadgeInfo(asset.type, asset.exchange);
                                            return (
                                                <button
                                                    key={`${asset.symbol}-${asset.exchange || 'na'}-${asset.type || 'na'}-${index}`}
                                                    type="button"
                                                    className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/80 transition-all text-left cursor-pointer border border-transparent hover:border-border/60 group"
                                                    onClick={() => handleSelectAsset(asset)}
                                                >
                                                    <div className="flex items-center gap-3 min-w-0 flex-1 overflow-hidden mr-2">
                                                        <SymbolLogo symbol={asset.symbol} size={36} className="shrink-0" />
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-bold text-[13px] block truncate text-foreground group-hover:text-primary transition-colors">
                                                                    {asset.exchange || info.exchange ? `${asset.exchange || info.exchange}:${info.ticker}` : info.ticker}
                                                                </span>
                                                            </div>
                                                            <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                                                                {asset.name || info.displayName}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center shrink-0">
                                                        <span className={cn('text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border tracking-wide', badge.badgeCls)}>
                                                            {badge.label}
                                                        </span>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                        {!isSearching && !searchError && searchResults.length === 0 && (
                                            <div className="text-center text-muted-foreground py-8 space-y-3">
                                                <p className="text-sm">No se encontraron resultados para "{trimmedQuery}".</p>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="rounded-xl font-medium"
                                                    onClick={() =>
                                                        handleSelectAsset({
                                                            symbol: trimmedQuery.toUpperCase(),
                                                            name: trimmedQuery.toUpperCase(),
                                                            type: 'custom',
                                                        })
                                                    }
                                                >
                                                    Crear "{trimmedQuery.toUpperCase()}" manualmente
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )
                    ) : (
                        <div className="space-y-4">
                            <div className="flex flex-col gap-3 rounded-lg border border-border/70 p-3">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="text-xs uppercase text-muted-foreground">Activo seleccionado</div>
                                        <div className="text-lg font-semibold">{selectedAsset?.symbol}</div>
                                        <div className="text-sm text-muted-foreground">{selectedAsset?.name}</div>
                                    </div>
                                    {canCedear && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-muted-foreground">CEDEAR (ARS)</span>
                                            <Switch checked={isCedear} onCheckedChange={handleCedearToggle} />
                                        </div>
                                    )}
                                </div>
                                {priceLoading && (
                                    <div className="text-xs text-muted-foreground">Actualizando precio desde TradingView / BYMA...</div>
                                )}
                                {priceError && !priceLoading && (
                                    <div className="text-xs text-red-400">{priceError}</div>
                                )}

                                {isCedear && cedearValuation && (
                                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs space-y-1.5 backdrop-blur-sm mt-1">
                                        <div className="flex justify-between items-center font-bold text-foreground">
                                            <span>Ratio CEDEAR:</span>
                                            <Badge variant="secondary" className="font-mono text-[11px]">{cedearValuation.ratio}:1</Badge>
                                        </div>
                                        <div className="flex justify-between text-muted-foreground">
                                            <span>Subyacente en EEUU ({cedearValuation.underlyingTicker}):</span>
                                            <span className="font-semibold text-foreground">${cedearValuation.underlyingPriceUsd?.toFixed(2) ?? 'N/A'} USD</span>
                                        </div>
                                        <div className="flex justify-between text-muted-foreground">
                                            <span>Dólar CCL Utilizado:</span>
                                            <span className="font-semibold text-foreground">${cedearValuation.dolarCcl?.toFixed(2) ?? 'N/A'} ARS</span>
                                        </div>
                                        <div className="flex justify-between border-t border-border/40 pt-1 text-muted-foreground">
                                            <span>Valor Teórico en ARS:</span>
                                            <span className="font-bold text-primary">${cedearValuation.theoreticalPriceArs?.toLocaleString('es-AR') ?? 'N/A'} ARS</span>
                                        </div>
                                        {cedearValuation.implicitCcl && (
                                            <div className="flex justify-between text-muted-foreground text-[11px]">
                                                <span>CCL Implícito del CEDEAR:</span>
                                                <span className="font-mono">${cedearValuation.implicitCcl.toFixed(2)} ARS ({cedearValuation.discrepancyPct >= 0 ? '+' : ''}{cedearValuation.discrepancyPct}%)</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <Tabs value={transactionType} onValueChange={setTransactionType} className="space-y-4">
                                <TabsList className="grid w-full grid-cols-3">
                                    <TabsTrigger value="BUY" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">Compra</TabsTrigger>
                                    <TabsTrigger value="SELL" className="data-[state=active]:bg-red-500 data-[state=active]:text-white">Venta</TabsTrigger>
                                    <TabsTrigger value="DIVIDEND" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">Dividendo</TabsTrigger>
                                </TabsList>

                                <TabsContent value="BUY" className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                                    <FormContent
                                        transactionType="BUY"
                                        date={date} setDate={setDate}
                                        quantity={quantity} setQuantity={setQuantity}
                                        price={price} setPrice={setPrice}
                                        fee={fee} setFee={setFee}
                                        notes={notes} setNotes={setNotes}
                                        total={total} currency={currency}
                                        priceLocked={hasLivePrice && !priceError}
                                        priceLoading={priceLoading}
                                        onRefreshPrice={handleRefreshPrice}
                                    />
                                </TabsContent>
                                <TabsContent value="SELL" className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                                    <FormContent
                                        transactionType="SELL"
                                        date={date} setDate={setDate}
                                        quantity={quantity} setQuantity={setQuantity}
                                        price={price} setPrice={setPrice}
                                        fee={fee} setFee={setFee}
                                        notes={notes} setNotes={setNotes}
                                        total={total} currency={currency}
                                        priceLocked={hasLivePrice && !priceError}
                                        priceLoading={priceLoading}
                                        onRefreshPrice={handleRefreshPrice}
                                    />
                                </TabsContent>
                                <TabsContent value="DIVIDEND" className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                                    <div className="space-y-2">
                                        <Label>Fecha</Label>
                                        <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Monto Neto Recibido ({currency})</Label>
                                        <Input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="0.00" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Notas</Label>
                                        <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Opcional..." />
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>
                    )}
                </div>

                {submitError && (
                    <div className="mx-6 mb-2 flex items-center gap-2.5 rounded-2xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400 font-semibold animate-in fade-in-50">
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                        <span className="flex-1">{submitError}</span>
                    </div>
                )}

                <DialogFooter className="p-6 pt-3 border-t border-border/40 gap-2">
                    {step === 'details' ? (
                        <div className="flex w-full items-center justify-between gap-2">
                            <BackButton onClick={() => setStep('search')} label="Volver" />
                            <Button
                                onClick={() => handleSubmit()}
                                disabled={isConfirmDisabled}
                                className="font-bold gap-1.5"
                            >
                                {isSubmitting ? 'Guardando...' : 'Confirmar Operación'}
                            </Button>
                        </div>
                    ) : (
                        <div className="flex w-full items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                                Selecciona un activo para continuar
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onOpenChange(false)}
                                className="text-xs font-semibold cursor-pointer"
                            >
                                Cancelar
                            </Button>
                        </div>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function FormContent({
    transactionType,
    date,
    setDate,
    quantity,
    setQuantity,
    price,
    setPrice,
    fee,
    setFee,
    notes,
    setNotes,
    total,
    currency,
    priceLocked,
    priceLoading,
    onRefreshPrice,
}: any) {
    const feeValue = parseInputNumber(fee || '0');
    const safeFee = Number.isFinite(feeValue) ? feeValue : 0;
    const cashImpact = transactionType === 'SELL' ? total - safeFee : -(total + safeFee);
    const amountLabel = transactionType === 'SELL' ? 'Monto de venta' : 'Monto del activo';
    const cashImpactLabel = transactionType === 'SELL' ? 'Ingreso neto' : 'Salida de caja';
    const currencyCode = currency === 'ARS' ? 'ARS' : 'USD';
    const formatter = TRANSACTION_CURRENCY_FORMATTERS[currencyCode];
    return (
        <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="date">Fecha</Label>
                    <Input id="date" type="date" value={date} onChange={e => setDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="currency">Moneda</Label>
                    <Select value={currency} disabled>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="ARS">ARS</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="qty">Cantidad</Label>
                    <Input id="qty" type="number" step="any" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="0.00" autoFocus />
                </div>
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="price">Precio por Unidad</Label>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={onRefreshPrice}
                            disabled={priceLoading}
                        >
                            Actualizar
                        </Button>
                    </div>
                    <Input
                        id="price"
                        type="number"
                        step="any"
                        value={price}
                        onChange={priceLocked ? undefined : (e => setPrice(e.target.value))}
                        placeholder={priceLoading ? 'Cargando...' : '0.00'}
                        readOnly={priceLocked}
                        className={priceLocked ? 'bg-muted/60 cursor-not-allowed' : undefined}
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="fee">Comisión (Fee)</Label>
                <Input id="fee" type="number" step="any" value={fee} onChange={e => setFee(e.target.value)} placeholder="0.00" />
            </div>

            <div className="bg-muted p-3 rounded-lg flex justify-between items-center">
                <div>
                    <div className="font-medium">{amountLabel}</div>
                    <div className="text-xs text-muted-foreground">
                        Comisión: -{formatter.format(safeFee)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                        {cashImpactLabel}: {formatter.format(cashImpact)}
                    </div>
                </div>
                <span className="text-xl font-bold">{formatter.format(total)}</span>
            </div>

            <div className="space-y-2">
                <Label htmlFor="notes">Notas</Label>
                <Textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Opcional..." className="h-20" />
            </div>
        </div>
    );
}

// Add default export for easier lazy loading if needed, or named export
export default AddTransactionModal;
