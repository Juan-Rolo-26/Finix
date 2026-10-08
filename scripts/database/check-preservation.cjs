#!/usr/bin/env node
// Compare original record identities and credentials without logging user data.
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const { Client } = require('pg');
const env = require('dotenv').parse(fs.readFileSync(process.argv[2] || 'apps/api/.env'));
const backup = path.resolve(process.argv[3] || '');
const url = new URL(env.DATABASE_URL);
if (!process.argv[3] || !['localhost', '127.0.0.1'].includes(url.hostname)) throw new Error('Explicit source snapshot and local destination required');
const manifest = JSON.parse(fs.readFileSync(path.join(backup, 'manifest.json')));
const sql = fs.readFileSync(path.join(backup, 'data.sql'));
if (crypto.createHash('sha256').update(sql).digest('hex') !== manifest.files?.['data.sql']?.sha256) throw new Error('Source snapshot checksum mismatch');
const decode = value => value === '\\N' ? null : value.replace(/\\([0-7]{1,3}|x[0-9a-fA-F]{1,2}|.)/g, (_, escape) => {
    const escapes = { b: '\b', f: '\f', n: '\n', r: '\r', t: '\t', v: '\v', '\\': '\\' };
    if (Object.hasOwn(escapes, escape)) return escapes[escape];
    if (/^[0-7]/.test(escape)) return String.fromCharCode(parseInt(escape, 8));
    if (escape.startsWith('x')) return String.fromCharCode(parseInt(escape.slice(1), 16));
    return escape;
});
const originals = new Map(); let table;
for (const line of sql.toString('utf8').split('\n')) {
    const match = line.match(/^COPY public\."([^"]+)" \((.+)\) FROM stdin;$/) || line.match(/^COPY public\.([a-zA-Z0-9_]+) \((.+)\) FROM stdin;$/);
    if (match) { table = { columns: match[2].split(',').map(c => c.trim().replace(/^"|"$/g, '')), rows: [] }; originals.set(match[1], table); }
    else if (table && line === '\\.') table = undefined;
    else if (table) table.rows.push(line.split('\t').map(decode));
}
const quote = name => '"' + name.replaceAll('"', '""') + '"';
(async () => {
    const client = new Client({ connectionString: url.toString(), connectionTimeoutMillis: 10000 });
    const report = { checkedAt: new Date().toISOString(), tables: [], missingOriginalRecords: 0, originalUsers: 0, preservedUsers: 0, usersWithChangedProtectedFields: 0 };
    try {
        await client.connect(); await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
        await client.query("SET timezone='UTC'"); await client.query('SET extra_float_digits=3');
        const protectedFields = new Set(['id', 'email', 'username', 'password', 'role', 'status', 'adminTwoFactorEnabled', 'adminTotpSecret']);
        for (const [name, original] of originals) {
            if (original.rows.length !== Number(manifest.tables[name]?.rows)) throw new Error('Source COPY parser/count mismatch');
            const primary = manifest.catalog.constraints.find(c => c.table_name === name && c.type === 'p');
            if (!primary) throw new Error('Source table without primary key requires manual comparison');
            const keyNames = primary.definition.match(/PRIMARY KEY \((.+)\)/)[1].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
            const keyIndexes = keyNames.map(key => original.columns.indexOf(key));
            if (keyIndexes.some(i => i < 0)) throw new Error('Invalid source key metadata');
            const current = (await client.query({ text: `SELECT ${original.columns.map(c => `${quote(c)}::text`).join(',')} FROM public.${quote(name)}`, rowMode: 'array' })).rows;
            const fields = original.columns;
            const types = new Map(manifest.catalog.columns.filter(c => c.table_name === name).map(c => [c.column_name, c.type]));
            const records = new Map(current.map(values => [JSON.stringify(keyIndexes.map(i => values[i])), values]));
            let missing = 0, changedFinancialRows = 0;
            for (const row of original.rows) {
                const actual = records.get(JSON.stringify(keyIndexes.map(i => row[i])));
                if (!actual) { missing++; continue; }
                const matches = i => {
                    const type = types.get(fields[i]);
                    const expected = type === 'boolean' && row[i] !== null ? (row[i] === 't' ? 'true' : 'false') : row[i];
                    return expected === actual[i];
                };
                if (name === 'User') {
                    report.preservedUsers++;
                    if (fields.some((field, i) => protectedFields.has(field) && !matches(i))) report.usersWithChangedProtectedFields++;
                }
                if (/Portfolio|Holding|Transaction|CashAccount|PersonalFinance/.test(name) && fields.some((_, i) => !matches(i))) changedFinancialRows++;
            }
            if (name === 'User') report.originalUsers = original.rows.length;
            report.missingOriginalRecords += missing;
            report.tables.push({ table: name, originalRecords: original.rows.length, currentRecords: current.length, missingOriginalRecords: missing, changedFinancialRows });
        }
        await client.query('COMMIT');
        report.success = report.tables.length === Object.keys(manifest.tables).length && !report.missingOriginalRecords && !report.usersWithChangedProtectedFields;
        if (process.argv[4]) fs.writeFileSync(process.argv[4], JSON.stringify(report, null, 2), { mode: 0o600 });
        console.log(JSON.stringify({ success: report.success, comparedSourceTables: report.tables.length, comparedOriginalRecords: report.tables.reduce((sum, t) => sum + t.originalRecords, 0), missingOriginalRecords: report.missingOriginalRecords, originalUsers: report.originalUsers, preservedUsers: report.preservedUsers, usersWithChangedProtectedFields: report.usersWithChangedProtectedFields, changedFinancialRows: report.tables.reduce((sum, t) => sum + t.changedFinancialRows, 0) }));
        if (!report.success) process.exitCode = 1;
    } finally { await client.end(); }
})().catch(error => { console.error(error.code || error.name); process.exitCode = 1; });
