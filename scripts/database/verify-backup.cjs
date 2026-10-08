#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(process.argv[2]);
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json')));
let success = true;
for (const name of ['application.dump', 'application.toc', 'schema.sql', 'data.sql']) {
    if (!manifest.files?.[name]?.bytes) { console.error(`Missing required artifact: ${name}`); success = false; }
}
if (manifest.fullBackupComplete) {
    for (const name of ['full-database.dump', 'full-database.toc', 'roles.sql']) {
        if (!manifest.files?.[name]?.bytes) { console.error(`Missing full-backup artifact: ${name}`); success = false; }
    }
}
for (const [name, expected] of Object.entries(manifest.files)) {
    const filename = path.resolve(root, name);
    if (path.dirname(filename) !== root) throw new Error('Invalid artifact path in manifest');
    if (!fs.existsSync(filename) || fs.statSync(filename).size !== expected.bytes || crypto.createHash('sha256').update(fs.readFileSync(filename)).digest('hex') !== expected.sha256) {
        console.error(`Invalid artifact: ${name}`); success = false;
    }
}
if (!manifest.fullBackupComplete && !process.argv.includes('--application-only')) {
    console.error('Full backup incomplete. Production cutover is blocked.'); success = false;
}
console.log(JSON.stringify({ success, fullBackupComplete: manifest.fullBackupComplete, artifacts: Object.keys(manifest.files).length, tables: Object.keys(manifest.tables).length, backupRequirementMet: success && manifest.fullBackupComplete, note: 'A successful restore validation is additionally required before cutover.' }));
process.exitCode = success ? 0 : 1;
