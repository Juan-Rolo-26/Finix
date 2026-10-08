// All API responses are fixtures; never writes to the user's database.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { fixtures } = require('./desktop-redesign.browser.cjs');
const base = process.env.FINIX_BROWSER_TEST_URL || 'http://localhost:5173';
const user = { id: 'preview', username: 'inversor', plan: 'CREATOR', role: 'USER', subscriptionStatus: 'ACTIVE', onboardingCompleted: true, isProfilePublic: true };
const other = { id: 'other', username: 'inversor_historico' };
const legacyMessage = { id: 'archived-message', conversationId: 'archived-chat', senderId: other.id, sender: other,
    content: 'Texto anterior conservado', attachmentType: 'story', attachmentMeta: { story: { id: 'archived-story', content: 'Historia antigua', author: other } },
    isRead: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
const conversation = { id: 'archived-chat', isGroup: false, title: other.username, otherUser: other,
    participants: [user, other].map(next => ({ userId: next.id, user: next })), participantCount: 2,
    lastMessage: legacyMessage, updatedAt: new Date().toISOString(), unreadCount: 0 };

async function main() {
    const browser = await chromium.launch({ headless: true });
    const errors = [], storyRequests = [], published = [];
    let checks = 0;
    try {
        for (const width of [1535, 390]) {
            const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
            page.setDefaultTimeout(15000);
            page.on('pageerror', error => errors.push(error.message));
            page.on('request', request => {
                if (/\/api\/stories(?:\/|\?|$)/.test(request.url())) storyRequests.push(request.url());
            });
            await fixtures(page, { populatedSocial: true });
            await page.addInitScript(user => localStorage.setItem('user', JSON.stringify(user)), user);
            await page.route('**/api/**', route => {
                const path = new URL(route.request().url()).pathname.replace(/^\/api/, '');
                if (path === '/auth/me' || path === '/me/settings') return route.fulfill({ json: user });
                if (path === '/messages/conversations') return route.fulfill({ json: [conversation] });
                if (path === '/messages/conversations/archived-chat/messages') return route.fulfill({ json: [legacyMessage] });
                if (path === '/messages/conversations/archived-chat/read') return route.fulfill({ json: { success: true } });
                if (path === '/posts' && route.request().method() === 'POST') {
                    const data = route.request().postDataJSON();
                    published.push(data);
                    return route.fulfill({ status: 201, json: { id: `new-post-${width}`, ...data, author: user, media: [], createdAt: new Date().toISOString(),
                        likesCount: 0, commentsCount: 0, repostsCount: 0, savesCount: 0, likedByMe: false, repostedByMe: false, savedByMe: false } });
                }
                return route.fallback();
            });
            await page.goto(`${base}/dashboard`);
            await page.getByText('Seguimos los resultados de las empresas', { exact: false }).first().waitFor();
            assert.equal(await page.getByRole('button', { name: /crear historia|compartir historia|cerrar historias/i }).count(), 0);
            assert.equal(await page.getByText('Todavia no hay historias', { exact: true }).count(), 0);
            checks++;

            await page.goto(`${base}/explore`);
            await page.locator('.explore-page').getByRole('button', { name: 'Crear publicación', exact: true }).first().click();
            await page.getByPlaceholder('¿Qué estás pensando sobre el mercado?').fill(`Publicación de prueba ${width}`);
            await page.getByRole('button', { name: 'Crear en feed', exact: true }).click();
            await page.getByPlaceholder('¿Qué estás pensando sobre el mercado?').waitFor({ state: 'hidden' });
            await page.getByText(`Publicación de prueba ${width}`, { exact: true }).waitFor();
            assert.equal(published.at(-1).type, 'post');
            assert.equal(await page.getByRole('menuitem', { name: /historia/i }).count(), 0);
            checks++;

            await page.goto(`${base}/messages`);
            await page.getByRole('button').filter({ hasText: other.username }).first().click();
            await page.getByText('Texto anterior conservado', { exact: true }).last().waitFor();
            await page.getByText('Adjunto no disponible', { exact: true }).last().waitFor();
            assert.equal(await page.getByText('Historia antigua', { exact: true }).count(), 0);
            assert.equal(await page.getByText('Historia compartida', { exact: true }).count(), 0);
            checks++;

            // Browser history from an older client cannot reopen the retired composer.
            await page.evaluate(() => history.replaceState({ ...history.state, usr: { composerAttachment: { type: 'story', sharedStory: { content: 'Historia antigua' } } } }, '', location.href));
            await page.reload();
            await page.getByRole('button').filter({ hasText: other.username }).first().waitFor();
            assert.equal(await page.getByText('Historia compartida', { exact: true }).count(), 0);
            assert.equal(await page.getByText('Historia antigua', { exact: true }).count(), 0);
            checks++;
            await page.close();
        }
        assert.deepEqual(storyRequests, [], 'No retired stories requests in desktop or mobile');
        assert.deepEqual(errors, [], 'No browser runtime errors');
        console.log(JSON.stringify({ checks, viewports: [1535, 390], storyRequests: storyRequests.length, regularPostsPublished: published.length, legacyMessagesPreserved: true, databaseWrites: false }));
    } finally {
        await browser.close();
    }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
