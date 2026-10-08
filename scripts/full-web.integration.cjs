// Local PostgreSQL only. All writes roll back; emails, payments and jobs are disabled.
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { mkdtempSync, rmSync } = require('node:fs');
const { join } = require('node:path');
const { tmpdir } = require('node:os');
require('reflect-metadata');
if (!process.env.FINIX_AUDIT_DATABASE_ENV) throw new Error('Set FINIX_AUDIT_DATABASE_ENV to an isolated local database env file');
require('dotenv').config({ path: process.env.FINIX_AUDIT_DATABASE_ENV, quiet: true });
const target = new URL(process.env.DATABASE_URL);
assert.ok(['localhost', '127.0.0.1'].includes(target.hostname) && target.port && target.port !== '5432', 'Use a dedicated local test database port');
process.env.JWT_SECRET = 'finix-isolated-functional-audit-secret-only';
process.env.NODE_ENV = 'test';
// Fixture writes use an outer transaction and must never fill a shared cache.
delete process.env.REDIS_URL;
// Account restrictions belong to production configuration; this isolated
// rollback test uses generated accounts and never changes the running API.
for (const key of ['ADMIN_OWNER_EMAIL', 'ADMIN_OWNER_USER_ID', 'ADMIN_ALLOWLIST', 'ADMIN_IP_ALLOWLIST']) process.env[key] = '';
process.env.ADMIN_2FA_EMAIL = 'audit-admin@example.invalid';
const uploads = mkdtempSync(join(tmpdir(), 'finix-functional-uploads-'));
process.env.UPLOADS_DIR = uploads;
process.env.FINIX_FREE_ACCESS_ENABLED = 'false';
for (const key of ['STRIPE_SECRET_KEY', 'MP_ACCESS_TOKEN', 'MERCADOPAGO_ACCESS_TOKEN', 'RESEND_API_KEY', 'SMTP_PASS']) delete process.env[key];
const nativeFetch = global.fetch;
global.fetch = (url, init) => {
    const parsed = new URL(typeof url === 'string' ? url : url.url || String(url));
    if (!['localhost', '127.0.0.1'].includes(parsed.hostname)) return Promise.reject(new Error('External network disabled during audit'));
    return nativeFetch(url, init);
};
const { PrismaClient } = require('@prisma/client');
const { Test } = require('@nestjs/testing');
const { ValidationPipe } = require('@nestjs/common');
const { AppModule } = require('../apps/api/dist/app.module');
const { PrismaService } = require('../apps/api/dist/prisma.service');
const { AuthService } = require('../apps/api/dist/auth/auth.service');
const { MailService } = require('../apps/api/dist/mail/mail.service');
const { MarketService } = require('../apps/api/dist/market/market.service');
const prisma = new PrismaClient();
const rollback = new Error('FINIX_FUNCTIONAL_AUDIT_ROLLBACK');
const checks = [], failures = [];
let app, browser;

