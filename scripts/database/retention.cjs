#!/usr/bin/env node
// Keep one verified backup per day/week/month; never remove unknown folders.
const fs = require('node:fs'), path = require('node:path');
const root = path.resolve(process.argv[2] || '');
if (root === '/' || !fs.existsSync(root)) throw new Error('Explicit backup root required');
const items = [];
for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
  if (!entry.isDirectory() || entry.isSymbolicLink()) continue;
  const directory = path.join(root, entry.name), file = path.join(directory, 'backup.json');
  if (!fs.existsSync(file)) continue;
  try {
    const manifest = JSON.parse(fs.readFileSync(file)), date = new Date(manifest.verifiedAt);
    if (manifest.version === 1 && Number.isFinite(date.getTime()) && manifest.files?.['database/manifest.json']) items.push({ directory, date });
  } catch { /* Unknown or unfinished backup remains untouched. */ }
}
items.sort((a, b) => b.date - a.date);
const keep = new Set();
for (const [limit, bucket] of [
  [7, d => d.toISOString().slice(0, 10)],
  [4, d => { const date = new Date(d); date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 6) % 7); return date.toISOString().slice(0, 10); }],
  [3, d => d.toISOString().slice(0, 7)],
]) {
  const seen = new Set();
  for (const item of items) { const key = bucket(item.date); if (!seen.has(key) && seen.size < limit) { seen.add(key); keep.add(item.directory); } }
}
const remove = items.filter(item => !keep.has(item.directory));
console.log(JSON.stringify({ dryRun: !process.argv.includes('--apply'), keep: [...keep], remove: remove.map(i => i.directory) }));
if (process.argv.includes('--apply')) {
  // Verify the newest retained backup before deleting anything.
  if (!items.length) throw new Error('No verified backup to retain');
  const result = require('node:child_process').spawnSync(process.execPath, [path.join(__dirname, 'verify-native-backup.cjs'), items[0].directory], { stdio: 'inherit' });
  if (result.status !== 0) throw new Error('Newest backup failed integrity verification; retention aborted');
  for (const item of remove) fs.rmSync(item.directory, { recursive: true });
}
