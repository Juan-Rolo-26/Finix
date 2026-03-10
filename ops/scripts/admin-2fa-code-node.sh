#!/usr/bin/env bash
set -euo pipefail

SECRET_FILE_DEFAULT="$HOME/.config/finix/admin_totp_secret"
SECRET_FILE="${1:-$SECRET_FILE_DEFAULT}"

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

FINIX_ADMIN_TOTP_SECRET="$SECRET" node - <<'NODE'
const speakeasy = require('speakeasy');
const secret = (process.env.FINIX_ADMIN_TOTP_SECRET || '').trim();
const token = speakeasy.totp({
  secret,
  encoding: 'base32',
  digits: 6,
  step: 30,
});
const secondsLeft = 30 - (Math.floor(Date.now() / 1000) % 30);
console.log(`Código 2FA actual: ${token}`);
console.log(`Válido por ~${secondsLeft}s`);
NODE
