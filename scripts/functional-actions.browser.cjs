// Every API call is intercepted. Tests real user actions through failure and recovery.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { fixtures } = require('./desktop-redesign.browser.cjs');
const base = process.env.FINIX_BROWSER_TEST_URL || 'http://127.0.0.1:4173';
const user = { id: 'preview', username: 'inversor', plan: 'CREATOR', accountType: 'CREATOR', role: 'USER', subscriptionStatus: 'ACTIVE', isCreator: true, onboardingCompleted: true };
const notifications = [
    { id: 'social', type: 'SOCIAL_LIKE', title: 'Me gusta de prueba', isRead: false, createdAt: new Date().toISOString() },
    { id: 'system', type: 'SYSTEM_ALERT', title: 'Aviso de sistema de prueba', isRead: false, createdAt: new Date().toISOString() },
];

async function main() {
    const browser = await chromium.launch({ headless: true });
    const errors = [];
    async function setup(handler) {
        const page = await browser.newPage({ viewport: { width: 1535, height: 900 } });
        page.on('pageerror', error => errors.push(error.message));
        await fixtures(page);
        await page.addInitScript(user => localStorage.setItem('user', JSON.stringify(user)), user);
        await page.route('**/api/**', route => {
            const path = new URL(route.request().url()).pathname.replace(/^\/api/, '');
            if (path === '/auth/me' || path === '/me/settings') return route.fulfill({ json: user });
            return handler(route, path);
        });
        return page;
    }
    let checks = 0;
    try {
        let failLoad = true, failRead = true;
        const bodies = [];
        const page = await setup((route, path) => {
            if (path === '/notifications') {
                if (failLoad) return route.fulfill({ status: 503, json: {} });
                const category = new URL(route.request().url()).searchParams.get('category');
                return route.fulfill({ json: { items: category === 'SOCIAL' ? notifications.slice(0, 1) : notifications, nextCursor: null } });
            }
            if (path === '/notifications/read-all') {
                bodies.push({ body: route.request().postDataJSON(), contentType: route.request().headers()['content-type'] });
                return route.fulfill({ status: failRead ? 503 : 200, json: { success: !failRead } });
            }
            return route.fallback();
        });
        await page.goto(`${base}/notifications`);
        await page.getByRole('alert').getByText('No se pudieron cargar las notificaciones. Intentá nuevamente.').waitFor();
        assert.equal(await page.getByText('Todo al día', { exact: true }).count(), 0, 'An outage is not an empty inbox');
        failLoad = false;
        await page.getByRole('button', { name: 'Reintentar', exact: true }).click();
        await page.getByText('Me gusta de prueba', { exact: true }).waitFor();
        await page.getByRole('button', { name: 'Social', exact: true }).click();
        await page.getByText('Me gusta de prueba', { exact: true }).waitFor();
        await page.getByRole('button', { name: 'Leídas', exact: true }).click();
        await page.getByRole('alert').getByText('No se pudieron marcar las notificaciones como leídas. Intentá nuevamente.').waitFor();
        assert.equal(await page.getByRole('button', { name: 'Leídas', exact: true }).count(), 1, 'Failed writes keep unread state');
        assert.deepEqual(bodies[0].body, { category: 'SOCIAL' });
        assert.match(bodies[0].contentType, /application\/json/);
        failRead = false;
        await page.getByRole('button', { name: 'Leídas', exact: true }).click();
        await page.getByRole('button', { name: 'Leídas', exact: true }).waitFor({ state: 'hidden' });
        checks += 4;
        await page.close();

        let release;
        const race = await setup(async (route, path) => {
            if (path !== '/notifications') return route.fallback();
            const category = new URL(route.request().url()).searchParams.get('category');
            if (!category) {
                await new Promise(resolve => { release = resolve; });
                return route.fulfill({ json: { items: notifications.slice(1), nextCursor: null } });
            }
            return route.fulfill({ json: { items: notifications.slice(0, 1), nextCursor: null } });
        });
        await race.goto(`${base}/notifications`);
        await race.getByRole('button', { name: 'Social', exact: true }).click();
        await race.getByText('Me gusta de prueba', { exact: true }).waitFor();
        release();
        await race.waitForTimeout(250);
        assert.equal(await race.getByText('Aviso de sistema de prueba', { exact: true }).count(), 0, 'Slow previous filters cannot replace current results');
        checks++;
        await race.close();

        let failCommunity = true;
        const community = { id: 'test-community', name: 'Comunidad de ensayo', description: 'Descripción de prueba', category: 'Argentina', privacyType: 'PUBLIC', creator: { id: 'creator', username: 'creador', isVerified: false }, plans: [], sections: [], _count: { members: 1, posts: 0, resources: 0 }, isMember: true, tierLevel: 0, createdAt: new Date().toISOString() };
        const communities = await setup((route, path) => {
            if (path === '/communities/test-community') return route.fulfill(failCommunity ? { status: 503, json: {} } : { json: community });
            if (path.startsWith('/communities/test-community/posts')) return route.fulfill({ json: { posts: [], hasMore: false } });
            return route.fallback();
        });
        await communities.goto(`${base}/comunidades/test-community`);
        await communities.getByRole('alert').getByText('No se pudo cargar la comunidad.').waitFor();
        assert.equal(new URL(communities.url()).pathname, '/comunidades/test-community', 'An outage retains the page for retry');
        failCommunity = false;
        await communities.getByRole('button', { name: 'Reintentar', exact: true }).click();
        await communities.getByRole('heading', { name: 'Comunidad de ensayo', exact: true }).waitFor();
        checks++;
        await communities.close();

        let failSave = true;
        const onboarding = await setup((route, path) => {
            if (path === '/me/onboarding' || path === '/me/privacy' || path === '/me/preferences') return route.fulfill({ status: failSave ? 503 : 200, json: { success: !failSave } });
            return route.fallback();
        });
        await onboarding.goto(`${base}/onboarding`);
        await onboarding.getByRole('heading', { name: 'Bienvenido a Finix', exact: true }).waitFor();
        const before = await onboarding.getByRole('heading').allTextContents();
        await onboarding.getByRole('button', { name: 'Avanzar', exact: true }).click();
        await onboarding.getByText('No se pudo guardar. Intentá nuevamente para continuar.', { exact: true }).waitFor();
        assert.deepEqual(await onboarding.getByRole('heading').allTextContents(), before, 'Failed saves do not advance');
        failSave = false;
        await onboarding.getByRole('button', { name: 'Avanzar', exact: true }).click();
        await onboarding.waitForTimeout(500);
        assert.notDeepEqual(await onboarding.getByRole('heading').allTextContents(), before, 'Retry advances after the server saves');
        checks++;
        await onboarding.close();
        assert.deepEqual(errors, []);
        console.log(JSON.stringify({ checks, notificationsFailureRecovery: true, scopedReadWrites: true, filterRace: true, communityRetry: true, onboardingFailureRecovery: true, runtimeErrors: errors }));
    } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
