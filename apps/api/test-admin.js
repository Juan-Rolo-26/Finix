const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '/home/juampi26/Finix/apps/api/.env' });

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });
  
  const email = 'juanpablorolo2007@gmail.com';
  const hashedPassword = bcrypt.hashSync('Juampi26_08', 10);
  
  try {
     const res = await pool.query('UPDATE "User" SET "password" = \$1, "role" = \$2, "status" = \$3 WHERE "email" = \$4 RETURNING *', [hashedPassword, 'SUPER_ADMIN', 'ACTIVE', email]);
     if(res.rows.length > 0) {
       console.log('User updated:', res.rows[0].email);
     } else {
       console.log('User not found in DB');
     }
  } catch (err) {
     console.error(err);
  } finally {
     await pool.end();
  }
}
main();
