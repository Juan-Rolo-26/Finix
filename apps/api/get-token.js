require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const email = process.env.TEST_EMAIL;
const password = process.env.TEST_PASSWORD;

if (!supabaseUrl || !supabaseKey || !email || !password) {
    throw new Error('Configurá SUPABASE_URL, SUPABASE_ANON_KEY, TEST_EMAIL y TEST_PASSWORD antes de ejecutar este script.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });
    if (error) {
        console.error("Login failed:", error.message);
    } else {
        fs.writeFileSync("token.txt", data.session.access_token);
        console.log("Token saved");
    }
}
run();
