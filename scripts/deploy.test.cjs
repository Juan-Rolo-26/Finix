const { test } = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const pm2 = path.join(root, '.local/finix/ops-tools/node_modules/.bin/pm2');
function run(command, args, env, cwd = root) {
  const result = spawnSync(command, args, { env: { ...process.env, ...env }, cwd, encoding: 'utf8', timeout: 30000 });
  assert.equal(result.status, 0, `${path.basename(command)} failed: ${result.stderr}`); return result.stdout;
}
test('Real production preflight on local DB; dry run does not create releases, locks or Git refs', () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'finix-deploy-dry-'));
  try {
    const config = require('dotenv').parse(fs.readFileSync(path.join(root, 'apps/api/.env')));
    Object.assign(config, { NODE_ENV: 'production', FINIX_LOCAL_MODE: 'false', API_BIND_HOST: '127.0.0.1', PORT: '3010', FRONTEND_URL: 'https://finixarg.com', GOOGLE_REDIRECT_URI: 'https://finixarg.com/api/auth/google/callback', ADMIN_TOTP_ENCRYPTION_KEY: config.ADMIN_TOTP_ENCRYPTION_KEY || config.JWT_SECRET, RESEND_API_KEY: 're_DryRunFixtureNotUsedExternally', UPLOADS_DIR: path.join(root, 'apps/api/uploads'), FINIX_PRIVATE_STORAGE_DIR: path.join(root, '.local/finix/private/storage') });
    const api = path.join(temp, 'api.env');
    fs.writeFileSync(api, Object.entries(config).map(([k, v]) => `${k}=${JSON.stringify(v)}`).join('\n'), { mode: 0o600 });
    const env = { FINIX_API_ENV: api, FINIX_WEB_ENV: path.join(root, 'apps/web/.env'), FINIX_ADMIN_ENV: path.join(root, 'apps/admin/.env'), FINIX_ALLOW_GOOGLE_DISABLED: 'true', FINIX_WEB_HEALTH_URL: 'https://finixarg.com/release.json', FINIX_ADMIN_HEALTH_URL: 'https://admin.finixarg.com/release.json', FINIX_RELEASE_ROOT: path.join(temp, 'releases'), FINIX_SHARED_ROOT: path.join(temp, 'shared'), FINIX_BACKUP_ROOT: path.join(temp, 'backups'), PATH: path.dirname(pm2) + ':' + process.env.PATH };
    const before = run('git', ['show-ref'], {});
    const result = run('bash', ['deploy.sh', '--dry-run'], env);
    assert.match(result, /DRY RUN/); assert.match(result, /safeApplicationRole/);
    assert.deepEqual(fs.readdirSync(temp), ['api.env']); assert.equal(run('git', ['show-ref'], {}), before);
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
});

test('Real isolated PM2: switch cwd between releases; rollback restores old code; unrelated process stays alive', async () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'finix-pm2-'));
  const env = { PM2_HOME: path.join(temp, 'pm2'), FINIX_LOG_DIR: path.join(temp, 'logs') };
  fs.mkdirSync(env.FINIX_LOG_DIR);
  fs.symlinkSync(path.join(root, 'node_modules'), path.join(temp, 'node_modules'), 'dir');
  const current = path.join(temp, 'current');
  function publish(release) { const next = current + '.next'; fs.symlinkSync(release, next); fs.renameSync(next, current); }
  async function probe(expected) {
    for (let i = 0; i < 60; i++) {
      try { const value = await fetch('http://127.0.0.1:13561', { signal: AbortSignal.timeout(1000) }).then(r => r.json()); if (value.marker === expected) return value; } catch {}
      await new Promise(r => setTimeout(r, 100));
    }
    throw new Error('PM2 did not serve expected release: ' + expected);
  }
  try {
    const idle = path.join(temp, 'unrelated.js'); fs.writeFileSync(idle, 'setInterval(()=>{},10000);');
    run(pm2, ['start', idle, '--name', 'unrelated-fixture'], env);
    const otherPid = run(pm2, ['pid', 'unrelated-fixture'], env).trim();
    for (const marker of ['before', 'after']) {
      const release = path.join(temp, marker); fs.mkdirSync(path.join(release, 'apps/api/dist'), { recursive: true }); fs.mkdirSync(path.join(release, 'ops'));
      fs.copyFileSync(path.join(root, 'ops/ecosystem.config.cjs'), path.join(release, 'ops/ecosystem.config.cjs'));
      fs.writeFileSync(path.join(release, 'apps/api/.env'), `FINIX_CONFIG_LABEL=${marker}\n`, { mode: 0o600 });
      fs.writeFileSync(path.join(release, 'apps/api/dist/main.js'), `require('http').createServer((q,s)=>{s.setHeader('Content-Type','application/json');s.end(JSON.stringify({marker:${JSON.stringify(marker)},cwd:process.cwd(),commit:process.env.FINIX_COMMIT,configured:process.env.FINIX_CONFIG_LABEL}))}).listen(13561,'127.0.0.1');`);
      publish(release);
      run(pm2, ['startOrReload', path.join(release, 'ops/ecosystem.config.cjs'), '--only', 'finix-api', '--env', 'production', '--update-env'], { ...env, FINIX_ROOT: current, FINIX_COMMIT: marker, FINIX_CONFIG_LABEL: 'stale-ambient-value' });
      const response = await probe(marker); assert.equal(response.cwd, path.join(release, 'apps/api')); assert.equal(response.commit, marker); assert.equal(response.configured, marker);
    }
    const release = path.join(temp, 'before');
    publish(release);
    run(pm2, ['startOrReload', path.join(release, 'ops/ecosystem.config.cjs'), '--only', 'finix-api', '--env', 'production', '--update-env'], { ...env, FINIX_ROOT: current, FINIX_COMMIT: 'before' });
    await probe('before'); assert.equal(run(pm2, ['pid', 'unrelated-fixture'], env).trim(), otherPid);
  } finally {
    // This daemon belongs only to the disposable rehearsal, never to production.
    spawnSync(pm2, ['kill'], { env: { ...process.env, ...env }, stdio: 'ignore', timeout: 30000 });
    fs.rmSync(temp, { recursive: true, force: true });
  }
});

