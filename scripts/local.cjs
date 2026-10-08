#!/usr/bin/env node
const fs = require('node:fs');
const { spawnSync, spawn } = require('node:child_process');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
process.chdir(root);
const config = require('dotenv').parse(fs.readFileSync('apps/api/.env'));
const url = new URL(config.DATABASE_URL);
const redisSecret = 'ops/database/.secrets/redis.password';
if (!fs.existsSync(redisSecret)) fs.writeFileSync(redisSecret, require('node:crypto').randomBytes(32).toString('hex'), { mode: 0o600 });
if (config.FINIX_LOCAL_MODE !== 'true' || config.NODE_ENV === 'production' || !['localhost', '127.0.0.1', '::1'].includes(url.hostname) || url.port !== '15432') {
    throw new Error('Use the verified Finix local configuration on port 15432');
}
const docker = spawnSync('docker', ['compose', '-p', 'finix-local', '-f', 'ops/database/compose.yml', '-f', 'ops/database/local.compose.yml', 'up', '-d', '--wait'], { stdio: 'inherit' });
if (docker.status !== 0) process.exit(docker.status || 1);
const shared = spawnSync('npm', ['run', 'build', '-w', '@finix/shared'], { stdio: 'inherit' });
if (shared.status !== 0) process.exit(shared.status || 1);
console.log('Web: http://localhost:5173 | Admin: http://localhost:5147 | Emails: http://localhost:8025');
const grouped = process.platform !== 'win32';
const app = spawn('npm', ['run', 'dev'], { stdio: 'inherit', detached: grouped });
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => {
    try {
        if (grouped) process.kill(-app.pid, signal);
        else app.kill(signal);
    } catch (error) { if (error.code !== 'ESRCH') throw error; }
});
app.on('exit', code => { process.exitCode = code || 0; });
