require('dotenv').config({ path: process.env.FINIX_ENV_FILE || 'apps/web/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) {
    throw new Error('Faltan VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en el entorno.');
}

const sb = createClient(supabaseUrl, supabaseKey);
sb.from('Portfolio').select('*, holdings:Holding(*, asset:Asset(*)), transactions:Transaction(*)').then(r => console.log(JSON.stringify(r.data, null, 2))).catch(e => console.error(e));
