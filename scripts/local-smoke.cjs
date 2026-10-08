#!/usr/bin/env node
// Real local HTTP, SMTP and browser test; only creates a dedicated demo account.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { randomBytes } = require('node:crypto');
const dotenv = require('dotenv');
const { chromium } = require('playwright');
const config = dotenv.parse(fs.readFileSync('apps/api/.env'));
assert.equal(config.FINIX_LOCAL_MODE, 'true');
assert.equal(new URL(config.DATABASE_URL).hostname, '127.0.0.1');
const demoFile = path.resolve('.local/finix/demo-account.env');
fs.mkdirSync(path.dirname(demoFile), { recursive: true, mode: 0o700 });
const existing = fs.existsSync(demoFile) ? dotenv.parse(fs.readFileSync(demoFile)) : null;
const username = `finixlocal_${randomBytes(3).toString('hex')}`;
const demo = existing || { EMAIL: `${username}@example.test`, USERNAME: username, PASSWORD: randomBytes(16).toString('hex') };
const origin = 'http://localhost:5173';
const checks = [];
let browser;
async function request(endpoint, data) {
    const response = await fetch(`${origin}/api${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    assert.equal(response.status, 200, endpoint);
    return response.json();
}
async function codeFromMail() {
    const result = await fetch(`http://localhost:8025/api/v1/search?query=${encodeURIComponent('to:' + demo.EMAIL)}`).then(r => r.json());
    assert.ok(result.messages?.length, 'Local SMTP delivered the email');
    const mail = await fetch(`http://localhost:8025/api/v1/message/${result.messages[0].ID}`).then(r => r.json());
    const code = mail.Text.match(/\b\d{6}\b/);
    assert.ok(code, 'Email contains verification code');
    return code[0];
}
(async () => {
    if (!existing) {
        await request('/auth/register/request-code', { email: demo.EMAIL, username: demo.USERNAME, password: demo.PASSWORD });
        await request('/auth/register/verify-code', { email: demo.EMAIL, code: await codeFromMail() });
        fs.writeFileSync(demoFile, Object.entries(demo).map(([k, v]) => `${k}=${JSON.stringify(v)}`).join('\n') + '\n', { mode: 0o600 });
        checks.push('Registration and verification through real local SMTP');
    }
    const session = await request('/auth/login', { email: demo.EMAIL, password: demo.PASSWORD });
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` };
    const onboarding = await fetch(`${origin}/api/me/onboarding`, { method: 'PATCH', headers, body: JSON.stringify({ completed: true }) });
    assert.equal(onboarding.status, 200);
    const portfolios = await fetch(`${origin}/api/portfolios`, { headers }).then(r => r.json());
    if (!portfolios.length) {
        const created = await fetch(`${origin}/api/portfolios`, { method: 'POST', headers, body: JSON.stringify({ nombre: 'Portafolio de prueba local', monedaBase: 'USD', esPrincipal: true }) });
        assert.equal(created.status, 201);
    }
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const providerCalls = [], errors = [];
    page.on('request', request => { if (/\.supabase\.(co|com)\//.test(request.url())) providerCalls.push(request.url()); });
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => localStorage.setItem('finix_cookie_consent', JSON.stringify({ version: '1', prefs: { necessary: true } })));
    await page.goto(`${origin}/login?redirect=%2Fportfolio`);
    await page.locator('input[type=email]').fill(demo.EMAIL);
    await page.locator('input[type=password]').fill(demo.PASSWORD);
    await page.getByRole('button', { name: 'Ingresar', exact: true }).click();
    await page.getByPlaceholder('Código de 6 dígitos').waitFor();
    await page.getByPlaceholder('Código de 6 dígitos').fill(await codeFromMail());
    await page.getByRole('button', { name: 'Ingresar', exact: true }).click();
    await page.waitForURL(url => url.pathname === '/portfolio');
    await page.getByRole('button', { name: 'Agregar transacción', exact: true }).waitFor();
    checks.push('Browser login with email code and portfolio redirect');
    await page.reload();
    await page.getByRole('button', { name: 'Agregar transacción', exact: true }).waitFor();
    checks.push('Persistent Finix session survives reload');
    for (const route of ['/dashboard', '/news', '/settings', '/finanzas']) {
        await page.goto(origin + route);
        await page.waitForTimeout(1000);
        assert.ok((await page.locator('#root').innerText()).trim());
        checks.push(`Rendered ${route}`);
    }
    assert.equal(providerCalls.length, 0, 'No Supabase requests');
    assert.deepEqual(errors, [], 'No browser exceptions');
    const ready = await fetch('http://127.0.0.1:3010/ready').then(r => r.json());
    assert.equal(ready.database, 'connected');
    const admin = await browser.newPage();
    await admin.goto('http://localhost:5147');
    await admin.locator('input[type=password]').waitFor();
    checks.push('Admin login page and local database readiness');
    console.log(JSON.stringify({ success: true, checks, supabaseRequests: providerCalls.length, demoCredentials: demoFile }, null, 2));
})().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(async () => { if (browser) await browser.close(); });
