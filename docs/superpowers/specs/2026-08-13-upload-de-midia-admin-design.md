# Upload de mídia no painel `/admin/visual`

**Data:** 2026-08-13
**Status:** aprovado, pronto para plano de implementação

## Problema

Hoje os campos de imagem do painel `/admin/visual` são caixas de texto: para trocar
o logo, o favicon ou um banner é preciso subir o arquivo por fora (FTP/deploy) e
digitar o caminho na mão. Não existe nenhuma infra de upload no projeto — nenhum
endpoint multipart, nenhum helper de arquivo.

Além disso, os oito painéis de configuração são renderizados empilhados numa página
única, o que dá uma rolagem longa para achar qualquer campo.

## Objetivo

1. Agrupar toda a mídia numa aba própria dentro de `/admin/visual`.
2. Permitir enviar imagens por **drag and drop ou clique**, com preview.
3. Fazer isso sem quebrar os valores que já estão configurados.

## Restrição que determinou a arquitetura

Em produção o Nitro serve estáticos de `.output/public`, que o `npm run build`
**regenera a partir de `public/`**. O deploy (`.github/scripts/vps-deploy.sh`) roda
`git reset --hard origin/main` seguido de `npm run build` a cada push.

Consequência: arquivo gravado em `public/` em tempo de execução **não é servido até
o próximo build**, e desaparece se a VPS for reprovisionada, porque não está no git.
Gravar direto em `.output/public` seria pior — o build seguinte apaga.

Ou seja: **nenhuma abordagem ingênua de filesystem funciona com a pipeline atual.**

## Decisões

| Decisão | Escolha | Por quê |
|---|---|---|
| Onde guardar | **MongoDB / GridFS** | Imune ao `git reset --hard` + rebuild; zero configuração na VPS; entra no mesmo backup do config, que já vive no Mongo |
| Estrutura da página | **Abas para todas as seções** | Resolve a rolagem dos 8 painéis empilhados; mídia ganha aba própria |
| Momento do upload | **Imediato, ao soltar o arquivo** | Erro de upload aparece na hora, não no fim; o preview passa a ser o arquivo real do servidor |
| Arquivos órfãos | **Limpeza automática + botão manual** | Sem isso o banco acumula toda imagem substituída ou abandonada |

Alternativas descartadas: disco fora do repo (`/var/www/mrcartas/uploads` + alias no
nginx) — exigiria setup na VPS, caminho diferente em dev e ficaria fora do backup do
banco; host externo (S3/Cloudinary) — dependência, credenciais e custo que o volume
atual não justifica.

## Arquitetura

```
UPLOAD                                      SERVIR
admin arrasta imagem                        <img src="/api/media/68f3...">
  │                                           │
  ├─ POST /api/media (multipart)              ├─ GET /api/media/[id]
  │   requireAdmin                            │   stream do GridFS
  │   valida tipo + tamanho                   │   Cache-Control 1 ano, immutable
  │   grava no bucket "media"                 │   ETag + 304
  │                                           │   público (visitante anônimo vê)
  └─ { id, url, filename, size, contentType }
       │
       campo do draft vira "/api/media/<id>"
       │
   [ Salvar alterações ] ── PUT /api/app-config (fluxo já existente)
                              └─ ao terminar, dispara a limpeza de órfãos
```

O `id` do GridFS é imutável, então `Cache-Control: immutable` de 1 ano é seguro:
trocar a imagem gera outro id e outra URL, sem invalidação manual.

## Backend

### `server/utils/media.ts`

Helper do bucket, reusando o `getDb()` existente.

- `getMediaBucket()` — devolve o `GridFSBucket` do bucket `media`
- `collectMediaIds(config)` — extrai todo id de `/api/media/<id>` de
  `brand.logo`, `brand.favicon`, `images.banners[]`, `images.blocked`,
  `images.premium`, `images.live`
- `cleanupOrphanMedia(graceMs?)` — lê o config atual do banco, monta o conjunto de
  ids em uso com `collectMediaIds` e apaga do GridFS os arquivos que não estão nele
  **e** têm `uploadDate` mais antigo que `graceMs`; devolve `{ removidos, espacoLiberado }`.
  `graceMs` é opcional e vale **1 hora** por padrão.

  A função lê o config do banco em vez de recebê-lo por parâmetro: assim os dois
  gatilhos (save e botão manual) usam exatamente a mesma fonte de verdade, e o
  gatilho manual não depende de ninguém passar o config certo.

### `server/api/media.post.ts`

- `requireAdmin(event)`
- lê o arquivo com `readMultipartFormData(event)`
- valida (ver abaixo) e grava no GridFS
- devolve `{ id, url: "/api/media/<id>", filename, size, contentType }`

### `server/api/media/[id].get.ts`

- valida que o `id` é um ObjectId válido → 400 se não for
- `bucket.openDownloadStream(id)` e `sendStream`
- 404 se o arquivo não existir
- headers: `Content-Type` gravado no upload, `Cache-Control: public, max-age=31536000, immutable`,
  `ETag: "<id>"` (responde 304 quando o `If-None-Match` bate)
- **rota pública** — as imagens precisam carregar para visitante não autenticado

### `server/api/media/cleanup.post.ts`

- `requireAdmin(event)`
- chama `cleanupOrphanMedia` e devolve `{ removidos, espacoLiberado }`

### Validação do upload

- **Tamanho máximo: 5 MB** (o maior arquivo atual, `melyn-hero.png`, tem 1,7 MB)
- **Tipos aceitos:** `image/png`, `image/jpeg`, `image/webp`, `image/gif`,
  `image/svg+xml`, `image/x-icon`
