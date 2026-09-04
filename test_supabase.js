const { createClient } = require('@supabase/supabase-js');
const sb = createClient('https://apxfsuxftnovgkvdrwpx.supabase.co', 'sb_publishable_1R8SGghwzgAzT7HjOeGMZw_fINqXZZs');
sb.from('Portfolio').select('*, holdings:Holding(*, asset:Asset(*)), transactions:Transaction(*)').then(r => console.log(JSON.stringify(r.data, null, 2))).catch(e => console.error(e));
