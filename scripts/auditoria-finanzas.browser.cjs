// Render real components with isolated fixtures. Audit numbers are not verified quotes.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { writeFileSync, unlinkSync } = require('node:fs');
const { setup, capture, widths, OUT, BASE } = require('./auditoria-ux-vscode.browser.cjs');
const harness = 'auditoria-finanzas-local.html';
const path = `apps/web/${harness}`;
(async () => {
    const browser = await chromium.launch({ headless: true, args: ['--disable-gpu'] });
    const phase = process.argv[2] || 'antes';
    const results = [];
    try {
        writeFileSync(path, `<!doctype html><html lang="es-AR"><div id="root"></div><script type="module">
            import React from 'react'; import {createRoot} from 'react-dom/client'; import {MemoryRouter} from 'react-router-dom';
            import Calendar from '/src/pages/CalendarPage.tsx'; import Fundamental from '/src/components/markets/AssetFundamentalPanel.tsx';
            import {useAuthStore} from '/src/stores/authStore.ts'; import '/src/index.css';
            useAuthStore.setState({user:{id:'preview',plan:'CREATOR',subscriptionStatus:'ACTIVE'}});
            document.documentElement.className = new URLSearchParams(location.search).get('theme');
            const component = new URLSearchParams(location.search).get('view') === 'calendar' ? React.createElement(Calendar) : React.createElement(Fundamental,{symbol:'NYSE:BXP'});
            createRoot(document.getElementById('root')).render(React.createElement(MemoryRouter,null,React.createElement('main',{style:{maxWidth:1200,margin:'auto',padding:16}},React.createElement('p',null,'Prueba local con fixtures de auditoría; no son cotizaciones verificadas.'),component)));
        </script></html>`);
        for (const theme of ['light', 'dark']) for (const width of phase === 'antes' ? [320,390,430,1440] : widths) {
            const { page, errors } = await setup(browser, { guest: false, theme, width });
            await page.route('**/api/calendar/week?*', route => route.fulfill({ json: {
                economicData: { status:'READY', source:'Fixture local de la auditoría', updatedAt:'2026-10-10T13:00:00Z' },
                weekRange:{from:'2026-10-05',to:'2026-10-09'}, categories:{all:1,us:1,ar:0,earnings:0,dividends:0},
                days:[{date:'2026-10-05',dayName:'Lunes',economicEvents:[{id:'audit-ism',eventType:'ECONOMIC',country:'US',title:'ISM Services Employment',date:'2026-10-05',importance:'MEDIUM',marketImpactScore:60,category:'EMPLOYMENT',actualValue:'50.1',consensusValue:'55',surprise:-0.1,unit:'puntos',source:'Fixture local de la auditoría'}],earningsEvents:[],dividendEvents:[]}]
            }}));
            await page.route('**/api/fundamental/BXP?*', route => route.fulfill({ json: {
                instrument:{normalizedTicker:'BXP',name:'BXP Inc.',providerUsed:'fmp',asOf:'2026-10-10T13:00:00Z'},
                metrics:{roic:1.38}, statements:{incomeStatement:[],balanceSheet:[],cashFlow:[]}, quality:{warnings:[]},
                source:{fetchedAt:'2026-10-10T13:00:00Z',providersTried:['fmp'],staleFromCache:false},
                metricContext:{roic:{source:'fmp',period:'FY',asOf:'2025-12-31',unit:'%',formula:'Operating profit × (1 − tax rate) / invested capital'},currency:null}
            }}));
            for (const view of ['calendar','fundamental']) {
                await page.goto(`${BASE}/${harness}?view=${view}&theme=${theme}`,{waitUntil:'domcontentloaded'});
                await page.getByText(view==='calendar'?'Empleo en servicios (ISM)':'Información del activo',{exact:false}).first().waitFor();
                const result = await capture(page,`vs02-${phase}-${view}-${width}-${theme}`);
                if(phase!=='antes' && view==='calendar') assert.ok((await page.locator('body').innerText()).includes('-4.9'), 'ISM surprise matches displayed actual minus estimate');
                results.push({view,...result,errors:[...errors]});
                writeFileSync(`${OUT}/vs02-${phase}-matriz.json`,JSON.stringify(results,null,2));
                console.log(phase,view,width,theme);
            }
            await page.close();
        }
    } finally { unlinkSync(path); await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
