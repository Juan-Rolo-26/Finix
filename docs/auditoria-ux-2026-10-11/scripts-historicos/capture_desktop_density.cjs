const { chromium } = require('playwright');
const path = require('path');

const OUT_DIR = '/home/juampi26/Finix/docs/auditoria-ux-2026-10-11/capturas';

async function run() {
    const browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    try {
        const setupPage = async (context, theme = 'light') => {
            const page = await context.newPage();
            await page.addInitScript((th) => {
                localStorage.setItem('finix_app_preferences_v4', JSON.stringify({ state: { theme: th, language: 'es-AR' }, version: 0 }));
                localStorage.setItem('finix_cookie_consent', JSON.stringify({ version: '1', prefs: { necessary: true, analytics: true, marketing: false } }));
                localStorage.setItem('cookieConsent', 'true');
                if (th === 'dark') document.documentElement.classList.add('dark');
                else document.documentElement.classList.remove('dark');
            }, theme);
            return page;
        };

        // 1. Desktop Market at 1440 and 1920 in light & dark
        for (const th of ['light', 'dark']) {
            for (const res of [{ name: '1440', width: 1440, height: 900 }, { name: '1920', width: 1920, height: 1080 }]) {
                const ctx = await browser.newContext({ viewport: { width: res.width, height: res.height } });
                const page = await setupPage(ctx, th);
                await page.goto('http://localhost:5173/mercados', { waitUntil: 'networkidle' });
                await page.waitForTimeout(600);
                await page.screenshot({
                    path: path.join(OUT_DIR, `mercado-desktop-densidad-${res.name}-${th}.png`),
                });
                await ctx.close();
            }
        }

        // 2. Article RSI at 1440 showing verified image and credits
        for (const th of ['light', 'dark']) {
            const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
            const page = await setupPage(ctx, th);
            await page.goto('http://localhost:5173/educativa/analisis-tecnico/que-es-el-rsi', { waitUntil: 'networkidle' });
            await page.waitForTimeout(600);
            await page.screenshot({
                path: path.join(OUT_DIR, `articulo-rsi-verificado-1440-${th}.png`),
            });
            await ctx.close();
        }

        console.log('Desktop density & RSI captures completed successfully!');
    } finally {
        await browser.close();
    }
}

run().catch(console.error);
