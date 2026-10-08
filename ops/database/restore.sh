#!/bin/sh
# Reads a verified custom-format public application archive from stdin.
# Only use on an empty destination. No --clean, DROP DATABASE or volume removal.
set -eu
export PGPASSWORD="$(cat /run/secrets/bootstrap_password)"
objects="$(psql -X -h 127.0.0.1 -U finix_bootstrap -d finix_prod -At --set=ON_ERROR_STOP=1 --command="
  SELECT (SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public')
       + (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public')
       + (SELECT count(*) FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public');")"
if [ "$objects" != 0 ]; then
  echo 'Restore refused: the public application schema is not empty.' >&2
  exit 1
fi
archive="$(mktemp)"
toc="$(mktemp)"
trap 'rm -f "$archive" "$toc"' EXIT HUP INT TERM
chmod 600 "$archive" "$toc"
cat > "$archive"
# roles.sql already provisions and owns public. Skip its duplicate CREATE SCHEMA
# in the archive's TOC, preserving every table, policy, constraint and data entry.
pg_restore --list "$archive" > "$toc"
sed -i -E '/^[0-9]+;[[:space:]]+[0-9]+[[:space:]]+[0-9]+[[:space:]]+SCHEMA[[:space:]]+-[[:space:]]+public[[:space:]]/s/^/;/' "$toc"
pg_restore -h 127.0.0.1 -U finix_bootstrap -d finix_prod \
  --role=finix_owner --no-owner --no-privileges --single-transaction --exit-on-error \
  --use-list="$toc" "$archive"
