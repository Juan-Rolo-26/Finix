#!/bin/sh
set -eu
umask 077
FINIX_REDIS_PASSWORD=$(cat /run/secrets/redis_password)
case "$FINIX_REDIS_PASSWORD" in *[!a-f0-9]*|'') echo 'Redis requires a generated hexadecimal password' >&2; exit 1;; esac
cat > /tmp/finix-redis.conf <<EOF
bind 0.0.0.0
protected-mode yes
port 6379
requirepass $FINIX_REDIS_PASSWORD
maxmemory 128mb
maxmemory-policy allkeys-lru
save ""
appendonly no
EOF
chown redis:redis /tmp/finix-redis.conf
exec /usr/local/bin/docker-entrypoint.sh redis-server /tmp/finix-redis.conf
