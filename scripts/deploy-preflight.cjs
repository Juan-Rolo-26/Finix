#!/usr/bin/env node
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const { Client } = require('pg');
const config = require('dotenv').parse(fs.readFileSync(process.env.FINIX_API_ENV || 'apps/api/.env'));
function ensure(value, message) { if (!value) throw new Error(message); }
async function main() {
  ensure((fs.statSync(process.env.FINIX_API_ENV || 'apps/api/.env').mode & 0o077) === 0, 'API environment file must be private (chmod 600)');
  for (const key of ['DATABASE_URL', 'DIRECT_URL', 'JWT_SECRET', 'FRONTEND_URL', 'ADMIN_URL', 'ALLOWED_ORIGINS', 'ADMIN_TOTP_ENCRYPTION_KEY', 'REDIS_URL', 'UPLOADS_DIR', 'FINIX_PRIVATE_STORAGE_DIR']) ensure(config[key] && !/REPLACE_WITH|your_|changeme/i.test(config[key]), `Configure ${key}`);
  ensure(config.NODE_ENV === 'production' && config.FINIX_LOCAL_MODE === 'false', 'Production requires NODE_ENV=production and FINIX_LOCAL_MODE=false');
  ensure(config.API_BIND_HOST === '127.0.0.1' && String(config.PORT) === '3010', 'API must bind 127.0.0.1:3010');
  ensure(config.JWT_SECRET.length >= 32, 'JWT secret too short');
  for (const key of ['FINIX_WEB_HEALTH_URL', 'FINIX_ADMIN_HEALTH_URL']) ensure(process.env[key]?.startsWith('https://'), `Set HTTPS ${key}`);
  const database = new URL(config.DATABASE_URL), direct = new URL(config.DIRECT_URL), redis = new URL(config.REDIS_URL);
  for (const url of [database, direct, redis]) ensure(['127.0.0.1', 'localhost'].includes(url.hostname), 'Database and Redis must use loopback');
  ensure(database.hostname === direct.hostname && database.port === direct.port && database.pathname === direct.pathname, 'App and migration database differ');
  ensure(decodeURIComponent(database.username) === 'finix_app' && decodeURIComponent(direct.username) === 'finix_owner', 'Use separate finix_app and finix_owner roles');
  ensure(Number(database.searchParams.get('connection_limit')) > 0 && Number(database.searchParams.get('connection_limit')) <= 10, 'Prisma connection_limit must be 1–10');
  for (const key of ['UPLOADS_DIR', 'FINIX_PRIVATE_STORAGE_DIR']) ensure(path.isAbsolute(config[key]) && fs.existsSync(config[key]), `Missing absolute persistent directory: ${key}`);
  const publicRoot = fs.realpathSync(config.UPLOADS_DIR), privateRoot = fs.realpathSync(config.FINIX_PRIVATE_STORAGE_DIR);
  ensure(privateRoot !== publicRoot && !privateRoot.startsWith(publicRoot + path.sep), 'Private storage must be outside public uploads');
  if (!(config.GOOGLE_CLIENT_ID && config.GOOGLE_CLIENT_SECRET)) ensure(process.env.FINIX_ALLOW_GOOGLE_DISABLED === 'true', 'Google credentials missing; configure them or explicitly set FINIX_ALLOW_GOOGLE_DISABLED=true');
  else ensure(config.GOOGLE_REDIRECT_URI === new URL('/api/auth/google/callback', config.FRONTEND_URL).toString() && config.GOOGLE_REDIRECT_URI.startsWith('https://'), 'Google production callback must match HTTPS frontend /api/auth/google/callback');
  ensure(config.RESEND_API_KEY || (config.SMTP_PASS && !config.SMTP_PASS.includes('REPLACE')), 'Configure Resend before production authentication');
  for (const app of ['web', 'admin']) {
    const filename = process.env[`FINIX_${app.toUpperCase()}_ENV`];
    ensure(filename && fs.existsSync(filename), `Set FINIX_${app.toUpperCase()}_ENV`);
    const env = require('dotenv').parse(fs.readFileSync(filename));
    ensure(!Object.keys(env).some(key => /SUPABASE|SECRET|PASSWORD|SERVICE_ROLE/i.test(key)), `Private or Supabase variable in ${app} build environment`);
    ensure(!env.VITE_API_URL || env.VITE_API_URL === '/api', `${app} must use same-origin /api`);
  }
  if (process.argv[2] === 'environment') { console.log('Production environment: OK (secret values hidden)'); return; }
  const client = new Client({ connectionString: config.DATABASE_URL, connectionTimeoutMillis: 5000 });
  try {
    await client.connect(); await client.query('BEGIN READ ONLY');
    const role = (await client.query('SELECT rolsuper,rolcreatedb,rolcreaterole,rolbypassrls FROM pg_roles WHERE rolname=current_user')).rows[0];
    ensure(role && Object.values(role).every(v => !v), 'Application role has unsafe privileges');
    ensure((await client.query('SELECT to_regclass($1) AS name', ['public.User'])).rows[0].name || (await client.query('SELECT to_regclass($1) AS name', ['public."User"'])).rows[0].name, 'Restore data before deploying; never migrate an empty database');
    const history = (await client.query('SELECT migration_name,finished_at,rolled_back_at FROM public._prisma_migrations')).rows;
    ensure(history.length && history.every(row => row.finished_at || row.rolled_back_at), 'Unfinished migrations require review');
    const applied = new Set(history.filter(row => row.finished_at && !row.rolled_back_at).map(row => row.migration_name));
    const directory = path.resolve(process.argv[3] || 'apps/api/prisma/migrations');
    const reviewFile = path.join(directory, '../../../../ops/database/reviewed-migrations.json');
    const approved = fs.existsSync(reviewFile) ? JSON.parse(fs.readFileSync(reviewFile)) : {};
    const pending = fs.readdirSync(directory, { withFileTypes: true }).filter(e => e.isDirectory() && !applied.has(e.name));
    for (const item of pending) {
      const sql = fs.readFileSync(path.join(directory, item.name, 'migration.sql'), 'utf8');
      const hash = crypto.createHash('sha256').update(sql).digest('hex');
      ensure(approved[item.name] === hash, `Migration requires explicit SQL review and SHA256 approval: ${item.name}`);
      const executable = sql.replace(/--[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
      ensure(!/\b(DROP|TRUNCATE|PRAGMA)\b|\bDELETE\s+FROM\b|\bSET\s+NOT\s+NULL\b/i.test(executable), `Potentially destructive migration blocked: ${item.name}`);
    }
    await client.query('COMMIT');
    console.log(JSON.stringify({ productionDatabase: 'restored', safeApplicationRole: true, pendingReviewedMigrations: pending.map(e => e.name) }));
  } finally { await client.end(); }
}
main().catch(error => { console.error(error.code || error.message.replace(/(?:postgres(?:ql)?|redis):\/\/\S+/g, '[redacted]')); process.exitCode = 1; });
