# Configuração visual pelo banco — app único

Este documento explica como reaproveitar a ideia do projeto JHEFFY em outro
frontend, mas com uma arquitetura mais simples: **um único aplicativo, uma única
marca e uma única configuração global**.

Não há múltiplos slugs, tenants ou marcas. O frontend sempre busca o mesmo
documento de configuração.

## Objetivo

Permitir que cores, textos, imagens, links, menus e conteúdos sejam alterados no
painel administrativo, sem editar ou recompilar o frontend.

O fluxo recomendado é:

```text
Painel administrativo
        ↓ PUT /api/app-config (JWT de admin)
Backend Fastify
        ↓
MongoDB: app_config
        ↑ GET /api/app-config (público)
Frontend
        ↓
Aplica cores, imagens, textos, links e recursos habilitados
```

O frontend não acessa o MongoDB diretamente. Toda leitura e alteração passa
pela API.

## O que remover da arquitetura atual

No projeto exclusivo, não é necessário manter:

- campo `slug` na configuração;
- campo `isDefault`;
- seleção de slug no painel;
- slug na URL, como `/esportiva/...`;
- parâmetro `?slug=esportiva` nas consultas;
- endpoint `/api/slugs/:slug/theme`;
- coleção de configuração com um documento por marca.

Em vez disso, haverá um único documento na coleção `app_config` e um endpoint
fixo:

```http
GET /api/app-config
```

## Estrutura sugerida no MongoDB

O documento pode ser organizado por responsabilidade:

```json
{
  "appId": "main",
  "brand": {
    "name": "Nome do App",
    "description": "Descrição usada no site e nos metadados",
    "keywords": "jogos, sinais, conteúdo",
    "logo": "/uploads/brand/logo.png",
    "favicon": "/uploads/brand/favicon.png"
  },
  "theme": {
    "colorPrimary": "#2ab885",
    "colorPrimaryDark": "#1e8a64",
    "colorSecondary": "#2ab885",
    "colorSecondaryDark": "#1e8a64",
    "bgDark": "#000000",
    "bgDarker": "#000000",
    "cardBg": "#101010",
    "inputBg": "#101012",
    "componentBg": "#121214",
    "cardBorder": "#242428",
    "textMain": "#ffffff",
    "textMuted": "#8f8f9c",
    "colorGold": "#ffd700",
    "colorFire": "#ffaa00",
    "colorDanger": "#ff4757"
  },
  "content": {
    "heroTitle": "Conteúdos e ferramentas exclusivas",
    "heroSubtitle": "Escolha uma opção para começar",
    "premiumTitle": "IA PREMIUM",
    "liveTitle": "LIVE DE ALAVANCAGEM",
    "supportTitle": "Precisa liberar seu acesso?",
    "supportMessage": "Fale com o suporte para verificar sua conta.",
    "unlockButton": "Desbloquear acesso",
    "accessButton": "Acessar agora"
  },
  "images": {
    "banners": [
      "/uploads/brand/banner-1.webp",
      "/uploads/brand/banner-2.webp"
    ],
    "blocked": "/uploads/brand/blocked.webp",
    "premium": "/uploads/brand/premium.webp",
    "live": "/uploads/brand/live.webp"
  },
  "links": {
    "register": "https://exemplo.com/cadastro",
    "checkout": "https://exemplo.com/checkout",
    "whatsappSupport": "https://wa.me/5500000000000",
    "whatsappCommunity": "",
    "telegram": "",
    "instagram": "",
    "site": ""
  },
  "features": {
    "home": true,
    "games": true,
    "lessons": true,
    "ranking": true,
    "links": true,
    "management": true,
    "live": true
  },
  "menu": [
    { "key": "home", "label": "Início", "icon": "home", "order": 1 },
    { "key": "games", "label": "Jogos", "icon": "game", "order": 2 },
    { "key": "lessons", "label": "Aulas", "icon": "play", "order": 3 },
    { "key": "ranking", "label": "Ranking", "icon": "ranking", "order": 4 }
  ],
  "maintenance": {
    "active": false,
    "title": "Em manutenção",
    "message": "Estamos realizando melhorias. Voltamos em breve."
  }
}
```

O campo `appId: "main"` é fixo. Ele garante que exista apenas uma configuração,
sem depender do ID interno criado pelo MongoDB.

## Model Mongoose sugerido

Arquivo sugerido: `api/src/models/AppConfig.ts`.

