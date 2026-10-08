#!/bin/sh
# Run inside this Compose container as root. Passwords never appear in argv.
set -eu
export PGPASSWORD="$(cat /run/secrets/bootstrap_password)"
export FINIX_OWNER_PASSWORD="$(cat /run/secrets/owner_password)"
export FINIX_APP_PASSWORD="$(cat /run/secrets/app_password)"
exec psql -X -h 127.0.0.1 -U finix_bootstrap -d finix_prod \
  --set=ON_ERROR_STOP=1 --file=/opt/finix/roles.sql
