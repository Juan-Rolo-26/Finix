-- Run as finix_bootstrap AFTER restore and structural validation.
-- The API is a trusted backend and enforces per-user authorization itself.
-- Never give finix_app credentials to browsers or expose this PostgreSQL port.
BEGIN;
DO $check$
BEGIN
  IF to_regclass('public."User"') IS NULL OR to_regclass('public._prisma_migrations') IS NULL THEN
    RAISE EXCEPTION 'Restore the Finix public application backup before granting runtime access';
  END IF;
END;
$check$;
GRANT USAGE ON SCHEMA public TO finix_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO finix_app;
REVOKE INSERT, UPDATE, DELETE ON TABLE public._prisma_migrations FROM finix_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO finix_app;
ALTER DEFAULT PRIVILEGES FOR ROLE finix_owner IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO finix_app;
ALTER DEFAULT PRIVILEGES FOR ROLE finix_owner IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO finix_app;
DO $policies$
DECLARE t record;
BEGIN
  FOR t IN
    SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p') AND c.relrowsecurity
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = t.relname
        AND policyname = 'finix_backend_access'
    ) THEN
      EXECUTE format('CREATE POLICY finix_backend_access ON public.%I FOR ALL TO finix_app USING (true) WITH CHECK (true)', t.relname);
    END IF;
  END LOOP;
END;
$policies$;
COMMIT;
