#!/bin/sh
set -eu
umask 077
FINIX_REDIS_PASSWORD=$(cat /run/secrets/redis_password)
case "$FINIX_REDIS_PASSWORD" in *[!a-f0-9]*|'') echo 'Redis requires a generated hexadecimal password' >&2; exit 1;; esac
FINIX_REDIS_CONFIG=$(mktemp /tmp/finix-redis.XXXXXX)
cleanup() {
  rm -f "$FINIX_REDIS_CONFIG"
}
forward_term() {
  kill -TERM "$FINIX_REDIS_PID" 2>/dev/null || true
  wait "$FINIX_REDIS_PID" 2>/dev/null || true
  exit 143
}
trap cleanup EXIT
cat > "$FINIX_REDIS_CONFIG" <<EOF
bind 0.0.0.0
protected-mode yes
port 6379
requirepass $FINIX_REDIS_PASSWORD
maxmemory 128mb
maxmemory-policy allkeys-lru
save ""
appendonly no
EOF
chown redis:redis "$FINIX_REDIS_CONFIG"
/usr/local/bin/docker-entrypoint.sh redis-server "$FINIX_REDIS_CONFIG" &
FINIX_REDIS_PID=$!
trap forward_term TERM INT
wait "$FINIX_REDIS_PID"
