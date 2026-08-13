# Upload de Mídia no Painel Admin — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dar ao painel `/admin/visual` uma aba de Mídia com upload por drag and drop ou clique, guardando os arquivos no MongoDB via GridFS.

**Architecture:** Os arquivos vão para o GridFS (bucket `media`) porque o deploy roda `git reset --hard` + `npm run build`, o que apaga qualquer coisa escrita em disco em runtime. Um endpoint autenticado recebe o upload e devolve `/api/media/<id>`; uma rota pública faz o stream de volta com cache imutável de 1 ano. Órfãos são apagados por uma função com janela de proteção de 1 hora, disparada tanto pelo save do config quanto por um botão manual.

**Tech Stack:** Nuxt 4 (SPA, `ssr: false`), Nitro/H3, MongoDB driver 7 (`GridFSBucket`), Vue 3 `<script setup>`.

**Spec:** [`docs/superpowers/specs/2026-08-13-upload-de-midia-admin-design.md`](../specs/2026-08-13-upload-de-midia-admin-design.md)

---

## Nota sobre testes

O projeto não tem framework de teste e o spec aprovado não introduz um. Os testes
deste plano são **scripts Node executáveis** que usam `node:assert` e batem no
servidor de dev por HTTP. Eles falham antes da implementação e passam depois, sem
adicionar nenhuma dependência ao `package.json`.

Os scripts ficam em `scripts/verify/` e rodam com `node scripts/verify/<arquivo>.mjs`.

## Ambiente para rodar os testes

Todas as tarefas assumem estes dois processos rodando. Suba uma vez, no início:

```bash
# terminal 1 — MongoDB em memória (o Mongo de produção não é acessível em dev)
node -e "
const { MongoMemoryServer } = require('mongodb-memory-server');
MongoMemoryServer.create({ instance: { port: 27019 } })
  .then(s => console.log('MONGO_URI=' + s.getUri()));
setInterval(() => {}, 1 << 30);
"

# terminal 2 — app
MONGODB_URI="mongodb://127.0.0.1:27019/" MONGO_DB_NAME=melyn_cartas npm run dev
```

Se `mongodb-memory-server` não estiver instalado, instale **fora do projeto** para
não sujar o `package.json`:

```bash
mkdir -p /tmp/mongo-dev && cd /tmp/mongo-dev && npm init -y && npm i mongodb-memory-server
```

O app sobe em `http://localhost:3098` (ou a próxima porta livre — confira o log).
Os scripts leem a base de `process.env.APP_URL`, com default `http://localhost:3098`.

---

## Estrutura de arquivos

**Novos**

| Arquivo | Responsabilidade |
|---|---|
| `server/utils/media.ts` | Bucket do GridFS, validação de arquivo, coleta de ids em uso, limpeza de órfãos |
| `server/api/media.post.ts` | Recebe o upload (admin), valida, grava, devolve a URL |
| `server/api/media/[id].get.ts` | Faz o stream do arquivo com cache e headers de segurança |
| `server/api/media/cleanup.post.ts` | Dispara a limpeza manualmente (admin) |
| `app/components/admin/MediaField.vue` | Dropzone + preview + progresso, um por campo de imagem |
| `scripts/verify/*.mjs` | Verificação executável de cada tarefa |

**Alterados**

| Arquivo | Mudança |
|---|---|
| `app/pages/admin/visual.vue` | Navegação por abas; aba Mídia usando o `MediaField` |
| `server/api/app-config.put.ts` | Dispara `cleanupOrphanMedia` após salvar |

---

## Task 1: Helper de mídia — validação de arquivo

Começa pela parte pura (validação por magic bytes), que é o que decide se um upload
entra ou não. Sem endpoint ainda.

**Files:**
- Create: `server/utils/media.ts`
- Create: `server/api/media.post.ts` (versão mínima, só para expor a validação ao teste)
- Test: `scripts/verify/01-validacao.mjs`

- [ ] **Step 1: Escrever o teste que falha**

Crie `scripts/verify/01-validacao.mjs`:

```javascript
import assert from 'node:assert/strict'

const BASE = process.env.APP_URL || 'http://localhost:3098'

const LOGIN = { email: 'devhypegaming@gmail.com', password: 'Rainha@Adm2026' }

const login = async () => {
  const r = await fetch(`${BASE}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(LOGIN)
  })
  assert.equal(r.status, 200, 'login do admin deveria funcionar')
  return (await r.json()).token
}

// PNG minimo valido: assinatura + IHDR
const pngBytes = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52
])

const upload = async (token, { name, type, data }) => {
  const form = new FormData()
  form.append('file', new Blob([data], { type }), name)
  return fetch(`${BASE}/api/media`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form
  })
}

const token = await login()

// 1. sem autenticacao -> 401
{
  const form = new FormData()
  form.append('file', new Blob([pngBytes], { type: 'image/png' }), 'a.png')
  const r = await fetch(`${BASE}/api/media`, { method: 'POST', body: form })
  assert.equal(r.status, 401, 'upload sem token deveria dar 401')
}

// 2. PNG valido -> 200
{
  const r = await upload(token, { name: 'ok.png', type: 'image/png', data: pngBytes })
  assert.equal(r.status, 200, 'PNG valido deveria ser aceito')
  const body = await r.json()
  assert.match(body.url, /^\/api\/media\/[a-f0-9]{24}$/, 'url deveria ser /api/media/<objectid>')
  assert.equal(body.contentType, 'image/png')
}

// 3. texto disfarcado de PNG -> 400 (magic bytes pegam)
{
  const r = await upload(token, {
    name: 'fake.png',
    type: 'image/png',
    data: Buffer.from('isto nao e uma imagem', 'utf8')
  })
  assert.equal(r.status, 400, 'arquivo com extensao/tipo mentindo deveria ser recusado')
}

// 4. tipo nao permitido -> 400
{
  const r = await upload(token, {
    name: 'doc.pdf',
    type: 'application/pdf',
    data: Buffer.from('%PDF-1.4', 'utf8')
  })
  assert.equal(r.status, 400, 'PDF deveria ser recusado')
}

