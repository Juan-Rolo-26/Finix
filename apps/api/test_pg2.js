require('dotenv').config();
const { Client } = require('pg');

async function test() {
  const urls = [
    ['Direct URL', process.env.DIRECT_URL],
    ['Pooler URL', process.env.DATABASE_URL],
  ].filter(([, url]) => url);

  if (!urls.length) {
    throw new Error('Configurá DIRECT_URL o DATABASE_URL antes de ejecutar este script.');
  }

  for (const [label, url] of urls) {
    const hostname = new URL(url).hostname;
    console.log(`Testing ${label}: ${hostname}`);
    const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 5000 });
    try {
      await client.connect();
      console.log(`${label} connected!`);
    } catch (e) {
      console.log(`${label} failed:`, e.message);
    } finally {
      await client.end().catch(() => {});
    }
  }
}
test();
