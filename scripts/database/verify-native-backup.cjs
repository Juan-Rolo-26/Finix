#!/usr/bin/env node
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const root = path.resolve(process.argv[2]);
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'backup.json')));
if (manifest.version !== 1 || !manifest.files['database/manifest.json'] || !manifest.files['uploads.tar.gz'] || !manifest.files['private-storage.tar.gz'] || !manifest.files['configuration/api.env']) throw new Error('Incomplete backup manifest');
for (const [name, expected] of Object.entries(manifest.files)) {
  const file = path.resolve(root, name);
  if (!file.startsWith(root + path.sep) || fs.lstatSync(file).isSymbolicLink() || !fs.statSync(file).isFile() || fs.statSync(file).size !== expected.bytes || crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex') !== expected.sha256) throw new Error(`Backup integrity failure: ${name}`);
}
const database = JSON.parse(fs.readFileSync(path.join(root, 'database/manifest.json')));
if (!database.fullBackupComplete) throw new Error('Full database backup incomplete');
console.log(JSON.stringify({ verified: true, artifacts: Object.keys(manifest.files).length, tables: Object.keys(database.tables).length }));
