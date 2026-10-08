#!/usr/bin/env node
// Creates a NEW private connection file; never edits the live API configuration.
const fs = require('node:fs');
const path = require('node:path');

try {
    const output = process.argv[2];
    const port = process.argv[3] || '15432';
    if (!output || !/^\d+$/.test(port) || Number(port) < 1024 || Number(port) > 65535) {
        throw Object.assign(new Error(), { code: 'USAGE: create-local-env.cjs OUTPUT_FILE [PORT]' });
    }
    const root = path.resolve(__dirname, '../../ops/database/.secrets');
    const makeUrl = (role, file, limit) => {
        const password = fs.readFileSync(path.join(root, file), 'utf8').trim();
        if (!/^[a-f0-9]{64}$/.test(password)) throw Object.assign(new Error(), { code: 'EXPECTED_OPENSSL_32_BYTE_HEX_SECRET' });
        const url = new URL(`postgresql://${role}@127.0.0.1:${port}/finix_prod`);
        url.password = password;
        url.searchParams.set('schema', 'public');
        url.searchParams.set('connection_limit', String(limit));
        url.searchParams.set('connect_timeout', '10');
        url.searchParams.set('pool_timeout', '15');
        return url.toString();
    };
    const contents = [
        '# Private database-only configuration. Preserve the API JWT and other settings.',
        `DATABASE_URL=${JSON.stringify(makeUrl('finix_app', 'app.password', 10))}`,
        `DIRECT_URL=${JSON.stringify(makeUrl('finix_owner', 'owner.password', 3))}`,
        '',
    ].join('\n');
    fs.writeFileSync(path.resolve(output), contents, { mode: 0o600, flag: 'wx' });
    console.log('Private connection file created. The live API environment was not changed.');
} catch (error) {
    console.error(error.code || error.name);
    process.exitCode = 1;
}
