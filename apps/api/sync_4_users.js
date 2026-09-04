const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY); // Or use anon key if needed, service_role works too

async function main() {
    const users = [
        { email: 'juan@test.com', password: 'password123' },
        { email: 'maria@test.com', password: 'password123' },
        { email: 'carlos@test.com', password: 'password123' },
        { email: 'lana@test.com', password: 'password123' }
    ];

    for (const u of users) {
        try {
            // Sign in to get JWT
            const { data, error } = await supabase.auth.signInWithPassword({
                email: u.email,
                password: u.password,
            });

            if (error) {
                console.error(`Login failed for ${u.email}:`, error);
                continue;
            }

            const token = data.session.access_token;
            console.log(`Successfully acquired JWT for ${u.email}`);

            // Hit the backend to trigger auto-sync
            const res = await fetch('http://localhost:3010/users/me', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                const profile = await res.json();
                console.log(`Backend auto-sync success for ${u.email}:`, profile.username);
            } else {
                const text = await res.text();
                console.error(`Backend auto-sync failed for ${u.email}. Status: ${res.status}. Error: ${text}`);
            }

        } catch (error) {
            console.error(`Error processing ${u.email}:`, error);
        }
    }
}

main();
