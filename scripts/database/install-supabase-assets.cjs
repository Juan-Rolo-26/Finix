#!/usr/bin/env node
// Install only into a local/staging rehearsal; the provider remains untouched.
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto'), { Client } = require('pg');
const env = require('dotenv').parse(fs.readFileSync(process.argv[2]));
const url = new URL(env.DATABASE_URL), exportRoot = path.resolve(process.argv[3]);
if (!['localhost', '127.0.0.1'].includes(url.hostname) || env.NODE_ENV === 'production' || env.FINIX_LOCAL_MODE !== 'true') throw new Error('Use a loopback staging DB with FINIX_LOCAL_MODE=true, never production');
if (!env.UPLOADS_DIR || !env.FINIX_PRIVATE_STORAGE_DIR || !path.isAbsolute(env.UPLOADS_DIR) || !path.isAbsolute(env.FINIX_PRIVATE_STORAGE_DIR)) throw new Error('Set absolute persistent file paths');
const manifest = JSON.parse(fs.readFileSync(path.join(exportRoot, 'assets.json')));
for (const name of ['auth-users.json', 'buckets.json']) {
  const expected = manifest.files?.[name], file = path.join(exportRoot, name);
  if (!expected || fs.statSync(file).size !== expected.bytes || crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex') !== expected.sha256) throw new Error('Provider metadata checksum mismatch');
}
const publicRoot = path.resolve(env.UPLOADS_DIR), privateRoot = path.resolve(env.FINIX_PRIVATE_STORAGE_DIR);
if (privateRoot === publicRoot || privateRoot.startsWith(publicRoot + path.sep)) throw new Error('Private documents must remain outside uploads');
for (const object of manifest.objects) {
  for (const value of [object.bucket, object.name]) if (!value || value.split('/').some(p => !p || p === '.' || p === '..') || value.includes('\\') || value.includes('\0')) throw new Error('Unsafe object path');
  const source = path.join(exportRoot, 'objects', object.bucket, object.name);
  if (fs.statSync(source).size !== object.bytes || crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex') !== object.sha256) throw new Error('Provider export checksum mismatch');
}
const quote = value => '"' + value.replaceAll('"', '""') + '"';
(async () => {
  const client = new Client({ connectionString: url.toString() }); const changes = [];
  try {
    await client.connect(); await client.query('BEGIN');
    const columns = (await client.query("SELECT table_name,column_name,data_type FROM information_schema.columns WHERE table_schema='public' AND data_type=ANY($1) AND table_name NOT IN ('ExternalIdentity','_prisma_migrations')", [['text', 'character varying', 'json', 'jsonb']])).rows;
    // Verify every file before copying anything; existing different files stop work.
    for (const object of manifest.objects) {
      const source = path.join(exportRoot, 'objects', object.bucket, object.name);
      const destination = path.join(object.public ? path.join(publicRoot, 'supabase') : privateRoot, object.bucket, object.name);
      fs.mkdirSync(path.dirname(destination), { recursive: true, mode: 0o700 });
      const actualParent = fs.realpathSync(path.dirname(destination));
      const allowedRoot = fs.realpathSync(object.public ? publicRoot : privateRoot);
      if (!actualParent.startsWith(allowedRoot + path.sep)) throw new Error('Destination symlink escapes storage root');
      if (fs.existsSync(destination)) {
        if (fs.lstatSync(destination).isSymbolicLink() || crypto.createHash('sha256').update(fs.readFileSync(destination)).digest('hex') !== object.sha256) throw new Error('Existing destination file differs; manual reconciliation required');
      } else fs.copyFileSync(source, destination, fs.constants.COPYFILE_EXCL);
    }
    for (const column of columns) for (const bucket of manifest.buckets.filter(b => b.public)) {
      const before = `https://${manifest.sourceHost}/storage/v1/object/public/${bucket.id}/`, after = `/uploads/supabase/${bucket.id}/`;
      const name = quote(column.column_name), json = ['json', 'jsonb'].includes(column.data_type);
      const result = await client.query(`UPDATE public.${quote(column.table_name)} SET ${name}=replace(${name}::text,$1,$2)${json ? `::${column.data_type}` : ''} WHERE strpos(${name}::text,$1)>0`, [before, after]);
      if (result.rowCount) changes.push({ table: column.table_name, column: column.column_name, rows: result.rowCount });
    }
    await client.query('COMMIT');
    console.log(JSON.stringify({ installedFiles: manifest.objects.length, rewrittenPublicUrlColumns: changes, archivedIdentityMetadataPreserved: true }));
  } catch (error) { await client.query('ROLLBACK').catch(() => {}); throw error; }
  finally { await client.end(); }
})().catch(error => { console.error(error.code || error.name); process.exitCode = 1; });
