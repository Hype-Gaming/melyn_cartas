# Deploy na VPS — `app.mrcartas.com`

Tutorial completo: da VPS crua até o deploy automático a cada push na `main`.

Se a VPS já roda os outros apps da Hype Gaming (rainha, irmandade, baccarat…),
a stack base já está instalada — **pule direto para o [passo 2](#2-preparar-a-pasta-do-app)**.

---

## Dados desta aplicação

| Item | Valor |
|---|---|
| Domínio | `app.mrcartas.com` |
| Porta local (Nitro) | `3102` |
| Processo PM2 | `aplicativo-mrcartas` |
| Pasta na VPS | `/var/www/mrcartas/melyn-cartas` |
| Repositório | `https://github.com/Hype-Gaming/melyn_cartas.git` |
| Banco Mongo | `melyn_cartas` |

> Esses valores aparecem em quatro lugares e precisam bater entre si:
> [`.github/scripts/vps-deploy.sh`](../.github/scripts/vps-deploy.sh) (bloco `Config do app`),
> [`ecosystem.config.cjs`](../ecosystem.config.cjs), [`package.json`](../package.json) (script `start`)
> e o `server` do NGINX. A porta `3102` foi escolhida por estar livre — as ocupadas
> estão na tabela do [DEPLOY-README.md](../DEPLOY-README.md).

---

## 1. Preparar a VPS (só se for uma VPS nova)

```bash
ssh root@SEU_IP_DA_VPS

# Node 22 (o build do Nuxt 4 exige Node 20+)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs git nginx

# PM2 como gerenciador de processos, iniciando junto com a máquina
sudo npm install -g pm2
pm2 startup systemd            # rode o comando que ele imprimir

# Certbot para o HTTPS
sudo apt-get install -y certbot python3-certbot-nginx
```

---

## 2. Preparar a pasta do app

```bash
sudo mkdir -p /var/www/mrcartas
sudo chown -R "$USER:$USER" /var/www/mrcartas
cd /var/www/mrcartas

git clone https://github.com/Hype-Gaming/melyn_cartas.git melyn-cartas
cd melyn-cartas
```

> O deploy automático roda `git reset --hard origin/main`. **Nunca edite arquivos
> versionados direto na VPS** — eles serão sobrescritos no próximo push.
> O `.env` é gitignored, então sobrevive aos deploys.

---

## 3. Criar o `.env` de produção

```bash
cp .env.example .env
nano .env
```

Preencha:

```bash
PORT=3102
NODE_ENV=production

# Quem pode entrar em /admin (separados por vírgula) e a senha do painel.
ADMIN_EMAILS=seu-email@dominio.com
ADMIN_PASSWORD=<senha-forte-e-unica>

# (Opcional) Segredo para assinar a sessão do admin.
# Se ausente, usa ADMIN_PASSWORD — trocar a senha derruba as sessões.
ADMIN_SESSION_SECRET=<string-longa-e-aleatoria>

# Webhook da Lastlink. Sem ele o endpoint rejeita tudo com 401.
LASTLINK_WEBHOOK_SECRET=<token-secreto>

# Mongo. A senha vai URL-encoded (@ vira %40, ! vira %21).
MONGODB_URI=mongodb://melyn_user:<SENHA>@104.131.7.171:27017/melyn_cartas?authSource=melyn_cartas
MONGO_DB_NAME=melyn_cartas

# Notificações push (Web Push / VAPID).
VAPID_PUBLIC_KEY=<chave-publica>
VAPID_PRIVATE_KEY=<chave-privada>
VAPID_SUBJECT=mailto:contato@mrcartas.com
```

```bash
chmod 600 .env      # o arquivo tem segredos — só o dono lê
```

> **`MONGO_DB_NAME` tem prioridade sobre o nome de banco que estiver na URI** —
> `server/utils/mongodb.ts` usa `client.db(DB_NAME)`. Se os dois divergirem, vale o
> `MONGO_DB_NAME`.

### Criar o usuário do Mongo (se ainda não existir)

```bash
mongosh "mongodb://admin:<SENHA_ADMIN>@104.131.7.171:27017/admin?authSource=admin"
```

```javascript
use melyn_cartas
db.createUser({
  user: "melyn_user",
  pwd: "<SENHA>",
  roles: [ { role: "readWrite", db: "melyn_cartas" } ]
})
```

No `mongosh` a senha vai **sem** URL-encode; no `.env` vai **com**.

### Mídia do painel

As imagens enviadas pelo painel `/admin/visual` (logo, favicon e banners) ficam no
próprio MongoDB, no bucket GridFS `media` — não em disco. Isso é proposital: o
deploy roda `git reset --hard` + `npm run build`, o que apagaria qualquer arquivo
escrito em `public/` em tempo de execução.

Duas consequências operacionais:

- **O backup do banco já inclui as imagens.** Não existe pasta de uploads separada
  para copiar.
- **O banco cresce com as mídias.** O painel tem o botão "Limpar mídias não usadas"
  na aba Mídia, e a limpeza também roda automaticamente após cada save da
  configuração. Ela só remove arquivos com mais de uma hora que não estejam
  referenciados por nenhum campo.

---

## 4. Primeiro build e subida no PM2

```bash
cd /var/www/mrcartas/melyn-cartas
npm ci
npm run build

pm2 start ecosystem.config.cjs --update-env
pm2 save

# deve responder (200, 302 — qualquer coisa menos conexão recusada)
curl -I http://localhost:3102
```

Se não responder:

```bash
pm2 logs aplicativo-mrcartas --lines 50
ss -ltnp | grep :3102          # a porta está ocupada por outro processo?
```

---

## 5. Apontar o DNS

No painel do domínio `mrcartas.com`, crie um registro:

| Tipo | Nome | Valor |
|---|---|---|
| `A` | `app` | `<IP_DA_VPS>` |

Confirme a propagação antes de emitir o certificado — o Certbot falha se o
domínio ainda não resolver para a VPS:

```bash
dig +short app.mrcartas.com
```

---

## 6. NGINX + HTTPS

```bash
sudo nano /etc/nginx/sites-available/app.mrcartas.com
```

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name app.mrcartas.com;

    # Tudo vai para o Nitro, inclusive /api/* — as rotas de API vivem no Nuxt.
    location / {
        proxy_pass http://127.0.0.1:3102;
        proxy_http_version 1.1;

        proxy_set_header Upgrade           $http_upgrade;
        proxy_set_header Connection        'upgrade';
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        proxy_read_timeout 300s;
    }

    client_max_body_size 10M;
}
```

```bash
sudo ln -s /etc/nginx/sites-available/app.mrcartas.com /etc/nginx/sites-enabled/
sudo nginx -t                 # tem que dizer "syntax is ok"
sudo systemctl reload nginx