(async () => {
    try {
        await prisma.$transaction(async tx => {
            // Services that use transactions share this outer rollback boundary.
            const connection = new Proxy(tx, { get(object, key) {
                if (key === '$transaction') return async work => typeof work === 'function' ? work(connection) : Promise.all(work);
                if (key === 'onModuleInit' || key === 'onModuleDestroy') return undefined;
                return object[key];
            } });
            const outbox = [];
            const mail = new Proxy({}, { get: (_, key) => key === 'then' ? undefined : String(key).startsWith('send') ? async (...args) => { outbox.push({ method: key, args }); return { success: true }; } : () => 'http://127.0.0.1' });
            const module = await Test.createTestingModule({ imports: [AppModule] })
                .overrideProvider(PrismaService).useValue(connection)
                .overrideProvider(MailService).useValue(mail)
                .compile();
            const applicationTypes = new Set(Object.entries(require.cache)
                .filter(([path]) => path.includes('/apps/api/dist/'))
                .flatMap(([, loaded]) => Object.values(loaded.exports || {})));
            // No boot-time imports, official-account edits, cron or interval tasks.
            for (const imported of module.container.getModules().values()) {
                for (const provider of imported.providers.values()) {
                    const instance = provider.instance;
                    if (instance && typeof instance === 'object' &&
                        (applicationTypes.has(instance.constructor) || ['ScheduleExplorer', 'SchedulerOrchestrator'].includes(instance.constructor?.name))) {
                        for (const hook of ['onModuleInit', 'onApplicationBootstrap', 'onModuleDestroy', 'onApplicationShutdown']) {
                            if (typeof instance[hook] === 'function') instance[hook] = () => {};
                        }
                    }
                }
            }
            app = module.createNestApplication({ logger: ['error'] });
            app.setGlobalPrefix('api');
            app.use(require('cookie-parser')());
            const express = require('express');
            app.use('/api/uploads', express.static(uploads), express.static(join(__dirname, '../apps/api/uploads')));
            app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
            await app.listen(0, '127.0.0.1');
            const origin = await app.getUrl();
            const suffix = randomUUID().slice(0, 8);
            const password = 'LocalAuditOnly-2026!';
            const hash = await require('argon2').hash(password);
            const makeUser = (name, plan = 'PRO', creator = false) => tx.user.create({ data: {
                email: `${name}-${suffix}@example.invalid`, username: `${name}-${suffix}`, password: hash,
                emailVerified: true, plan, subscriptionStatus: plan === 'FREE' ? 'CANCELED' : 'ACTIVE',
                accountType: creator ? 'CREATOR' : plan === 'FREE' ? 'BASIC' : 'PRO', isCreator: creator,
                onboardingCompleted: true, isProfilePublic: true,
            } });
            const owner = await makeUser('audit-owner', 'CREATOR', true), other = await makeUser('audit-other'), free = await makeUser('audit-free', 'FREE');
            const auth = app.get(AuthService);
            const sessions = new Map();
            for (const user of [owner, other, free]) sessions.set(user.id, await auth.createPersistentSession(user.id));
            async function request(path, { user = owner, method = 'GET', body, status = 200 } = {}) {
                const response = await fetch(`${origin}/api${path}`, { method, headers: {
                    'Content-Type': 'application/json', ...(user ? { Authorization: `Bearer ${sessions.get(user.id).token}` } : {}),
                }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
                const data = await response.json().catch(() => null);
                assert.equal(response.status, status, `${method} ${path}: expected ${status}, got ${response.status}${response.status >= 400 ? ` (${JSON.stringify(data)})` : ''}`);
                checks.push(`${method} ${path} ${status}`);
                return data;
            }
            await request('/auth/me');
            await request('/auth/me', { user: null, status: 401 });
            for (const [method, path] of [
                ['GET', '/stories/feed'], ['POST', '/stories'],
                ['POST', '/stories/retired/view'], ['POST', '/stories/retired/like'],
                ['DELETE', '/stories/retired'], ['DELETE', '/stories/retired/like'],
            ]) await request(path, { method, status: 404 });
            checks.push('Retired stories endpoints are unavailable even to authenticated users');
            const login = await request('/auth/login', { user: null, method: 'POST', body: { email: owner.email, password } });
            assert.ok(login.token && login.refreshToken);
            const adminUser = await makeUser('audit-admin');
            await tx.user.update({ where: { id: adminUser.id }, data: { role: 'SUPER_ADMIN' } });
            const challenge = await request('/admin/auth/login', { user: null, method: 'POST', body: { email: adminUser.email, password } });
            assert.equal(challenge.step, 'VERIFY_EMAIL');
            const adminEmailCode = outbox.findLast(mail => mail.method === 'sendAdmin2faCode').args[1];
            const setup = await request('/admin/auth/verify-email', { user: null, method: 'POST', body: { token: challenge.token, code: adminEmailCode } });
            assert.equal(setup.step, 'SETUP_2FA');
            const code2fa = require('speakeasy').totp({ secret: setup.secret, encoding: 'base32' });
            const adminResponse = await fetch(`${origin}/api/admin/auth/verify-2fa`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: setup.token, code: code2fa }) });
            assert.equal(adminResponse.status, 200);
            const adminCookie = adminResponse.headers.getSetCookie().find(value => value.startsWith('finix_admin_at='));
            assert.ok(adminCookie);
            const accessToken = adminCookie.split(';')[0].slice('finix_admin_at='.length);
            sessions.set(adminUser.id, { token: accessToken });
            const repeatChallenge = await request('/admin/auth/login', { user: null, method: 'POST', body: { email: adminUser.email, password } });
            const repeatEmailCode = outbox.findLast(mail => mail.method === 'sendAdmin2faCode').args[1];
            await request('/admin/auth/verify-2fa', { user: null, method: 'POST', status: 401, body: { token: repeatChallenge.token, code: code2fa } });
            await request('/admin/auth/setup-totp', { user: null, method: 'POST', status: 401, body: { token: repeatChallenge.token } });
            const repeatEmail = await request('/admin/auth/verify-email', { user: null, method: 'POST', body: { token: repeatChallenge.token, code: repeatEmailCode } });
            assert.equal(repeatEmail.step, 'VERIFY_2FA');
            assert.equal(repeatEmail.user, undefined, 'Email alone must not create an admin session');
            await request('/admin/auth/verify-email', { user: null, method: 'POST', status: 401, body: { token: repeatChallenge.token, code: repeatEmailCode } });
            await request('/admin/auth/setup-totp', { user: null, method: 'POST', status: 403, body: { token: repeatEmail.token } });
            await request('/admin/auth/resend-code', { user: null, method: 'POST', status: 401, body: { token: repeatEmail.token } });
            await request('/admin/auth/verify-2fa', { user: null, method: 'POST', body: { token: repeatEmail.token, code: code2fa } });
            checks.push('Existing admin requires email and TOTP; cannot bypass email, replay email or replace configured Authenticator');
            await request('/admin/auth/me', { user: adminUser });
            await request('/admin/users', { user: adminUser });
            await request('/admin/verifications', { user: adminUser });
            await request('/admin/verifications/document?path=../../.env', { user: adminUser, status: 404 });
            await request('/admin/verifications/document?path=missing.pdf', { user: null, status: 401 });
            checks.push('Admin email challenge, TOTP setup, authenticated data and private-file guards');
            const registeredEmail = `registered-${suffix}@example.invalid`;
            await request('/auth/register/request-code', { user: null, method: 'POST', body: { email: registeredEmail, username: `registered_${suffix}`, password } });
            const code = outbox.findLast(mail => mail.method === 'sendVerificationCode' && mail.args[0] === registeredEmail).args[1];
            const verified = await request('/auth/register/verify-code', { user: null, method: 'POST', body: { email: registeredEmail, code } });
            assert.ok(verified.token && verified.user.emailVerified);
            await request('/auth/forgot/request-code', { user: null, method: 'POST', body: { email: registeredEmail } });
            const resetCode = outbox.findLast(mail => mail.method === 'sendPasswordResetCode' && mail.args[0] === registeredEmail).args[1];
            await request('/auth/forgot/reset', { user: null, method: 'POST', body: { email: registeredEmail, code: resetCode, newPassword: `${password}-new` } });
            await request('/auth/login', { user: null, method: 'POST', body: { email: registeredEmail, password: `${password}-new` } });
            await request('/auth/login', { user: null, method: 'POST', body: { email: owner.email, password: 'wrong-password' }, status: 401 });
            await request('/users/me', { method: 'PATCH', body: { bio: 'Perfil de ensayo guardado' } });
            assert.equal((await request('/users/me')).bio, 'Perfil de ensayo guardado');
            await request('/me/privacy', { method: 'PATCH', body: { showPortfolio: false } });
            assert.equal((await request('/me/settings')).showPortfolio, false);
            await request('/me/preferences', { method: 'PATCH', body: { theme: 'dark', currency: 'ARS' } });
            assert.equal((await request('/me/settings')).theme, 'dark');
            await tx.user.update({ where: { id: free.id }, data: { password: null } });
            await request('/users/me/password', { user: free, method: 'PATCH', status: 400, body: { currentPassword: password, newPassword: `${password}-changed` } });
            const post = await request('/posts', { method: 'POST', status: 201, body: { content: 'Publicación funcional de ensayo', type: 'post' } });
            await request(`/posts/${post.id}/like`, { user: other, method: 'POST', status: 201 });
            await request(`/posts/${post.id}/comment`, { user: other, method: 'POST', status: 201, body: { content: 'Comentario de ensayo' } });
            await request(`/posts/${post.id}/save`, { user: other, method: 'POST', status: 201 });
            assert.ok((await request(`/posts/${post.id}/comments`)).comments.length > 0);
            await request(`/posts/${post.id}`, { user: other, method: 'DELETE', status: 403 });
            const portfolio = await request('/portfolios', { method: 'POST', status: 201, body: { nombre: 'Portafolio de ensayo', monedaBase: 'USD', esPrincipal: true } });
            assert.ok((await request('/portfolios')).some(row => row.id === portfolio.id));
            await request(`/portfolios/${portfolio.id}/metrics`);
            await request(`/portfolios/${portfolio.id}/metrics`, { user: other, status: 404 });
            await request(`/portfolios/${portfolio.id}`, { method: 'PUT', body: { nombre: 'Portafolio de ensayo actualizado' } });
            const buy = { assetTicker: 'NASDAQ:AUDIT', assetName: 'Activo sintético de prueba', assetType: 'ACCION', type: 'BUY', quantity: 2, price: 10, currency: 'USD', fee: 0, updateCash: false };
            await request(`/portfolios/${portfolio.id}/transactions`, { method: 'POST', status: 201, body: buy });
            await request(`/portfolios/${portfolio.id}/transactions`, { method: 'POST', status: 400, body: { ...buy, type: 'SELL', quantity: 3 } });
            await request(`/portfolios/${portfolio.id}/transactions`, { method: 'POST', status: 201, body: { ...buy, type: 'SELL', quantity: 1, price: 12 } });
            await request(`/portfolios/${portfolio.id}/movements`);
            const list = await request('/watchlist', { method: 'POST', status: 201, body: { name: 'Seguimiento de ensayo' } });
            await request(`/watchlist/${list.id}`);
            await request(`/watchlist/${list.id}`, { user: other, status: 404 });
            await request(`/watchlist/${list.id}`, { method: 'PATCH', body: { name: 'Lista de ensayo actualizada' } });
            const account = await request('/personal-finance/accounts', { method: 'POST', status: 201, body: { name: 'Cuenta de ensayo', currency: 'ARS', balance: 0 } });
            const income = await request('/personal-finance/transactions', { method: 'POST', status: 201, body: { description: 'Ingreso de ensayo', date: new Date().toISOString().slice(0, 10), type: 'income', amount: 1200, currency: 'ARS', accountId: account.id } });
            assert.equal((await request('/personal-finance/snapshot?currency=ARS')).summary.income, 1200);
            await request(`/personal-finance/transactions/${income.id}`, { method: 'PATCH', body: { amount: 1300 } });
            assert.equal((await request('/personal-finance/snapshot?currency=ARS')).summary.income, 1300);
            await request('/personal-finance/export');
            await request('/personal-finance/snapshot', { user: free, status: 403 });
            await request(`/personal-finance/accounts/${account.id}`, { user: other, method: 'DELETE', status: 404 });
            const conversation = await request('/messages/conversations', { method: 'POST', status: 201, body: { userId: other.id } });
            const messageCountBeforeRetiredAttachment = await tx.directMessage.count({ where: { conversationId: conversation.id } });
            await request(`/messages/conversations/${conversation.id}/messages`, { method: 'POST', status: 400, body: {
                attachment: { type: 'story', meta: { storyId: 'retired' } },
            } });
            assert.equal(await tx.directMessage.count({ where: { conversationId: conversation.id } }), messageCountBeforeRetiredAttachment);
            const message = await request(`/messages/conversations/${conversation.id}/messages`, { method: 'POST', status: 201, body: { content: 'Mensaje de ensayo' } });
            assert.ok((await request(`/messages/conversations/${conversation.id}/messages`, { user: other })).some(row => row.id === message.id));
            await request(`/messages/conversations/${conversation.id}/messages`, { user: free, status: 403 });
            await request(`/messages/conversations/${conversation.id}/read`, { user: other, method: 'POST', status: 201 });
            await request(`/messages/conversations/${conversation.id}/messages/${message.id}`, { method: 'PATCH', body: { content: 'Mensaje de ensayo editado' } });
            const community = await request('/communities', { method: 'POST', status: 201, body: { name: `Comunidad de ensayo ${suffix}`, description: 'Comunidad local de prueba', category: 'Argentina', privacyType: 'PUBLIC', status: 'PUBLISHED' } });
            await request(`/communities/${community.id}`);
            await request(`/communities/${community.id}/join`, { user: other, method: 'POST', status: 201, body: {} });
            await request(`/communities/${community.id}/posts`, { method: 'POST', status: 201, body: { content: 'Publicación de comunidad de ensayo' } });
            await request(`/communities/${community.id}/members`);
            await request('/notifications', { user: other });
            await request('/notifications/read-all', { user: other, method: 'PATCH', body: { category: 'SOCIAL' } });
            await request('/billing/overview');
            await request('/mercadopago/config', { user: null });
            const form = new FormData();
            form.append('avatar', new Blob([Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64')], { type: 'image/png' }), 'avatar.png');
            const upload = await fetch(`${origin}/api/me/avatar`, { method: 'POST', headers: { Authorization: `Bearer ${sessions.get(owner.id).token}` }, body: form });
            assert.equal(upload.status, 201);
            const savedImage = await upload.json();
            assert.equal((await request('/me/settings')).avatarUrl, savedImage.avatarUrl);
            assert.equal((await fetch(`${origin}/api${savedImage.avatarUrl}`)).status, 200);
            checks.push('Multipart avatar upload, persisted URL and static image delivery');

            if (process.env.FINIX_AUDIT_BROWSER === 'true') {
                const { chromium } = require('playwright');
                browser = await chromium.launch({ headless: true });
                if (process.env.FINIX_AUDIT_ADMIN_ONLY !== 'true') {
                const page = await browser.newPage({ viewport: { width: 1535, height: 900 }, reducedMotion: 'reduce' });
                const errors = [], apiFailures = [];
                const routePatterns = [...require('node:fs').readFileSync(join(__dirname, '../apps/web/src/App.tsx'), 'utf8').matchAll(/<Route\s+path="([^"]+)"/g)]
                    .filter(match => match[1] !== '*').map(match => new RegExp(`^${match[1].replace(/\/\*/g, '(?:/.*)?').replace(/:[^/]+/g, '[^/]+')}/?$`));
                page.on('pageerror', error => errors.push(error.message));
                await page.addInitScript(({ session, user }) => {
                    localStorage.setItem('token', session.token);
                    localStorage.setItem('refreshToken', session.refreshToken);
                    localStorage.setItem('user', JSON.stringify(user));
                    localStorage.setItem('finix_cookie_consent', JSON.stringify({ version: '1', prefs: { necessary: true } }));
                    localStorage.setItem('finix_watchlist_onboarding_dismissed', 'true');
                }, { session: sessions.get(owner.id), user: owner });
                await page.route('**/api/**', async route => {
                    const url = new URL(route.request().url());
                    try {
                        const response = await route.fetch({ url: `${origin}${url.pathname}${url.search}`, timeout: 20000 });
                        if (response.status() >= 500 || response.status() === 404) apiFailures.push(`${url.pathname} ${response.status()}`);
                        await route.fulfill({ response });
                    } catch { await route.fulfill({ status: 503, json: { message: 'Servicio no disponible durante ensayo' } }); }
                });
                const routes = ['/dashboard', '/explore', '/market', '/market/seguimiento', '/market/top-gainers', '/calendario', '/news', '/analysis', '/portfolio', '/profile', `/profile/${other.username}`, '/settings', '/settings/plan', '/messages', '/notifications', '/comunidades', '/comunidades/crear', `/comunidades/${community.id}`, `/comunidades/${community.id}/admin`, '/finanzas', ...['movimientos', 'cuentas', 'tarjetas', 'calendario', 'presupuestos', 'objetivos', 'analytics', 'importar', 'configuracion'].map(tab => `/finanzas/${tab}`), '/pro', '/creator', '/about', '/help', '/terms', '/privacy', '/cookies'];
                for (const path of routes) {
                    errors.length = 0; apiFailures.length = 0;
                    await page.goto(`${process.env.FINIX_AUDIT_WEB_URL || 'http://127.0.0.1:4173'}${path}`);
                    await page.waitForTimeout(1400);
                    const visible = (await page.locator('#root').innerText()).trim();
                    const error = errors.length || !visible ? { path, errors: [...errors], blank: !visible } : null;
                    if (error) failures.push(error);
                    if (apiFailures.length) failures.push({ path, apiFailures: [...new Set(apiFailures)] });
                    const links = await page.locator('a[href]').evaluateAll(links => links.map(link => new URL(link.href)).filter(url => url.origin === location.origin).map(url => url.pathname));
                    const invalidLinks = [...new Set(links.filter(link => !routePatterns.some(pattern => pattern.test(link))))];
                    if (invalidLinks.length) failures.push({ path, invalidLinks });
                    checks.push(`Browser ${path}`);
                    console.log(`Route ${path}: ${error ? 'FAIL' : 'rendered'}`);
                }
                const guest = await browser.newPage({ viewport: { width: 390, height: 844 } });
                await guest.addInitScript(() => {
                    localStorage.setItem('finix_cookie_consent', JSON.stringify({ version: '1', prefs: { necessary: true } }));
                });
                await guest.route('**/api/**', async route => {
                    const url = new URL(route.request().url());
                    await route.fulfill({ response: await route.fetch({ url: `${origin}${url.pathname}${url.search}` }) });
                });
                await guest.goto(`${process.env.FINIX_AUDIT_WEB_URL || 'http://127.0.0.1:4173'}/login?redirect=%2Fportfolio`);
                await guest.locator('input[type=email]').fill(owner.email);
                await guest.locator('input[type=password]').fill(password);
                await guest.getByRole('button', { name: 'Ingresar', exact: true }).click();
                await guest.getByPlaceholder('Código de 6 dígitos').waitFor();
                const loginCode = outbox.findLast(mail => mail.method === 'sendLoginCode' && mail.args[0] === owner.email).args[1];
                await guest.getByPlaceholder('Código de 6 dígitos').fill(loginCode);
                await guest.getByRole('button', { name: 'Ingresar', exact: true }).click();
                await guest.waitForURL(url => url.pathname === '/portfolio');
                await guest.getByRole('button', { name: 'Agregar transacción', exact: true }).waitFor();
                checks.push('Mobile login with real email-code verification, saved session and portfolio redirect');
                await guest.reload();
                await guest.getByRole('button', { name: 'Agregar transacción', exact: true }).waitFor();
                checks.push('Persistent authenticated session survives browser reload');
                }
                const adminContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
                const adminPage = await adminContext.newPage();
                const adminErrors = [], adminApiFailures = [];
                adminPage.on('pageerror', error => adminErrors.push(error.message));
                await adminPage.route('**/api/**', async route => {
                    const url = new URL(route.request().url());
                    const response = await route.fetch({ url: `${origin}${url.pathname}${url.search}` });
                    if (url.pathname === '/api/admin/auth/me' || url.pathname === '/api/admin/auth/refresh') {
                        console.log('Admin auth response', JSON.stringify({ path: url.pathname, status: response.status(), body: response.ok() ? undefined : await response.json().catch(() => null) }));
                    }
                    if (response.status() >= 500 || response.status() === 404) adminApiFailures.push(`${url.pathname} ${response.status()}`);
                    await route.fulfill({ response });
                });
                const adminOrigin = process.env.FINIX_AUDIT_ADMIN_URL || 'http://localhost:5147';
                await adminPage.goto(`${adminOrigin}/login`);
                await adminPage.locator('input[type=email]').fill(adminUser.email);
                await adminPage.locator('input[type=password]').fill(password);
                await adminPage.getByRole('button', { name: 'Continuar con 2FA', exact: true }).click();
                const emailInput = adminPage.getByRole('textbox', { name: 'Código de verificación de 6 dígitos' });
                await emailInput.waitFor();
                await emailInput.fill(outbox.findLast(mail => mail.method === 'sendAdmin2faCode').args[1]);
                await adminPage.getByRole('button', { name: 'Verificar y Acceder', exact: true }).click();
                const totpInput = adminPage.getByRole('textbox', { name: 'Código de autenticación de 6 dígitos' });
                await totpInput.waitFor();
                await totpInput.fill(require('speakeasy').totp({ secret: setup.secret, encoding: 'base32' }));
                await adminPage.getByRole('button', { name: 'Verificar y Acceder', exact: true }).click();
                await adminPage.waitForURL(url => url.pathname === '/dashboard');
                checks.push('Admin browser login requires password, email code and configured Authenticator');
                const adminRoutes = [...require('node:fs').readFileSync(join(__dirname, '../apps/admin/src/App.tsx'), 'utf8').matchAll(/<Route\s+path="([^"]+)"/g)]
                    .map(match => match[1]).filter(path => !['/', '/login', '*'].includes(path));
                for (const path of adminRoutes) {
                    adminErrors.length = 0; adminApiFailures.length = 0;
                    await adminPage.goto(`${adminOrigin}${path}`);
                    await adminPage.waitForTimeout(1000);
                    if (!(await adminPage.locator('#root').innerText()).trim() || adminErrors.length || adminApiFailures.length) {
                        failures.push({ adminPath: path, errors: [...adminErrors], apiFailures: [...new Set(adminApiFailures)] });
                    }
                    if (new URL(adminPage.url()).pathname !== path) {
                        console.log('Admin session diagnostics', JSON.stringify({ cookies: (await adminContext.cookies()).map(({ name, domain, path, secure }) => ({ name, domain, path, secure })), body: (await adminPage.locator('#root').innerText()).slice(0,400) }));
                    }
                    assert.equal(new URL(adminPage.url()).pathname, path, 'Admin session survives navigation and reload');
                    checks.push(`Admin browser ${path}`);
                    console.log(`Admin route ${path}: rendered`);
                }
                await adminContext.close();
                await browser.close(); browser = null;
            }
            // Two distinct persistent sessions become unusable after logout-all.
            const second = await auth.createPersistentSession(owner.id);
            const { io } = require('socket.io-client');
            const socket = io(origin, { auth: { token: second.token }, transports: ['websocket'], reconnection: false });
            const otherSocket = io(origin, { auth: { token: sessions.get(other.id).token }, transports: ['websocket'], reconnection: false });
            await Promise.all([socket, otherSocket].map(client => new Promise((resolve, reject) => {
                const timer = setTimeout(() => reject(new Error('Socket connection timed out')), 3000);
                client.once('connect', () => { clearTimeout(timer); resolve(); });
                client.once('connect_error', reject);
            })));
            await new Promise(resolve => setTimeout(resolve, 100));
            const messageCountBeforeRetiredSocket = await tx.directMessage.count({ where: { conversationId: conversation.id } });
            await new Promise((resolve, reject) => {
                const timer = setTimeout(() => reject(new Error('Retired attachment was not rejected through Socket.IO')), 3000);
                socket.once('error', error => {
                    clearTimeout(timer);
                    try { assert.equal(error.message, 'Error al enviar mensaje'); resolve(); }
                    catch (failure) { reject(failure); }
                });
                socket.emit('sendDirectMessage', { conversationId: conversation.id, attachment: { type: 'story', meta: { storyId: 'retired' } } });
            });
            assert.equal(await tx.directMessage.count({ where: { conversationId: conversation.id } }), messageCountBeforeRetiredSocket);
            checks.push('REST and Socket.IO reject retired story attachments without creating messages');
            const disconnected = new Promise((resolve, reject) => {
                const timer = setTimeout(() => reject(new Error('Logout-all did not disconnect messages')), 3000);
                socket.once('disconnect', () => { clearTimeout(timer); resolve(); });
            });
            await request('/me/logout-all', { method: 'POST', status: 201 });
            await disconnected;
            assert.ok(otherSocket.connected, 'Logout-all preserves the other account');
            socket.close(); otherSocket.close();
            checks.push('Logout-all disconnects realtime messages only for the revoked user');
            await request('/auth/me', { status: 401 });
            const response = await fetch(`${origin}/api/auth/me`, { headers: { Authorization: `Bearer ${second.token}` } });
            assert.equal(response.status, 401);
            await request('/auth/refresh', { user: null, method: 'POST', body: { refreshToken: second.refreshToken }, status: 401 });
            await request('/auth/me', { user: other });
            await request(`/posts/${post.id}`, { method: 'DELETE', user: other, status: 403 });
            await request(`/personal-finance/transactions/${income.id}`, { user: other, method: 'DELETE', status: 404 });
            await app.close(); app = null;
            throw rollback;
        }, { timeout: 600000, maxWait: 10000 });
    } catch (error) { if (error !== rollback) throw error; }
    console.log(JSON.stringify({ checks: checks.length, failures, writesRolledBack: true, externalServicesDisabled: true }, null, 2));
    if (failures.length) process.exitCode = 1;
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
    if (browser) await browser.close();
    if (app) await app.close();
    await prisma.$disconnect();
    rmSync(uploads, { recursive: true, force: true });
});
