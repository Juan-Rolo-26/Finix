// ─── Mock Communities Handler ─────────────────────────────────────────────────
// Intercepts all /communities/* API calls and returns mock data from localStorage.

const DB_KEY = 'mockCommunitiesDb';
const MEMBERS_KEY = 'mockCommunitiesMembers';

export interface MockCommunity {
    id: string;
    name: string;
    description: string;
    category: string;
    imageUrl?: string;
    bannerUrl?: string;
    privacyType: string;
    createdAt: string;
    rules?: string;
    creator: { id: string; username: string; avatarUrl?: string; isVerified: boolean };
    plans: { id: string; name: string; price: number; interval: string; features: string[]; tierLevel: number }[];
    _count: { members: number; posts: number; resources: number; events: number };
    isMember: boolean;
    tierLevel: number;
}

function getDb(): MockCommunity[] {
    return JSON.parse(localStorage.getItem(DB_KEY) || 'null') || seedDb();
}

function saveDb(db: MockCommunity[]) {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function getMembers(): Record<string, boolean> {
    return JSON.parse(localStorage.getItem(MEMBERS_KEY) || '{}');
}

function applyMemberState(communities: MockCommunity[]): MockCommunity[] {
    const members = getMembers();
    return communities.map((c) => ({ ...c, isMember: !!members[c.id] }));
}

function nowDays(offsetDays = 0) {
    return new Date(Date.now() - offsetDays * 86400000).toISOString();
}

function freePlan(id: string) {
    return [{ id: `${id}-free`, name: 'Gratis', price: 0, interval: 'monthly', features: ['Acceso a publicaciones', 'Chat de la comunidad'], tierLevel: 0 }];
}

function seedDb(): MockCommunity[] {
    const seed: MockCommunity[] = [
        {
            id: 'mc-1', name: 'Inversores Argentinos',
            description: 'La comunidad más grande de inversores argentinos. Analizamos el Merval, CEDEARs, dólar y todo lo que mueve nuestra economía.',
            category: 'Acciones', privacyType: 'PUBLIC', createdAt: nowDays(120),
            creator: { id: 'u1', username: 'inversor_pro', isVerified: true },
            plans: freePlan('mc-1'),
            _count: { members: 4820, posts: 1340, resources: 89, events: 12 },
            isMember: false, tierLevel: 0,
        },
        {
            id: 'mc-2', name: 'Crypto Argentina',
            description: 'Todo sobre Bitcoin, Ethereum y el ecosistema DeFi desde la perspectiva argentina. Análisis técnico y fundamental.',
            category: 'Cripto', privacyType: 'PUBLIC', createdAt: nowDays(90),
            creator: { id: 'u3', username: 'crypto_analyst_ar', isVerified: true },
            plans: [
                ...freePlan('mc-2'),
                { id: 'mc-2-pro', name: 'Pro', price: 9.99, interval: 'monthly', features: ['Alertas de precio', 'Análisis exclusivos', 'Señales de trading'], tierLevel: 1 },
            ],
            _count: { members: 3210, posts: 2780, resources: 145, events: 8 },
            isMember: false, tierLevel: 0,
        },
        {
            id: 'mc-3', name: 'Value Investing Club',
            description: 'Comunidad enfocada en value investing y largo plazo. Analizamos empresas con fundamentos sólidos y buscamos margen de seguridad.',
            category: 'Acciones', privacyType: 'PUBLIC', createdAt: nowDays(200),
            creator: { id: 'u8', username: 'value_invest_ar', isVerified: false },
            plans: freePlan('mc-3'),
            _count: { members: 1580, posts: 890, resources: 234, events: 5 },
            isMember: false, tierLevel: 0,
        },
        {
            id: 'mc-4', name: 'Trading Técnico',
            description: 'Análisis técnico aplicado a todos los mercados. Aprende a leer gráficos, identificar patrones y gestionar el riesgo.',
            category: 'Trading', privacyType: 'PUBLIC', createdAt: nowDays(60),
            creator: { id: 'u6', username: 'tech_stocks_lat', isVerified: false },
            plans: [
                { id: 'mc-4-basic', name: 'Básico', price: 4.99, interval: 'monthly', features: ['Señales semanales', 'Foro premium'], tierLevel: 1 },
                { id: 'mc-4-pro', name: 'Pro', price: 14.99, interval: 'monthly', features: ['Señales diarias', '1:1 mensual', 'Alertas automáticas'], tierLevel: 2 },
            ],
            _count: { members: 2340, posts: 4120, resources: 67, events: 24 },
            isMember: false, tierLevel: 0,
        },
        {
            id: 'mc-5', name: 'Finanzas Personales AR',
            description: 'Cómo manejar tus finanzas personales en Argentina. Ahorro, inversión, cobertura inflacionaria y planificación financiera.',
            category: 'Finanzas personales', privacyType: 'PUBLIC', createdAt: nowDays(150),
            creator: { id: 'u2', username: 'finanzas_ok', isVerified: false },
            plans: freePlan('mc-5'),
            _count: { members: 6780, posts: 3450, resources: 312, events: 18 },
            isMember: false, tierLevel: 0,
        },
        {
            id: 'mc-6', name: 'Macro Global',
            description: 'Análisis macroeconómico global: Fed, BCE, inflación, tasas de interés y cómo afectan a tus inversiones.',
            category: 'Macro', privacyType: 'PUBLIC', createdAt: nowDays(45),
            creator: { id: 'u5', username: 'finix_news', isVerified: true },
            plans: freePlan('mc-6'),
            _count: { members: 1920, posts: 780, resources: 156, events: 7 },
            isMember: false, tierLevel: 0,
        },
        {
            id: 'mc-7', name: 'Dividendos & Renta Pasiva',
            description: 'Construí tu portfolio de dividendos. Analizamos empresas que pagan dividendos crecientes y estrategias de renta pasiva.',
            category: 'Dividendos', privacyType: 'PUBLIC', createdAt: nowDays(300),
            creator: { id: 'u4', username: 'merval_watcher', isVerified: false },
            plans: freePlan('mc-7'),
            _count: { members: 2890, posts: 1230, resources: 445, events: 3 },
            isMember: false, tierLevel: 0,
        },
        {
            id: 'mc-8', name: 'Educación Financiera',
            description: 'Aprendé los fundamentos de las inversiones desde cero. Cursos, guías y recursos para inversores principiantes.',
            category: 'Educación', privacyType: 'PUBLIC', createdAt: nowDays(180),
            creator: { id: 'u7', username: 'economia_ar', isVerified: false },
            plans: [
                ...freePlan('mc-8'),
                { id: 'mc-8-premium', name: 'Premium', price: 7.99, interval: 'monthly', features: ['Cursos exclusivos', 'Mentorías grupales', 'Certificados'], tierLevel: 1 },
            ],
            _count: { members: 8940, posts: 2100, resources: 678, events: 42 },
            isMember: false, tierLevel: 0,
        },
        {
            id: 'mc-9', name: 'Tech & IA Stocks',
            description: 'Acciones del sector tecnológico, inteligencia artificial y semiconductores. El futuro de la inversión en tech.',
            category: 'Tecnología', privacyType: 'PUBLIC', createdAt: nowDays(30),
            creator: { id: 'u6', username: 'tech_stocks_lat', isVerified: false },
            plans: freePlan('mc-9'),
            _count: { members: 3450, posts: 1890, resources: 89, events: 15 },
            isMember: false, tierLevel: 0,
        },
        {
            id: 'mc-10', name: 'Bonos & Renta Fija',
            description: 'Todo sobre bonos soberanos, corporativos y renta fija en Argentina y el mundo. Estrategias para mercados volátiles.',
            category: 'Bonos', privacyType: 'PUBLIC', createdAt: nowDays(75),
            creator: { id: 'u1', username: 'inversor_pro', isVerified: true },
            plans: freePlan('mc-10'),
            _count: { members: 1240, posts: 560, resources: 123, events: 4 },
            isMember: false, tierLevel: 0,
        },
        {
            id: 'mc-finix', name: 'Finix',
            description: 'Finix, la comunidad dentro de la primera Red Social de Inversiones Gratuita. Desde acá podrás aprender y compartir con otros inversores todo lo que desees.',
            category: 'Finanzas personales', privacyType: 'PUBLIC', createdAt: nowDays(5),
            creator: { id: 'u5', username: 'finix_news', isVerified: true },
            plans: freePlan('mc-finix'),
            _count: { members: 12400, posts: 5670, resources: 890, events: 67 },
            isMember: true, tierLevel: 0,
        },
    ];
    saveDb(seed);
    return seed;
}

function json(data: unknown, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'content-type': 'application/json' },
    });
}

