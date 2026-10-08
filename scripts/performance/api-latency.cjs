#!/usr/bin/env node
// Passive benchmark; writes only sizes/status/timings, never response records.
const fs = require('node:fs');
const { performance } = require('node:perf_hooks');
const base = process.argv[2] || 'http://127.0.0.1:3010';
const output = process.argv[3] || '/tmp/finix-api-latency.json';
const samples = Number(process.env.FINIX_BENCHMARK_SAMPLES || 10);
const interval = Number(process.env.FINIX_BENCHMARK_INTERVAL_MS || 3600);
if (!Number.isInteger(samples) || samples < 1 || samples > 50 || interval < 400) throw new Error('Use 1–50 samples and at least 400ms pacing');
const paths = ['/api/posts/feed?limit=20', '/api/news?limit=20', '/api/news/categories', '/api/calendar/home', '/api/market/dashboard'];
const percentile = (values, p) => values[Math.min(values.length - 1, Math.ceil(values.length * p) - 1)];
(async () => {
    let token = process.env.FINIX_BENCHMARK_TOKEN;
    if (!token && process.env.FINIX_BENCHMARK_AUTH_ENV) {
        if (!['127.0.0.1', 'localhost'].includes(new URL(base).hostname)) throw new Error('Automatic demo login is local-only');
        const demo = require('dotenv').parse(fs.readFileSync(process.env.FINIX_BENCHMARK_AUTH_ENV));
        const response = await fetch(base + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: demo.EMAIL, password: demo.PASSWORD }) });
        if (!response.ok) throw new Error('Demo authentication failed');
        token = (await response.json()).token;
    }
    if (token) paths.push('/api/users/ranking', '/api/communities?limit=20', '/api/portfolios', '/api/notifications', '/api/analysis?limit=20');
    const result = { measuredAt: new Date().toISOString(), base, conditions: 'Paced sequential GET requests; first recorded request is separate from warm samples. Existing cache state is not reset. Private records and tokens are never saved.', endpoints: [] };
    for (const route of paths) {
        const measurements = [];
        for (let i = 0; i <= samples; i++) {
            const start = performance.now();
            try {
                const response = await fetch(base + route, { signal: AbortSignal.timeout(30000), headers: token ? { Authorization: `Bearer ${token}` } : {} });
                const headersAt = performance.now(); const body = await response.arrayBuffer();
                measurements.push({ status: response.status, elapsedMs: performance.now() - start, ttfbMs: headersAt - start, bytes: body.byteLength, dbOperations: response.headers.get('x-finix-db-operations') });
            } catch (error) { measurements.push({ status: 0, elapsedMs: performance.now() - start, error: error.name }); }
            await new Promise(resolve => setTimeout(resolve, interval));
        }
        const warm = measurements.slice(1), successful = warm.filter(m => m.status >= 200 && m.status < 400);
        const durations = successful.map(m => m.elapsedMs).sort((a, b) => a - b);
        result.endpoints.push({ path: route, firstRecorded: measurements[0], warm: { samples: warm.length, successfulSamples: successful.length, meanMs: durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : null, p50Ms: durations.length ? percentile(durations, 0.5) : null, p95Ms: durations.length ? percentile(durations, 0.95) : null, p99Ms: durations.length ? percentile(durations, 0.99) : null, errors: warm.length - successful.length, bytes: successful.at(-1)?.bytes ?? null, statuses: [...new Set(warm.map(m => m.status))], dbOperations: successful.map(m => m.dbOperations) } });
        fs.writeFileSync(output, JSON.stringify(result, null, 2), { mode: 0o600 });
        console.log(JSON.stringify(result.endpoints.at(-1)));
    }
    if (result.endpoints.some(e => e.firstRecorded.status >= 400 || e.warm.errors)) process.exitCode = 1;
})().catch(error => { console.error(error.name); process.exitCode = 1; });
