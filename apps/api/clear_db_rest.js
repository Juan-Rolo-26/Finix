const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing Supabase variables');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
    const targetEmail = 'juanpablorolo2007@gmail.com';
    console.log('Fetching users from auth.users (requires service_role)...');

    try {
        const { data: users, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
        if (error) throw error;

        console.log(`Found ${users.users.length} users in auth.`);
        const usersToDelete = users.users.filter(u => u.email !== targetEmail);

        console.log(`Deleting ${usersToDelete.length} users...`);
        let deleted = 0;
        for (const user of usersToDelete) {
            const { error: delErr } = await supabase.auth.admin.deleteUser(user.id);
            if (delErr) {
                console.log(`Failed to delete user ${user.email} (${user.id}):`, delErr.message);
            } else {
                deleted++;
            }
        }
        console.log(`Successfully deleted ${deleted} users.`);

        // Let's clear standard tables using the rest API.
        // We will just try to delete everything from the tables without where clauses, or where id is not null.
        const tables = [
            'Conversation',
            'Post',
            'Comment',
            'Portfolio',
            'Community',
            'News',
            'User' // Make sure the user record is deleted in public.User if auth deletion didn't cascade
        ];

        for (const table of tables) {
            console.log(`Attempting to clear table ${table}...`);
            const { error: tErr } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
            if (tErr) console.log(`Result for ${table}:`, tErr.message);
            else console.log(`Cleared ${table} (if REST allows it).`);
        }

    } catch (e) {
        console.error('Error:', e.message);
    }
}
main();