// 5. acima de 5MB -> 400
{
  const grande = Buffer.concat([pngBytes, Buffer.alloc(5 * 1024 * 1024)])
  const r = await upload(token, { name: 'grande.png', type: 'image/png', data: grande })
  assert.equal(r.status, 400, 'arquivo acima de 5MB deveria ser recusado')
}

// 6. SVG valido -> 200
{
  const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>', 'utf8')
  const r = await upload(token, { name: 'logo.svg', type: 'image/svg+xml', data: svg })
  assert.equal(r.status, 200, 'SVG valido deveria ser aceito')
}

console.log('OK: 01-validacao')
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `node scripts/verify/01-validacao.mjs`
Expected: FAIL — o endpoint `/api/media` não existe, então a asserção do 401 falha
com o status 404 que o Nitro devolve.

- [ ] **Step 3: Escrever o helper de mídia**

Crie `server/utils/media.ts`:

```typescript
import { GridFSBucket, ObjectId } from 'mongodb'
import { getDb } from './mongodb'

export const MEDIA_BUCKET = 'media'
export const MAX_MEDIA_BYTES = 5 * 1024 * 1024

const ALLOWED = new Set([
  'image/png', 'image/jpeg', 'image/webp',
  'image/gif', 'image/svg+xml', 'image/x-icon'
])

export const getMediaBucket = async () =>
  new GridFSBucket(await getDb(), { bucketName: MEDIA_BUCKET })

const startsWith = (buffer: Buffer, bytes: number[]) =>
  bytes.every((byte, index) => buffer[index] === byte)

/**
 * Descobre o tipo real pelo conteudo, ignorando o que o cliente declarou.
 * Devolve null se o conteudo nao for uma imagem que aceitamos.
 */
export const sniffImageType = (buffer: Buffer): string | null => {
  if (buffer.length < 4) return null

  if (startsWith(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'image/png'
  if (startsWith(buffer, [0xff, 0xd8, 0xff])) return 'image/jpeg'
  if (startsWith(buffer, [0x47, 0x49, 0x46, 0x38])) return 'image/gif'
  if (startsWith(buffer, [0x00, 0x00, 0x01, 0x00])) return 'image/x-icon'

  // WEBP = "RIFF" .... "WEBP"
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) return 'image/webp'

  // SVG nao tem assinatura binaria — checamos o inicio do texto.
  const head = buffer.subarray(0, 1024).toString('utf8').trimStart()
  if (head.startsWith('<?xml') || head.startsWith('<svg')) return 'image/svg+xml'

  return null
}

export interface MediaValidation {
  ok: boolean
  contentType?: string
  error?: string
}

export const validateMedia = (buffer: Buffer): MediaValidation => {
  if (!buffer?.length) return { ok: false, error: 'Arquivo vazio.' }

  if (buffer.length > MAX_MEDIA_BYTES) {
    return { ok: false, error: 'Arquivo maior que 5 MB.' }
  }

  const contentType = sniffImageType(buffer)
  if (!contentType || !ALLOWED.has(contentType)) {
    return { ok: false, error: 'Formato não suportado. Use PNG, JPEG, WEBP, GIF, SVG ou ICO.' }
  }

  return { ok: true, contentType }
}

export const saveMedia = async (
  buffer: Buffer,
  filename: string,
  contentType: string
): Promise<ObjectId> => {
  const bucket = await getMediaBucket()
  const stream = bucket.openUploadStream(filename, { contentType })

  await new Promise<void>((resolve, reject) => {
    stream.on('finish', () => resolve())
    stream.on('error', reject)
    stream.end(buffer)
  })

  return stream.id as ObjectId
}
```

- [ ] **Step 4: Escrever o endpoint de upload**

Crie `server/api/media.post.ts`:

```typescript
import { requireAdmin } from '../utils/admin'
import { saveMedia, validateMedia } from '../utils/media'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const parts = await readMultipartFormData(event)
  const file = parts?.find((part) => part.filename && part.data?.length)

  if (!file) {
    throw createError({ statusCode: 400, message: 'Nenhum arquivo enviado.' })
  }

  const check = validateMedia(file.data)
  if (!check.ok) {
    throw createError({ statusCode: 400, message: check.error })
  }

  const filename = String(file.filename).slice(0, 200)
  const id = await saveMedia(file.data, filename, check.contentType!)

  return {
    id: id.toString(),
    url: `/api/media/${id.toString()}`,
    filename,
    size: file.data.length,
    contentType: check.contentType
  }
})
```

- [ ] **Step 5: Rodar o teste e confirmar que passa**

Run: `node scripts/verify/01-validacao.mjs`
Expected: `OK: 01-validacao`

- [ ] **Step 6: Commit**

```bash
git add server/utils/media.ts server/api/media.post.ts scripts/verify/01-validacao.mjs
git commit -m "feat: endpoint de upload de midia com validacao por magic bytes"
```

---

## Task 2: Servir o arquivo

**Files:**
- Create: `server/api/media/[id].get.ts`
- Test: `scripts/verify/02-servir.mjs`

- [ ] **Step 1: Escrever o teste que falha**

Crie `scripts/verify/02-servir.mjs`:

```javascript
import assert from 'node:assert/strict'

const BASE = process.env.APP_URL || 'http://localhost:3098'

const pngBytes = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52
])

const r0 = await fetch(`${BASE}/api/admin/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'devhypegaming@gmail.com', password: 'Rainha@Adm2026' })
})
const { token } = await r0.json()

