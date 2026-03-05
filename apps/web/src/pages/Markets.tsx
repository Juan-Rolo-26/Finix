import { useState, useEffect } from 'react';
import { Search, TrendingUp, TrendingDown, Activity, LineChart, Zap } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiFetch } from '@/lib/api';
import TradingViewChart from '@/components/TradingViewChart';
import MarketOverview from '@/components/MarketOverview';
import { useTranslation } from '@/i18n';

interface MarketAsset {
    symbol: string;
    name: string;
    type: string;
    exchange?: string;
}

interface QuoteData {
    inputSymbol?: string;
    symbol: string;
    price: number | null;
    change: number | null;
    updatedAt: string;
    unavailable?: boolean;
}

export default function Markets() {
    const t = useTranslation();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<MarketAsset[]>([]);
    const [selectedAsset, setSelectedAsset] = useState<MarketAsset | null>({
        symbol: 'NASDAQ:AAPL',
        name: 'Apple Inc.',
        type: 'stock',
        exchange: 'NASDAQ'
    });
    const [quoteData, setQuoteData] = useState<QuoteData | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [activeTab, setActiveTab] = useState('chart');

    // Popular assets for quick access
    const popularAssets: MarketAsset[] = [
        { symbol: 'NASDAQ:AAPL', name: 'Apple', type: 'stock', exchange: 'NASDAQ' },
        { symbol: 'NASDAQ:TSLA', name: 'Tesla', type: 'stock', exchange: 'NASDAQ' },
        { symbol: 'NASDAQ:NVDA', name: 'NVIDIA', type: 'stock', exchange: 'NASDAQ' },
        { symbol: 'BINANCE:BTCUSDT', name: 'Bitcoin', type: 'crypto', exchange: 'BINANCE' },
        { symbol: 'BINANCE:ETHUSDT', name: 'Ethereum', type: 'crypto', exchange: 'BINANCE' },
        { symbol: 'FX:EURUSD', name: 'EUR/USD', type: 'forex', exchange: 'FX' },
        { symbol: 'OANDA:XAUUSD', name: 'Gold', type: 'commodity', exchange: 'OANDA' },
        { symbol: 'NYSE:SPY', name: 'S&P 500 ETF', type: 'etf', exchange: 'NYSE' },
    ];

    // Search handler with debounce
    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }

        const timeoutId = setTimeout(async () => {
            setIsSearching(true);
            try {
                const res = await apiFetch(`/market/search?query=${encodeURIComponent(searchQuery)}`);
                if (res.ok) {
                    const data = await res.json();
                    setSearchResults(data || []);
                }
            } catch (err) {
                console.error('Search error:', err);
            } finally {
                setIsSearching(false);
            }
        }, 400);

        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    // Fetch quote when asset changes
    useEffect(() => {
        if (!selectedAsset) return;

        const fetchQuote = async () => {
            try {
                const res = await apiFetch(`/market/quote?symbol=${encodeURIComponent(selectedAsset.symbol)}`);
                if (res.ok) {
                    const data = await res.json();
                    setQuoteData(data);
                }
            } catch (err) {
                console.error('Quote error:', err);
            }
        };

        fetchQuote();
        const interval = setInterval(fetchQuote, 30000); // Update every 30s

        return () => clearInterval(interval);
    }, [selectedAsset]);

    const selectAsset = (asset: MarketAsset) => {
        setSelectedAsset(asset);
        setSearchQuery('');
        setSearchResults([]);
    };

    const getTypeColor = (type: string) => {
        const colors: Record<string, string> = {
            stock: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
            crypto: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
            forex: 'bg-green-500/10 text-green-400 border-green-500/20',
            commodity: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
            etf: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        };
        return colors[type] || 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    };

    return (
        <div className="p-4 md:p-6 lg:p-8 w-full space-y-8 pb-16 xl:space-y-10">
            {/* Header */}
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-5xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                            {t.markets.title}
                        </h1>
                        <p className="text-muted-foreground mt-3 text-lg">
                            {t.markets.subtitle}
                        </p>
                    </div>
                    <Activity className="w-16 h-16 text-primary/60" />
                </div>

                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                    <Input
                        type="text"
                        placeholder={t.markets.searchPlaceholder}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-12 h-14 text-lg bg-card/50 border-border/60 focus:bg-card"
                    />
                    {isSearching && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                    )}

                    {/* Search Results Dropdown */}
                    {searchResults.length > 0 && (
                        <Card className="absolute top-full mt-2 w-full z-50 max-h-96 overflow-y-auto shadow-2xl border-primary/20">
                            <CardContent className="p-2">
                                {searchResults.map((asset, idx) => (
                                    <button
                                        key={`${asset.symbol}-${idx}`}
                                        onClick={() => selectAsset(asset)}
                                        className="w-full flex items-center justify-between gap-3 p-3 rounded-lg hover:bg-secondary/80 transition-colors text-left"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold text-foreground truncate">{asset.symbol}</div>
                                            <div className="text-sm text-muted-foreground truncate">{asset.name}</div>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            {asset.exchange && (
                                                <Badge variant="outline" className="uppercase text-xs">
                                                    {asset.exchange}
                                                </Badge>
                                            )}
                                            <Badge className={getTypeColor(asset.type)}>
                                                {asset.type}
                                            </Badge>
                                        </div>
                                    </button>
                                ))}
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Popular Assets */}
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        <Zap className="inline w-4 h-4 mr-2" />
                        {t.markets.quickAccess}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {popularAssets.map((asset) => (
                            <Button
                                key={asset.symbol}
                                variant={selectedAsset?.symbol === asset.symbol ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => selectAsset(asset)}
                                className="transition-all hover:scale-105"
                            >
                                {asset.name}
                            </Button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Selected Asset Info */}
            {selectedAsset && (
                <Card className="border-primary/20 bg-gradient-to-br from-card to-card/50">
                    <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                            <div>
                                <CardTitle className="text-2xl">{selectedAsset.symbol}</CardTitle>
                                <CardDescription className="text-base mt-1">{selectedAsset.name}</CardDescription>
                            </div>
                            {quoteData && (
                                <div className="text-right">
                                    {typeof quoteData.price === 'number' ? (
                                        <>
                                            <div className="text-3xl font-bold">
                                                ${quoteData.price.toFixed(2)}
                                            </div>
                                            <div className={`flex items-center gap-1 justify-end mt-1 ${(quoteData.change ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'
                                                }`}>
                                                {(quoteData.change ?? 0) >= 0 ? (
                                                    <TrendingUp className="w-4 h-4" />
                                                ) : (
                                                    <TrendingDown className="w-4 h-4" />
                                                )}
                                                <span className="font-semibold">
                                                    {(quoteData.change ?? 0) >= 0 ? '+' : ''}{(quoteData.change ?? 0).toFixed(2)}%
                                                </span>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-xs text-yellow-400">
                                            {t.markets.noQuote}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </CardHeader>
                </Card>
            )}

            {/* Main Content Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-7">
                <TabsList className="grid w-full grid-cols-2 h-16 bg-secondary/50">
                    <TabsTrigger value="chart" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        <LineChart className="w-4 h-4" />
                        {t.markets.tabs.chart}
                    </TabsTrigger>
                    <TabsTrigger value="overview" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        <Activity className="w-4 h-4" />
                        {t.markets.tabs.overview}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="chart" className="space-y-4 min-h-[72vh]">
                    {selectedAsset && (
                        <TradingViewChart symbol={selectedAsset.symbol} height={1000} />
                    )}
                </TabsContent>

                <TabsContent value="overview" className="space-y-4">
                    <MarketOverview />
                </TabsContent>
            </Tabs>
        </div>
    );
}