```ts
import mongoose, { Schema } from 'mongoose'

const ThemeSchema = new Schema({
  colorPrimary: { type: String, default: '#2ab885' },
  colorPrimaryDark: { type: String, default: '#1e8a64' },
  colorSecondary: { type: String, default: '#2ab885' },
  colorSecondaryDark: { type: String, default: '#1e8a64' },
  bgDark: { type: String, default: '#000000' },
  bgDarker: { type: String, default: '#000000' },
  cardBg: { type: String, default: '#101010' },
  inputBg: { type: String, default: '#101012' },
  componentBg: { type: String, default: '#121214' },
  cardBorder: { type: String, default: '#242428' },
  textMain: { type: String, default: '#ffffff' },
  textMuted: { type: String, default: '#8f8f9c' },
  colorGold: { type: String, default: '#ffd700' },
  colorFire: { type: String, default: '#ffaa00' },
  colorDanger: { type: String, default: '#ff4757' }
}, { _id: false })

const MenuItemSchema = new Schema({
  key: { type: String, required: true, trim: true },
  label: { type: String, required: true, trim: true },
  icon: { type: String, default: '' },
  order: { type: Number, default: 0 }
}, { _id: false })

const AppConfigSchema = new Schema({
  appId: {
    type: String,
    required: true,
    unique: true,
    default: 'main'
  },
  brand: {
    name: { type: String, default: 'App' },
    description: { type: String, default: '' },
    keywords: { type: String, default: '' },
    logo: { type: String, default: null },
    favicon: { type: String, default: null }
  },
  theme: { type: ThemeSchema, default: () => ({}) },
  content: { type: Schema.Types.Mixed, default: () => ({}) },
  images: {
    banners: { type: [String], default: [] },
    blocked: { type: String, default: null },
    premium: { type: String, default: null },
    live: { type: String, default: null }
  },
  links: { type: Schema.Types.Mixed, default: () => ({}) },
  features: { type: Schema.Types.Mixed, default: () => ({}) },
  menu: { type: [MenuItemSchema], default: [] },
  maintenance: {
    active: { type: Boolean, default: false },
    title: { type: String, default: 'Em manutenção' },
    message: { type: String, default: '' }
  }
}, { timestamps: true, collection: 'app_config' })

export const AppConfigModel = mongoose.model('AppConfig', AppConfigSchema)
```

Para um projeto maior, prefira schemas tipados também para `content`, `links` e
`features`. `Schema.Types.Mixed` é útil na primeira versão, mas aceita qualquer
formato e oferece menos validação.

## Endpoints

### Leitura pública

```http
GET /api/app-config
```

Resposta:

```json
{
  "success": true,
  "data": {
    "brand": {},
    "theme": {},
    "content": {},
    "images": {},
    "links": {},
    "features": {},
    "menu": [],
    "maintenance": {}
  }
}
```

### Alteração administrativa

```http
PUT /api/app-config
Authorization: Bearer TOKEN_ADMIN
Content-Type: application/json
```

O corpo pode conter apenas os grupos modificados:

```json
{
  "theme": {
    "colorPrimary": "#7c3aed"
  },
  "content": {
    "heroTitle": "Novo título"
  }
}
```

### Uploads

É mais simples manter endpoints separados para arquivos:

```http
POST   /api/app-config/logo
POST   /api/app-config/favicon
POST   /api/app-config/banners
DELETE /api/app-config/banners
POST   /api/app-config/blocked-image
POST   /api/app-config/premium-image
POST   /api/app-config/live-image
```

Todos os uploads e alterações devem exigir o JWT do administrador. Somente o
`GET /api/app-config` deve ser público.

## Implementação resumida das rotas

Arquivo sugerido: `api/src/routes/appConfig.ts`.

```ts
import type { FastifyInstance } from 'fastify'
import { AppConfigModel } from '../models/AppConfig.js'

const DEFAULT_CONFIG = {
  appId: 'main',
  brand: { name: 'App' },
  theme: {},
  content: {},
  images: { banners: [] },
  links: {},
  features: {},
  menu: [],
  maintenance: { active: false }
}

export default async function appConfigRoutes(fastify: FastifyInstance) {
  fastify.get('/', async (_request, reply) => {
    const config = await AppConfigModel.findOneAndUpdate(
      { appId: 'main' },
      { $setOnInsert: DEFAULT_CONFIG },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean()

    return reply.send({ success: true, data: config })
  })

  fastify.put('/', async (request, reply) => {
    const body = request.body as Record<string, unknown>

    // Não permita que o cliente altere identificadores internos.
    delete body._id
    delete body.appId
    delete body.createdAt
    delete body.updatedAt

    const config = await AppConfigModel.findOneAndUpdate(
      { appId: 'main' },
      { $set: body, $setOnInsert: { appId: 'main' } },
      { new: true, upsert: true, runValidators: true }
    ).lean()

    return reply.send({ success: true, data: config })
  })
}
```

