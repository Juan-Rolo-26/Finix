// Run against `npm run dev -w web -- --port 4173`.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
(async () => {
    const browser = await chromium.launch({ headless: true });
    const name = `performance-regression-${process.pid}.html`;
    const file = path.join(__dirname, '../apps/web', name);
    const requests = [], errors = [];
    let held, fail = false, deny = false;
    try {
        fs.writeFileSync(file, `<!doctype html><div id="root"></div><script type="module">
            import React from 'react'; import { createRoot } from 'react-dom/client';
            import { useAuthStore } from '/src/stores/authStore.ts';
            window.authStore = useAuthStore;
            import { setAccessToken, apiFetch } from '/src/lib/api.ts';
            window.readApi = path => apiFetch(path).then(response => response.json());
            import { useCursorFeed } from '/src/hooks/useCursorFeed.ts';
            import { useUnreadCount } from '/src/hooks/useUnreadCount.ts';
            import '/src/index.css';
            window.setOwner = id => { setAccessToken('token-'+id); useAuthStore.setState({ user: { id, username:id }, token:'token-'+id }); };
            window.setOwner('A');
            function Counter(){ const [count] = useUnreadCount('notifications'); const [messages] = useUnreadCount('messages'); return React.createElement('span',{className:'counter'},count+':'+messages); }
            function Fixture(){ const owner=useAuthStore(s=>s.user?.id); const [sort,setSort]=React.useState('general');const feed=useCursorFeed(owner,sort);window.setSort=setSort;
                return React.createElement('main',null,React.createElement('div',{id:'owner'},owner),React.createElement(Counter),React.createElement(Counter),React.createElement('button',{onClick:feed.loadMore},'Más'),React.createElement('button',{onClick:feed.retry},'Reintentar'),React.createElement('div',{id:'rows'},...feed.posts.map(p=>React.createElement('p',{key:p.id},p.id))),feed.error&&React.createElement('div',{role:'alert'},feed.error),React.createElement('div',{ref:feed.sentinel,style:{marginTop:2000}},'Fin'));
            }
            window.root=createRoot(document.getElementById('root'));window.root.render(React.createElement(Fixture));
        </script>`);
        const page = await browser.newPage({ viewport: { width: 1000, height: 800 } });
        await page.clock.install({ time: new Date('2026-10-04T12:00:00Z') });
        page.on('pageerror', error => errors.push(error.message));
        await page.route('**/api/**', async route => {
            const url = new URL(route.request().url()), owner = route.request().headers().authorization?.replace('Bearer token-', '');
            requests.push({ path: url.pathname, query: url.search, owner });
            if (url.pathname === '/api/news') return route.fulfill({ json: [{ id: 'real-backend-fixture' }] });
            if (url.pathname.endsWith('/unread-count')) return route.fulfill({ json: { count: owner === 'A' ? 3 : 7 } });
            if (url.pathname.endsWith('/auth/refresh')) return route.fulfill({ status: 401, json: {} });
            if (url.pathname.endsWith('/posts/feed')) {
                if (owner === 'A' && url.searchParams.get('sort') === 'following') { held = route; return; }
                if (deny) return route.fulfill({ status: 403, json: { message: 'Revocado' } });
                if (fail) return route.fulfill({ status: 503, json: { message: 'Temporal' } });
                const start = url.searchParams.has('cursor') ? Number(url.searchParams.get('cursor').split('-')[1]) + 1 : 0;
                const posts = Array.from({ length: Math.min(20, 45-start) }, (_, i) => ({ id: owner+'-'+(start+i) }));
                return route.fulfill({ json: { posts, hasMore: start+20 < 45, nextCursor: start+20 < 45 ? posts.at(-1).id : null } });
            }
            return route.fulfill({ json: {} });
        });
        await page.goto(`http://127.0.0.1:4173/${name}`);
        await page.locator('#rows p').nth(19).waitFor();
        assert.deepEqual(await page.evaluate(() => window.readApi('/news?category=etfs')), [{ id: 'real-backend-fixture' }], 'Demo news must not intercept normal API reads');
        await page.locator('.counter').first().getByText('3:3',{exact:true}).waitFor();
        for (const resource of ['notifications','messages']) assert.equal(requests.filter(r=>r.path===`/api/${resource}/unread-count`).length,1,'desktop and mobile share a poller');
        await page.getByRole('button',{name:'Más',exact:true}).click();
        await page.locator('#rows p').nth(39).waitFor();
        assert.equal(requests.filter(r=>r.query.includes('cursor=')).length,1);
        await page.getByRole('button',{name:'Más',exact:true}).click();
        await page.locator('#rows p').nth(44).waitFor();
        assert.equal(await page.locator('#rows p').count(),45);
        await page.evaluate(()=>window.setSort('following'));
        await page.waitForFunction(()=>document.querySelector('#rows')?.textContent==='');
        await page.waitForTimeout(100);
        await page.evaluate(()=>window.setOwner('B'));
        await page.locator('#rows').getByText('B-0',{exact:true}).waitFor();
        if(held)await held.fulfill({json:{posts:[{id:'private-A'}],hasMore:false}}).catch(()=>{});
        assert.equal(await page.getByText('private-A',{exact:true}).count(),0);
        assert.equal(await page.locator('#rows').getByText(/^A-/).count(),0);
        assert.equal(requests.filter(r=>r.owner==='A'&&r.query.includes('sort=following')).length,1,'an aborted read must not retry on another base URL');
        await page.locator('.counter').first().getByText('7:7',{exact:true}).waitFor();
        const unread = ()=>requests.filter(r=>r.path.endsWith('/unread-count')).length;
        await page.evaluate(()=>{window.testHidden=true;Object.defineProperty(document,'hidden',{configurable:true,get:()=>window.testHidden});});
        const hiddenCount=unread();await page.clock.fastForward(60001);assert.equal(unread(),hiddenCount,'hidden tabs stop polling');
        await page.evaluate(()=>{window.testHidden=false;document.dispatchEvent(new Event('visibilitychange'));});
        await page.waitForTimeout(100);assert.equal(unread(),hiddenCount+2);
        fail=true;await page.evaluate(()=>window.setSort('recent'));
        await page.getByRole('alert').waitFor();assert.equal(await page.locator('#rows p').count(),0);
        fail=false;await page.getByRole('button',{name:'Reintentar',exact:true}).click();await page.locator('#rows p').nth(19).waitFor();
        deny=true;await page.getByRole('button',{name:'Más',exact:true}).click();await page.getByRole('alert').waitFor();assert.equal(await page.locator('#rows p').count(),0,'revocation clears cached private data');
        const before=unread();await page.evaluate(()=>window.root.unmount());await page.clock.fastForward(60001);assert.equal(unread(),before,'unmount removes all pollers');
        await page.route('**/src/lib/supabase.ts*', route => route.fulfill({ status: 503, body: 'Unavailable OAuth chunk' }));
        const loggedOut = await page.evaluate(async () => {
            window.authStore.getState().login('native.token.signature', { id: 'logout-owner' }, 'refresh-fixture');
            await window.authStore.getState().logout();
            return { token: window.authStore.getState().token, user: window.authStore.getState().user, storedToken: localStorage.getItem('token'), storedUser: localStorage.getItem('user'), refresh: localStorage.getItem('refreshToken') };
        });
        assert.deepEqual(loggedOut, { token: null, user: null, storedToken: null, storedUser: null, refresh: null }, 'OAuth failure must not prevent local logout');
        assert.deepEqual(errors,[]);
        console.log(JSON.stringify({cursorPages:true,accountIsolation:true,abortedRequestsDoNotRetry:true,sharedCounters:true,hiddenTabsIdle:true,initialFailureRetry:true,revokedDataCleared:true,cleanup:true,logoutDuringProviderOutage:true}));
    } finally { await browser.close(); fs.rmSync(file,{force:true}); }
})().catch(error=>{console.error(error);process.exitCode=1});
