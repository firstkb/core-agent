#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CERTS_DIR="${ROOT_DIR}/certs"
PRIVATE_KEY_PATH="${CERTS_DIR}/dev-auth-private.pem"
PUBLIC_KEY_PATH="${CERTS_DIR}/dev-auth-public.pem"

mkdir -p "${CERTS_DIR}"

if [[ -f "${PRIVATE_KEY_PATH}" || -f "${PUBLIC_KEY_PATH}" ]]; then
  echo "Refusing to overwrite existing auth keys in ${CERTS_DIR}. Remove them first if you want to regenerate." >&2
  exit 1
fi

openssl genrsa -out "${PRIVATE_KEY_PATH}" 2048
openssl rsa -in "${PRIVATE_KEY_PATH}" -pubout -out "${PUBLIC_KEY_PATH}"

chmod 600 "${PRIVATE_KEY_PATH}"
chmod 644 "${PUBLIC_KEY_PATH}"

echo "Generated:"
echo "  ${PRIVATE_KEY_PATH}"
echo "  ${PUBLIC_KEY_PATH}"
