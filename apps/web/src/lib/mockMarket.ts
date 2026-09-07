export const handleMockMarket = async (path: string, init?: RequestInit) => {
    const method = init?.method || 'GET';
    // Utilizaremos fechas en tiempo real y variaciones mas realistas
    const now = new Date().toISOString();

    if (path === '/market/dashboard' && method === 'GET') {
        const dummyAsset = {
            id: 'mock-a1', symbol: 'NASDAQ:AAPL', label: 'Apple Inc.', description: 'Tecnología',
            format: 'currency', currency: 'USD', price: 150.2, change: +1.5, updatedAt: now, unavailable: false
        };
        const dashboard = {
            updatedAt: now,
            pulse: {
                label: 'Mercado mixto', tone: 'neutral', summary: 'Leves variaciones en jornada moderada.',
                advancing: 45, declining: 30, unchanged: 25
            },
            currencyGap: {
                label: 'Brecha Cambiaria', gapPct: 20.5, gapValue: 200, officialSell: 1000, blueSell: 1200
            },
            dollars: [
                { id: 'd1', label: 'Dolar Blue', buy: 1180, sell: 1200, spreadPct: 0.1, updatedAt: now },
                { id: 'd2', label: 'Dolar MEP', buy: 1150, sell: 1160, spreadPct: -0.2, updatedAt: now },
                { id: 'd3', label: 'Dolar CCL', buy: 1170, sell: 1175, spreadPct: 0.5, updatedAt: now },
                // NUEVA REFERENCIA: Dólar Oficial/Tarjeta
                { id: 'd4', label: 'Dolar Tarjeta', buy: 1515, sell: 1550, spreadPct: 0.05, updatedAt: now }
            ],
            sections: {
                argentina: [
                    { ...dummyAsset, id: 'a1', symbol: 'BCBA:GGAL', label: 'Grupo Financiero Galicia', price: 4200, change: 3.8, currency: 'ARS' },
                    { ...dummyAsset, id: 'a2', symbol: 'BCBA:YPFD', label: 'YPF S.A.', price: 19500, change: -0.5, currency: 'ARS' },
                    { ...dummyAsset, id: 'a3', symbol: 'BCBA:PAMP', label: 'Pampa Energía', price: 3100, change: 1.2, currency: 'ARS' },
                    { ...dummyAsset, id: 'a4', symbol: 'BCBA:AL30', label: 'Bono AL30', price: 58000, change: 0.8, currency: 'ARS' },
                    { ...dummyAsset, id: 'a5', symbol: 'BCBA:CEPU', label: 'Central Puerto', price: 1450, change: -1.7, currency: 'ARS' },
                    { ...dummyAsset, id: 'a6', symbol: 'BCBA:BMA', label: 'Banco Macro', price: 5600, change: 2.1, currency: 'ARS' }
                ],
                global: [
                    dummyAsset,
                    { ...dummyAsset, id: 'g2', symbol: 'NASDAQ:MSFT', label: 'Microsoft', price: 421.5, change: 1.2 },
                    { ...dummyAsset, id: 'g3', symbol: 'NASDAQ:TSLA', label: 'Tesla', price: 175.2, change: 3.4 },
                    { ...dummyAsset, id: 'g4', symbol: 'NASDAQ:AMZN', label: 'Amazon', price: 185.1, change: -0.8 },
                    { ...dummyAsset, id: 'g5', symbol: 'NASDAQ:NVDA', label: 'NVIDIA', price: 895.5, change: 4.9 },
                    { ...dummyAsset, id: 'g6', symbol: 'NASDAQ:META', label: 'Meta', price: 510.3, change: 2.1 }
                ],
                crypto: [
                    { ...dummyAsset, id: 'c1', symbol: 'CRYPTO:BTC', label: 'Bitcoin', price: 62450, change: 3.2 },
                    { ...dummyAsset, id: 'c2', symbol: 'CRYPTO:ETH', label: 'Ethereum', price: 3450, change: 1.5 },
                    { ...dummyAsset, id: 'c3', symbol: 'CRYPTO:SOL', label: 'Solana', price: 145, change: 8.2 },
                    { ...dummyAsset, id: 'c4', symbol: 'CRYPTO:BNB', label: 'Binance Coin', price: 560, change: -1.2 },
                    { ...dummyAsset, id: 'c5', symbol: 'CRYPTO:ADA', label: 'Cardano', price: 0.45, change: 0.5 }
                ],
                commodities: [
                    { ...dummyAsset, id: 'cm1', symbol: 'OANDA:XAUUSD', label: 'Oro', price: 2350, change: -0.5 },
                    { ...dummyAsset, id: 'cm2', symbol: 'NYMEX:CL', label: 'Petróleo WTI', price: 82.5, change: 1.2 },
                    { ...dummyAsset, id: 'cm3', symbol: 'OANDA:XAGUSD', label: 'Plata', price: 28.4, change: 2.1 },
                    { ...dummyAsset, id: 'cm4', symbol: 'COMEX:HG', label: 'Cobre', price: 4.5, change: -1.8 },
                    { ...dummyAsset, id: 'cm5', symbol: 'CBOT:ZS', label: 'Soja', price: 1150, change: 0.3 }
                ],
                indicators: [
                    { ...dummyAsset, id: 'i1', symbol: 'INDEX:SPX', label: 'S&P 500', price: 5200, change: 0.8 },
                    { ...dummyAsset, id: 'i2', symbol: 'INDEX:NDX', label: 'Nasdaq 100', price: 18000, change: 1.5 },
                    // DOS REFERENCIAS MAS DE INDICADORES
                    { ...dummyAsset, id: 'i3', symbol: 'INDEX:VIX', label: 'VIX Volatilidad', price: 14.50, change: -2.3, description: 'Medidor del miedo' },
                    { ...dummyAsset, id: 'i4', symbol: 'RATES:US10Y', label: 'Rendimiento 10 Años US', price: 4.25, change: 0.5, format: 'percent', description: 'Bonos del Tesoro' }
                ]
            },
            leaders: {
                gainers: [{ ...dummyAsset, id: 'lg1', symbol: 'CRYPTO:BTC', label: 'Bitcoin', price: 62000, change: 3.2 }],
                losers: [{ ...dummyAsset, id: 'll1', symbol: 'BCBA:YPFD', label: 'YPF S.A.', price: 18000, change: -1.2, currency: 'ARS' }]
            },
            // DATOS REALES / DINAMICOS PARA EL RADAR (Vamos a simular Nvidia dinamicamente basada en tendencia de AI actual)
            community: [
                { symbol: 'NASDAQ:NVDA', label: 'Nvidia Corp.', mentions: 342, engagement: 8940, price: 119.5, change: 4.2, updatedAt: now }
            ]
        };
        return new Response(JSON.stringify(dashboard), { status: 200, headers: { 'content-type': 'application/json' } });
    }

    if (path.startsWith('/market/search') && method === 'GET') {
        const urlParams = new URLSearchParams(path.split('?')[1]);
        const query = urlParams.get('query') || '';
        return new Response(JSON.stringify([{
            symbol: `NASDAQ:${query.toUpperCase()}`,
            name: query.toUpperCase(),
            type: 'stock',
            exchange: 'NASDAQ'
        }]), { status: 200, headers: { 'content-type': 'application/json' } });
    }

    if (path.startsWith('/market/quote') && method === 'GET') {
        const urlParams = new URLSearchParams(path.split('?')[1]);
        const symbol = urlParams.get('symbol') || '';
        return new Response(JSON.stringify({
            symbol,
            price: Math.random() * 1000 + 100,
            change: (Math.random() * 10) - 5,
            updatedAt: now
        }), { status: 200, headers: { 'content-type': 'application/json' } });
    }

    if (path === '/market/tickers' && method === 'GET') {
        return new Response(JSON.stringify([
            { symbol: 'NASDAQ:NVDA', price: 895.50, change: 42.10, changePercent: 4.93, volume: 45000000 },
            { symbol: 'NASDAQ:META', price: 510.30, change: 18.40, changePercent: 3.74, volume: 15200000 },
            { symbol: 'NASDAQ:TSLA', price: 175.22, change: 5.80, changePercent: 3.43, volume: 88500000 },
            { symbol: 'NASDAQ:AMZN', price: 185.10, change: 4.50, changePercent: 2.49, volume: 32100000 },
            { symbol: 'NASDAQ:MSFT', price: 420.90, change: 8.50, changePercent: 2.06, volume: 19500000 }
        ]), { status: 200, headers: { 'content-type': 'application/json' } });
    }

    return null;
};