// ─── Helper: leave community ──────────────────────────────────────────────────
function leaveCommunity(id: string): Response {
    const m = getMembers();
    delete m[id];
    localStorage.setItem(MEMBERS_KEY, JSON.stringify(m));
    const db = getDb();
    const c = db.find((x) => x.id === id);
    if (c) { c._count.members = Math.max(0, c._count.members - 1); saveDb(db); }
    return json({ success: true, isMember: false });
}

export async function handleMockCommunities(path: string, init?: RequestInit): Promise<Response | null> {
    const method = (init?.method || 'GET').toUpperCase();

    // ── GET /communities ──────────────────────────────────────────────────────
    if ((path === '/communities' || path.startsWith('/communities?')) && method === 'GET') {
        const qs = path.includes('?') ? new URLSearchParams(path.split('?')[1]) : new URLSearchParams();
        const search = (qs.get('search') || '').toLowerCase();
        const category = qs.get('category') || '';
        const sort = qs.get('sort') || 'members';

        let db = applyMemberState(getDb());
        if (search) {
            db = db.filter((c) =>
                c.name.toLowerCase().includes(search) ||
                c.description.toLowerCase().includes(search) ||
                c.category.toLowerCase().includes(search)
            );
        }
        if (category && category !== 'all') {
            db = db.filter((c) => c.category === category);
        }
        if (sort === 'members') db = [...db].sort((a, b) => b._count.members - a._count.members);
        else if (sort === 'recent') db = [...db].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        else if (sort === 'posts') db = [...db].sort((a, b) => b._count.posts - a._count.posts);

        return json(db);
    }

    // ── POST /communities ─────────────────────────────────────────────────────
    if (path === '/communities' && method === 'POST') {
        const body = JSON.parse((init?.body as string) || '{}');
        const db = getDb();
        const newId = `mc-${Date.now()}`;
        const newCommunity: MockCommunity = {
            id: newId,
            name: body.name || 'Nueva comunidad',
            description: body.description || '',
            category: Array.isArray(body.category) ? body.category[0] : (body.category || 'Acciones'),
            imageUrl: body.imageUrl,
            bannerUrl: body.bannerUrl,
            privacyType: body.privacyType || 'PUBLIC',
            createdAt: new Date().toISOString(),
            rules: body.rules,
            creator: { id: 'current-user', username: 'vos', isVerified: false },
            plans: body.plans?.length
                ? body.plans.map((p: any, i: number) => ({ ...p, id: `plan-${newId}-${i}` }))
                : freePlan(newId),
            _count: { members: 1, posts: 0, resources: 0, events: 0 },
            isMember: true,
            tierLevel: 0,
        };
        db.unshift(newCommunity);
        saveDb(db);
        const m = getMembers(); m[newId] = true; localStorage.setItem(MEMBERS_KEY, JSON.stringify(m));
        return json(newCommunity, 201);
    }

    // ── Sub-resource routes — MUST come before the generic GET /:id ───────────

    // POST /communities/:id/join
    const joinMatch = path.match(/^\/communities\/([^/]+)\/join$/);
    if (joinMatch) {
        const id = joinMatch[1];
        if (method === 'POST') {
            const m = getMembers(); m[id] = true; localStorage.setItem(MEMBERS_KEY, JSON.stringify(m));
            const db = getDb(); const c = db.find((x) => x.id === id);
            if (c) { c._count.members += 1; saveDb(db); }
            return json({ success: true, isMember: true });
        }
        if (method === 'DELETE') return leaveCommunity(id);
    }

    // POST|DELETE /communities/:id/leave
    const leaveMatch = path.match(/^\/communities\/([^/]+)\/leave$/);
    if (leaveMatch && (method === 'POST' || method === 'DELETE')) {
        return leaveCommunity(leaveMatch[1]);
    }

    // DELETE /communities/:id/posts/:postId  (specific — before /posts general)
    const deleteCommunityPostMatch = path.match(/^\/communities\/([^/]+)\/posts\/([^/]+)$/);
    if (deleteCommunityPostMatch && method === 'DELETE') {
        return json({ success: true });
    }

    // GET|POST /communities/:id/posts
    const communityPostsMatch = path.match(/^\/communities\/([^/]+)\/posts/);
    if (communityPostsMatch) {
        if (method === 'GET') return json({ posts: [], nextCursor: null, hasMore: false });
        if (method === 'POST') {
            const body = JSON.parse((init?.body as string) || '{}');
            return json({
                id: `cp-${Date.now()}`, content: body.content || '', type: body.type || 'post', media: [],
                author: { id: 'current-user', username: 'vos' },
                likesCount: 0, commentsCount: 0, repostsCount: 0, savesCount: 0,
                likedByMe: false, repostedByMe: false, savedByMe: false,
                createdAt: new Date().toISOString(),
            }, 201);
        }
    }

    // GET /communities/:id/events
    if (path.match(/^\/communities\/([^/]+)\/events/) && method === 'GET') {
        return json([]);
    }

    // GET /communities/:id/resources
    if (path.match(/^\/communities\/([^/]+)\/resources/) && method === 'GET') {
        return json([]);
    }

    // GET /communities/:id/members
    if (path.match(/^\/communities\/([^/]+)\/members/) && method === 'GET') {
        return json({ members: [], total: 0 });
    }

    // GET /communities/:id  (catch-all — MUST be last)
    const getByIdMatch = path.match(/^\/communities\/([^/?]+)(\?.*)?$/);
    if (getByIdMatch && method === 'GET') {
        const id = getByIdMatch[1];
        const db = applyMemberState(getDb());
        const community = db.find((c) => c.id === id);
        if (!community) return json({ error: 'Not found' }, 404);
        return json(community);
    }

    return null;
}
