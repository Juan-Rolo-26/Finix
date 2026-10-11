// Real chart components; synthetic rows only exercise layout, never provider accuracy.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { writeFileSync, unlinkSync } = require('node:fs');
const { setup, capture, widths, OUT, BASE } = require('./auditoria-ux-vscode.browser.cjs');
const path = 'apps/web/auditoria-graficos-local.html';
(async () => {
    const phase = process.argv[2] || 'antes';
    const browser = await chromium.launch({ headless: true });
    const results = [];
    try {
        writeFileSync(path, `<!doctype html><html lang="es-AR"><div id="root"></div><script type="module">
            import React from 'react'; import {createRoot} from 'react-dom/client'; import '/src/index.css';
            import {ChartContainer} from '/src/components/charts/shared/ChartContainer.tsx';
            import History from '/src/components/charts/financial/FinancialPriceHistory.tsx';
            document.documentElement.className = new URLSearchParams(location.search).get('theme');
            const candles = Array.from({length:12},(_,i)=>({date:'2026-09-'+String(i+1).padStart(2,'0'),close:100+i}));
            window.renderState = state => createRootOnce.render(React.createElement('main',{style:{maxWidth:1000,margin:'auto',padding:16}},
                React.createElement('p',null,'Fixtures locales para probar el gráfico; no son cotizaciones.'),
                React.createElement(ChartContainer,{title:'Histórico del precio de cierre y referencia temporal del activo',description:'Precio por acción en USD; fuente: fixture local, demora no aplicable.',loading:state==='loading',empty:state==='empty',error:state==='error'?'Servicio de prueba no disponible':null,onRetry:()=>window.retryCount=(window.retryCount||0)+1},React.createElement(History,{candles,currency:'USD'})),
                React.createElement('h2',null,'Sin fechas válidas'),React.createElement(History,{candles:[{close:10}],currency:null})));
            const createRootOnce=createRoot(document.getElementById('root')); window.renderState('ready');
        </script></html>`);
        for (const theme of ['light','dark']) for (const width of phase==='antes'?[320,390,430,1440]:widths) {
            const {page,errors}=await setup(browser,{theme,width});
            await page.goto(BASE+'/auditoria-graficos-local.html?theme='+theme);
            const chart=page.getByRole('region',{name:'Histórico del precio de cierre y referencia temporal del activo'});
            await chart.getByText('Precio de cierre · USD.',{exact:false}).waitFor();
            const title=await chart.locator('h3').evaluate(el=>({clipped:el.scrollWidth>el.clientWidth,whiteSpace:getComputedStyle(el).whiteSpace}));
            const result=await capture(page,`imagenes-${phase}-grafico-${width}-${theme}`);
            if(phase!=='antes') {
                assert.equal(title.clipped,false,'full chart title');
                assert.equal(result.width,result.scrollWidth,'no document overflow');
                const summary=chart.locator('summary'); await summary.focus(); await page.keyboard.press('Enter');
                assert.ok(await chart.getByRole('table').isVisible(),'keyboard-accessible complete data');
                assert.equal(await chart.getByRole('row').count(),13);
                const fullscreen=chart.getByRole('button',{name:'Ver en pantalla completa'});
                assert.ok(await fullscreen.evaluate(el=>el.getBoundingClientRect().height>=44));
                await fullscreen.focus(); await page.keyboard.press('Enter');
                await chart.getByRole('button',{name:'Salir de pantalla completa'}).waitFor();
                // Browser native Escape is trusted outside Playwright. The fullscreenchange
                // event must restore UI state when the platform exits fullscreen.
                await page.evaluate(async()=>{if(document.fullscreenElement) await document.exitFullscreen();});
                await chart.getByRole('button',{name:'Ver en pantalla completa'}).waitFor();
                for(const state of ['loading','empty','error']) {
                    await page.evaluate(state=>window.renderState(state),state);
                    await page.waitForTimeout(80);
                    if(state==='error') {await chart.getByRole('button',{name:'Reintentar carga de datos'}).click(); assert.equal(await page.evaluate(()=>window.retryCount),1);}
                }
                await capture(page,`imagenes-despues-error-${width}-${theme}`);
            }
            results.push({theme,width,title,...result,errors});
            writeFileSync(`${OUT}/imagenes-${phase}-graficos.json`,JSON.stringify(results,null,2));
            console.log(phase,width,theme); await page.close();
        }
    } finally {unlinkSync(path);await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
