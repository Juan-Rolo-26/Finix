const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const compiled = path.join(root, 'apps/api/dist/config/runtime-environment.js');
function run({ mode = 'production', file = true } = {}) {
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'finix-runtime-env-'));
    try {
        const api = path.join(temp, 'release/apps/api'), target = path.join(api, 'dist/config/runtime-environment.js');
        fs.mkdirSync(path.dirname(target), { recursive: true });fs.copyFileSync(compiled, target);
        fs.symlinkSync(path.join(root, 'node_modules'), path.join(temp, 'node_modules'), 'dir');
        if (file) fs.writeFileSync(path.join(api, '.env'), 'MP_ACCESS_TOKEN=real-release-fixture\nFINIX_APPROVED_EMAILS_ENABLED=true\nSTRIPE_CHECKOUT_ENABLED=false\n', { mode: 0o600 });
        const result = spawnSync(process.execPath, ['-e', `require(${JSON.stringify(target)}); console.log(JSON.stringify({token:process.env.MP_ACCESS_TOKEN,email:process.env.FINIX_APPROVED_EMAILS_ENABLED,stripe:process.env.STRIPE_CHECKOUT_ENABLED}))`], {
            cwd: temp, encoding: 'utf8', env: { ...process.env, NODE_ENV: mode, MP_ACCESS_TOKEN: 'stale-saved-fixture', FINIX_APPROVED_EMAILS_ENABLED: 'false', STRIPE_CHECKOUT_ENABLED: 'true' },
        });
        assert.equal(result.status, 0, result.stderr);
        return { value: JSON.parse(result.stdout.trim()), output: result.stdout };
    } finally { fs.rmSync(temp, { recursive: true, force: true }); }
}
test('production restart uses release credentials and mail switches rather than stale PM2 values', () => {
    assert.deepEqual(run().value, { token:'real-release-fixture',email:'true',stripe:'false' });
});
test('development keeps intentionally supplied process settings', () => {
    assert.deepEqual(run({mode:'development'}).value, {token:'stale-saved-fixture',email:'false',stripe:'true'});
});
test('environment-only hosts continue working without a local env file', () => {
    assert.equal(run({file:false}).value.token,'stale-saved-fixture');
});
