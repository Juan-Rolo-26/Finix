const { Client } = require('pg');

async function test() {
  const url = 'postgresql://postgres:Juampi26_08@db.apxfsuxftnovgkvdrwpx.supabase.co:5432/postgres';
  console.log('Testing direct URL:', url);
  const client1 = new Client({ connectionString: url, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 5000 });
  try {
    await client1.connect();
    console.log('Direct URL connected!');
    await client1.end();
  } catch(e) {
    console.log('Direct URL failed:', e.message);
  }

  const url2 = 'postgresql://postgres.apxfsuxftnovgkvdrwpx:Juampi26_08@aws-0-us-east-2.pooler.supabase.com:6543/postgres';
  console.log('Testing Pooler URL:', url2);
  const client2 = new Client({ connectionString: url2, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 5000 });
  try {
    await client2.connect();
    console.log('Pooler URL connected!');
    await client2.end();
  } catch(e) {
    console.log('Pooler URL failed:', e.message);
  }
}
test();
