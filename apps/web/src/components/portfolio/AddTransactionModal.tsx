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
import BackButton from '@/components/BackButton';

interface AddTransactionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    portfolioId: string;
    onSuccess: () => void;
    initialSymbol?: string;
}

interface AssetResult {
    symbol: string;
    name: string;
    type: string;
    exchange?: string;
    matchScore?: number;
}

const MAG7_RECOMMENDATIONS: AssetResult[] = [
    { symbol: 'NASDAQ:AAPL', name: 'Apple Inc.', type: 'stock', exchange: 'NASDAQ' },
    { symbol: 'NASDAQ:MSFT', name: 'Microsoft Corp.', type: 'stock', exchange: 'NASDAQ' },
    { symbol: 'NASDAQ:GOOGL', name: 'Alphabet Class A', type: 'stock', exchange: 'NASDAQ' },
    { symbol: 'NASDAQ:AMZN', name: 'Amazon.com Inc.', type: 'stock', exchange: 'NASDAQ' },
    { symbol: 'NASDAQ:NVDA', name: 'NVIDIA Corp.', type: 'stock', exchange: 'NASDAQ' },
    { symbol: 'NASDAQ:TSLA', name: 'Tesla Inc.', type: 'stock', exchange: 'NASDAQ' },
    { symbol: 'NASDAQ:META', name: 'Meta Platforms Inc.', type: 'stock', exchange: 'NASDAQ' },
];

