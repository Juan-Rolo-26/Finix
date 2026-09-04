export const handleMockRequest = async (path: string, init?: RequestInit) => {
    const getDb = () => JSON.parse(localStorage.getItem('mockPortfolios') || '[]');
    const saveDb = (db: any) => localStorage.setItem('mockPortfolios', JSON.stringify(db));

    let db = getDb();

    // Seed database if empty
    if (db.length === 0) {
        db = [{
            id: 'mock-1', nombre: 'Mi Portfolio Principal', descripcion: 'Portfolio de prueba local', objetivo: 'largo plazo', monedaBase: 'USD', nivelRiesgo: 'medio', modoSocial: false, esPrincipal: true, cashBalance: 5000,
            assets: [
                { id: '1', ticker: 'AAPL', tipoActivo: 'stock', cantidad: 10, ppc: 150, montoInvertido: 1500, precioActual: 180, value: 1800 },
                { id: '2', ticker: 'BTC', tipoActivo: 'crypto', cantidad: 0.05, ppc: 40000, montoInvertido: 2000, precioActual: 62000, value: 3100 }
            ],
            movements: [
                { id: 'm1', fecha: new Date().toISOString(), tipoMovimiento: 'compra', ticker: 'AAPL', claseActivo: 'STOCK', cantidad: 10, precio: 150, total: 1500 },
                { id: 'm2', fecha: new Date().toISOString(), tipoMovimiento: 'compra', ticker: 'BTC', claseActivo: 'CRYPTO', cantidad: 0.05, precio: 40000, total: 2000 }
            ]
        }];
        saveDb(db);
    }

    const method = init?.method || 'GET';

    if (path === '/portfolios' && method === 'GET') {
        const res = db.map((p: any) => {
            const { movements, ...rest } = p;
            rest.assets = rest.assets?.map((a: any) => ({ ...a, tipoActivo: a.tipoActivo || 'stock' })) || [];
            return rest;
        });
        return new Response(JSON.stringify(res), { status: 200, headers: { 'content-type': 'application/json' } });
    }

    if (path === '/portfolios' && method === 'POST') {
        const body = JSON.parse(init?.body as string);
        const newP = { ...body, id: 'mock-' + Date.now(), assets: [], movements: [], cashBalance: 0 };
        db.push(newP);
        saveDb(db);
        return new Response(JSON.stringify(newP), { status: 201, headers: { 'content-type': 'application/json' } });
    }

    if (path.match(/^\/portfolios\/[^\/]+$/) && method === 'DELETE') {
        const id = path.split('/')[2];
        db = db.filter((p: any) => p.id !== id);
        saveDb(db);
        return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'content-type': 'application/json' } });
    }

    if (path.match(/^\/portfolios\/[^\/]+$/) && method === 'PUT') {
        const id = path.split('/')[2];
        const body = JSON.parse(init?.body as string);
        const idx = db.findIndex((p: any) => p.id === id);
        if (idx !== -1) {
            db[idx] = { ...db[idx], ...body };
            saveDb(db);
            return new Response(JSON.stringify(db[idx]), { status: 200, headers: { 'content-type': 'application/json' } });
        }
    }

    if (path.match(/^\/portfolios\/([^\/]+)\/metrics\/?(\?.*)?$/) && method === 'GET') {
        const id = path.match(/^\/portfolios\/([^\/]+)\/metrics/)?.[1];
        const p = db.find((x: any) => x.id === id);
        if (!p) return new Response('Not found', { status: 404 });

        const assetsValue = p.assets.reduce((sum: number, a: any) => sum + (a.cantidad * (a.precioActual || a.ppc)), 0);
        const capitalInvertido = p.assets.reduce((sum: number, a: any) => sum + a.montoInvertido, 0);
        const valorActual = assetsValue + p.cashBalance;
        const gananciaTotal = assetsValue - capitalInvertido;
        const variacionPorcentual = capitalInvertido > 0 ? (gananciaTotal / capitalInvertido) * 100 : 0;

        const metrics = {
            capitalTotal: valorActual,
            capitalInvertido,
            assetsValue,
            cashBalance: p.cashBalance,
            valorActual,
            totalValue: valorActual,
            gananciaTotal,
            variacionPorcentual,
            diversificacionPorClase: { STOCK: 50, CRYPTO: 50 },
            diversificacionPorActivo: { AAPL: 50, BTC: 50 },
            cantidadActivos: p.assets.length
        };
        return new Response(JSON.stringify(metrics), { status: 200, headers: { 'content-type': 'application/json' } });
    }

    if (path.match(/^\/portfolios\/([^\/]+)\/movements\/?(\?.*)?$/) && method === 'GET') {
        const id = path.match(/^\/portfolios\/([^\/]+)\/movements/)?.[1];
        const p = db.find((x: any) => x.id === id);
        if (!p) return new Response('Not found', { status: 404 });
        return new Response(JSON.stringify(p.movements || []), { status: 200, headers: { 'content-type': 'application/json' } });
    }

    return null;
};
