#!/usr/bin/env node
const fs = require('node:fs'), path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '../..'); process.chdir(root); process.umask(0o077);
const backup = path.resolve(process.argv[2] || '');
if (!process.argv.includes('--confirm-empty')) throw new Error('Pass --confirm-empty; restore refuses a populated database');
const config = require('dotenv').parse(fs.readFileSync(process.env.FINIX_API_ENV || 'apps/api/.env'));
const url = new URL(config.DATABASE_URL);
if (!['localhost', '127.0.0.1'].includes(url.hostname)) throw new Error('Native restore requires loopback');
const container = process.env.FINIX_DB_CONTAINER;
if (!container || !/^[a-zA-Z0-9_.-]+$/.test(container)) throw new Error('Set FINIX_DB_CONTAINER explicitly');
function run(command, args, options = {}) {
  const result = spawnSync(command, args, { stdio: 'inherit', ...options });
  if (result.error || result.status !== 0) throw new Error(`${path.basename(command)} failed; no automatic database rollback`);
}
run(process.execPath, ['scripts/database/verify-native-backup.cjs', backup]);
const ports = spawnSync('docker', ['port', container, '5432/tcp'], { encoding: 'utf8' });
if (ports.status !== 0 || !ports.stdout.trim().split('\n').includes(`127.0.0.1:${url.port || '5432'}`)) throw new Error('Restore container/URL mismatch');
const directories = [config.UPLOADS_DIR, config.FINIX_PRIVATE_STORAGE_DIR];
if (directories.some(p => !p || !path.isAbsolute(p))) throw new Error('Set absolute UPLOADS_DIR and FINIX_PRIVATE_STORAGE_DIR for the empty restore target');
for (const directory of directories) if (fs.existsSync(directory) && fs.readdirSync(directory).length) throw new Error('Restore files target is not empty');
const empty = spawnSync('docker', ['exec', container, 'sh', '/opt/finix/psql.sh', '-Atc', "SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public'"], { encoding: 'utf8' });
if (empty.status !== 0 || empty.stdout.trim() !== '0') throw new Error('Restore refused before role changes: database is not empty');
run('docker', ['exec', container, 'sh', '/opt/finix/roles.sh']);
const fd = fs.openSync(path.join(backup, 'database/application.dump'), 'r');
try { run('docker', ['exec', '-i', container, 'sh', '/opt/finix/restore.sh'], { stdio: [fd, 'inherit', 'inherit'] }); }
finally { fs.closeSync(fd); }
// Validate as owner, without letting inherited environment redirect the target.
const childEnv = { ...process.env }; for (const key of ['FINIX_VALIDATE_URL', 'DIRECT_URL', 'DATABASE_URL']) delete childEnv[key];
run(process.execPath, ['scripts/database/validate.cjs', process.env.FINIX_API_ENV || 'apps/api/.env', path.join(backup, 'database/manifest.json'), path.join(backup, `restore-validation-${container}.json`)], { env: childEnv });
run('docker', ['exec', container, 'sh', '/opt/finix/psql.sh', '-f', '/opt/finix/permissions.sql']);
for (let i = 0; i < directories.length; i++) {
  const directory = directories[i]; fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
  run('tar', ['-xzf', path.join(backup, `${i ? 'private-storage' : 'uploads'}.tar.gz`), '-C', directory, '--no-same-owner']);
}
console.log('Restauración y comparación completas. Configuración privada no sobrescrita; usar las claves del respaldo al preparar el destino.');
