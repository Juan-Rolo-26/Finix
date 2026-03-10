#!/usr/bin/env bash
set -euo pipefail

SECRET_FILE="$HOME/.config/finix/admin_totp_secret"
mkdir -p "$(dirname "$SECRET_FILE")"

read -r -p "Pega tu secreto TOTP (Base32): " SECRET
SECRET="$(echo "$SECRET" | tr -d ' \n\r\t')"

if [[ ! "$SECRET" =~ ^[A-Z2-7]+=*$ ]]; then
  echo "Secreto inválido (debe ser Base32)."
  exit 1
fi

printf '%s' "$SECRET" > "$SECRET_FILE"
chmod 600 "$SECRET_FILE"

echo "Secreto guardado en $SECRET_FILE"
echo "Ahora genera código con: ./ops/scripts/admin-2fa-code.sh"