- O tipo é conferido pela **assinatura do arquivo (magic bytes)**, não pelo
  `Content-Type` que o cliente mandou. SVG e ICO, que não têm assinatura binária
  confiável, são validados por inspeção do conteúdo (SVG precisa começar com
  `<?xml` ou `<svg` após trim).
- Erro de validação → 400 com mensagem em português, exibida inline no componente

### Segurança do SVG

O logo atual é SVG. Um SVG servido da mesma origem pode executar script se a URL for
aberta diretamente no navegador. A rota de leitura manda:

- `X-Content-Type-Options: nosniff`
- `Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'`

A imagem continua renderizando normalmente em `<img>`, mas não executa nada se
alguém navegar direto para `/api/media/<id>`.

## Frontend

### Abas

`app/pages/admin/visual.vue` passa a ter navegação por abas com as oito seções
existentes: **Marca, Cores, Textos, Links, Mídia, Recursos, Menu, Manutenção**.

- A aba ativa fica na query string (`?tab=midia`), então reload e link compartilhado
  caem na aba certa
- O botão **Salvar alterações** continua no topo, fora das abas, e salva o config
  inteiro — trocar de aba não perde edição

A aba **Mídia** agrupa o que hoje está espalhado entre "Marca e metadados"
(logo, favicon) e "Imagens e banners" (bloqueio, premium, live, banners).

### `app/components/admin/MediaField.vue`

Componente único, reusado por todos os campos de imagem.

**Props:** `modelValue` (string | null), `label`, `hint?`
**Emits:** `update:modelValue`

**Comportamento:**
- dropzone que aceita **drag and drop e clique** (input file escondido)
- estado visual de "arrastando por cima"
- preview da imagem atual — funciona tanto com `/api/media/<id>` quanto com os
  caminhos antigos (`/media/melyn-logo.svg`)
- barra de progresso durante o upload, via `XMLHttpRequest` (o `$fetch` não expõe
  progresso de upload)
- erro inline: tamanho, tipo inválido, falha de rede
- botão de limpar o campo
- input de texto colapsado como escape hatch, para colar uma URL externa

**Banners** usam o mesmo componente numa lista, com adicionar e remover.

### Botão de limpeza

Na aba Mídia, um botão "Limpar mídias não usadas" chama `POST /api/media/cleanup`
e mostra o resultado no toast que a página já tem.

## Limpeza de órfãos

Órfão = arquivo no GridFS que nenhum campo do config referencia. Acontece quando uma
imagem é substituída, ou quando alguém sobe um arquivo e nunca clica em Salvar.

**Janela de proteção de 1 hora.** Só é apagado o órfão com `uploadDate` de mais de
uma hora atrás. Sem isso existiria uma corrida real: o admin sobe o logo novo, ainda
não salvou, e um save disparado de outra aba apagaria o arquivo debaixo dele. Com a
janela isso é impossível na prática, e o arquivo abandonado ainda assim some sozinho
depois.

**Dois gatilhos, uma implementação:**

1. **Automático** — após cada `PUT /api/app-config` bem-sucedido. Roda embrulhado em
   try/catch e **nunca derruba o save**: se a limpeza falhar, o config já foi gravado
   e a falha vira log.
2. **Manual** — `POST /api/media/cleanup`, acionado pelo botão na aba Mídia.

## Compatibilidade

Nada quebra e não há migração. Os valores atuais (`/media/melyn-logo.svg`,
`/media/melyn-hero.png`) são caminhos comuns servidos de `public/`; o `MediaField`
apenas mostra o preview deles. Quem quiser troca pelo upload quando quiser.

O `normalizeAppConfig` em `server/utils/appConfig.ts` já aceita caminhos assim e
continua bloqueando `javascript:` e `data:` — `/api/media/<id>` passa sem alteração
na validação.

## Fora de escopo

- Reordenar banners arrastando — adicionar e remover resolve o caso atual
- Crop/resize no navegador antes do upload

## Verificação

O projeto não tem framework de teste. A verificação é manual, dirigindo o app pelo
Chrome com Playwright, como foi feito nas etapas anteriores:

1. Subir o app com o Mongo local e autenticar em `/admin/visual`
2. Navegar entre as oito abas; conferir que `?tab=midia` sobrevive ao reload
3. Upload de PNG por **clique** e de SVG por **drag and drop** — preview troca,
   progresso aparece
4. Arquivo acima de 5 MB → recusado com erro inline
5. Arquivo de tipo não permitido (ex.: `.txt` renomeado para `.png`) → recusado pela
   checagem de magic bytes
6. Salvar, recarregar a página e confirmar que os valores persistiram
7. Abrir a home e confirmar que o logo e o banner enviados aparecem
8. Abrir `/api/media/<id>` direto e conferir os headers de cache e de segurança
9. Órfãos: subir três arquivos, referenciar um, salvar; confirmar pelo botão manual
   que os outros dois **sobrevivem** (estão dentro da janela de 1 hora). Depois
   chamar `cleanupOrphanMedia(0)` por um script Node avulso apontando para o mesmo
   Mongo — é por isso que `graceMs` é parâmetro da função e não constante fixa — e
   confirmar que os dois órfãos somem e o referenciado permanece
10. Screenshots ao final

## Arquivos

**Novos**
- `server/utils/media.ts`
- `server/api/media.post.ts`
- `server/api/media/[id].get.ts`
- `server/api/media/cleanup.post.ts`
- `app/components/admin/MediaField.vue`

**Alterados**
- `app/pages/admin/visual.vue` — abas + aba Mídia usando o `MediaField`
- `server/api/app-config.put.ts` — dispara a limpeza após salvar