const form = new FormData()
form.append('file', new Blob([pngBytes], { type: 'image/png' }), 'servir.png')
const up = await fetch(`${BASE}/api/media`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` },
  body: form
})
assert.equal(up.status, 200)
const { url } = await up.json()

// 1. rota e publica (sem token) e devolve os mesmos bytes
{
  const r = await fetch(`${BASE}${url}`)
  assert.equal(r.status, 200, 'a imagem deveria ser publica')
  assert.equal(r.headers.get('content-type'), 'image/png')

  const bytes = Buffer.from(await r.arrayBuffer())
  assert.deepEqual(bytes, pngBytes, 'os bytes devolvidos deveriam ser identicos aos enviados')
}

// 2. headers de cache e seguranca
{
  const r = await fetch(`${BASE}${url}`)
  assert.match(r.headers.get('cache-control') || '', /immutable/, 'deveria ter cache immutable')
  assert.match(r.headers.get('cache-control') || '', /max-age=31536000/, 'cache de 1 ano')
  assert.equal(r.headers.get('x-content-type-options'), 'nosniff')
  assert.match(r.headers.get('content-security-policy') || '', /default-src 'none'/)
  assert.ok(r.headers.get('etag'), 'deveria mandar ETag')
}

// 3. ETag responde 304
{
  const first = await fetch(`${BASE}${url}`)
  const etag = first.headers.get('etag')
  const second = await fetch(`${BASE}${url}`, { headers: { 'If-None-Match': etag } })
  assert.equal(second.status, 304, 'com If-None-Match igual deveria dar 304')
}

// 4. id inexistente -> 404
{
  const r = await fetch(`${BASE}/api/media/aaaaaaaaaaaaaaaaaaaaaaaa`)
  assert.equal(r.status, 404, 'id inexistente deveria dar 404')
}

// 5. id malformado -> 400
{
  const r = await fetch(`${BASE}/api/media/nao-e-objectid`)
  assert.equal(r.status, 400, 'id invalido deveria dar 400')
}

console.log('OK: 02-servir')
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `node scripts/verify/02-servir.mjs`
Expected: FAIL — a rota de leitura não existe; a primeira asserção quebra com 404.

- [ ] **Step 3: Implementar a rota**

Crie `server/api/media/[id].get.ts`:

```typescript
import { ObjectId } from 'mongodb'
import { getMediaBucket } from '../../utils/media'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id') || ''

  if (!ObjectId.isValid(id)) {
    throw createError({ statusCode: 400, message: 'Identificador inválido.' })
  }

  const objectId = new ObjectId(id)
  const bucket = await getMediaBucket()
  const [file] = await bucket.find({ _id: objectId }).limit(1).toArray()

  if (!file) {
    throw createError({ statusCode: 404, message: 'Arquivo não encontrado.' })
  }

  // O id do GridFS e imutavel: trocar a imagem gera outro id e outra URL.
  // Por isso o cache pode ser longo e immutable, sem invalidacao manual.
  const etag = `"${id}"`
  setHeader(event, 'ETag', etag)
  setHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')
  setHeader(event, 'Content-Type', file.contentType || 'application/octet-stream')

  // SVG servido da mesma origem executaria script se aberto direto na URL.
  setHeader(event, 'X-Content-Type-Options', 'nosniff')
  setHeader(event, 'Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'")

  if (getHeader(event, 'if-none-match') === etag) {
    setResponseStatus(event, 304)
    return null
  }

  setHeader(event, 'Content-Length', String(file.length))
  return sendStream(event, bucket.openDownloadStream(objectId))
})
```

- [ ] **Step 4: Rodar o teste e confirmar que passa**

Run: `node scripts/verify/02-servir.mjs`
Expected: `OK: 02-servir`

- [ ] **Step 5: Commit**

```bash
git add server/api/media/\[id\].get.ts scripts/verify/02-servir.mjs
git commit -m "feat: rota publica que serve midia do GridFS com cache imutavel"
```

---

## Task 3: Limpeza de órfãos

**Files:**
- Modify: `server/utils/media.ts` (adiciona `collectMediaIds` e `cleanupOrphanMedia`)
- Create: `server/api/media/cleanup.post.ts`
- Modify: `server/api/app-config.put.ts`
- Test: `scripts/verify/03-orfaos.mjs`

- [ ] **Step 1: Escrever o teste que falha**

Crie `scripts/verify/03-orfaos.mjs`:

```javascript
import assert from 'node:assert/strict'

const BASE = process.env.APP_URL || 'http://localhost:3098'

const pngBytes = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52
])