Registre a rota no servidor:

```ts
await fastify.register(appConfigRoutes, { prefix: '/api/app-config' })
```

Na lista de rotas públicas, libere somente:

```ts
{ methods: ['GET'], test: (path) => path === '/api/app-config' }
```

> Importante: em uma implementação de produção, não use o corpo inteiro do
> request sem validação. Monte uma allowlist com os campos permitidos ou use um
> JSON Schema do Fastify para impedir propriedades inesperadas.

## Consumo no frontend

Crie um estado global chamado, por exemplo, `useAppConfig`. Ele deve carregar a
configuração uma vez durante a inicialização.

```ts
const appConfig = ref(null)

const CSS_VARIABLES = {
  colorPrimary: '--color-primary',
  colorPrimaryDark: '--color-primary-dark',
  colorSecondary: '--color-secondary',
  colorSecondaryDark: '--color-secondary-dark',
  bgDark: '--bg-dark',
  bgDarker: '--bg-darker',
  cardBg: '--card-bg',
  inputBg: '--input-bg',
  componentBg: '--component-bg',
  cardBorder: '--card-border',
  textMain: '--text-main',
  textMuted: '--text-muted',
  colorGold: '--color-gold',
  colorFire: '--color-fire',
  colorDanger: '--color-danger'
}

async function loadAppConfig() {
  const response = await fetch(`${API_BASE}/api/app-config`)
  if (!response.ok) throw new Error('Falha ao carregar configuração')

  const result = await response.json()
  appConfig.value = result.data

  for (const [key, cssVariable] of Object.entries(CSS_VARIABLES)) {
    const value = result.data.theme?.[key]
    if (value) document.documentElement.style.setProperty(cssVariable, value)
  }

  applyMetadata(result.data)
}
```

Metadados:

```ts
function applyMetadata(config) {
  document.title = config.brand.name || 'App'

  const favicon = resolveImageUrl(
    config.brand.favicon || config.brand.logo
  )

  if (favicon) {
    let element = document.querySelector('link[rel="icon"]')
    if (!element) {
      element = document.createElement('link')
      element.rel = 'icon'
      document.head.appendChild(element)
    }
    element.href = favicon
  }
}
```

Resolução dos uploads:

```ts
function resolveImageUrl(path) {
  if (!path) return null
  if (path.startsWith('/uploads')) return `${API_BASE}${path}`
  return path
}
```

## Como ligar os dados ao layout novo

O layout pode ser completamente diferente. Basta escolher qual campo alimenta
cada componente.

```vue
<template>
  <header>
    <img :src="logoUrl" :alt="config.brand.name">
  </header>

  <section class="hero">
    <h1>{{ config.content.heroTitle }}</h1>
    <p>{{ config.content.heroSubtitle }}</p>
  </section>

  <nav>
    <a
      v-for="item in visibleMenu"
      :key="item.key"
      :href="`/${item.key}`"
    >
      {{ item.label }}
    </a>
  </nav>
</template>
```

```ts
const visibleMenu = computed(() =>
  config.value.menu
    .filter(item => config.value.features[item.key] !== false)
    .sort((a, b) => a.order - b.order)
)
```

```css
body {
  background: var(--bg-dark);
  color: var(--text-main);
}

.hero {
  background: var(--component-bg);
  border: 1px solid var(--card-border);
}

.primary-button {
  background: var(--color-primary);
  color: var(--text-main);
}
```

O banco define **o conteúdo e a identidade**. O frontend define **a posição, o
tamanho, a responsividade e a experiência visual**.

## Catálogo de jogos sem slug

Se o novo app também utilizar jogos, remova o campo `slug` do model `Game` e
troque:

```http
GET /api/games?slug=esportiva&active=true
```

por:

```http
GET /api/games?active=true
```

A consulta do backend passa a ser:

