#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT=${PROJECT_ROOT:-"$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"}
NODE_ENV=${NODE_ENV:-production}
PM2_PROCESS_NAME=${PM2_PROCESS_NAME:-inventarios-backend}
RUN_MIGRATIONS=${RUN_MIGRATIONS:-false}

echo "🚀 Iniciando despliegue backend (Bash)"
BACKEND_PATH="${PROJECT_ROOT}/backend"
if [[ ! -d "$BACKEND_PATH" ]]; then
  echo "❌ No se encontró backend en $BACKEND_PATH" >&2
  exit 1
fi

cd "$BACKEND_PATH"

echo "📦 Instalando dependencias (npm ci --omit=dev)"
npm ci --omit=dev

if [[ "$RUN_MIGRATIONS" == "true" ]]; then
  echo "🛠️ Ejecutando migraciones"
  npx sequelize-cli db:migrate --env "$NODE_ENV"
fi

ENV_FILE="${BACKEND_PATH}/.env.${NODE_ENV}"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "❌ Falta archivo de entorno $ENV_FILE" >&2
  exit 1
fi

export NODE_ENV

if command -v pm2 >/dev/null 2>&1; then
  echo "🔁 Reiniciando proceso con PM2"
  if pm2 describe "$PM2_PROCESS_NAME" >/dev/null 2>&1; then
    pm2 reload "$PM2_PROCESS_NAME" --update-env
  else
    pm2 start npm --name "$PM2_PROCESS_NAME" -- run start
  fi
  pm2 save
else
  echo "⚠️ PM2 no encontrado, ejecutando node src/server.js en background"
  nohup node src/server.js >/var/log/inventarios-backend.log 2>&1 &
fi

echo "✅ Backend desplegado correctamente"