const r0 = await fetch(`${BASE}/api/admin/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'devhypegaming@gmail.com', password: 'Rainha@Adm2026' })
})
const { token } = await r0.json()
const auth = { Authorization: `Bearer ${token}` }

const subir = async (nome) => {
  const form = new FormData()
  form.append('file', new Blob([pngBytes], { type: 'image/png' }), nome)
  const r = await fetch(`${BASE}/api/media`, { method: 'POST', headers: auth, body: form })
  assert.equal(r.status, 200)
  return (await r.json()).url
}

const vive = async (url) => (await fetch(`${BASE}${url}`)).status === 200

// Sobe tres, referencia um so
const usado = await subir('usado.png')
const orfao1 = await subir('orfao1.png')
const orfao2 = await subir('orfao2.png')

const save = await fetch(`${BASE}/api/app-config`, {
  method: 'PUT',
  headers: { ...auth, 'Content-Type': 'application/json' },
  body: JSON.stringify({ brand: { logo: usado } })
})
assert.equal(save.status, 200, 'salvar o config deveria funcionar')

// 1. o save nao pode apagar nada: os tres estao dentro da janela de 1h
assert.ok(await vive(usado), 'o arquivo referenciado deve continuar vivo')
assert.ok(await vive(orfao1), 'orfao recente NAO pode ser apagado (janela de 1h)')
assert.ok(await vive(orfao2), 'orfao recente NAO pode ser apagado (janela de 1h)')

// 2. o endpoint manual existe, exige admin e respeita a janela
{
  const semToken = await fetch(`${BASE}/api/media/cleanup`, { method: 'POST' })
  assert.equal(semToken.status, 401, 'cleanup sem token deveria dar 401')

  const r = await fetch(`${BASE}/api/media/cleanup`, { method: 'POST', headers: auth })
  assert.equal(r.status, 200)
  const body = await r.json()
  assert.equal(typeof body.removidos, 'number', 'deveria devolver quantos removeu')
  assert.equal(body.removidos, 0, 'nada deveria ser removido dentro da janela de 1h')
  assert.ok(await vive(orfao1), 'orfao recente segue vivo apos cleanup')
}

// 3. com graceMs=0 os orfaos somem e o referenciado fica
{
  const r = await fetch(`${BASE}/api/media/cleanup?graceMs=0`, { method: 'POST', headers: auth })
  assert.equal(r.status, 200)
  const body = await r.json()
  assert.ok(body.removidos >= 2, `deveria remover os dois orfaos, removeu ${body.removidos}`)

  assert.ok(await vive(usado), 'o arquivo referenciado NAO pode ser apagado')
  assert.equal(await vive(orfao1), false, 'orfao1 deveria ter sido apagado')
  assert.equal(await vive(orfao2), false, 'orfao2 deveria ter sido apagado')
}

console.log('OK: 03-orfaos')
```

> O teste usa `?graceMs=0` na query. Isso é uma decisão desta tarefa: o endpoint
> aceita um override opcional da janela, o que torna o comportamento testável por
> HTTP sem script separado. O default continua sendo 1 hora.

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `node scripts/verify/03-orfaos.mjs`
Expected: FAIL — `/api/media/cleanup` não existe; a asserção do 401 recebe 404.

- [ ] **Step 3: Adicionar coleta e limpeza ao helper**

Primeiro, acrescente estes dois imports **no topo** de `server/utils/media.ts`,
junto dos que já existem (imports não podem ficar no meio do arquivo):

```typescript
import type { AppConfig } from '../../shared/appConfig'
import { getAppConfig } from './appConfig'
```

Depois acrescente o restante ao **final** do arquivo:

```typescript
export const DEFAULT_MEDIA_GRACE_MS = 60 * 60 * 1000 // 1 hora

const MEDIA_URL = /^\/api\/media\/([a-f0-9]{24})$/

const idFromUrl = (value: unknown): string | null => {
  if (typeof value !== 'string') return null
  const match = value.trim().match(MEDIA_URL)
  return match ? match[1]! : null
}

/** Todos os ids de mídia referenciados pelo config. */
export const collectMediaIds = (config: AppConfig): Set<string> => {
  const candidates: unknown[] = [
    config.brand?.logo,
    config.brand?.favicon,
    config.images?.blocked,
    config.images?.premium,
    config.images?.live,
    ...(Array.isArray(config.images?.banners) ? config.images.banners : [])
  ]

  const ids = new Set<string>()
  for (const candidate of candidates) {
    const id = idFromUrl(candidate)
    if (id) ids.add(id)
  }
  return ids
}

export interface CleanupResult {
  removidos: number
  espacoLiberado: number
}

/**
 * Apaga do GridFS as mídias que nenhum campo do config referencia.
 *
 * Só apaga arquivo mais velho que `graceMs`. Sem essa janela haveria corrida:
 * o admin sobe uma imagem, ainda não clicou em Salvar, e um save vindo de outra
 * aba apagaria o arquivo debaixo dele.
 *
 * Lê o config do banco em vez de recebê-lo por parâmetro, para que o gatilho
 * automático e o manual usem exatamente a mesma fonte de verdade.
 */
export const cleanupOrphanMedia = async (
  graceMs: number = DEFAULT_MEDIA_GRACE_MS
): Promise<CleanupResult> => {
  const config = await getAppConfig()
  const emUso = collectMediaIds(config)

  const bucket = await getMediaBucket()
  const limite = new Date(Date.now() - graceMs)
  const arquivos = await bucket.find({}).toArray()

  let removidos = 0
  let espacoLiberado = 0

  for (const arquivo of arquivos) {
    const id = arquivo._id.toString()
    if (emUso.has(id)) continue
    if (arquivo.uploadDate > limite) continue

    await bucket.delete(arquivo._id)
    removidos += 1
    espacoLiberado += arquivo.length
  }

  return { removidos, espacoLiberado }
}
```

- [ ] **Step 4: Criar o endpoint de limpeza**

Crie `server/api/media/cleanup.post.ts`:

```typescript
import { requireAdmin } from '../../utils/admin'
import { DEFAULT_MEDIA_GRACE_MS, cleanupOrphanMedia } from '../../utils/media'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  // Override opcional da janela de proteção — usado pela verificação.
  const raw = getQuery(event).graceMs
  const parsed = Number(raw)
  const graceMs = Number.isFinite(parsed) && parsed >= 0 ? parsed : DEFAULT_MEDIA_GRACE_MS

  return await cleanupOrphanMedia(graceMs)
})
```

- [ ] **Step 5: Disparar a limpeza depois de salvar o config**

Substitua o conteúdo de `server/api/app-config.put.ts`:

```typescript
import { requireAdmin } from '../utils/admin'
import { saveAppConfig } from '../utils/appConfig'
import { cleanupOrphanMedia } from '../utils/media'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readBody(event)
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw createError({ statusCode: 400, message: 'Configuração inválida' })
  }

  const data = await saveAppConfig(body)

  // A limpeza nunca pode derrubar o save: o config já está gravado neste ponto.
  try {
    await cleanupOrphanMedia()
  } catch (error) {
    console.error('Falha ao limpar mídias órfãs:', error)
  }

  return { success: true, data }
})
```

- [ ] **Step 6: Rodar o teste e confirmar que passa**

Run: `node scripts/verify/03-orfaos.mjs`
Expected: `OK: 03-orfaos`

- [ ] **Step 7: Rodar os testes anteriores para garantir que nada quebrou**

Run: `node scripts/verify/01-validacao.mjs && node scripts/verify/02-servir.mjs`
Expected: `OK: 01-validacao` e `OK: 02-servir`

- [ ] **Step 8: Commit**

```bash
git add server/utils/media.ts server/api/media/cleanup.post.ts server/api/app-config.put.ts scripts/verify/03-orfaos.mjs
git commit -m "feat: limpeza de midias orfas com janela de protecao de 1 hora"
```

---

## Task 4: Componente `MediaField`

Componente de UI. A verificação é pelo navegador, na Task 6 — aqui o passo de
validação é o build passar e o componente montar sem erro.

**Files:**
- Create: `app/components/admin/MediaField.vue`

- [ ] **Step 1: Escrever o componente**

Crie `app/components/admin/MediaField.vue`:

```vue
<template>
  <div class="media-field">
    <span class="media-label">{{ label }}</span>

    <div
      class="dropzone"
      :class="{ dragging, erro: !!erro }"
      @click="abrirSeletor"
      @dragover.prevent="dragging = true"
      @dragleave.prevent="dragging = false"
      @drop.prevent="aoSoltar"
    >
      <img v-if="modelValue && !enviando" :src="modelValue" class="preview" alt="" />

      <div v-else-if="enviando" class="progresso">
        <div class="barra"><div class="barra-fill" :style="{ width: progresso + '%' }" /></div>
        <span>{{ progresso }}%</span>
      </div>

      <div v-else class="vazio">
        <Icon name="ph:image-square-bold" />
        <span>Arraste uma imagem ou clique para escolher</span>
      </div>

      <input
        ref="inputFile"
        type="file"
        class="input-oculto"
        :accept="ACCEPT"
        @change="aoEscolher"
      />
    </div>

    <p v-if="erro" class="erro-msg">{{ erro }}</p>
    <p v-else-if="hint" class="hint">{{ hint }}</p>

    <div class="acoes">
      <button v-if="modelValue" type="button" class="link-btn" @click.stop="limpar">
        <Icon name="ph:trash-bold" /> Remover
      </button>
      <button type="button" class="link-btn" @click.stop="mostrarUrl = !mostrarUrl">
        <Icon name="ph:link-bold" /> {{ mostrarUrl ? 'Ocultar URL' : 'Usar URL' }}
      </button>
    </div>

    <input
      v-if="mostrarUrl"
      v-model="modelValue"
      class="url-input"
      placeholder="/media/logo.svg ou https://..."
    />
  </div>
</template>

<script setup lang="ts">
const ACCEPT = 'image/png,image/jpeg,image/webp,image/gif,image/svg+xml,image/x-icon'
const MAX_BYTES = 5 * 1024 * 1024

defineProps<{ label: string; hint?: string }>()

// defineModel ja cria a prop e o emit "update:modelValue".
// NAO declare defineEmits para esse evento — seria declaracao duplicada.
const modelValue = defineModel<string | null>()

const { adminFetch } = useAdmin()
const inputFile = ref<HTMLInputElement | null>(null)
const dragging = ref(false)
const enviando = ref(false)
const progresso = ref(0)
const erro = ref('')
const mostrarUrl = ref(false)

const abrirSeletor = () => {
  if (enviando.value) return
  inputFile.value?.click()
}

const limpar = () => {
  erro.value = ''
  modelValue.value = null
}

const aoEscolher = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) enviar(file)
}

const aoSoltar = (event: DragEvent) => {
  dragging.value = false
  const file = event.dataTransfer?.files?.[0]
  if (file) enviar(file)
}

// Usa XMLHttpRequest porque o $fetch nao expoe progresso de upload.
const enviar = (file: File) => {
  erro.value = ''

  if (file.size > MAX_BYTES) {
    erro.value = 'Arquivo maior que 5 MB.'
    return
  }

  enviando.value = true
  progresso.value = 0

  const form = new FormData()
  form.append('file', file, file.name)

  const xhr = new XMLHttpRequest()
  xhr.open('POST', '/api/media')

  const token = localStorage.getItem('rdb_admin_token')
  if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)

  xhr.upload.onprogress = (progressEvent) => {
    if (progressEvent.lengthComputable) {
      progresso.value = Math.round((progressEvent.loaded / progressEvent.total) * 100)
    }
  }

  xhr.onload = () => {
    enviando.value = false
    if (xhr.status === 200) {
      try {
        modelValue.value = JSON.parse(xhr.responseText).url
      } catch {
        erro.value = 'Resposta inválida do servidor.'
      }
      return
    }
    try {
      erro.value = JSON.parse(xhr.responseText).message || 'Falha ao enviar o arquivo.'
    } catch {
      erro.value = 'Falha ao enviar o arquivo.'
    }
  }

  xhr.onerror = () => {
    enviando.value = false
    erro.value = 'Falha de rede ao enviar o arquivo.'
  }

  xhr.send(form)
}
</script>

<style scoped>
.media-field { display: grid; gap: 8px; }
.media-label { color: #cdd0db; font-size: 13px; font-weight: 700; }
.dropzone {
  display: flex; align-items: center; justify-content: center;
  min-height: 140px; padding: 14px;
  border: 1px dashed #303544; border-radius: 12px;
  background: #0b0d12; cursor: pointer; transition: border-color .15s, background .15s;
}
.dropzone:hover { border-color: #8b7cf6; }
.dropzone.dragging { border-color: #8b7cf6; background: #12142090; }
.dropzone.erro { border-color: #a82e42; }
.preview { max-width: 100%; max-height: 150px; object-fit: contain; }
.vazio { display: grid; justify-items: center; gap: 8px; color: #6f7488; font-size: 13px; text-align: center; }
.vazio svg { width: 28px; height: 28px; }
.progresso { display: grid; gap: 8px; justify-items: center; width: 80%; color: #a9a6ba; font-size: 12px; }
.barra { width: 100%; height: 6px; border-radius: 99px; background: #22263a; overflow: hidden; }
.barra-fill { height: 100%; background: linear-gradient(90deg, #8b7cf6, #6657d8); transition: width .2s; }
.input-oculto { display: none; }
.erro-msg { color: #ef6a86; font-size: 12px; }
.hint { color: #6f7488; font-size: 12px; }
.acoes { display: flex; gap: 14px; }
.link-btn {
  display: inline-flex; align-items: center; gap: 5px;
  border: 0; background: none; color: #a78bfa; cursor: pointer; font-size: 12px; font-weight: 700;
}
.url-input {
  width: 100%; padding: 9px 11px;
  border: 1px solid #303544; border-radius: 8px;
  background: #0b0d12; color: #fff; font: inherit; font-size: 13px;
}
</style>
```

- [ ] **Step 2: Confirmar que o projeto compila com o componente novo**

Run: `npm run build`
Expected: build termina sem erro e imprime `.output/server/index.mjs`

- [ ] **Step 3: Commit**

```bash
git add app/components/admin/MediaField.vue
git commit -m "feat: componente MediaField com drag and drop, preview e progresso"
```

---

## Task 5: Abas em `/admin/visual`

**Files:**
- Modify: `app/pages/admin/visual.vue`

- [ ] **Step 1: Adicionar o estado das abas ao script**

Em `app/pages/admin/visual.vue`, dentro do `<script setup>`, logo depois da linha
`const { loadAppConfig, applyTheme } = useVisualConfig()`, acrescente:

```typescript
const TABS = [
  { key: 'marca', label: 'Marca', icon: 'ph:identification-card-bold' },
  { key: 'cores', label: 'Cores', icon: 'ph:palette-bold' },
  { key: 'textos', label: 'Textos', icon: 'ph:text-aa-bold' },
  { key: 'links', label: 'Links', icon: 'ph:link-bold' },
  { key: 'midia', label: 'Mídia', icon: 'ph:image-square-bold' },
  { key: 'recursos', label: 'Recursos', icon: 'ph:toggle-right-bold' },
  { key: 'menu', label: 'Menu', icon: 'ph:list-bold' },
  { key: 'manutencao', label: 'Manutenção', icon: 'ph:wrench-bold' }
] as const

const route = useRoute()
const router = useRouter()

// A aba ativa vive na query, entao reload e link compartilhado caem na aba certa.
const abaAtiva = computed({
  get: () => {
    const tab = String(route.query.tab || '')
    return TABS.some(item => item.key === tab) ? tab : 'marca'
  },
  set: (value: string) => {
    router.replace({ query: { ...route.query, tab: value } })
  }
})

const limpandoMidia = ref(false)

const limparMidias = async () => {
  limpandoMidia.value = true
  try {
    const result = await adminFetch<{ removidos: number; espacoLiberado: number }>(
      '/api/media/cleanup',
      { method: 'POST' }
    )
    notify(
      result.removidos
        ? `${result.removidos} mídia(s) removida(s).`
        : 'Nenhuma mídia não usada encontrada.'
    )
  } catch (error: any) {
    notify(error?.data?.message || 'Erro ao limpar mídias.', 'error')
  } finally {
    limpandoMidia.value = false
  }
}
```

- [ ] **Step 2: Trocar o corpo do template pelas abas**

Substitua todo o bloco `<template v-else> ... </template>` (dos painéis) por:

```vue
      <template v-else>
        <nav class="tabs">
          <button
            v-for="tab in TABS"
            :key="tab.key"
            class="tab"
            :class="{ ativa: abaAtiva === tab.key }"
            @click="abaAtiva = tab.key"
          >
            <Icon :name="tab.icon" /> {{ tab.label }}
          </button>
        </nav>

        <section v-show="abaAtiva === 'marca'" class="panel">
          <h2>Marca e metadados</h2>
          <div class="form-grid">
            <label v-for="field in brandFields" :key="field.key" class="field" :class="{ wide: field.wide }">
              <span>{{ field.label }}</span>
              <textarea v-if="field.multiline" v-model="draft.brand[field.key]" rows="3" />
              <input v-else v-model="draft.brand[field.key]" :placeholder="field.placeholder" />
            </label>
          </div>
          <p class="hint">O logo e o favicon ficam na aba Mídia.</p>
        </section>

        <section v-show="abaAtiva === 'cores'" class="panel">
          <h2>Cores do tema</h2>
          <div class="color-grid">
            <label v-for="field in themeFields" :key="field.key" class="color-field">
              <span>{{ field.label }}</span>
              <div>
                <input v-model="draft.theme[field.key]" type="color" />
                <input v-model="draft.theme[field.key]" class="color-text" maxlength="30" />
              </div>
            </label>
          </div>
        </section>

        <section v-show="abaAtiva === 'textos'" class="panel">
          <h2>Textos</h2>
          <div class="form-grid">
            <label v-for="field in contentFields" :key="field.key" class="field">
              <span>{{ field.label }}</span>
              <input v-model="draft.content[field.key]" />
            </label>
          </div>
        </section>

        <section v-show="abaAtiva === 'links'" class="panel">
          <h2>Links</h2>
          <div class="form-grid">
            <label v-for="field in linkFields" :key="field.key" class="field">
              <span>{{ field.label }}</span>
              <input v-model="draft.links[field.key]" type="url" placeholder="https://..." />
            </label>
          </div>
        </section>

        <section v-show="abaAtiva === 'midia'" class="panel">
          <div class="panel-head">
            <h2>Mídia</h2>
            <button class="ghost-btn" :disabled="limpandoMidia" @click="limparMidias">
              <Icon name="ph:broom-bold" />
              {{ limpandoMidia ? 'Limpando...' : 'Limpar mídias não usadas' }}
            </button>
          </div>

          <div class="media-grid">
            <AdminMediaField v-model="draft.brand.logo" label="Logo" />
            <AdminMediaField v-model="draft.brand.favicon" label="Favicon" />
            <AdminMediaField v-model="draft.images.blocked" label="Imagem de bloqueio" />
            <AdminMediaField v-model="draft.images.premium" label="Imagem premium" />
            <AdminMediaField v-model="draft.images.live" label="Imagem da live" />
          </div>

          <div class="banners-head">
            <h3>Banners</h3>
            <button class="ghost-btn" @click="draft.images.banners.push('')">
              <Icon name="ph:plus-bold" /> Adicionar banner
            </button>
          </div>

          <div class="media-grid">
            <div v-for="(_, index) in draft.images.banners" :key="index" class="banner-item">
              <AdminMediaField v-model="draft.images.banners[index]" :label="`Banner ${index + 1}`" />
              <button class="icon-btn" title="Remover banner" @click="draft.images.banners.splice(index, 1)">
                <Icon name="ph:trash-bold" />
              </button>
            </div>
          </div>
        </section>

        <section v-show="abaAtiva === 'recursos'" class="panel">
          <h2>Recursos visíveis</h2>
          <div class="toggle-grid">
            <label v-for="field in featureFields" :key="field.key" class="toggle">
              <input v-model="draft.features[field.key]" type="checkbox" />
              <span>{{ field.label }}</span>
            </label>
          </div>
        </section>

        <section v-show="abaAtiva === 'menu'" class="panel">
          <div class="panel-head">
            <h2>Menu</h2>
            <button class="ghost-btn" @click="addMenuItem"><Icon name="ph:plus-bold" /> Adicionar</button>
          </div>
          <div class="menu-list">
            <div v-for="(item, index) in draft.menu" :key="index" class="menu-row">
              <input v-model="item.key" placeholder="chave" />
              <input v-model="item.label" placeholder="Nome" />
              <input v-model="item.icon" placeholder="ph:house-bold" />
              <input v-model.number="item.order" type="number" min="0" placeholder="Ordem" />
              <button class="icon-btn" title="Remover" @click="draft.menu.splice(index, 1)"><Icon name="ph:trash-bold" /></button>
            </div>
          </div>
        </section>

        <section v-show="abaAtiva === 'manutencao'" class="panel maintenance-panel">
          <h2>Modo de manutenção</h2>
          <label class="toggle danger"><input v-model="draft.maintenance.active" type="checkbox" /><span>Bloquear o app para visitantes</span></label>
          <div class="form-grid">
            <label class="field"><span>Título</span><input v-model="draft.maintenance.title" /></label>
            <label class="field"><span>Mensagem</span><input v-model="draft.maintenance.message" /></label>
          </div>
        </section>

        <div class="bottom-actions">
          <button class="primary-btn" :disabled="saving" @click="saveConfig">
            <Icon name="ph:floppy-disk-bold" /> {{ saving ? 'Salvando...' : 'Salvar alterações' }}
          </button>
        </div>
      </template>
```

> `v-show` e não `v-if`: mantém o estado dos campos das outras abas montado, então
> trocar de aba nunca perde edição não salva.

> O componente é referenciado como `AdminMediaField` porque o Nuxt gera o nome a
> partir da pasta: `app/components/admin/MediaField.vue` → `AdminMediaField`.

- [ ] **Step 3: Remover os campos de logo e favicon da aba Marca**

Em `brandFields`, no `<script setup>`, apague as duas últimas entradas para que
não apareçam duplicados (agora vivem na aba Mídia):

```typescript
const brandFields: Array<{ key: BrandKey; label: string; placeholder?: string; multiline?: boolean; wide?: boolean }> = [
  { key: 'name', label: 'Nome do app' },
  { key: 'keywords', label: 'Palavras-chave' },
  { key: 'description', label: 'Descrição', multiline: true, wide: true }
]
```

- [ ] **Step 4: Adicionar o CSS das abas e da grade de mídia**

Acrescente ao `<style scoped>` da página:

```css
.tabs { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 18px; }
.tab {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 10px 15px; border: 1px solid #252936; border-radius: 10px;
  background: #11131a; color: #9095a5; cursor: pointer; font: inherit; font-size: 13px; font-weight: 700;
  transition: border-color .15s, color .15s, background .15s;
}
.tab:hover { color: #dcdff0; border-color: #343847; }
.tab.ativa { border-color: #8b7cf6; background: #171531; color: #fff; }
.media-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px; }
.banners-head { display: flex; align-items: center; justify-content: space-between; margin: 26px 0 14px; }
.banners-head h3 { font-size: 15px; }
.banner-item { position: relative; }
.banner-item .icon-btn { position: absolute; top: 26px; right: 8px; width: 30px; height: 30px; }
@media (max-width: 980px) { .media-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 640px) { .media-grid { grid-template-columns: 1fr; } }
```

- [ ] **Step 5: Confirmar que compila**

Run: `npm run build`
Expected: build sem erro

- [ ] **Step 6: Commit**

```bash
git add app/pages/admin/visual.vue
git commit -m "feat: navegacao por abas em /admin/visual com aba de midia"
```

---

## Task 6: Verificação end-to-end no navegador

**Files:**
- Create: `scripts/verify/06-navegador.mjs`

- [ ] **Step 1: Escrever o roteiro de navegador**

Crie `scripts/verify/06-navegador.mjs`:

```javascript
import assert from 'node:assert/strict'
import { chromium } from 'playwright-core'

const BASE = process.env.APP_URL || 'http://localhost:3098'
const CHROME = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'

const browser = await chromium.launch({ executablePath: CHROME, headless: true })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 950 } })
const page = await ctx.newPage()

const erros = []
page.on('pageerror', e => erros.push(String(e)))
page.on('console', m => { if (m.type() === 'error') erros.push(m.text()) })

// login + reload (a pagina so carrega o config apos o reload)
await page.goto(`${BASE}/admin/visual`, { waitUntil: 'domcontentloaded', timeout: 120000 })
await page.waitForTimeout(4000)
const email = page.locator('input[type=email]').first()
if (await email.count() && await email.isVisible().catch(() => false)) {
  await email.fill('devhypegaming@gmail.com')
  await page.locator('input[type=password]').first().fill('Rainha@Adm2026')
  await page.locator('button[type=submit]').first().click()
  await page.waitForTimeout(3000)
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 120000 })
}
await page.locator('.tabs').waitFor({ timeout: 60000 })

// 1. oito abas
assert.equal(await page.locator('.tab').count(), 8, 'deveria haver 8 abas')

// 2. a aba ativa sobrevive ao reload
await page.locator('.tab', { hasText: 'Mídia' }).click()
await page.waitForTimeout(500)
assert.match(page.url(), /tab=midia/, 'a aba ativa deveria ir para a query')
await page.reload({ waitUntil: 'domcontentloaded', timeout: 120000 })
await page.locator('.media-grid').first().waitFor({ timeout: 60000 })
assert.ok(
  await page.locator('.tab.ativa', { hasText: 'Mídia' }).count(),
  'apos o reload a aba Midia deveria continuar ativa'
)

// 3. upload por clique (input file) no campo Logo
const logo = page.locator('.media-field', { hasText: 'Logo' }).first()
await logo.locator('input[type=file]').setInputFiles({
  name: 'logo-teste.png',
  mimeType: 'image/png',
  buffer: Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52
  ])
})
await logo.locator('img.preview').waitFor({ timeout: 30000 })
const src = await logo.locator('img.preview').getAttribute('src')
assert.match(src, /^\/api\/media\/[a-f0-9]{24}$/, 'o preview deveria apontar para a midia enviada')

// 4. arquivo invalido mostra erro inline
const favicon = page.locator('.media-field', { hasText: 'Favicon' }).first()
await favicon.locator('input[type=file]').setInputFiles({
  name: 'fake.png',
  mimeType: 'image/png',
  buffer: Buffer.from('isto nao e imagem', 'utf8')
})
await favicon.locator('.erro-msg').waitFor({ timeout: 30000 })

// 5. salvar e conferir que persistiu
await page.locator('.visual-topbar .primary-btn').click()
await page.waitForTimeout(4000)

const config = await page.evaluate(async () => (await (await fetch('/api/app-config')).json()).data)
assert.equal(config.brand.logo, src, 'o logo salvo deveria ser a midia enviada')

// 6. a home mostra a imagem enviada
await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded', timeout: 120000 })
await page.waitForTimeout(5000)
const logoNaHome = await page.evaluate(() =>
  [...document.querySelectorAll('img')].map(img => img.getAttribute('src'))
)
assert.ok(
  logoNaHome.some(s => s && s.startsWith('/api/media/')),
  'a home deveria carregar o logo vindo de /api/media'
)

await page.screenshot({ path: 'verify-home.png' })
assert.equal(erros.length, 0, `erros de console: ${erros.join(' | ')}`)

console.log('OK: 06-navegador')
await browser.close()
```

- [ ] **Step 2: Rodar o roteiro**

Run: `node scripts/verify/06-navegador.mjs`
Expected: `OK: 06-navegador` e o arquivo `verify-home.png` gerado

Se `playwright-core` não estiver disponível, instale fora do projeto:
`mkdir -p /tmp/pw && cd /tmp/pw && npm init -y && npm i playwright-core`, e rode o
script a partir de lá com `APP_URL` apontando para o app.

- [ ] **Step 3: Rodar a suíte inteira**

Run:
```bash
node scripts/verify/01-validacao.mjs && \
node scripts/verify/02-servir.mjs && \
node scripts/verify/03-orfaos.mjs && \
node scripts/verify/06-navegador.mjs
```
Expected: os quatro `OK:`

- [ ] **Step 4: Commit**

```bash
git add scripts/verify/06-navegador.mjs
git commit -m "test: verificacao end-to-end do upload de midia no navegador"
```

---

## Task 7: Documentação

**Files:**
- Modify: `docs/deploy-vps.md`

- [ ] **Step 1: Registrar o impacto da mídia no banco**

Em `docs/deploy-vps.md`, logo depois da seção "Criar o usuário do Mongo (se ainda
não existir)", acrescente:

