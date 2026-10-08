// Validate the desktop search redesign using local API fixtures.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { sectionFixtures } = require('./desktop-sections.browser.cjs');
async function main() {
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1536, height: 864 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await sectionFixtures(page);
    const open = async () => {
        await page.goto('http://127.0.0.1:4173/dashboard');
        await page.getByRole('button', { name: 'Buscar en Finix', exact: true }).click();
        await page.getByRole('dialog', { name: 'Buscar en Finix', exact: true }).waitFor();
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(700);
    };
    try {
        await open();
        const dialog = page.getByRole('dialog', { name: 'Buscar en Finix', exact: true });
        const input = dialog.getByRole('textbox', { name: 'Buscar en Finix', exact: true });
        assert.equal(await input.evaluate(node => document.activeElement === node), true, 'Input receives focus');
        for (const theme of ['light', 'dark']) {
            await page.evaluate(theme => document.documentElement.className = theme, theme);
            for (const [width,height] of [[1536,864],[1280,720],[1024,650]]) {
                await page.setViewportSize({width,height});
                await page.waitForTimeout(100);
                const geometry = await dialog.evaluate(node => {
                    const r = node.getBoundingClientRect();
                    return { x:r.x,y:r.y,right:r.right,bottom:r.bottom,scrollWidth:node.scrollWidth,clientWidth:node.clientWidth };
                });
                assert.ok(geometry.x >= 24 && geometry.right <= width - 24 && geometry.y >= 24 && geometry.bottom <= height - 24, 'Dialog fits desktop viewport');
                assert.ok(geometry.scrollWidth <= geometry.clientWidth, 'No horizontal dialog overflow');
                assert.equal(await dialog.locator('.global-search-suggestion').count(), 4);
                assert.equal(await dialog.locator('.global-search-recent').count(), 2);
                await page.screenshot({path:`/tmp/finix-search-${theme}-${width}.png`,animations:'disabled'});
            }
        }
        await dialog.getByRole('button', { name: 'AAPL', exact: true }).click();
        assert.equal(await input.inputValue(), 'AAPL');
        const asset = dialog.getByRole('button', { name: 'Microsoft stock NASDAQ:MSFT', exact: true });
        await asset.waitFor();
        await dialog.getByRole('button', { name: 'Limpiar búsqueda', exact: true }).click();
        await page.waitForTimeout(500);
        await dialog.getByRole('button', { name: 'Inversores que tengan Apple', exact: true }).click();
        assert.equal(await input.inputValue(), 'Inversores que tengan Apple');
        await dialog.getByRole('button', { name: 'Mercado', exact: true }).click();
        assert.equal(await dialog.getByRole('button', { name: 'Mercado', exact: true }).getAttribute('aria-pressed'), 'true');
        await input.fill('MSFT');
        await asset.waitFor();
        await dialog.getByRole('button', { name: 'Agregar Microsoft a Seguimiento', exact: true }).click();
        await page.getByRole('dialog', { name: /Agregar a Seguimiento/ }).waitFor();
        await page.keyboard.press('Escape');
        await open();
        await input.fill('MSFT');
        await asset.waitFor();
        await asset.click();
        await page.waitForURL('**/market?symbol=NASDAQ:MSFT');
        assert.equal(await dialog.count(),0);
        await open();
        await input.fill('otro');
        await dialog.getByRole('button', { name: /otro_inversor/ }).click();
        await page.waitForURL('**/profile/otro_inversor');
        await open();
        await dialog.getByRole('button', { name: 'Cerrar buscador', exact: true }).click();
        assert.equal(await dialog.count(),0);
        await page.keyboard.press('Control+k');
        await dialog.waitFor();
        await page.keyboard.press('Escape');
        assert.equal(await dialog.count(),0);
        await page.getByRole('button', { name: 'Buscar en Finix', exact: true }).click();
        await dialog.waitFor();
        await page.getByRole('button', { name: 'Cerrar búsqueda', exact: true }).click({position:{x:20,y:20}});
        assert.equal(await dialog.count(),0);
        assert.deepEqual(errors, [], 'No runtime errors');
        console.log(JSON.stringify({desktopViews:6,lightAndDark:true,searchAndNavigation:true,recentAndSuggestedQueries:true,watchlistAction:true,closeAndShortcuts:true,runtimeErrors:errors}));
    } finally {await browser.close();}
}
main().catch(error => {console.error(error);process.exitCode=1;});
