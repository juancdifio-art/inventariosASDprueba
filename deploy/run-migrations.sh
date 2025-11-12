#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT=${PROJECT_ROOT:-"$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"}
NODE_ENV=${NODE_ENV:-production}

BACKEND_PATH="${PROJECT_ROOT}/backend"
if [[ ! -d "$BACKEND_PATH" ]]; then
  echo "❌ No se encontró backend en $BACKEND_PATH" >&2
  exit 1
fi

cd "$BACKEND_PATH"

if ! command -v npx >/dev/null 2>&1; then
  echo "❌ npx no está disponible en el PATH" >&2
  exit 1
fi

echo "🛠️ Ejecutando migraciones para entorno $NODE_ENV"
NODE_ENV="$NODE_ENV" npx sequelize-cli db:migrate --env "$NODE_ENV"

echo "✅ Migraciones completadas"