```markdown
### Mídia do painel

As imagens enviadas pelo painel `/admin/visual` (logo, favicon, banners) ficam no
próprio MongoDB, no bucket GridFS `media` — não em disco. Isso é proposital: o
deploy roda `git reset --hard` + `npm run build`, o que apagaria qualquer arquivo
escrito em `public/` em tempo de execução.

Duas consequências operacionais:

- **O backup do banco já inclui as imagens.** Não existe pasta de uploads separada
  para copiar.
- **O banco cresce com as mídias.** O painel tem um botão "Limpar mídias não usadas"
  na aba Mídia, e a limpeza também roda sozinha a cada save do config. Só remove
  arquivo com mais de 1 hora que nenhum campo referencia.
```

- [ ] **Step 2: Commit**

```bash
git add docs/deploy-vps.md
git commit -m "docs: registra o armazenamento de midia no GridFS no tutorial de deploy"
```

---

## Cobertura do spec

| Requisito do spec | Task |
|---|---|
| GridFS bucket `media`, helper com `getMediaBucket` | 1 |
| Validação: 5 MB, tipos permitidos, magic bytes | 1 |
| `POST /api/media` com `requireAdmin` | 1 |
| `GET /api/media/[id]` público, stream, 404/400 | 2 |
| Cache 1 ano immutable + ETag/304 | 2 |
| Headers de segurança do SVG (`nosniff`, CSP) | 2 |
| `collectMediaIds` sobre os 6 campos de mídia | 3 |
| `cleanupOrphanMedia` lendo o config do banco, janela de 1 h | 3 |
| Gatilho automático no `PUT /api/app-config`, sem derrubar o save | 3 |
| `POST /api/media/cleanup` (gatilho manual) | 3 |
| `MediaField` com drag/drop, clique, preview, progresso, erro, limpar, escape hatch de URL | 4 |
| Oito abas com estado na query string | 5 |
| Aba Mídia agrupando logo, favicon, bloqueio, premium, live e banners | 5 |
| Botão "Limpar mídias não usadas" | 5 |
| Compatibilidade com caminhos antigos (`/media/*.svg`) | 4 (o `MediaField` usa o valor direto como `src`) |
| Verificação manual pelo navegador | 6 |
