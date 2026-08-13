#!/usr/bin/env bash
#
# vps-deploy.sh — executado NA VPS via "ssh ... 'bash -s' < este-arquivo"
# pelo workflow .github/workflows/deploy.yml.
#
# Faz: git fetch + reset --hard origin/main -> npm ci -> npm run build ->
# pm2 reload -> pm2 save -> healthcheck na porta local.
#
# O .env e o node_modules NÃO são tocados (gitignored / preservados).
# Em caso de falha no build ou no healthcheck, faz rollback para o commit anterior.
# ----------------------------------------------------------------------------
set -euo pipefail

# ===== Config do app (ajuste 1x por repositório) =====
APP_DIR="/var/www/mrcartas/melyn-cartas"
PM2_NAME="aplicativo-mrcartas"
PORT_LOCAL=3102
BRANCH="main"
# =====================================================

echo "==> cd $APP_DIR"
cd "$APP_DIR" || { echo "ERRO: $APP_DIR não existe (faça o setup inicial — veja docs/deploy-vps.md)"; exit 1; }

if [ ! -d .git ]; then
  echo "ERRO: $APP_DIR não é um repositório git. Veja o setup em docs/deploy-vps.md."
  exit 1
fi

# Guarda o commit atual para poder voltar se algo quebrar.
PREV_COMMIT="$(git rev-parse HEAD)"
echo "==> Commit atual (rollback alvo): $PREV_COMMIT"

rollback() {
  echo ""
  echo "!!! Falha no deploy — voltando para $PREV_COMMIT"
  git reset --hard "$PREV_COMMIT"
  if [ -f package-lock.json ]; then npm ci --no-audit --no-fund; else npm install; fi
  npm run build
  pm2 startOrReload ecosystem.config.cjs --update-env
  pm2 save
  echo "!!! Rollback concluído. O app voltou para a versão anterior."
}

echo "==> git fetch + reset --hard origin/$BRANCH"
git fetch --prune origin
git reset --hard "origin/$BRANCH"
echo "==> Novo commit: $(git rev-parse --short HEAD) — $(git log -1 --pretty=%s)"

echo "==> Instalando dependências"
if [ -f package-lock.json ]; then
  npm ci --no-audit --no-fund || { rollback; exit 1; }
else
  npm install || { rollback; exit 1; }
fi

echo "==> Build"
npm run build || { rollback; exit 1; }

echo "==> Reload do PM2"
if [ -f ecosystem.config.cjs ]; then
  pm2 startOrReload ecosystem.config.cjs --update-env
else
  pm2 restart "$PM2_NAME" --update-env
fi
pm2 save

echo "==> Healthcheck em localhost:$PORT_LOCAL"
for _ in $(seq 1 20); do
  code="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 5 "http://localhost:$PORT_LOCAL" 2>/dev/null || echo 000)"
  if [ "$code" != "000" ]; then
    echo "OK: localhost:$PORT_LOCAL respondeu HTTP $code"
    echo "==> Deploy concluído: $(git rev-parse --short HEAD)"
    exit 0
  fi
  sleep 2
done

echo "ERRO: app não respondeu em localhost:$PORT_LOCAL após 40s"
pm2 logs "$PM2_NAME" --lines 50 --nostream || true
rollback
exit 1