test('Bash orchestration: failed build preserves old release; public health failure rolls back; successful deploy publishes all pointers', () => {
  for (const failure of ['build', 'public-health', 'none']) {
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'finix-deploy-flow-'));
    try {
      const source = path.join(temp, 'source'), bin = path.join(temp, 'bin'), releases = path.join(temp, 'releases'), shared = path.join(temp, 'shared');
      for (const dir of [source, bin, releases, shared, path.join(temp, 'web'), path.join(temp, 'admin')]) fs.mkdirSync(dir, { recursive: true });
      for (const name of ['deploy.sh', 'scripts/deploy-preflight.cjs', 'scripts/pm2-path-check.cjs', 'ops/ecosystem.config.cjs', 'ops/database/reviewed-migrations.json', 'apps/api/prisma/migrations']) {
        const destination = path.join(source, name); fs.mkdirSync(path.dirname(destination), { recursive: true }); fs.cpSync(path.join(root, name), destination, { recursive: true });
      }
      fs.mkdirSync(path.join(source, 'apps/web'), { recursive: true }); fs.mkdirSync(path.join(source, 'apps/admin'), { recursive: true });
      for (const app of ['api', 'web', 'admin']) fs.writeFileSync(path.join(source, `apps/${app}/package.json`), '{}');
      fs.writeFileSync(path.join(source, '.gitignore'), 'node_modules\n');
      fs.symlinkSync(path.join(root, 'node_modules'), path.join(source, 'node_modules'), 'dir');
      fs.writeFileSync(path.join(source, 'backup.sh'), '#!/bin/bash\nset -eu\necho backup >> "$FINIX_TEST_EVENTS"\nmkdir -p "$1"\n');
      const before = path.join(releases, 'before');
      fs.mkdirSync(path.join(before, 'ops'), { recursive: true }); fs.copyFileSync(path.join(root, 'ops/ecosystem.config.cjs'), path.join(before, 'ops/ecosystem.config.cjs'));
      for (const app of ['web', 'admin']) fs.mkdirSync(path.join(before, `apps/${app}/dist`), { recursive: true });
      fs.writeFileSync(path.join(before, 'release.json'), JSON.stringify({ commit: 'before' }));
      const current = path.join(temp, 'current'), web = path.join(temp, 'web/current'), admin = path.join(temp, 'admin/current');
      fs.symlinkSync(before, current); fs.symlinkSync(path.join(before, 'apps/web/dist'), web); fs.symlinkSync(path.join(before, 'apps/admin/dist'), admin);
      const config = require('dotenv').parse(fs.readFileSync(path.join(root, 'apps/api/.env')));
      Object.assign(config, { NODE_ENV: 'production', FINIX_LOCAL_MODE: 'false', API_BIND_HOST: '127.0.0.1', PORT: '3010', FRONTEND_URL: 'https://finixarg.com', GOOGLE_REDIRECT_URI: 'https://finixarg.com/api/auth/google/callback', ADMIN_TOTP_ENCRYPTION_KEY: config.ADMIN_TOTP_ENCRYPTION_KEY || config.JWT_SECRET, RESEND_API_KEY: 're_IsolatedFixtureNotUsedExternally', UPLOADS_DIR: path.join(root, 'apps/api/uploads'), FINIX_PRIVATE_STORAGE_DIR: path.join(root, '.local/finix/private/storage') });
      const api = path.join(temp, 'api.env'); fs.writeFileSync(api, Object.entries(config).map(([k, v]) => `${k}=${JSON.stringify(v)}`).join('\n'), { mode: 0o600 });
      const scripts = {
        npm: '#!/bin/bash\nset -eu\nif [[ "$FINIX_TEST_FAILURE" == build && "$*" == "run build -w api" ]]; then exit 72; fi\nif [[ "$1" == ci ]]; then ln -s "$FINIX_TEST_NODE_MODULES" node_modules; fi\nmkdir -p apps/api/dist apps/web/dist apps/admin/dist\n',
        npx: '#!/bin/bash\nset -eu\nif [[ "$*" == *"migrate deploy"* ]]; then echo migrate >> "$FINIX_TEST_EVENTS"; fi\n',
        pm2: '#!/bin/bash\nset -eu\nif [[ "$1" == jlist ]]; then echo "[]"; else [[ "$1" == startOrReload && "$3" == --only && "$4" == finix-api ]] || exit 71; echo restart >> "$FINIX_TEST_EVENTS"; printf \'{"commit":"%s"}\\n\' "$FINIX_COMMIT" > "$FINIX_TEST_STATE"; fi\n',
        curl: '#!/bin/bash\nset -eu\nif [[ "$*" == *https://* && "$FINIX_TEST_FAILURE" == public-health ]]; then exit 22; fi\ncat "$FINIX_TEST_STATE"\n',
      };
      for (const [name, body] of Object.entries(scripts)) fs.writeFileSync(path.join(bin, name), body, { mode: 0o700 });
      run('git', ['init', '-q'], {}, source); run('git', ['add', '.'], {}, source); run('git', ['-c', 'user.name=Local rehearsal', '-c', 'user.email=rehearsal@example.invalid', 'commit', '-qm', 'Disposable deploy fixture'], {}, source);
      const env = { PATH: bin + ':' + process.env.PATH, FINIX_API_ENV: api, FINIX_WEB_ENV: path.join(root, 'apps/web/.env'), FINIX_ADMIN_ENV: path.join(root, 'apps/admin/.env'), FINIX_ALLOW_GOOGLE_DISABLED: 'true', FINIX_WEB_HEALTH_URL: 'https://finixarg.com/release.json', FINIX_ADMIN_HEALTH_URL: 'https://admin.finixarg.com/release.json', FINIX_RELEASE_ROOT: releases, FINIX_SHARED_ROOT: shared, FINIX_API_CURRENT: current, FINIX_WEB_CURRENT: web, FINIX_ADMIN_CURRENT: admin, FINIX_BACKUP_ROOT: path.join(temp, 'backups'), FINIX_TEST_NODE_MODULES: path.join(root, 'node_modules'), FINIX_TEST_FAILURE: failure, FINIX_TEST_EVENTS: path.join(temp, 'events'), FINIX_TEST_STATE: path.join(temp, 'state') };
      const result = spawnSync('bash', ['deploy.sh', '--skip-fetch'], { cwd: source, env: { ...process.env, ...env }, encoding: 'utf8', timeout: 20000 });
      if (failure === 'none') { assert.equal(result.status, 0, result.stdout + result.stderr); assert.notEqual(fs.realpathSync(current), before); assert.equal(fs.realpathSync(web), path.join(fs.realpathSync(current), 'apps/web/dist')); assert.equal(fs.realpathSync(admin), path.join(fs.realpathSync(current), 'apps/admin/dist'));
        assert.equal(fs.statSync(path.join(fs.realpathSync(web), 'release.json')).mode & 0o777, 0o644);
        assert.equal(fs.statSync(path.join(fs.realpathSync(current), 'apps/api/.env')).mode & 0o777, 0o600);
        assert.equal(fs.statSync(fs.realpathSync(current)).mode & 0o111, 0o111);
      }
      else { assert.notEqual(result.status, 0); assert.equal(fs.realpathSync(current), before); assert.equal(fs.realpathSync(web), path.join(before, 'apps/web/dist')); assert.equal(fs.realpathSync(admin), path.join(before, 'apps/admin/dist')); }
      if (failure === 'build') assert.equal(fs.existsSync(env.FINIX_TEST_EVENTS), false);
      else {
        assert.ok(fs.existsSync(env.FINIX_TEST_EVENTS), result.stdout + result.stderr);
        const events = fs.readFileSync(env.FINIX_TEST_EVENTS, 'utf8').trim().split('\n'); assert.deepEqual(events.slice(0, 3), ['backup', 'migrate', 'restart']);
        if (failure === 'public-health') { assert.equal(events.at(-1), 'restart'); assert.equal(JSON.parse(fs.readFileSync(env.FINIX_TEST_STATE)).commit, 'before'); assert.match(result.stdout, /Rollback/); }
      }
    } finally { fs.rmSync(temp, { recursive: true, force: true }); }
  }
});
