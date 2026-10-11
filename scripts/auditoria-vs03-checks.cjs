const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { writeFileSync } = require('node:fs');
const { setup, capture, OUT, BASE } = require('./auditoria-ux-vscode.browser.cjs');
(async () => {
    const browser=await chromium.launch({headless:true,args:['--disable-gpu']});
    const results=[];
    try {
        for(const guest of [true,false]) {
            const {page,writes,errors}=await setup(browser,{guest});
            for(const route of ['/pricing','/pro']) {
                await page.goto(`${BASE}${route}`,{waitUntil:'domcontentloaded'});
                await page.locator('[data-plan=PRO]').getByText('Gratis',{exact:true}).waitFor();
                const pro=page.locator('[data-plan=PRO]');
                assert.ok((await pro.innerText()).includes('Importe actual: ARS 0'));
                assert.ok((await pro.innerText()).includes('Precio habitual configurado: ARS 6.300'));
                assert.equal(await pro.getByRole('button',{name:guest?'Creá tu cuenta y accedé gratis':'Usar PRO gratis',exact:true}).count(),1);
                assert.equal(await page.locator('.pricing-table-wrap').isVisible(),false);
                assert.equal(await page.locator('.pricing-comparison-benefit').first().isVisible(),true);
                const lists=page.locator('.pricing-comparison-benefit').filter({has:page.getByRole('heading',{name:'Listas de seguimiento',exact:true})});
                assert.ok((await lists.innerText()).includes('25') && (await lists.innerText()).includes('50'));
            }
            await page.locator('[data-plan=PRO] button').click();
            await page.waitForURL(url=>url.pathname===(guest?'/auth':'/market'));
            assert.equal(writes.filter(path=>/checkout|subscription/.test(path)).length,0);
            results.push(`${guest?'Visitante':'Creador'}: /pricing y /pro coherentes, importe actual 0 y habitual separado, límites 25/50, sin checkout; CTA dirige al acceso o Mercado.`);
            assert.deepEqual(errors,[]);
            await page.close();
        }
        const {page,writes,errors}=await setup(browser,{configError:true});
        let failed=true;
        await page.route('**/api/mercadopago/config',route=>route.fulfill(failed?{status:503,json:{}}:{json:{freeAccessEnabled:true,purchasesPaused:true,proPriceArs:6300,creatorPriceArs:29900}}));
        await page.goto(`${BASE}/pricing`);
        await page.getByRole('button',{name:'Reintentar',exact:true}).waitFor();
        assert.equal(await page.locator('[data-plan=PRO]').getByText('Precio no disponible',{exact:true}).count(),1);
        assert.ok(await page.locator('[data-plan=PRO] button').isDisabled());
        assert.ok(!(await page.locator('[data-plan=PRO]').innerText()).includes('6.300'));
        await capture(page,'vs03-planes-error-390-light');
        failed=false;
        await page.getByRole('button',{name:'Reintentar',exact:true}).click();
        await page.locator('[data-plan=PRO]').getByText('Gratis',{exact:true}).waitFor();
        results.push('Error de configuración oculta importes no confirmados, deshabilita acción de planes pagos y Reintentar recupera el catálogo.');
        await page.goto(`${BASE}/market`);
        await page.getByText('Vista de ejemplo de las herramientas.',{exact:false}).waitFor();
        assert.equal(await page.getByText('STRONG BUY',{exact:true}).count(),0);
        const decoration=page.locator('[aria-hidden=true][inert]');
        assert.equal(await decoration.count(),1);
        await capture(page,'vs03-paywall-ejemplo-390-light');
        results.push('Ilustración distinguida como Vista de ejemplo, sin rendimientos ni recomendaciones inventadas, aria-hidden e inert; CTA legible.');
        assert.deepEqual(errors,[]);
        assert.equal(writes.filter(path=>/checkout|subscription/.test(path)).length,0);
        writeFileSync(`${OUT}/vs03-criterios.json`,JSON.stringify({results,realPurchases:0},null,2));
        console.log(results.join('\n'));
    } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
