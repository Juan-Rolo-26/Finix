// Stable public-schema definitions. OIDs, ownership and ACLs differ after restore.
const queries = {
    columns: `SELECT c.relname AS table_name,a.attname AS column_name,
        format_type(a.atttypid,a.atttypmod) AS type,a.attnotnull AS not_null,
        pg_get_expr(d.adbin,d.adrelid) AS default_expression,a.attidentity AS identity,a.attgenerated AS generated
        FROM pg_attribute a JOIN pg_class c ON c.oid=a.attrelid JOIN pg_namespace n ON n.oid=c.relnamespace
        LEFT JOIN pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum
        WHERE n.nspname='public' AND c.relkind IN ('r','p') AND a.attnum>0 AND NOT a.attisdropped
        ORDER BY c.relname,a.attnum`,
    constraints: `SELECT t.relname AS table_name,c.conname AS name,c.contype AS type,c.convalidated AS validated,
        pg_get_constraintdef(c.oid,true) AS definition FROM pg_constraint c
        JOIN pg_class t ON t.oid=c.conrelid JOIN pg_namespace n ON n.oid=t.relnamespace
        WHERE n.nspname='public' AND c.contype<>'n' ORDER BY t.relname,c.conname`,
    indexes: `SELECT tablename AS table_name,indexname AS name,indexdef AS definition
        FROM pg_indexes WHERE schemaname='public' ORDER BY tablename,indexname`,
    enums: `SELECT t.typname AS name,e.enumlabel AS label,e.enumsortorder AS position
        FROM pg_type t JOIN pg_enum e ON t.oid=e.enumtypid JOIN pg_namespace n ON n.oid=t.typnamespace
        WHERE n.nspname='public' ORDER BY t.typname,e.enumsortorder`,
    sequences: `SELECT sequencename AS name,data_type,start_value,min_value,max_value,increment_by,cycle,last_value
        FROM pg_sequences WHERE schemaname='public' ORDER BY sequencename`,
    triggers: `SELECT t.relname AS table_name,g.tgname AS name,pg_get_triggerdef(g.oid,true) AS definition
        FROM pg_trigger g JOIN pg_class t ON t.oid=g.tgrelid JOIN pg_namespace n ON n.oid=t.relnamespace
        WHERE n.nspname='public' AND NOT g.tgisinternal ORDER BY t.relname,g.tgname`,
    views: `SELECT viewname AS name,definition FROM pg_views WHERE schemaname='public' ORDER BY viewname`,
    functions: `SELECT p.proname AS name,pg_get_function_identity_arguments(p.oid) AS arguments,
        p.prosecdef AS security_definer,pg_get_functiondef(p.oid) AS definition
        FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
        WHERE n.nspname='public' AND p.prokind IN ('f','p') ORDER BY p.proname,arguments`,
    policies: `SELECT tablename AS table_name,policyname AS name,permissive,roles,cmd,qual,with_check
        FROM pg_policies WHERE schemaname='public' ORDER BY tablename,policyname`,
    rowSecurity: `SELECT tablename AS table_name,rowsecurity AS enabled FROM pg_tables
        WHERE schemaname='public' ORDER BY tablename`,
};
async function readCatalog(client) {
    const result = {};
    for (const [name, sql] of Object.entries(queries)) result[name] = (await client.query(sql)).rows;
    return result;
}
module.exports = { readCatalog };
