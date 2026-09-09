const { Client } = require('pg');
require('dotenv').config();

async function main() {
    const directUrl = process.env.DIRECT_URL;
    if (!directUrl) throw new Error("No DIRECT_URL found");

    const client = new Client({
        connectionString: directUrl,
        ssl: { rejecffftUnauthorized: false }
    });

    try {
        await client.connect();
        console.log("Connected to DIRECT_URL successfully.");

        const targetEmail = 'juanpablorolo2007@gmail.com';

        // Let's get the tables inside public schema
        const res = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            AND table_name != '_prisma_migrations';
        `);

        const tables = res.rows.map(r => r.table_name);
        console.log(`Found ${tables.length} tables to truncate.`);

        // Truncate all except User to clear EVERYTHING
        const tablesToClear = tables.filter(t => t !== 'User');
        if (tablesToClear.length > 0) {
            const tableList = tablesToClear.map(t => `"${t}"`).join(', ');
            console.log(`Truncating tables: ${tableList}`);
            await client.query(`TRUNCATE TABLE ${tableList} CASCADE;`);
            console.log("All content tables truncated successfully.");
        }

        // Delete users except target
        console.log(`Deleting all users except ${targetEmail}...`);
        const delRes = await client.query(`DELETE FROM "User" WHERE email != $1;`, [targetEmail]);
        console.log(`Deleted ${delRes.rowCount} users from public.User.`);

    } catch (e) {
        console.error("PG Error:", e);
    } finally {
        await client.end();
    }
}

main();