```ts
const filter: Record<string, unknown> = {}

if (request.query.category) {
  filter.category = request.query.category
}

if (request.query.active !== undefined) {
  filter.active = request.query.active === 'true'
}

const games = await GameModel.find(filter).sort({ category: 1, order: 1 })
```

O cadastro do jogo continua contendo nome, imagem, categoria, ordem, status,
premium e dados necessários para abrir o jogo.

## Painel administrativo simplificado

O painel não precisa mais exibir uma seleção de projeto. Ao abrir, ele consulta
diretamente:

```js
async function loadConfig() {
  const { data } = await api('/api/app-config')
  currentConfig = data
  renderBrand()
  renderTheme()
  renderContent()
  renderFeatures()
  renderLinks()
  renderMenu()
}
```

Ao salvar:

```js
async function saveConfig(payload) {
  const { data } = await api('/api/app-config', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  currentConfig = data
}
```

O helper `api()` do painel deve continuar enviando:

```http
Authorization: Bearer TOKEN_ADMIN
```

## Alterações refletidas sem novo deploy

Podem ser atualizados somente pelo painel/banco:

- nome, descrição e favicon;
- logo, banners e imagens especiais;
- todas as cores do tema;
- textos cadastrados em `content`;
- links externos;
- itens e nomes do menu;
- visibilidade das páginas;
- modo de manutenção;
- jogos, imagens, ordem e disponibilidade.

Continuam sendo responsabilidade do código do frontend:

- estrutura das páginas;
- posição dos elementos;
- tamanhos e espaçamentos;
- responsividade;
- animações;
- comportamento de componentes;
- regras de autenticação e autorização.

Para que um novo elemento seja editável pelo painel, siga sempre o mesmo fluxo:

1. Adicione um campo ao model `AppConfig`.
2. Inclua esse campo na validação do `PUT /api/app-config`.
3. Adicione o controle correspondente no painel.
4. Leia o campo no componente do frontend.
5. Defina um valor padrão para o app não quebrar quando o campo estiver vazio.

## Cache e atualização

Na primeira versão, carregue a configuração ao abrir ou atualizar o app. Assim,
qualquer alteração feita no painel aparece após um F5.

Se for usar cache posteriormente:

- retorne `updatedAt` na API;
- use um tempo curto de cache;
- invalide o cache após salvar no painel;
- mantenha valores padrão no CSS e no frontend;
- não deixe o app parar de funcionar quando a API estiver temporariamente fora.

## Segurança

- O frontend nunca deve receber credenciais do MongoDB.
- Somente `GET /api/app-config` deve ser público.
- `PUT`, uploads e exclusões devem exigir JWT de administrador.
- Valide cores, URLs, textos, tipos e tamanhos dos arquivos no backend.
- Restrinja uploads a formatos permitidos, como PNG, JPEG e WebP.
- Não aceite propriedades arbitrárias no endpoint administrativo.
- Adicione o domínio do novo frontend à configuração de CORS da API.
- Não armazene tokens administrativos no código do frontend público.

## Checklist de implementação

- [ ] Criar o model `AppConfig` com `appId: "main"` único.
- [ ] Criar `GET /api/app-config` público.
- [ ] Criar `PUT /api/app-config` protegido.
- [ ] Criar endpoints protegidos de upload.
- [ ] Registrar as rotas no Fastify.
- [ ] Remover seleção e parâmetros de slug do painel.
- [ ] Criar `useAppConfig` ou store equivalente no frontend.
- [ ] Aplicar `theme` em variáveis CSS.
- [ ] Usar `brand`, `content`, `links`, `features` e `menu` nos componentes.
- [ ] Remover `slug` do model e das consultas de jogos.
- [ ] Configurar CORS para o domínio do novo frontend.
- [ ] Definir valores padrão para funcionamento sem API.
- [ ] Proteger e validar todas as alterações administrativas.

## Resumo

Para um aplicativo exclusivo, a unidade principal deixa de ser o `slug` e passa
a ser uma configuração fixa identificada por `appId: "main"`.

O contrato essencial do frontend fica reduzido a:

```http
GET /api/app-config
GET /api/games?active=true
```

O painel utiliza:

```http
PUT /api/app-config
POST /api/app-config/<tipo-de-imagem>
```

Com isso, o backend e o painel ficam mais simples, e qualquer frontend pode ter
um visual próprio sem perder a possibilidade de alterar identidade, conteúdo e
catálogo pelo banco.
