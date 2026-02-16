import { useEffect } from 'react';

export const useDebugPortfolio = () => {
    useEffect(() => {
        const token = localStorage.getItem('token') || '';
        const demoMode = localStorage.getItem('demo_mode') === '1' || token.startsWith('demo-');
        if (!demoMode) {
            return;
        }

        const demoPortfolio = {
            id: '1',
            nombre: 'Portafolio Principal',
            descripcion: 'Mi portafolio de inversiones',
            objetivo: 'largo plazo',
            monedaBase: 'USD',
            nivelRiesgo: 'medio',
            modoSocial: false,
            esPrincipal: true,
            admiteBienesRaices: false,
            assets: [
                {
                    id: '1',
                    ticker: 'AAPL',
                    tipoActivo: 'Acción',
                    montoInvertido: 5000,
                    ppc: 150,
                    cantidad: 33.33,
                    precioActual: 180,
                    createdAt: new Date().toISOString()
                },
                {
                    id: '2',
                    ticker: 'BTC-USD',
                    tipoActivo: 'Crypto',
                    montoInvertido: 3000,
                    ppc: 40000,
                    cantidad: 0.075,
                    precioActual: 45000,
                    createdAt: new Date().toISOString()
                },
                {
                    id: '3',
                    ticker: 'TSLA',
                    tipoActivo: 'Acción',
                    montoInvertido: 2000,
                    ppc: 200,
                    cantidad: 10,
                    precioActual: 220,
                    createdAt: new Date().toISOString()
                }
            ],
            movements: [],
            createdAt: new Date().toISOString()
        };

        // Obtener el usuario actual para la clave del storage
        const rawUser = localStorage.getItem('user');
        let keyPart = 'guest';
        if (rawUser) {
            try {
                const parsed = JSON.parse(rawUser);
                keyPart = parsed?.email || parsed?.username || keyPart;
            } catch {
                // ignore
            }
        }

        const storageKey = `demo_portfolios:${keyPart}`;

        // Si no hay portfolios, crear uno demo
        const existing = localStorage.getItem(storageKey);
        if (!existing) {
            localStorage.setItem(storageKey, JSON.stringify([demoPortfolio]));
            console.log('✅ Portfolio de demostración creado');
        }
    }, []);
};
