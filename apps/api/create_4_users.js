const { createClient } = require('@supabase/supabase-js');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
    const users = [
        { email: 'juan@test.com', username: 'juanperez' },
        { email: 'maria@test.com', username: 'mariagomez' },
        { email: 'carlos@test.com', username: 'carloslopez' },
        { email: 'lana@test.com', username: 'lanamartinez' }
    ];

    for (const u of users) {
        try {
            const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
                email: u.email,
                password: 'password123',
                email_confirm: true,
                user_metadata: { username: u.username }
            });

            if (authError && authError.code !== 'email_exists') {
                console.error('Supabase Auth error for', u.email, authError);
                continue;
            }
            console.log(`Created/Ensured Auth user ${u.email}`);

            const { error: dbError } = await supabase.from('User').upsert(
                {
                    email: u.email,
                    username: u.username,
                    emailVerified: true
                },
                { onConflict: 'email' }
            );

            if (dbError) {
                console.error(`Error inserting into User table for ${u.email}:`, dbError);
            } else {
                console.log(`Success DB for ${u.email}`);
            }

        } catch (error) {
            console.error(`Error processing ${u.email}:`, error);
        }
    }
}

main();
