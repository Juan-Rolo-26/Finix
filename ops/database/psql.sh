#!/bin/sh
set -eu
export PGPASSWORD="$(cat /run/secrets/bootstrap_password)"
exec psql -X -h 127.0.0.1 -U finix_bootstrap -d finix_prod --set=ON_ERROR_STOP=1 "$@"
