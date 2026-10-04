// With the web dev server on port 4173: node scripts/calendar-spanish-browser.test.cjs
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { writeFileSync, unlinkSync } = require('node:fs');
const { join } = require('node:path');
const { localizeEconomicEvent } = require('../packages/shared/dist');

async function main() {
    const harnessName = `calendar-spanish-test-${process.pid}.html`;
    const harnessPath = join(__dirname, '../apps/web', harnessName);
    const browser = await chromium.launch({ headless: true });
    try {
        writeFileSync(harnessPath, `<!doctype html><div id="root"></div><script type="module">
            import React from 'react';
            import ReactDOM from 'react-dom/client';
            import { MemoryRouter } from 'react-router-dom';
            import CalendarPage from '/src/pages/CalendarPage.tsx';
            import { CalendarPreviewCard } from '/src/components/CalendarPreviewCard.tsx';
            import { useAuthStore } from '/src/stores/authStore.ts';
            import '/src/index.css';
            useAuthStore.setState({ user: { id: 'spanish-test', plan: 'PRO', subscriptionStatus: 'ACTIVE' } });
            const root = ReactDOM.createRoot(document.getElementById('root'));
            window.renderCalendar = () => root.render(React.createElement(MemoryRouter, null, React.createElement(CalendarPage)));
            window.renderPreview = () => root.render(React.createElement(MemoryRouter, null, React.createElement(CalendarPreviewCard)));
            window.renderCalendar();
        </script>`);
        const page = await browser.newPage();
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        const names = ['MBA Mortgage Refinance Index', 'ADP Employment Change', 'GDP Sales QoQ Final', 'Goods Trade Balance Adv', 'New Experimental Survey'];
        const events = names.map((title, i) => ({
            id: `event-${i}`, eventType: 'ECONOMIC', country: 'US', title,
            description: i === 0 ? 'The MBA Weekly Mortgage Application Survey is a comprehensive overview of the nationwide mortgage market.' : 'La encuesta is a comprehensive overview of the market.',
            date: '2026-09-30', time: '12:30', timezone: 'UTC', importance: 'MEDIUM', marketImpactScore: 60,
            category: 'EMPLOYMENT', actualValue: '557.8', previousValue: '61.1', source: 'TradingView Economic Calendar',
        }));
        let alreadyLocalized = false;
        await page.route('**/calendar/week?*', route => route.fulfill({ json: {
            economicData: { status: 'READY' }, weekRange: { from: '2026-09-28', to: '2026-10-04' }, isProUser: true,
            categories: { all: events.length, us: events.length, ar: 0, earnings: 0, dividends: 0 },
            days: [{ date: '2026-09-30', dayName: 'Miércoles', economicEvents: alreadyLocalized ? events.map(localizeEconomicEvent) : events, earningsEvents: [], dividendEvents: [] }],
        } }));
        await page.route('**/calendar/home', route => route.fulfill({ json: { events: [
            { ...events[0], type: 'ECONOMIC', dayLabel: 'MIÉ', impactScore: 60 },
            { id: 'earnings', type: 'EARNINGS', title: 'Apple Inc.', ticker: 'AAPL', epsEstimate: 1, date: '2026-09-30', dayLabel: 'MIÉ', importance: 'HIGH', impactScore: 80 },
        ] } }));
        await page.goto(`http://127.0.0.1:4173/${harnessName}`);
        const expected = ['Índice de refinanciación hipotecaria (MBA)', 'Variación del empleo privado (ADP)', 'Ventas finales de la producción interna · variación trimestral · dato definitivo', 'Balanza comercial de bienes · estimación preliminar', 'Publicación económica'];
        async function checkCalendar() {
            await page.getByRole('heading', { name: expected[0], exact: true }).waitFor();
            for (const name of expected) assert.equal(await page.getByRole('heading', { name, exact: true }).count(), 1);
            assert.equal(await page.locator('article').count(), events.length);
            const body = await page.locator('body').innerText();
            assert.doesNotMatch(body, /Mortgage|Employment Change|GDP Sales|Goods Trade|Experimental Survey|The MBA|comprehensive overview|Economic Calendar/);
            assert.ok(body.includes('557.8') && body.includes('61.1'), 'Numeric values must remain unchanged');
            assert.equal(await page.getByText('Fuente: Calendario económico de TradingView', { exact: true }).count(), events.length);
        }
        await checkCalendar();
        await page.setViewportSize({ width: 390, height: 844 });
        await checkCalendar();
        alreadyLocalized = true;
        await page.reload();
        await checkCalendar();
        await page.evaluate(() => window.renderPreview());
        await page.getByText(expected[0], { exact: true }).waitFor();
        await page.getByText('Apple Inc.', { exact: true }).waitFor();
        assert.doesNotMatch(await page.locator('body').innerText(), /Mortgage|The MBA/);
        assert.deepEqual(errors, []);
        console.log('Spanish calendar browser checks passed: raw and localized API data, complete titles/descriptions, source labels, mobile, values and home preview.');
    } finally {
        await browser.close();
        unlinkSync(harnessPath);
    }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
