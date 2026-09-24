#!/usr/bin/env bash
# Compatibility entrypoint.
# The production deployment lives at the repository root. Keeping this wrapper
# prevents older VPS instructions from publishing to a directory Nginx does
# not serve.
set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
REPO_DIR="$(cd -- "$SCRIPT_DIR/../.." && pwd -P)"

exec bash "$REPO_DIR/deploy.sh" "$@"
