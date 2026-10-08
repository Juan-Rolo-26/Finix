#!/usr/bin/env node
// Read-only checks against a local PostgreSQL, using the API's runtime role.
// Usage: node scripts/database/check-local.cjs /private/local-runtime.env
const fs = require('node:fs');
const path = require('node:path');
const { Client } = require('pg');
const { PrismaClient, Prisma } = require('@prisma/client');
const dotenv = require('dotenv');

async function main() {
    const configuration = dotenv.parse(fs.readFileSync(process.argv[2] || 'apps/api/.env'));
    const raw = configuration.DATABASE_URL;
    let url;
    try { url = new URL(raw); } catch { throw Object.assign(new Error(), { code: 'INVALID_DATABASE_URL' }); }
    if (!['localhost', '127.0.0.1', '[::1]', '::1'].includes(url.hostname)) {
        throw Object.assign(new Error(), { code: 'LOCAL_DATABASE_REQUIRED' });
    }
    const pgUrl = new URL(url); pgUrl.search = '';
    const client = new Client({ connectionString: pgUrl.toString(), ssl: false, connectionTimeoutMillis: 10000 });
    const prisma = new PrismaClient({ datasources: { db: { url: raw } } });
    const report = { success: false, checkedAt: new Date().toISOString(), errors: [], warnings: [] };
    try {
        await client.connect();
        await client.query('SET default_transaction_read_only=on');
        report.database = (await client.query(`SELECT current_database() AS name,
            current_user AS runtime_role, current_setting('server_version') AS version`)).rows[0];
        const role = (await client.query(`SELECT rolsuper,rolcreatedb,rolcreaterole,rolbypassrls
            FROM pg_roles WHERE rolname=current_user`)).rows[0];
        report.role = role;
        if (Object.values(role).some(Boolean)) report.errors.push({ check: 'runtime_role', code: 'EXCESSIVE_PRIVILEGES' });
        const invalidConstraints = (await client.query(`SELECT count(*)::int AS n FROM pg_constraint c
            JOIN pg_namespace n ON n.oid=c.connamespace WHERE n.nspname='public' AND NOT c.convalidated`)).rows[0].n;
        const invalidIndexes = (await client.query(`SELECT count(*)::int AS n FROM pg_index i
            JOIN pg_class c ON c.oid=i.indexrelid JOIN pg_namespace n ON n.oid=c.relnamespace
            WHERE n.nspname='public' AND (NOT i.indisvalid OR NOT i.indisready)`)).rows[0].n;
        report.invalidConstraints = invalidConstraints; report.invalidIndexes = invalidIndexes;
        if (invalidConstraints || invalidIndexes) report.errors.push({ check: 'integrity', code: 'INVALID_CATALOG_OBJECTS' });
        const rlsWithoutRolePolicy = (await client.query(`SELECT c.relname AS table FROM pg_class c
            JOIN pg_namespace n ON n.oid=c.relnamespace
            WHERE n.nspname='public' AND c.relrowsecurity AND NOT EXISTS (
                SELECT 1 FROM pg_policy p WHERE p.polrelid=c.oid AND p.polcmd='*'
                AND p.polroles @> ARRAY[(SELECT oid FROM pg_roles WHERE rolname=current_user)]
            ) ORDER BY c.relname`)).rows;
        if (rlsWithoutRolePolicy.length) report.errors.push({ check: 'backend_rls', tables: rlsWithoutRolePolicy.map(t => t.table), code: 'BACKEND_POLICY_MISSING' });
        const tables = (await client.query(`SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename`)).rows;
        let rows = 0;
        for (const { tablename } of tables) {
            const identifier = '"' + tablename.replaceAll('"', '""') + '"';
            try { rows += Number((await client.query(`SELECT count(*)::text AS n FROM public.${identifier}`)).rows[0].n); }
            catch (error) { report.errors.push({ check: 'table_read', table: tablename, code: error.code || error.name }); }
        }
        report.publicTables = tables.length; report.visibleRows = rows;
        report.modelsRead = 0;
        await prisma.$transaction(async transaction => {
            await transaction.$executeRawUnsafe('SET TRANSACTION READ ONLY');
            for (const model of Prisma.dmmf.datamodel.models) {
                const delegate = model.name[0].toLowerCase() + model.name.slice(1);
                await transaction[delegate].findFirst();
                report.modelsRead++;
            }
        }, { maxWait: 10000, timeout: 60000 });
        const migrationRoot = path.resolve(__dirname, '../../apps/api/prisma/migrations');
        const folders = fs.readdirSync(migrationRoot, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name);
        const history = (await client.query('SELECT migration_name,finished_at,rolled_back_at FROM public._prisma_migrations')).rows;
        const applied = new Set(history.filter(m => m.finished_at && !m.rolled_back_at).map(m => m.migration_name));
        report.appliedMigrations = applied.size;
        report.pendingMigrations = folders.filter(name => !applied.has(name));
        report.missingMigrationSql = folders.filter(name => !fs.existsSync(path.join(migrationRoot, name, 'migration.sql')));
        if (report.pendingMigrations.length) report.errors.push({ check: 'migrations', code: 'PENDING_MIGRATIONS' });
        if (report.missingMigrationSql.length) report.errors.push({ check: 'migrations', code: 'MISSING_MIGRATION_SQL' });
        if (history.some(m => !m.finished_at && !m.rolled_back_at)) report.errors.push({ check: 'migrations', code: 'FAILED_MIGRATION' });
        report.warnings.push('Checks cover the database and ORM; HTTP routes, OAuth, external providers and scheduled jobs require separate integration checks.');
        report.success = report.errors.length === 0;
    } finally {
        await prisma.$disconnect(); await client.end();
    }
    console.log(JSON.stringify(report, null, 2));
    if (!report.success) process.exitCode = 1;
}
main().catch(error => {
    console.error(JSON.stringify({ success: false, code: error.code || error.name }));
    process.exitCode = 1;
});
