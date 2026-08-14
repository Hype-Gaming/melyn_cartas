#!/usr/bin/env bash
# Executado na VPS pelo GitHub Actions via stdin.
set -euo pipefail

APP_DIR="/var/www/mrcartas/melyn-cartas"
PM2_NAME="aplicativo-mrcartas"
PORT_LOCAL=3102
BRANCH="main"
HEALTH_PATH="/api/app-config"

cd "$APP_DIR" || {
  echo "ERRO: diretório $APP_DIR não existe"
  exit 1
}

test -d .git || { echo "ERRO: $APP_DIR não é um repositório git"; exit 1; }
test -f .env || { echo "ERRO: .env de produção não existe"; exit 1; }
test -f package-lock.json || { echo "ERRO: package-lock.json não existe"; exit 1; }

PREV_COMMIT="$(git rev-parse HEAD)"
TARGET_COMMIT="${DEPLOY_COMMIT:-origin/$BRANCH}"

healthcheck() {
  local attempts="${1:-20}"
  local code

  for _ in $(seq 1 "$attempts"); do
    code="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 10 \
      "http://127.0.0.1:$PORT_LOCAL$HEALTH_PATH" 2>/dev/null || true)"
    if [ "$code" = "200" ]; then
      echo "OK: app e Mongo responderam HTTP 200"
      return 0
    fi
    echo "aguardando healthcheck... (HTTP ${code:-000})"
    sleep 2
  done

  return 1
}

rollback() {
  echo "!!! Falha no deploy - rollback para $PREV_COMMIT"
  git reset --hard "$PREV_COMMIT"
  npm ci --no-audit --no-fund
  npm run build
  pm2 startOrReload ecosystem.config.cjs --update-env
  pm2 save

  if ! healthcheck 20; then
    echo "ERRO CRÍTICO: rollback subiu, mas o healthcheck continua falhando"
    pm2 logs "$PM2_NAME" --lines 80 --nostream || true
    return 1
  fi

  echo "Rollback concluído"
}

echo "==> Commit atual: $PREV_COMMIT"
echo "==> Buscando origin/$BRANCH"
git fetch --prune origin

git cat-file -e "$TARGET_COMMIT^{commit}" || {
  echo "ERRO: commit $TARGET_COMMIT não encontrado"
  exit 1
}

git merge-base --is-ancestor "$TARGET_COMMIT" "origin/$BRANCH" || {
  echo "ERRO: commit solicitado não pertence a origin/$BRANCH"
  exit 1
}

echo "==> Publicando commit $TARGET_COMMIT"
git reset --hard "$TARGET_COMMIT"
echo "==> $(git rev-parse --short HEAD) - $(git log -1 --pretty=%s)"

echo "==> Instalando dependências"
npm ci --no-audit --no-fund || { rollback; exit 1; }

echo "==> Gerando build"
npm run build || { rollback; exit 1; }
test -f .output/server/index.mjs || { rollback; exit 1; }

echo "==> Recarregando PM2"
pm2 startOrReload ecosystem.config.cjs --update-env
pm2 save

echo "==> Validando $HEALTH_PATH em localhost:$PORT_LOCAL"
if ! healthcheck 20; then
  pm2 logs "$PM2_NAME" --lines 80 --nostream || true
  rollback
  exit 1
fi

echo "==> Deploy concluído: $(git rev-parse --short HEAD)"
