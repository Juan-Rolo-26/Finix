#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const { Client } = require('pg');
const dotenv = require('dotenv');
const configuration = { ...dotenv.parse(fs.readFileSync(process.argv[2] || 'apps/api/.env')), ...process.env };
let url;
try { url = new URL(configuration.FINIX_AUDIT_URL || configuration.SOURCE_DATABASE_URL || configuration.DIRECT_URL || configuration.DATABASE_URL); }
catch { throw new Error('Invalid database connection configuration'); }
url.search = '';
const local = ['127.0.0.1', 'localhost', '::1'].includes(url.hostname);
const output = process.argv[3] || '/tmp/finix-database-audit.json';
const queries = {
    server: 'SELECT version(),current_user,pg_database_size(current_database())::text AS bytes',
    tables: `SELECT c.relname,n.nspname,c.relrowsecurity,c.relforcerowsecurity,pg_total_relation_size(c.oid)::text AS bytes FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relkind IN ('r','p') AND n.nspname NOT LIKE 'pg_%' AND n.nspname <> 'information_schema' ORDER BY 2,1`,
    columns: `SELECT table_schema,table_name,column_name,data_type,udt_name,is_nullable,column_default,ordinal_position FROM information_schema.columns WHERE table_schema='public' ORDER BY table_name,ordinal_position`,
    constraints: `SELECT n.nspname AS schema,t.relname AS table,c.conname,c.contype,c.convalidated,pg_get_constraintdef(c.oid,true) AS definition FROM pg_constraint c JOIN pg_class t ON t.oid=c.conrelid JOIN pg_namespace n ON n.oid=t.relnamespace WHERE n.nspname='public' ORDER BY 2,3`,
    indexes: `SELECT schemaname,tablename,indexname,indexdef FROM pg_indexes WHERE schemaname='public' ORDER BY tablename,indexname`,
    enums: `SELECT n.nspname,t.typname,e.enumlabel,e.enumsortorder FROM pg_type t JOIN pg_enum e ON t.oid=e.enumtypid JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public' ORDER BY t.typname,e.enumsortorder`,
    sequences: `SELECT schemaname,sequencename,data_type,start_value,min_value,max_value,increment_by,cycle FROM pg_sequences WHERE schemaname='public' ORDER BY sequencename`,
    functions: `SELECT n.nspname,p.proname,pg_get_function_identity_arguments(p.oid) AS arguments,p.prosecdef,pg_get_functiondef(p.oid) AS definition FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.prokind IN ('f','p') ORDER BY 2`,
    triggers: `SELECT n.nspname,t.relname,g.tgname,pg_get_triggerdef(g.oid,true) AS definition FROM pg_trigger g JOIN pg_class t ON t.oid=g.tgrelid JOIN pg_namespace n ON n.oid=t.relnamespace WHERE n.nspname='public' AND NOT g.tgisinternal ORDER BY 2,3`,
    views: `SELECT schemaname,viewname,definition FROM pg_views WHERE schemaname='public'`,
    policies: `SELECT * FROM pg_policies WHERE schemaname='public' ORDER BY tablename,policyname`,
    extensions: 'SELECT extname,extversion FROM pg_extension ORDER BY extname',
    permissions: `SELECT table_schema,table_name,grantee,privilege_type,is_grantable FROM information_schema.table_privileges WHERE table_schema='public' ORDER BY table_name,grantee,privilege_type`,
    statistics: `SELECT schemaname,relname,n_live_tup,n_dead_tup,last_autovacuum,last_autoanalyze,seq_scan,idx_scan FROM pg_stat_user_tables ORDER BY schemaname,relname`,
};
(async () => {
    const client = new Client({ connectionString: url.toString(), ssl: local ? false : { rejectUnauthorized: false }, connectionTimeoutMillis: 15000 });
    const result = { createdAt: new Date().toISOString(), sourceHost: url.hostname, errors: [] };
    try {
        await client.connect(); await client.query('SET default_transaction_read_only=on');
        for (const [section, query] of Object.entries(queries)) {
            try { result[section] = (await client.query(query)).rows; }
            catch (error) { result.errors.push({ section, code: error.code }); }
        }
        fs.mkdirSync(path.dirname(output), { recursive: true, mode: 0o700 });
        fs.writeFileSync(output, JSON.stringify(result, null, 2), { mode: 0o600 });
        console.log(JSON.stringify({ output, sections: Object.fromEntries(Object.entries(result).filter(([,v]) => Array.isArray(v)).map(([k,v]) => [k,v.length])) }));
    } finally { await client.end(); }
})().catch(error => { console.error(error.code || error.name); process.exitCode = 1; });
