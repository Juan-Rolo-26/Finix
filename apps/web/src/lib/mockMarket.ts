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
                    { ...dummyAsset, id: 'a1', symbol: 'BCBA:GGAL', label: 'Grupo Financiero Galicia', price: 3500, change: 2.4, currency: 'ARS' },
                    { ...dummyAsset, id: 'a2', symbol: 'BCBA:YPFD', label: 'YPF S.A.', price: 18000, change: -1.2, currency: 'ARS' }
                ],
                global: [
                    dummyAsset,
                    { ...dummyAsset, id: 'g2', symbol: 'NASDAQ:MSFT', label: 'Microsoft' }
                ],
                crypto: [
                    { ...dummyAsset, id: 'c1', symbol: 'CRYPTO:BTC', label: 'Bitcoin', price: 60200, change: 3.2 },
                    { ...dummyAsset, id: 'c2', symbol: 'CRYPTO:ETH', label: 'Ethereum', price: 3400, change: 1.5 }
                ],
                commodities: [
                    { ...dummyAsset, id: 'cm1', symbol: 'OANDA:XAUUSD', label: 'Oro', price: 2350, change: -0.5 },
                    { ...dummyAsset, id: 'cm2', symbol: 'NYMEX:CL', label: 'Petróleo WTI', price: 82.5, change: 1.2 }
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
            symbol: `MOCK:${query.toUpperCase()}`,
            name: query.toUpperCase(),
            type: 'stock',
            exchange: 'MOCK'
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
