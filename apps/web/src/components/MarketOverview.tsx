import { useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Globe, DollarSign, Flame } from 'lucide-react';
import FinvizHeatmap from './FinvizHeatmap';

const FOREX_HEIGHT = 700;
const CRYPTO_HEIGHT = 760;

export default function MarketOverview() {
    const tickerRef = useRef<HTMLDivElement>(null);
    const forexRef = useRef<HTMLDivElement>(null);
    const cryptoRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const mountWidget = (
            target: HTMLDivElement,
            scriptSrc: string,
            config: Record<string, unknown>,
            height: number
        ) => {
            target.innerHTML = '';

            const widgetRoot = document.createElement('div');
            widgetRoot.className = 'tradingview-widget-container market-overview-widget';
            widgetRoot.style.height = `${height}px`;
            widgetRoot.style.width = '100%';

            const widgetViewport = document.createElement('div');
            widgetViewport.className = 'tradingview-widget-container__widget';
            widgetViewport.style.height = '100%';
            widgetViewport.style.width = '100%';
            widgetRoot.appendChild(widgetViewport);

            const script = document.createElement('script');
            script.src = scriptSrc;
            script.async = true;
            script.type = 'text/javascript';
            script.innerHTML = JSON.stringify({
                ...config,
                width: '100%',
                height
            });

            widgetRoot.appendChild(script);
            target.appendChild(widgetRoot);
        };

        // Ticker Tape Widget
        if (tickerRef.current) {
            tickerRef.current.innerHTML = '';
            const tickerScript = document.createElement('script');
            tickerScript.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js';
            tickerScript.async = true;
            tickerScript.innerHTML = JSON.stringify({
                symbols: [
                    { proName: 'FOREXCOM:SPXUSD', title: 'S&P 500' },
                    { proName: 'FOREXCOM:NSXUSD', title: 'NASDAQ' },
                    { proName: 'BITSTAMP:BTCUSD', title: 'Bitcoin' },
                    { proName: 'BITSTAMP:ETHUSD', title: 'Ethereum' },
                    { description: 'Apple', proName: 'NASDAQ:AAPL' },
                    { description: 'Tesla', proName: 'NASDAQ:TSLA' },
                    { description: 'NVIDIA', proName: 'NASDAQ:NVDA' },
                    { description: 'Microsoft', proName: 'NASDAQ:MSFT' },
                    { description: 'EUR/USD', proName: 'FX:EURUSD' },
                    { description: 'Gold', proName: 'OANDA:XAUUSD' }
                ],
                showSymbolLogo: true,
                colorTheme: 'dark',
                isTransparent: true,
                displayMode: 'adaptive',
                locale: 'es'
            });

            const tickerContainer = document.createElement('div');
            tickerContainer.className = 'tradingview-widget-container';
            tickerContainer.appendChild(tickerScript);
            tickerRef.current.appendChild(tickerContainer);
        }

        // Forex Cross Rates Widget
        if (forexRef.current) {
            mountWidget(
                forexRef.current,
                'https://s3.tradingview.com/external-embedding/embed-widget-forex-cross-rates.js',
                {
                    currencies: ['EUR', 'USD', 'JPY', 'GBP', 'CHF', 'AUD'],
                    isTransparent: true,
                    colorTheme: 'dark',
                    locale: 'es'
                },
                FOREX_HEIGHT
            );
        }

        // Crypto Market Widget
        if (cryptoRef.current) {
            mountWidget(
                cryptoRef.current,
                'https://s3.tradingview.com/external-embedding/embed-widget-screener.js',
                {
                    defaultColumn: 'overview',
                    screener_type: 'crypto_mkt',
                    displayCurrency: 'USD',
                    colorTheme: 'dark',
                    locale: 'es',
                    isTransparent: true
                },
                CRYPTO_HEIGHT
            );
        }

        // Cleanup
        return () => {
            if (tickerRef.current) tickerRef.current.innerHTML = '';
            if (forexRef.current) forexRef.current.innerHTML = '';
            if (cryptoRef.current) cryptoRef.current.innerHTML = '';
        };
    }, []);

    return (
        <div className="space-y-8">
            {/* Ticker Tape */}
            <Card className="border-primary/20 bg-gradient-to-br from-card to-card/50 overflow-hidden">
                <div ref={tickerRef} />
            </Card>

            {/* Stock Heatmap */}
            <Card className="border-primary/20 bg-gradient-to-br from-card to-card/50">
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-xl">
                        <Flame className="w-6 h-6 text-primary" />
                        Mapa de Calor - Finviz (S&P 500)
                    </CardTitle>
                    <CardDescription className="text-base">
                        Heatmap estilo Finviz con breadth, ganadores y perdedores
                    </CardDescription>
                </CardHeader>
                <CardContent className="px-5 pb-5 pt-0">
                    <FinvizHeatmap />
                </CardContent>
            </Card>

            {/* Forex and Crypto Widgets */}
            <div className="grid gap-6 grid-cols-1 2xl:grid-cols-2">
                {/* Forex Cross Rates */}
                <Card className="border-primary/20 bg-gradient-to-br from-card to-card/50">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-xl">
                            <DollarSign className="w-6 h-6 text-primary" />
                            Tasas de Cambio
                        </CardTitle>
                        <CardDescription className="text-base">
                            Cruces de divisas principales
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="px-5 pb-5 pt-0">
                        <div ref={forexRef} className="h-[700px] w-full" />
                    </CardContent>
                </Card>

                {/* Crypto Market */}
                <Card className="border-primary/20 bg-gradient-to-br from-card to-card/50">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-xl">
                            <Globe className="w-6 h-6 text-primary" />
                            Mercado Cripto
                        </CardTitle>
                        <CardDescription className="text-base">
                            Top criptomonedas por capitalización
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="px-5 pb-5 pt-0">
                        <div ref={cryptoRef} className="h-[760px] w-full" />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