const normalizeAssetResults = (data: unknown): AssetResult[] => {
    if (!Array.isArray(data)) return [];
    const stripHtml = (value: string) => value.replace(/<[^>]*>/g, '').trim();
    const mapped = data.map((item: any) => {
        const rawSymbol = String(item?.symbol || item?.ticker || '').trim();
        const symbol = stripHtml(rawSymbol);
        if (!symbol) return null;
        const rawName = String(item?.name || item?.description || item?.full_name || symbol).trim();
        const name = stripHtml(rawName || symbol);
        const type = String(item?.type || item?.assetType || item?.contract || 'other').trim();
        const rawExchange = String(item?.exchange || item?.exchange_name || '').trim();
        const exchange = stripHtml(rawExchange);
        const matchScore = typeof item?.matchScore === 'number' ? item.matchScore : (typeof item?.score === 'number' ? item.score : undefined);
        return { symbol, name, type, exchange, matchScore } as AssetResult;
    });
    return mapped.filter((item): item is AssetResult => Boolean(item));
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

const isCedearSymbol = (symbol?: string) => {
    if (!symbol) return false;
    return symbol.toUpperCase().startsWith('BCBA:');
};

const parseInputNumber = (value: string) => {
    if (value === undefined || value === null) return NaN;
    return Number(String(value).replace(',', '.'));
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

export function AddTransactionModal({ open, onOpenChange, portfolioId, onSuccess, initialSymbol }: AddTransactionModalProps) {
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
    const [transactionType, setTransactionType] = useState('BUY');
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

    // TradingView direct fetch functions removed in favor of backend proxy


    const resetState = (nextQuery?: string) => {
        setStep('search');
        setSelectedAsset(null);
        setBaseAsset(null);
        setIsCedear(false);
        setTransactionType('BUY');
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
    }, [open, initialSymbol]);

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
            const res = await apiFetch(`/market/quote?symbol=${encodeURIComponent(symbol)}`);
            if (res.ok) {
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

    const handleSelectAsset = async (asset: AssetResult) => {
        setBaseAsset(asset);
        setSelectedAsset(asset);
        const cedearSelected = isCedearSymbol(asset.symbol);
        setIsCedear(cedearSelected);
        setCurrency(cedearSelected ? 'ARS' : 'USD');
        setStep('details');
        setPrice('');
        await fetchQuote(asset.symbol);
    };

    const handleCedearToggle = async (checked: boolean) => {
        if (!baseAsset) return;
        if (!baseSymbol) return;
        if (checked) {
            const cedearAsset: AssetResult = {
                ...baseAsset,
                symbol: `BCBA:${baseSymbol}`,
                exchange: 'BCBA',
                type: 'cedear',
            };
            setSelectedAsset(cedearAsset);
            setIsCedear(true);
            setCurrency('ARS');
            setPrice('');
            await fetchQuote(cedearAsset.symbol);
        } else {
            setSelectedAsset(baseAsset);
            setIsCedear(false);
            setCurrency('USD');
            setPrice('');
            await fetchQuote(baseAsset.symbol);
        }
    };

    const handleRefreshPrice = async () => {
        if (!selectedAsset?.symbol) return;
        setPrice('');
        await fetchQuote(selectedAsset.symbol);
    };

    const needsPrice = transactionType === 'BUY' || transactionType === 'SELL';
    const numericQuantity = parseInputNumber(quantity);
    const numericPrice = needsPrice ? parseInputNumber(price) : 0;

    const handleSubmit = async () => {
        if (!selectedAsset || !quantity) return;
        if (!Number.isFinite(numericQuantity) || numericQuantity <= 0) return;
        if (needsPrice && (!Number.isFinite(numericPrice) || numericPrice <= 0)) return;
        setIsSubmitting(true);
        try {
            const payload = {
                assetTicker: selectedAsset.symbol,
                assetName: selectedAsset.name,
                assetType: isCedear ? 'CEDEAR' : selectedAsset.type,
                type: transactionType,
                date: new Date(date),
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
                const data = await response.json().catch(() => ({}));
                throw new Error(data?.message || 'Error creating transaction');
            }

            onSuccess();
            onOpenChange(false);
            resetState(initialSymbol || '');
        } catch (error) {
            console.error(error);
            alert((error as any)?.message || 'Error creating transaction');
        } finally {
            setIsSubmitting(false);
        }
    };

    const total = (numericQuantity || 0) * (numericPrice || 0);
    const trimmedQuery = searchQuery.trim();
    const isConfirmDisabled = isSubmitting || !quantity || (needsPrice && (priceLoading || !price));
    const baseSymbol = baseAsset ? extractBaseSymbol(baseAsset.symbol).toUpperCase() : '';
    const canCedear = Boolean(
        baseAsset &&
        !isCedearSymbol(baseAsset.symbol) &&
        (/stock|etf/i.test(baseAsset.type) ||
            /NASDAQ|NYSE|AMEX/i.test(baseAsset.exchange || '') ||
            /^(NASDAQ|NYSE|AMEX):/i.test(baseAsset.symbol))
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] gap-0 p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle>{step === 'search' ? 'Buscar Activo' : `Nueva Transacción: ${selectedAsset?.symbol}`}</DialogTitle>
                    <DialogDescription>
                        {step === 'search' ? 'Busca por ticker o nombre en TradingView (ej. AAPL, BTC)...' : 'Ingresa los detalles de la operación.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="p-6 pt-2">
                    {step === 'search' ? (
                        <div className="space-y-4">
                            <Input
                                placeholder="Buscar... (ej: NASDAQ:TSLA, BYBIT:BTCUSDT)"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                autoFocus
                                className="text-lg h-12"
                            />
                            <div className="max-h-[300px] overflow-y-auto space-y-2">
                                {isSearching && (
                                    <div className="text-center text-muted-foreground py-4">Buscando en TradingView...</div>
                                )}
                                {!isSearching && searchError && (
                                    <div className="text-center text-red-400 py-4">{searchError}</div>
                                )}
                                {!isSearching && trimmedQuery.length < 1 && (
                                    <div className="text-center text-muted-foreground py-4">
                                        Escribe al menos 1 caracter para buscar en TradingView.
                                    </div>
                                )}
                                {!isSearching && !searchError && trimmedQuery.length >= 1 && searchResults.map((asset, index) => (
                                    <button
                                        key={`${asset.symbol}-${asset.exchange || 'na'}-${asset.type || 'na'}-${index}`}
                                        className="w-full flex items-center justify-between gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                                        onClick={() => handleSelectAsset(asset)}
                                    >
                                        <div>
                                            <div className="font-bold">{asset.symbol}</div>
                                            <div className="text-sm text-muted-foreground">{asset.name}</div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {asset.exchange && (
                                                <Badge variant="secondary" className="uppercase text-[10px]">
                                                    {asset.exchange}
                                                </Badge>
                                            )}
                                            <Badge variant="outline">{formatAssetType(asset.type)}</Badge>
                                        </div>
                                    </button>
                                ))}
                                {!isSearching && !searchError && trimmedQuery.length >= 1 && searchResults.length === 0 && (
                                    <div className="text-center text-muted-foreground py-4">
                                        No se encontraron resultados en TradingView.
                                        <Button
                                            variant="link"
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
                            <div className="pt-3 border-t border-border/60">
                                <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                                    Recomendados · 7 Magníficas
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {MAG7_RECOMMENDATIONS.map((asset) => (
                                        <button
                                            key={asset.symbol}
                                            className="flex flex-col items-start gap-1 rounded-lg border border-border/70 p-3 text-left transition-colors hover:bg-muted"
                                            onClick={() => handleSelectAsset(asset)}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold">{asset.name}</span>
                                                <Badge variant="outline" className="uppercase text-[10px]">
                                                    {formatAssetType(asset.type)}
                                                </Badge>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
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
                                    <div className="text-xs text-muted-foreground">Actualizando precio desde TradingView...</div>
                                )}
                                {priceError && !priceLoading && (
                                    <div className="text-xs text-red-400">{priceError}</div>
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

                <DialogFooter className="p-6 pt-2 gap-2">
                    {step === 'details' && (
                        <BackButton onClick={() => setStep('search')} label="Volver" />
                    )}
                    <Button
                        onClick={() => (step === 'search' ? onOpenChange(false) : handleSubmit())}
                        disabled={step === 'details' ? isConfirmDisabled : isSubmitting}
                    >
                        {isSubmitting ? 'Guardando...' : step === 'search' ? 'Cancelar' : 'Confirmar'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function FormContent({
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
    const displayTotal = total + feeValue;
    const formatter = new Intl.NumberFormat(currency === 'ARS' ? 'es-AR' : 'en-US', {
        style: 'currency',
        currency: currency || 'USD',
    });
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
                <span className="font-medium">Total Estimado</span>
                <span className="text-xl font-bold">{formatter.format(displayTotal)}</span>
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
