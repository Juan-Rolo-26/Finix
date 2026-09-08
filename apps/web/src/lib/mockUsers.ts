// intercept user search
export async function handleMockUsers(path: string, init?: RequestInit): Promise<Response | null> {
    const method = (init?.method || 'GET').toUpperCase();

    if (path.startsWith('/users/search') && method === 'GET') {
        const qs = path.includes('?') ? new URLSearchParams(path.split('?')[1]) : new URLSearchParams();
        const q = (qs.get('q') || '').toLowerCase().trim();

        if (!q) {
            return new Response(JSON.stringify([]), { status: 200, headers: { 'content-type': 'application/json' } });
        }

        const dummyUsers = [
            { id: 'u1', username: 'inversor_pro', title: 'Analista Técnico', isVerified: true, avatarUrl: undefined },
            { id: 'u2', username: 'crypto_whale', title: 'Crypto Experto', isVerified: false, avatarUrl: undefined },
            { id: 'u3', username: 'value_investor_ar', title: 'Value Investing', isVerified: true, avatarUrl: undefined },
            { id: 'u4', username: 'trading_latam', title: 'Day Trader', isVerified: false, avatarUrl: undefined },
            { id: 'u5', username: 'finix_oficial', title: 'Plataforma oficial', isVerified: true, avatarUrl: undefined },
            { id: 'u6', username: 'WarrenBuffettArg', title: 'Holding AR', isVerified: true, avatarUrl: undefined },
            { id: 'u7', username: 'cripto_monedas', title: 'DeFi Dev', isVerified: false, avatarUrl: undefined },
            { id: 'u8', username: 'juan_perez', title: 'Principiante', isVerified: false, avatarUrl: undefined },
            { id: 'u9', username: 'MariaL', title: 'Analista Fundamental', isVerified: false, avatarUrl: undefined },
            { id: 'u10', username: 'BitcoinArg', title: 'Miner', isVerified: true, avatarUrl: undefined },
        ];

        const results = dummyUsers.filter(u =>
            u.username.toLowerCase().includes(q) ||
            (u.title && u.title.toLowerCase().includes(q))
        );

        return new Response(JSON.stringify(results), {
            status: 200,
            headers: { 'content-type': 'application/json' }
        });
    }

    return null;
}