# emite o certificado e reescreve o server block para 443 + redirect
sudo certbot --nginx -d app.mrcartas.com

curl -I https://app.mrcartas.com
```

A renovação é automática (timer do systemd). Para conferir:
`sudo certbot renew --dry-run`.

---

## 7. Ligar o deploy automático

### 7.1 Chave SSH exclusiva do deploy

**Na VPS**, como o usuário que é dono de `/var/www/mrcartas`:

```bash
ssh-keygen -t ed25519 -C "github-actions-mrcartas" -f ~/.ssh/id_mrcartas_deploy -N ""
cat ~/.ssh/id_mrcartas_deploy.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

cat ~/.ssh/id_mrcartas_deploy      # copie TUDO, incluindo as linhas BEGIN/END
```

### 7.2 Secrets no GitHub

Em `Settings → Secrets and variables → Actions → New repository secret`:

| Secret | Valor |
|---|---|
| `VPS_SSH_KEY` | a **chave privada** inteira (`id_mrcartas_deploy`) |
| `VPS_HOST` | IP ou hostname da VPS |
| `VPS_USER` | usuário dono de `/var/www/mrcartas` |
| `VPS_PORT` | porta SSH (opcional — o workflow assume `22`) |

### 7.3 Testar

```bash
# do seu computador, simulando o que o Actions faz
ssh -i ~/.ssh/id_mrcartas_deploy VPS_USER@VPS_HOST 'bash -s' \
  < .github/scripts/vps-deploy.sh
```

Depois, no GitHub: aba **Actions → CI/CD — app.mrcartas.com → Run workflow**.

---

## Como a pipeline funciona

[`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) tem dois jobs:

```
push/PR na main
      │
      ├─ job "build"  ── npm ci → npm run build → confere .output/server/index.mjs
      │                  (roda em PR também; é o portão de qualidade)
      │
      └─ job "deploy" ── só em push/manual, e só se o build passou
                         │
                         ├─ SSH na VPS  →  .github/scripts/vps-deploy.sh
                         │                 git reset --hard origin/main
                         │                 npm ci → npm run build
                         │                 pm2 startOrReload → pm2 save
                         │                 healthcheck em localhost:3102
                         │                 (falhou? rollback pro commit anterior)
                         │
                         └─ healthcheck público em https://app.mrcartas.com
```

