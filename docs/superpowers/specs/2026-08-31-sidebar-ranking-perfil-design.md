# Estrutura padrão Jheffy: sidebar, ranking e perfil

Data: 2026-08-31
Branch: `feat/upload-midia-admin`
Status: aprovado, aguardando plano de implementação

## Objetivo

Adotar a estrutura de navegação do Jheffy no MR Cartas: uma sidebar persistente
com identidade, dados do usuário, saldo e navegação; uma área de Ranking; e uma
área de Perfil.

O que **não** está no escopo: trocar a paleta de cores (mantém a de produção),
copiar código do Jheffy verbatim, e portar o subsistema de gamificação
(conquistas, desafio semanal, favoritos).

## Contexto

O Jheffy e o MR Cartas descendem da mesma base: os 15 tokens de tema têm nomes
idênticos. A divergência é estrutural, não estética.

| | Jheffy | MR Cartas |
|---|---|---|
| Home | 285 linhas, composta de peças | 1624 linhas, monolítica |
| Componentes de UI | 17 extraídos | 3 |
| Navegação | `AppSidebar` + `AppMobileHeader` | inline na home |
| Backend | API separada (`jheffy/api`) | Nitro no mesmo app + Mongo |

O MR Cartas já tem, e vamos reaproveitar em vez de portar:

- `appConfig.nav` com `key`/`label`/`icon`/`order` — `shared/appConfig.ts:182`
- `appConfig.features` incluindo `ranking` — `shared/appConfig.ts`
- `useAuth` expondo `user`, `isAuthenticated`, `balance` — `app/composables/useAuth.ts:181`
- `useDeposit` com o fluxo PIX
- `useVisualConfig` aplicando o tema no DOM
- coleção `deposits` e dados de atividade em Mongo

## Restrição de estilo

Cada componente novo segue as convenções de acabamento do Jheffy:

- superfícies usam os tokens do tema (`var(--card-bg)`, `var(--text-main)`…),
  nunca hex cravado — o painel `/admin/visual` precisa controlá-las;
- transição só em `transform`, com `cubic-bezier(.16, 1, .3, 1)`;
- `:focus-visible` visível em toda peça interativa;
- bloco `@media (prefers-reduced-motion: reduce)` neutralizando o movimento.

A escala `--sp-1..--sp-12` do Jheffy **não** será portada: tem zero uso no código
deles.

## Arquitetura

O projeto ainda não usa `layouts/`. A sidebar entra num layout, não no `app.vue`,
para que `/admin/*` não a herde.

```
app/layouts/default.vue     <- shell: AppSidebar + AppMobileHeader + <slot/>
app/layouts/bare.vue        <- sem cromo; usado por /auth/login
app/pages/admin/*           <- definePageMeta({ layout: 'bare' })
```

`app.vue` mantém o que já faz (bootstrap visual, manutenção, modais globais) e
passa a renderizar `<NuxtLayout><NuxtPage /></NuxtLayout>`.

### Componentes novos

| Componente | Responsabilidade | Depende de |
|---|---|---|
| `AppSidebar.vue` | identidade, card de usuário, card de saldo, nav, sair | `useAuth`, `useDeposit`, `useVisualConfig`, `useSidebarDrawer` |
| `AppMobileHeader.vue` | topo mobile, abre o drawer | `useVisualConfig`, `useSidebarDrawer` |
| `AppNavList.vue` | lista de itens a partir de `appConfig.nav` | `useVisualConfig` |
| `RankingList.vue` | lista com pódio, skeleton e vazio | props |

### Composable novo

`useSidebarDrawer` — estado `open` compartilhado, `openDrawer`/`closeDrawer`,
fecha na navegação e com `Escape`. Único estado novo da Fase 1.

## Fase 1 — Sidebar + header mobile

A sidebar reproduz a do Jheffy: logo (com fallback para iniciais quando a imagem
falha), card de usuário com nome, e-mail e botão de atualizar saldo, card de
saldo com CTA "Depositar PIX", seção NAVEGAÇÃO e botão Sair.

Fonte dos dados, toda já existente:

| Elemento | Origem |
|---|---|
| Logo / nome | `appConfig.brand` |
| Nome, e-mail | `useAuth().user` |
| Saldo | `useAuth().balance` |
| Depositar | `useDeposit()` |
| Itens de nav | `appConfig.nav` filtrado por `appConfig.features` |

Regras:

- itens de nav vêm do config, ordenados por `order`, ocultos quando a feature
  correspondente estiver `false` — nada hardcoded;
