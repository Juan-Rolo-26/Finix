// Local UI evidence only. All API traffic is intercepted; no real writes or emails.
const { chromium } = require('playwright');
const { mkdirSync, writeFileSync, existsSync, readFileSync } = require('node:fs');
const { fixtures } = require('./desktop-redesign.browser.cjs');
const BASE = process.env.FINIX_AUDIT_BASE_URL || 'http://127.0.0.1:5183';
process.env.PW_TEST_SCREENSHOT_NO_FONTS_READY = '1';
const OUT = 'docs/auditoria-ux-2026-10-10/evidencia';
const widths = [320, 360, 390, 430, 768, 1024, 1280, 1440];
async function setup(browser, { guest = true, theme = 'light', width = 390, configError = false, timezoneId = 'UTC' } = {}) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce', timezoneId });
    const errors = [], writes = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', route => {
        const url = new URL(route.request().url());
        if (url.origin !== BASE && !['data:', 'blob:'].includes(url.protocol)) return route.abort();
        return route.fallback();
    });
    // Register fixture routes without its own init script; one atomic init avoids
    // undefined ordering between Playwright addInitScript callbacks.
    await fixtures({ addInitScript: async () => {}, route: page.route.bind(page) });
    await page.addInitScript(({ guest, theme }) => {
        localStorage.setItem('finix_app_preferences_v4', JSON.stringify({ state: { theme, language: 'es-AR' }, version: 0 }));
        localStorage.setItem('finix_cookie_consent', JSON.stringify({ version: '1', prefs: { necessary: true, analytics: false, marketing: false } }));
        localStorage.setItem('finix_watchlist_onboarding_dismissed', 'true');
        if (guest) for (const key of ['user', 'token', 'accessToken', 'refreshToken']) localStorage.removeItem(key);
        else {
            localStorage.setItem('user', JSON.stringify({ id: 'preview', username: 'inversor', plan: 'CREATOR', role: 'USER', subscriptionStatus: 'ACTIVE', isCreator: true, onboardingCompleted: true }));
            localStorage.setItem('token', 'isolated-ui-fixture');
        }
    }, { guest, theme });
    await page.route('**/api/**', route => {
        const request = route.request(), path = new URL(request.url()).pathname.replace(/^\/api/, '');
        if (request.method() !== 'GET') {
            writes.push(path);
            return route.fulfill({ status: 401, json: { message: 'Invalid login credentials' } });
        }
        if (path === '/auth/me' && guest) return route.fulfill({ status: 401, json: {} });
        if (path === '/auth/me') return route.fulfill({ json: { id: 'preview', username: 'inversor', plan: 'CREATOR', role: 'USER', subscriptionStatus: 'ACTIVE', isCreator: true, onboardingCompleted: true } });
        if (path === '/auth/providers') return route.fulfill({ json: { google: false } });
        if (path === '/mercadopago/config') return route.fulfill(configError ? { status: 503, json: {} } : { json: { freeAccessEnabled: true, purchasesPaused: true, proPriceArs: 6300, creatorPriceArs: 29900, planLimits: require('../packages/shared/dist').WATCHLIST_PLAN_LIMITS } });
        if (path === '/stripe/config') return route.fulfill({ json: { purchasesPaused: true, configured: false } });
        return route.fallback();
    });
    return { page, errors, writes };
}
async function capture(page, name) {
    await page.evaluate(() => Promise.race([document.fonts.ready, new Promise(resolve => setTimeout(resolve, 1500))]));
    await page.waitForTimeout(650);
    await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true, animations: 'disabled', timeout: 15000 });
    await page.evaluate(() => window.scrollTo({top: document.documentElement.scrollHeight, behavior: 'instant'}));
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${OUT}/${name}-final.png`, animations: 'disabled', timeout: 15000 });
    return page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth, theme: document.documentElement.className, bottom: scrollY + innerHeight >= document.documentElement.scrollHeight - 2 })).catch(() => ({ navigationDuringCapture: true }));
}
async function main() {
    mkdirSync(OUT, { recursive: true });
    const phase = process.argv[2] || 'antes';
    const browser = await chromium.launch({ headless: true, args: ['--disable-gpu'] });
    const resume = process.argv.includes('--resume') && existsSync(`${OUT}/${phase}-matriz.json`);
    const results = resume ? JSON.parse(readFileSync(`${OUT}/${phase}-matriz.json`,'utf8')) : [];
    try {
        for (const theme of ['light', 'dark']) for (const width of phase === 'antes' ? [320, 390, 430, 1440] : widths) {
            const { page, errors, writes } = await setup(browser, { theme, width });
            const routes = [['login', '/login?redirect=%2Fmessages'], ['registro', '/login?mode=register&redirect=%2Fmessages'], ['planes', '/pricing'], ['paywall', '/market'], ['lista', '/market/seguimiento']];
            for (const [name, path] of phase === 'vs01' ? routes.slice(0, 2) : phase === 'vs03' ? routes.slice(2) : routes) {
                if(results.some(row=>row.name===name && row.width===width && row.theme.includes(theme))) continue;
                console.log(phase, name, width, theme);
                await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
                await page.locator('h1, h2, form').first().waitFor({ timeout: 5000 }).catch(() => {});
                const result = await capture(page, `${phase}-${name}-${width}-${theme}`);
                const fields = await page.locator('input:not([type=hidden])').evaluateAll(inputs => inputs.map(input => ({ id: input.id, label: input.labels?.[0]?.textContent, described: input.getAttribute('aria-describedby') }))).catch(()=>[]);
                results.push({ phase, name, ...result, fields, errors: [...errors], writes: [...writes] });
                writeFileSync(`${OUT}/${phase}-matriz.json`, JSON.stringify(results, null, 2));
            }
            await page.close();
        }
        writeFileSync(`${OUT}/${phase}-matriz.json`, JSON.stringify(results, null, 2));
        console.log(`${results.length} vistas guardadas (${phase}); resultados en ${OUT}/${phase}-matriz.json`);
    } finally { await browser.close(); }
}
if (require.main === module) main().catch(error => { console.error(error); process.exitCode = 1; });
module.exports = { setup, capture, widths, OUT, BASE };
