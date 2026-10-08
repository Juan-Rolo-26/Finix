#!/usr/bin/env node
// Read-only validation against the consistent snapshot recorded by backup.cjs.
const fs = require('node:fs');
const { Client } = require('pg');
const dotenv = require('dotenv');
const { readCatalog } = require('./catalog.cjs');
const env = { ...dotenv.parse(fs.readFileSync(process.argv[2])), ...process.env };
const manifest = JSON.parse(fs.readFileSync(process.argv[3]));
let url;
try { url = new URL(env.FINIX_VALIDATE_URL || env.DIRECT_URL || env.DATABASE_URL); }
catch { throw new Error('Invalid database connection configuration'); }
url.search = '';
const quote = name => `"${name.replace(/"/g, '""')}"`;
(async () => {
    const client = new Client({ connectionString: url.toString(), ssl: ['127.0.0.1', 'localhost', '::1'].includes(url.hostname) ? false : { rejectUnauthorized: false } });
    const report = { checkedAt: new Date().toISOString(), tables: [], mismatches: [], catalogMismatches: [], invalidConstraints: [], invalidIndexes: [] };
    try {
        await client.connect(); await client.query("SET timezone='UTC'");
        await client.query('SELECT set_config($1,$2,false)', ['extra_float_digits', String(manifest.canonicalSettings?.extraFloatDigits ?? env.FINIX_VALIDATE_EXTRA_FLOAT_DIGITS ?? 3)]);
        await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
        const actual = (await client.query("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename")).rows.map(t => t.tablename);
        for (const name of actual.filter(name => !Object.hasOwn(manifest.tables, name))) report.mismatches.push({ table: name, reason: 'unexpected table' });
        if (manifest.catalog) {
            const restoredCatalog = await readCatalog(client);
            for (const [section, expected] of Object.entries(manifest.catalog)) {
                if (JSON.stringify(expected) !== JSON.stringify(restoredCatalog[section])) report.catalogMismatches.push(section);
            }
        }
        report.catalogCompared = Boolean(manifest.catalog);
        for (const name of Object.keys(manifest.tables)) {
            if (!actual.includes(name)) { report.mismatches.push({ table: name, reason: 'missing table' }); continue; }
            const { rows } = await client.query(`SELECT count(*)::text AS rows,
                coalesce(sum(hashtextextended(row_to_json(t)::text, 0)::numeric),0)::text AS hash0,
                coalesce(sum(hashtextextended(row_to_json(t)::text, 1)::numeric),0)::text AS hash1
                FROM public.${quote(name)} t`);
            const matches = JSON.stringify(rows[0]) === JSON.stringify(manifest.tables[name]);
            report.tables.push({ table: name, sourceRows: manifest.tables[name].rows, restoredRows: rows[0].rows, contentMatches: matches });
            if (!matches) report.mismatches.push({ table: name, reason: 'row count or content fingerprint changed' });
        }
        report.invalidConstraints = (await client.query("SELECT conname FROM pg_constraint c JOIN pg_namespace n ON n.oid=c.connamespace WHERE n.nspname='public' AND NOT convalidated")).rows;
        report.invalidIndexes = (await client.query("SELECT c.relname FROM pg_index i JOIN pg_class c ON c.oid=i.indexrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND (NOT i.indisvalid OR NOT i.indisready)")).rows;
        await client.query('COMMIT');
        report.success = report.mismatches.length === 0 && report.catalogMismatches.length === 0 && report.invalidConstraints.length === 0 && report.invalidIndexes.length === 0;
        fs.writeFileSync(process.argv[4] || '/tmp/finix-restore-validation.json', JSON.stringify(report, null, 2), { mode: 0o600 });
        console.log(JSON.stringify({ success: report.success, tables: report.tables.length, rows: report.tables.reduce((sum, t) => sum + Number(t.restoredRows), 0), mismatches: report.mismatches, catalogCompared: report.catalogCompared, catalogMismatches: report.catalogMismatches, invalidConstraints: report.invalidConstraints, invalidIndexes: report.invalidIndexes }));
        if (!report.success) process.exitCode = 1;
    } finally { await client.end(); }
})().catch(error => { console.error(error.code || error.name); process.exitCode = 1; });
