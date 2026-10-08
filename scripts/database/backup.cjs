#!/usr/bin/env node
// Credentials stay in the process environment, never in argv, logs or Git.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawn } = require('node:child_process');
const { Client } = require('pg');
const dotenv = require('dotenv');
const { readCatalog } = require('./catalog.cjs');

const envFile = path.resolve(process.argv[2] || 'apps/api/.env');
const output = path.resolve(process.argv[3] || `/var/backups/finix/database/${new Date().toISOString().replace(/[:.]/g, '-')}`);
const configuration = { ...dotenv.parse(fs.readFileSync(envFile)), ...process.env };
const rawUrl = configuration.FINIX_BACKUP_SOURCE_URL || configuration.SOURCE_DATABASE_URL || configuration.DIRECT_URL || configuration.DATABASE_URL;
let url;
try { url = new URL(rawUrl); }
catch { throw new Error('Invalid database connection configuration'); }
const local = ['localhost', '127.0.0.1', '::1'].includes(url.hostname);
const pgEnv = { ...process.env, PGHOST: url.hostname, PGPORT: url.port || '5432', PGDATABASE: decodeURIComponent(url.pathname.slice(1)), PGUSER: decodeURIComponent(url.username), PGPASSWORD: decodeURIComponent(url.password), PGSSLMODE: local ? 'disable' : 'require', PGCONNECT_TIMEOUT: '15' };
if (!local && configuration.FINIX_SOURCE_CA_FILE) {
    pgEnv.PGSSLMODE = 'verify-full'; pgEnv.PGSSLROOTCERT = configuration.FINIX_SOURCE_CA_FILE;
}
url.search = '';
process.umask(0o077);
fs.mkdirSync(output, { recursive: true, mode: 0o700 });
if (fs.readdirSync(output).length) throw new Error('Backup directory must be empty; existing backups are never overwritten');
const pgBin = configuration.FINIX_PG_BIN || '';
const tool = name => pgBin ? path.join(pgBin, name) : name;
const quote = name => `"${name.replace(/"/g, '""')}"`;

function run(name, args, filename) {
    return new Promise((resolve, reject) => {
        const errorFile = fs.openSync(path.join(output, `${path.basename(filename)}.stderr`), 'w', 0o600);
        const outputFile = fs.openSync(filename, 'w', 0o600);
        const child = spawn(tool(name), args, { env: pgEnv, stdio: ['ignore', outputFile, errorFile] });
        child.once('error', reject);
        child.once('close', code => { fs.closeSync(outputFile); fs.closeSync(errorFile); code === 0 ? resolve() : reject(new Error(`${name} failed (${code}); details in the protected backup directory`)); });
    });
}

async function main() {
    const client = new Client({ connectionString: url.toString(), ssl: local ? false : { rejectUnauthorized: Boolean(configuration.FINIX_SOURCE_CA_FILE), ...(configuration.FINIX_SOURCE_CA_FILE ? { ca: fs.readFileSync(configuration.FINIX_SOURCE_CA_FILE, 'utf8') } : {}) }, connectionTimeoutMillis: 15000 });
    const manifest = { startedAt: new Date().toISOString(), source: { host: url.hostname, database: pgEnv.PGDATABASE }, files: {}, optionalFailures: [] };
    try {
        await client.connect();
        // Supabase roles can default to extra_float_digits=0. Fix the output
        // precision so COPY and validation compare the same lossless values.
        await client.query("SET timezone='UTC'");
        await client.query('SET extra_float_digits=3');
        manifest.canonicalSettings = { timeZone: 'UTC', extraFloatDigits: 3 };
        await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
        const snapshot = (await client.query('SELECT pg_export_snapshot() AS snapshot')).rows[0].snapshot;
        manifest.source.version = (await client.query('SELECT version() AS version')).rows[0].version;
        manifest.catalog = await readCatalog(client);
        const tables = (await client.query("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename")).rows;
        manifest.tables = {};
        // One round trip for the inventory, rather than a remote query per table.
        const fingerprints = tables.map(({ tablename }) => `SELECT '${tablename.replace(/'/g, "''")}' AS table_name,count(*)::text AS rows,
                coalesce(sum(hashtextextended(row_to_json(t)::text, 0)::numeric),0)::text AS hash0,
                coalesce(sum(hashtextextended(row_to_json(t)::text, 1)::numeric),0)::text AS hash1
                FROM public.${quote(tablename)} t`).join(' UNION ALL ');
        for (const { table_name, ...fingerprint } of (await client.query(fingerprints)).rows) {
            manifest.tables[table_name] = fingerprint;
        }
        const snapshotArgs = ['--snapshot', snapshot, '--lock-wait-timeout=30s'];
        for (const [name, args] of [
            ['application.dump', ['--format=custom', '--schema=public']],
            ['schema.sql', ['--schema-only', '--schema=public']],
            ['data.sql', ['--data-only', '--schema=public']],
        ]) await run('pg_dump', [...snapshotArgs, ...args], path.join(output, name));
        await run('pg_restore', ['--list', path.join(output, 'application.dump')], path.join(output, 'application.toc'));
        for (const [name, command, args] of [
            ['full-database.dump', 'pg_dump', [...snapshotArgs, '--format=custom']],
            ['roles.sql', 'pg_dumpall', ['--roles-only', '--no-role-passwords']],
        ]) {
            try { await run(command, args, path.join(output, name)); }
            catch (error) { manifest.optionalFailures.push({ artifact: name, reason: error.message }); fs.rmSync(path.join(output, name), { force: true }); }
        }
        if (fs.existsSync(path.join(output, 'full-database.dump'))) await run('pg_restore', ['--list', path.join(output, 'full-database.dump')], path.join(output, 'full-database.toc'));
        await client.query('COMMIT');
        for (const name of fs.readdirSync(output).filter(name => !name.endsWith('.stderr') && name !== 'manifest.json')) {
            const file = path.join(output, name);
            if (fs.statSync(file).isFile()) manifest.files[name] = { bytes: fs.statSync(file).size, sha256: crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex') };
        }
        manifest.finishedAt = new Date().toISOString();
        manifest.fullBackupComplete = manifest.optionalFailures.length === 0;
        fs.writeFileSync(path.join(output, 'manifest.json'), JSON.stringify(manifest, null, 2), { mode: 0o600 });
        console.log(JSON.stringify({ directory: output, tables: tables.length, applicationArchiveReadable: true, fullBackupComplete: manifest.fullBackupComplete, failures: manifest.optionalFailures }));
    } finally { await client.end(); }
}
main().catch(error => { console.error(error.code || error.message.replace(/postgres(?:ql)?:\/\/\S+/g, '[redacted]')); process.exitCode = 1; });
