#!/usr/bin/env node
// Native PostgreSQL + files + configuration. Never source .env as shell code.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const dotenv = require('dotenv');
const root = path.resolve(__dirname, '../..');
process.chdir(root); process.umask(0o077);
const envFile = path.resolve(process.env.FINIX_API_ENV || 'apps/api/.env');
const config = dotenv.parse(fs.readFileSync(envFile));
const url = new URL(config.DATABASE_URL);
if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) throw new Error('Native backup requires a loopback database');
const container = process.env.FINIX_DB_CONTAINER || 'finix-local-db-1';
if (!/^[a-zA-Z0-9_.-]+$/.test(container)) throw new Error('Invalid container name');
const secrets = path.resolve(process.env.FINIX_SECRETS_DIR || 'ops/database/.secrets');
const output = path.resolve(process.argv[2] || `.local/finix/backups/${new Date().toISOString().replace(/[:.]/g, '-')}`);
if (fs.existsSync(output)) throw new Error('Backup destination already exists');
fs.mkdirSync(output, { recursive: true, mode: 0o700 });
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'finix-backup-'));
function run(command, args, options = {}) {
  const result = spawnSync(command, args, { stdio: 'inherit', ...options });
  if (result.error || result.status !== 0) throw new Error(`${path.basename(command)} failed`);
}
try {
  // The server used by the Docker dump and the client inventory must be identical.
  const ports = spawnSync('docker', ['port', container, '5432/tcp'], { encoding: 'utf8' });
  if (ports.status !== 0 || !ports.stdout.trim().split('\n').includes(`127.0.0.1:${url.port || '5432'}`)) throw new Error('Database container/URL mismatch');
  const bin = path.join(temporary, 'bin'); fs.mkdirSync(bin);
  for (const tool of ['pg_dump', 'pg_dumpall', 'pg_restore']) {
    let wrapper = '#!/bin/sh\nset -eu\n';
    if (tool === 'pg_restore') wrapper += `if [ "$1" = "--list" ]; then exec docker exec -i ${container} pg_restore --list < "$2"; fi\n`;
    wrapper += 'export PGPORT=5432\nexec docker exec -i ' + ['PGHOST', 'PGPORT', 'PGDATABASE', 'PGUSER', 'PGPASSWORD', 'PGSSLMODE', 'PGCONNECT_TIMEOUT'].map(k => `--env ${k}`).join(' ') + ` ${container} ${tool} "$@"\n`;
    fs.writeFileSync(path.join(bin, tool), wrapper, { mode: 0o700 });
  }
  url.username = 'finix_bootstrap'; url.password = fs.readFileSync(path.join(secrets, 'bootstrap.password'), 'utf8').trim();
  const source = path.join(temporary, 'source.env');
  fs.writeFileSync(source, `SOURCE_DATABASE_URL=${JSON.stringify(url.toString())}\nFINIX_PG_BIN=${JSON.stringify(bin)}\n`, { mode: 0o600 });
  const childEnv = { ...process.env };
  for (const key of ['FINIX_BACKUP_SOURCE_URL', 'SOURCE_DATABASE_URL', 'DIRECT_URL', 'DATABASE_URL', 'FINIX_PG_BIN']) delete childEnv[key];
  run(process.execPath, ['scripts/database/backup.cjs', source, path.join(output, 'database')], { env: childEnv });
  run(process.execPath, ['scripts/database/verify-backup.cjs', path.join(output, 'database')]);
  const assets = [
    ['uploads', path.resolve(config.UPLOADS_DIR || 'apps/api/uploads')],
    ['private-storage', path.resolve(config.FINIX_PRIVATE_STORAGE_DIR || '.local/finix/private/storage')],
  ];
  for (const [name, directory] of assets) {
    if (!fs.existsSync(directory)) throw new Error(`Missing required directory: ${name}`);
    run('tar', ['-czf', path.join(output, `${name}.tar.gz`), '-C', directory, '.']);
  }
  const configuration = path.join(output, 'configuration'); fs.mkdirSync(configuration);
  fs.copyFileSync(envFile, path.join(configuration, 'api.env'));
  for (const app of ['web', 'admin']) if (fs.existsSync(`apps/${app}/.env`)) fs.copyFileSync(`apps/${app}/.env`, path.join(configuration, `${app}.env`));
  fs.cpSync(secrets, path.join(configuration, 'database-secrets'), { recursive: true });
  const files = {};
  function hashes(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) hashes(file);
      else if (entry.isFile()) files[path.relative(output, file)] = { bytes: fs.statSync(file).size, sha256: crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex') };
      else throw new Error('Unexpected backup symlink');
    }
  }
  hashes(output);
  fs.writeFileSync(path.join(output, 'backup.json'), JSON.stringify({ version: 1, verifiedAt: new Date().toISOString(), databaseSnapshot: true, filesSnapshot: 'Requires maintenance mode for database/files atomic consistency', files }, null, 2));
  console.log(`Backup completo verificado: ${output}`);
} finally { fs.rmSync(temporary, { recursive: true, force: true }); }