- desktop: sidebar fixa; mobile: drawer sobre overlay, fechando ao navegar;
- enquanto o saldo carrega, mostrar skeleton — nunca `R$ 0,00` provisório;
- deslogado, a sidebar mostra CTA de login no lugar dos cards de usuário e saldo.

### Conflito com o aside atual da home

A home já tem um `<aside class="sidebar">` de 280px (`app/pages/index.vue:64`)
com o CTA de assinar e os cards de notícia. Com a nav sidebar à esquerda, seriam
duas colunas laterais — e a referência do Jheffy não tem coluna direita.

Decisão: **o aside atual é preservado como coluna direita**, não removido. Ele
carrega conteúdo de negócio (assinatura e notícias) que não existe em outro
lugar; apagá-lo seria perda de função, não simplificação. Em telas menores que
1200px ele passa a fluir abaixo do conteúdo principal, como já faz hoje.

Se o objetivo for a home visualmente idêntica à do Jheffy — banner e trilhos de
jogos, sem coluna direita — esse conteúdo precisa de novo endereço antes, e isso
é uma decisão de produto fora desta fase.

A classe `.sidebar` da home é `scoped`, então não colide com `AppSidebar`. Ainda
assim, renomear para `.home-aside` durante a Fase 1 evita confusão futura.

A home **não** será reescrita nesta fase. Ela perde apenas o cabeçalho e a
navegação inline que a sidebar passa a cobrir.

## Fase 2 — Ranking

Página `/ranking`, exibida no nav quando `features.ranking` estiver ativa.

Dois modos, como no Jheffy: **atividade** e **depósitos**. Períodos: 7 dias,
30 dias, todos.

### Endpoint

`GET /api/ranking?mode=activity|deposits&period=7d|30d|all`

Público (não exige admin), agregando no Mongo as coleções que hoje só o painel
lê. Retorna no máximo 50 posições.

### Privacidade

O ranking é público e os dados são de pessoas reais. Portanto:

- nome mascarado: primeiro nome + inicial do sobrenome (`Thiago E.`);
- nunca retornar e-mail, telefone ou ID do jogador;
- no modo depósitos, retornar valor agregado do período, nunca transações;
- o próprio usuário vê sua posição destacada, com o nome completo apenas na
  linha dele.

### Banner

A área reaproveita os banners com `placement: 'ranking'` que já existem no
config e já são administráveis em `/admin/visual:165`. Sem banner ativo, não
renderizar container — o doc de migração exige não deixar espaço vazio.

## Fase 3 — Perfil enxuto

Página `/perfil`. **Não** porta as 1110 linhas do Jheffy: nove dos composables
que ela usa (`useAchievements`, `useFavoriteGames`, `useGameActivity`,
`useMyRankPositions`, `useUserEngagement`, `useSlugWeeklyChallenge`,
`useAvatarUrl`, `useAppPrefs`, `usePush`) não existem aqui e cada um exigiria
backend próprio.

Escopo: o visual do Jheffy sobre os dados que o MR Cartas já tem.

- nome, e-mail, telefone;
- saldo, com o mesmo CTA de depósito da sidebar;
- primeiro e último acesso (já gravados por `/api/activity/login`);
- posição no ranking, se a Fase 2 estiver no ar;
- botão de notificações, reusando a lógica de `NotificationPrompt.vue`;
- sair.

Sem endpoint novo: tudo vem de `useAuth` e de `/api/activity`.

## Erros e estados

Cada área carrega três estados explícitos: carregando (skeleton), vazio (texto
orientando o que fazer) e erro (mensagem + botão de tentar de novo). Falha no
ranking não pode derrubar a página — a seção degrada sozinha.

A sidebar nunca depende de rede para renderizar: sem saldo, mostra skeleton;
sem usuário, mostra CTA de login.

## Verificação

Cada fase só fecha com:

1. `npm run build` sem erro;
2. app rodando, navegado de verdade em 360px e 1440px;
3. sidebar: navegar por todos os itens, abrir/fechar o drawer, depositar,
   sair;
4. ranking: os três períodos e os dois modos, incluindo o estado vazio;
5. perfil: com e sem telefone cadastrado;
6. `/admin/*` **sem** a sidebar do usuário;
7. mudar uma cor em `/admin/visual` e confirmar que as peças novas acompanham.

## Ordem

Fase 1 → verificar → commit. Fase 2 → verificar → commit. Fase 3 → verificar →
commit. Cada fase é um commit próprio e independente; parar depois de qualquer
uma delas deixa o app íntegro.
