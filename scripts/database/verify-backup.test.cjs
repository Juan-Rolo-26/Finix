const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const verifier = path.join(__dirname, 'verify-backup.cjs');

function fixture(t, full = true) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'finix-backup-guard-'));
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    const manifest = { fullBackupComplete: full, tables: { User: { rows: '0' } }, files: {} };
    const names = ['application.dump', 'application.toc', 'schema.sql', 'data.sql'];
    if (full) names.push('full-database.dump', 'full-database.toc', 'roles.sql');
    // This tests the artifact-integrity guard, not PostgreSQL archive validity.
    for (const name of names) {
        const content = Buffer.from(`fixture ${name}`);
        fs.writeFileSync(path.join(root, name), content, { mode: 0o600 });
        manifest.files[name] = { bytes: content.length, sha256: crypto.createHash('sha256').update(content).digest('hex') };
    }
    const save = () => fs.writeFileSync(path.join(root, 'manifest.json'), JSON.stringify(manifest));
    save();
    const run = (...args) => spawnSync(process.execPath, [verifier, root, ...args], { encoding: 'utf8' });
    return { root, manifest, save, run };
}

test('intact full artifact set passes the checksum gate', t => {
    const f = fixture(t); const result = f.run();
    assert.equal(result.status, 0, result.stderr);
    assert.equal(JSON.parse(result.stdout).backupRequirementMet, true);
});
test('corrupted artifact blocks progression', t => {
    const f = fixture(t);
    fs.appendFileSync(path.join(f.root, 'application.dump'), 'corruption');
    assert.equal(f.run().status, 1);
});
test('public-only backup cannot satisfy the production requirement', t => {
    const f = fixture(t, false);
    assert.equal(f.run().status, 1);
    const rehearsal = f.run('--application-only');
    assert.equal(rehearsal.status, 0);
    assert.equal(JSON.parse(rehearsal.stdout).backupRequirementMet, false);
});
test('a complete flag cannot hide a missing full database archive', t => {
    const f = fixture(t); delete f.manifest.files['full-database.dump']; f.save();
    assert.equal(f.run().status, 1);
});
test('a manifest cannot read artifacts outside its backup directory', t => {
    const f = fixture(t); f.manifest.files['../outside'] = { bytes: 1, sha256: 'invalid' }; f.save();
    assert.notEqual(f.run().status, 0);
});
