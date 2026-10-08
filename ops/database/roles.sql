-- Run before restoring the public application dump. Re-running rotates passwords
-- to the mounted secret files, so coordinate changes with the API environment.
\getenv owner_password FINIX_OWNER_PASSWORD
\getenv app_password FINIX_APP_PASSWORD
BEGIN;
SELECT 'CREATE ROLE finix_owner' WHERE NOT EXISTS (
  SELECT 1 FROM pg_roles WHERE rolname = 'finix_owner'
) \gexec
SELECT 'CREATE ROLE finix_app' WHERE NOT EXISTS (
  SELECT 1 FROM pg_roles WHERE rolname = 'finix_app'
) \gexec
SELECT format('ALTER ROLE finix_owner WITH LOGIN PASSWORD %L NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS CONNECTION LIMIT 8', :'owner_password') \gexec
SELECT format('ALTER ROLE finix_app WITH LOGIN PASSWORD %L NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS CONNECTION LIMIT 15', :'app_password') \gexec
ALTER DATABASE finix_prod OWNER TO finix_owner;
REVOKE ALL ON DATABASE finix_prod FROM PUBLIC;
GRANT CONNECT ON DATABASE finix_prod TO finix_owner, finix_app;
ALTER SCHEMA public OWNER TO finix_owner;
REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO finix_app;
ALTER ROLE finix_app IN DATABASE finix_prod SET statement_timeout = '30s';
ALTER ROLE finix_app IN DATABASE finix_prod SET idle_in_transaction_session_timeout = '30s';
CREATE SCHEMA IF NOT EXISTS finix_monitor;
REVOKE ALL ON SCHEMA finix_monitor FROM PUBLIC;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA finix_monitor;
COMMIT;
