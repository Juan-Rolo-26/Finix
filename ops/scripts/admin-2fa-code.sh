#!/usr/bin/env bash
set -euo pipefail

SECRET_FILE_DEFAULT="$HOME/.config/finix/admin_totp_secret"
SECRET_FILE="${1:-$SECRET_FILE_DEFAULT}"

if ! command -v oathtool >/dev/null 2>&1; then
  echo "oathtool no está instalado."
  echo "Instálalo con: sudo apt update && sudo apt install -y oathtool"
  exit 1
fi

SECRET="${FINIX_ADMIN_TOTP_SECRET:-}"

if [[ -z "$SECRET" && -f "$SECRET_FILE" ]]; then
  SECRET="$(tr -d ' \n\r\t' < "$SECRET_FILE")"
fi

if [[ -z "$SECRET" ]]; then
  echo "No encontré secreto TOTP."
  echo "Opciones:"
  echo "1) export FINIX_ADMIN_TOTP_SECRET='TU_SECRETO_BASE32'"
  echo "2) guardar el secreto en: $SECRET_FILE"
  echo "   (recomendado: chmod 600 $SECRET_FILE)"
  exit 1
fi

if [[ ! "$SECRET" =~ ^[A-Z2-7]+=*$ ]]; then
  echo "El secreto no parece Base32 válido."
  exit 1
fi

CODE="$(oathtool --totp -b "$SECRET")"
SECONDS_LEFT=$((30 - ($(date +%s) % 30)))

echo "Código 2FA actual: $CODE"
echo "Válido por ~${SECONDS_LEFT}s"
