// PostgreSQL execution plans on a disposable synthetic database; no real data.
// Uses an existing, explicitly named task-owned container. Never use production.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process');
const container = process.argv[2], output = process.argv[3];
assert.equal(container, 'finix-performance-postgres', 'Only the disposable performance container is allowed');
assert.ok(output, 'Pass a JSON output path');
const database = 'finix_perf_indexes_' + Date.now();
execFileSync('docker', ['exec', container, 'createdb', '-U', 'postgres', database]);
function sql(text) { return execFileSync('docker', ['exec','-i',container,'psql','-U','postgres','-d',database,'-X','-A','-t','-v','ON_ERROR_STOP=1'], {input:text, encoding:'utf8'}).trim(); }
sql(`
CREATE TABLE "Post" (id text PRIMARY KEY, visibility text, "deletedAt" timestamp, "parentId" text, "communityId" text, "createdAt" timestamp);
CREATE INDEX "Post_createdAt_idx" ON "Post" ("createdAt");
CREATE INDEX "Post_parentId_idx" ON "Post" ("parentId");
CREATE INDEX "Post_communityId_idx" ON "Post" ("communityId");
CREATE TABLE "User" (id text PRIMARY KEY, "isProfilePublic" boolean, "showStats" boolean, "totalReturn" double precision);
CREATE TABLE "Follow" ("followerId" text, "followingId" text, PRIMARY KEY ("followerId","followingId"));
INSERT INTO "Post" SELECT g::text, CASE WHEN g%5=0 THEN 'VISIBLE' ELSE 'HIDDEN' END, CASE WHEN g%11=0 THEN '2026-09-01'::timestamp ELSE NULL END, CASE WHEN g%7=0 THEN 'parent' ELSE NULL END, CASE WHEN g%3=0 THEN 'community' ELSE NULL END, '2026-01-01'::timestamp + g * interval '1 second' FROM generate_series(1,100000) g;
INSERT INTO "User" SELECT g::text, g%3=0, g%4=0, (g*7919%100000)/100.0 FROM generate_series(1,50000) g;
INSERT INTO "Follow" SELECT (g%10000)::text, (g/10000)::text FROM generate_series(1,100000) g;
ANALYZE;
`);
const queries = {
 feed: `SELECT id FROM "Post" WHERE visibility='VISIBLE' AND "deletedAt" IS NULL AND "parentId" IS NULL AND "communityId" IS NULL ORDER BY "createdAt" DESC,id DESC LIMIT 21`,
 rankings: `SELECT id,"totalReturn" FROM "User" WHERE "isProfilePublic"=true AND "showStats"=true AND "totalReturn" IS NOT NULL ORDER BY "totalReturn" DESC LIMIT 10`,
 followers: `SELECT "followerId" FROM "Follow" WHERE "followingId"='5'`
};
function measure() { return Object.fromEntries(Object.entries(queries).map(([name,query]) => [name, Array.from({length:3},()=>JSON.parse(sql('EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) '+query))[0])])); }
const beforeRows = Object.fromEntries(Object.entries(queries).map(([name,q]) => [name, sql(q)]));
const before = measure();
for (const name of ['20261004010000_public_ranking_index', '20261004010100_incoming_follows_index']) {
 const migration = fs.readFileSync(path.resolve(__dirname,'../../apps/api/prisma/migrations',name,'migration.sql'),'utf8');
 sql(migration); sql(migration); // Validate IF NOT EXISTS as well as concurrent DDL.
}
sql('ANALYZE');
const after = measure();
for (const [name,q] of Object.entries(queries)) { if(name==='followers') assert.deepEqual(sql(q).split('\n').sort(), beforeRows[name].split('\n').sort()); else assert.equal(sql(q),beforeRows[name]); }
fs.writeFileSync(output, JSON.stringify({conditions:'Local PostgreSQL16; warm synthetic fixture, 100k posts, 50k users, 100k follows, 3 EXPLAIN ANALYZE runs each; minimal columns matching query predicates, no production data. Migration applied twice without transaction.',before,after},null,2));
console.log(JSON.stringify(Object.fromEntries(Object.keys(queries).map(name=>[name,{before:before[name].map(p=>p['Execution Time']),after:after[name].map(p=>p['Execution Time'])}]))));

execFileSync('docker', ['exec',container,'dropdb','-U','postgres',database]);