Pontos que valem saber:

- **O build roda duas vezes** — uma no runner (portão) e outra na VPS (o que
  realmente vai pro ar). O do runner existe para o deploy nem começar se o código
  não compila.
- **PR não faz deploy.** O job `deploy` tem `if: github.event_name != 'pull_request'`.
- **Rollback automático.** Se `npm ci`, `npm run build` ou o healthcheck falharem
  na VPS, o script volta para o commit anterior, rebuilda e sobe. O ar não fica
  quebrado por um push ruim.
- **Deploys não se atropelam.** O `concurrency` serializa execuções do mesmo branch.
- **`.env` e `node_modules` nunca são tocados** pelo `git reset --hard` (gitignored).

---

## Operação do dia a dia

```bash
# status e logs
pm2 list
pm2 logs aplicativo-mrcartas --lines 100
pm2 monit

# reiniciar relendo o .env (obrigatório o --update-env)
pm2 restart aplicativo-mrcartas --update-env

# conferir se uma variável entrou mesmo no processo
pm2 env $(pm2 id aplicativo-mrcartas | tr -d '[]') | grep MONGODB_URI
```

Mudou só o `.env`? Basta o `restart --update-env` — **não precisa rebuildar**.
Mudou código? Faça push na `main` e deixe a pipeline trabalhar.

---

## Rollback manual

O deploy já faz rollback sozinho quando falha. Para voltar uma versão que subiu
"com sucesso" mas está com problema:

```bash
cd /var/www/mrcartas/melyn-cartas

git log --oneline -10           # ache o commit bom
git reset --hard <SHA_DO_COMMIT_BOM>
npm ci
npm run build
pm2 startOrReload ecosystem.config.cjs --update-env
pm2 save

curl -I http://localhost:3102
curl -I https://app.mrcartas.com
```

> O próximo push na `main` traz o app de volta para o topo do branch. Se o commit
> ruim já está na `main`, reverta lá também (`git revert <SHA>`), senão a pipeline
> vai reintroduzir o problema.

---

## Problemas comuns

| Sintoma | Causa provável | O que fazer |
|---|---|---|
| `502 Bad Gateway` no domínio | Nitro caído ou em outra porta | `pm2 logs aplicativo-mrcartas`; conferir se a porta do NGINX bate com a do `ecosystem.config.cjs` |
| App sobe mas `/api/app-config` dá **503** | Mongo inacessível | `grep MONGODB_URI .env`; testar com `mongosh "<URI>"`; conferir firewall na porta 27017 |
| Painel `/admin` não aceita login | `ADMIN_EMAILS` ou `ADMIN_PASSWORD` vazios | Preencher no `.env` e `pm2 restart --update-env` |
| Deploy passa mas o site não muda | Build antigo em cache do navegador | Hard refresh; conferir `public/version.json` (o `npm run build` regenera) |
| `Permission denied (publickey)` no Actions | Chave errada ou usuário errado | Conferir `VPS_SSH_KEY` (privada, completa) e `VPS_USER` |
| `Host key verification failed` | `ssh-keyscan` não pegou o host | Conferir `VPS_HOST` e `VPS_PORT` nos secrets |
| Porta `3102` ocupada | Outro app tomou a porta | `ss -ltnp \| grep :3102`; escolher outra porta livre e atualizar os 4 lugares |
| Certbot falha ao emitir | DNS ainda não propagou | `dig +short app.mrcartas.com` tem que devolver o IP da VPS |

---

## Checklist de um app novo

- [ ] Node 22, NGINX, PM2 e Certbot instalados
- [ ] Repositório clonado em `/var/www/mrcartas/melyn-cartas`
- [ ] `.env` preenchido e com `chmod 600`
- [ ] Usuário do Mongo criado e URI testada
- [ ] `npm ci && npm run build` sem erro
- [ ] `pm2 start ecosystem.config.cjs` + `pm2 save` + `pm2 startup`
- [ ] DNS `app` → IP da VPS, propagado
- [ ] NGINX apontando para `127.0.0.1:3102` e `nginx -t` ok
- [ ] Certificado emitido, `https://app.mrcartas.com` respondendo
- [ ] Chave de deploy gerada e os 4 secrets criados no GitHub
- [ ] Workflow rodado manualmente uma vez, verde
