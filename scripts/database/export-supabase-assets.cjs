#!/usr/bin/env node
// Read-only provider API requests; exports do not replace a full managed DB dump.
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
process.umask(0o077);
const config = require('dotenv').parse(fs.readFileSync(process.argv[2]));
const source = new URL(config.SUPABASE_URL), key = config.SUPABASE_SERVICE_ROLE_KEY;
if (source.protocol !== 'https:' || source.username || source.password || !key) throw new Error('HTTPS Supabase URL and service role required');
const output = path.resolve(process.argv[3] || '');
if (!process.argv[3] || fs.existsSync(output)) throw new Error('Pass a new private output directory');
fs.mkdirSync(output, { recursive: true, mode: 0o700 });
async function request(route, body) {
  const response = await fetch(new URL(route, source), { method: body ? 'POST' : 'GET', redirect: 'error', signal: AbortSignal.timeout(60000), headers: { apikey: key, Authorization: `Bearer ${key}`, ...(body ? { 'Content-Type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  if (!response.ok) throw new Error(`Provider export failed (${response.status}); no secret response logged`);
  return response;
}
const safePath = value => {
  if (!value || value.split('/').some(p => !p || p === '.' || p === '..') || value.includes('\\') || value.includes('\0')) throw new Error('Unsafe provider object path');
  return value;
};
(async () => {
  const users = [], buckets = await (await request('/storage/v1/bucket')).json(), objects = [];
  for (let page = 1; ; page++) {
    const data = await (await request(`/auth/v1/admin/users?page=${page}&per_page=1000`)).json();
    if (!Array.isArray(data.users)) throw new Error('Invalid Auth export'); users.push(...data.users);
    if (data.users.length < 1000) break;
    if (page > 10000) throw new Error('Unexpected pagination');
  }
  fs.writeFileSync(path.join(output, 'auth-users.json'), JSON.stringify(users, null, 2));
  fs.writeFileSync(path.join(output, 'buckets.json'), JSON.stringify(buckets, null, 2));
  for (const bucket of buckets) {
    safePath(bucket.id); const prefixes = [''];
    for (let cursor = 0; cursor < prefixes.length; cursor++) {
      const prefix = prefixes[cursor];
      for (let offset = 0; ; offset += 1000) {
        const entries = await (await request(`/storage/v1/object/list/${encodeURIComponent(bucket.id)}`, { prefix, limit: 1000, offset, sortBy: { column: 'name', order: 'asc' } })).json();
        if (!Array.isArray(entries)) throw new Error('Invalid Storage export');
        for (const entry of entries) {
          const name = safePath(prefix ? `${prefix}/${entry.name}` : entry.name);
          if (!entry.id && !entry.metadata) { if (prefixes.includes(name)) throw new Error('Repeated provider prefix'); prefixes.push(name); continue; }
          const encoded = name.split('/').map(encodeURIComponent).join('/');
          const response = await request(`/storage/v1/object/${bucket.public ? 'public' : 'authenticated'}/${encodeURIComponent(bucket.id)}/${encoded}`);
          const contents = Buffer.from(await response.arrayBuffer());
          const filename = path.join(output, 'objects', bucket.id, name); fs.mkdirSync(path.dirname(filename), { recursive: true }); fs.writeFileSync(filename, contents, { flag: 'wx' });
          objects.push({ bucket: bucket.id, name, public: bucket.public, bytes: contents.length, sha256: crypto.createHash('sha256').update(contents).digest('hex'), metadata: entry });
        }
        if (entries.length < 1000) break;
      }
    }
  }
  const files = {};
  for (const name of ['auth-users.json', 'buckets.json']) files[name] = { bytes: fs.statSync(path.join(output, name)).size, sha256: crypto.createHash('sha256').update(fs.readFileSync(path.join(output, name))).digest('hex') };
  const manifest = { version: 1, exportedAt: new Date().toISOString(), sourceHost: source.hostname, users: users.length, buckets, objects, files, fullManagedDatabaseBackup: false };
  fs.writeFileSync(path.join(output, 'assets.json'), JSON.stringify(manifest, null, 2));
  console.log(JSON.stringify({ users: users.length, buckets: buckets.length, objects: objects.length, verifiedDownloadHashes: true, fullManagedDatabaseBackup: false }));
})().catch(error => { console.error(error.code || error.message.replace(/(?:postgres(?:ql)?|https?):\/\/\S+/g, '[redacted]')); process.exitCode = 1; });
