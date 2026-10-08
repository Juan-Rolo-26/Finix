#!/usr/bin/env node
const fs = require('node:fs'), path = require('node:path'), { Client } = require('pg');
const env = require('dotenv').parse(fs.readFileSync(process.env.FINIX_API_ENV || 'apps/api/.env'));
const url = new URL(env.DATABASE_URL);
if (!['localhost', '127.0.0.1'].includes(url.hostname)) throw new Error('Loopback database required');
url.username = 'finix_bootstrap'; url.password = fs.readFileSync(path.join(process.env.FINIX_SECRETS_DIR || 'ops/database/.secrets', 'bootstrap.password'), 'utf8').trim(); url.search = '';
(async () => {
  const client = new Client({ connectionString: url.toString() });
  try {
    await client.connect(); await client.query('BEGIN READ ONLY');
    const settings = (await client.query("SELECT name,setting,unit FROM pg_settings WHERE name=ANY($1) ORDER BY name", [['max_connections', 'shared_buffers', 'effective_cache_size', 'work_mem', 'maintenance_work_mem', 'statement_timeout', 'shared_preload_libraries', 'log_min_duration_statement', 'log_statement', 'log_parameter_max_length', 'log_parameter_max_length_on_error']])).rows;
    const connections = (await client.query('SELECT usename,state,count(*)::int AS connections FROM pg_stat_activity WHERE datname=current_database() GROUP BY usename,state ORDER BY usename,state')).rows;
    const indexes = (await client.query("SELECT tablename,indexname,indexdef FROM pg_indexes WHERE schemaname='public' AND tablename=ANY($1) ORDER BY tablename,indexname", [['Post', 'User', 'Portfolio', 'Transaction', 'Follow']])).rows;
    const actor = (await client.query('SELECT id FROM public."User" LIMIT 1')).rows[0]?.id;
    const portfolio = (await client.query('SELECT id FROM public."Portfolio" LIMIT 1')).rows[0]?.id;
    const statements = {
      topTraders: ['SELECT id,username,"avatarUrl","totalReturn","winRate","riskScore","isVerified",title,company FROM public."User" WHERE "isProfilePublic"=true AND "showStats"=true AND "totalReturn" IS NOT NULL ORDER BY "totalReturn" DESC LIMIT 10', []],
      publicFeed: ['SELECT id,"createdAt" FROM public."Post" WHERE visibility=\'VISIBLE\' AND "deletedAt" IS NULL AND "parentId" IS NULL AND "communityId" IS NULL ORDER BY "createdAt" DESC,id DESC LIMIT 21', []],
      portfoliosByUser: ['SELECT id FROM public."Portfolio" WHERE "userId"=$1', [actor]],
      transactionsByPortfolio: ['SELECT id,date FROM public."Transaction" WHERE "portfolioId"=$1 ORDER BY date DESC LIMIT 50', [portfolio]],
    };
    const plans = {};
    for (const [name, [sql, values]] of Object.entries(statements)) plans[name] = (await client.query('EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ' + sql, values)).rows[0]['QUERY PLAN'][0];
    const statistics = (await client.query('SELECT queryid::text,calls::text,rows::text,total_exec_time,mean_exec_time,shared_blks_hit::text,shared_blks_read::text FROM finix_monitor.pg_stat_statements WHERE dbid=(SELECT oid FROM pg_database WHERE datname=current_database()) ORDER BY total_exec_time DESC LIMIT 20')).rows;
    await client.query('COMMIT');
    fs.writeFileSync(process.argv[2] || '/tmp/finix-database-report.json', JSON.stringify({ checkedAt: new Date().toISOString(), settings, connections, indexes, plans, statistics, note: 'Plans and query identifiers stay private. No SQL parameters or full query text exported to public logs.' }, null, 2), { mode: 0o600 });
    console.log(JSON.stringify({ settings: settings.length, connections, indexes: indexes.length, plans: Object.fromEntries(Object.entries(plans).map(([name, plan]) => [name, { milliseconds: plan['Execution Time'], type: plan.Plan['Node Type'] }])), normalizedStatementStats: statistics.length }));
  } finally { await client.end(); }
})().catch(error => { console.error(error.code || error.name); process.exitCode = 1; });
