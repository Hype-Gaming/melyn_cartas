# Migração do APP MR Cartas para o padrão Jheffy

## Objetivo

Atualizar o APP MR Cartas para seguir a mesma estrutura de experiência, aquisição,
controle de acesso e administração usada no Jheffy, preservando os nomes atuais das
abas de jogos gratuitos e bloqueados.

O resultado esperado é um aplicativo em que o lead chega pela homepage, autentica-se
na casa, recebe o convite para ativar notificações, acessa a sala gratuita e precisa
ter o saldo mínimo definido para visualizar os sinais. Toda a operação cotidiana deve
ser controlável pelo painel administrativo, sem alteração manual no código.

---

## 1. Jornada do lead

### 1.1 Entrada pela homepage

1. O link de divulgação deve abrir a homepage pública da MR Cartas.
2. A homepage pode ser visualizada sem autenticação.
3. Ao clicar em um CTA ou em um conteúdo que exige conta, o visitante deve ser
   direcionado para a tela de login.
4. O destino pretendido deve ser preservado para que, depois do login, o usuário
   continue a jornada sem precisar procurar novamente o conteúdo.

### 1.2 Login

1. O usuário informa o login e a senha da casa de apostas.
2. Credenciais inválidas devem manter o usuário na tela e exibir uma mensagem clara.
3. Em caso de sucesso, criar a sessão e registrar:
   - e-mail;
   - telefone, quando disponível;
   - ID do jogador, quando disponível;
   - data e hora do primeiro acesso;
   - data e hora do último acesso.
4. Após autenticar, o usuário deve retornar ao destino original ou, quando ele não
   existir, para a homepage autenticada.

### 1.3 Convite para notificações

Depois do primeiro login bem-sucedido, exibir um pop-up próprio da MR Cartas com:

- título e explicação do benefício das notificações;
- botão **Ativar notificações**;
- botão **Agora não**.

Regras:

- solicitar a permissão nativa do navegador somente depois do clique em
  **Ativar notificações**;
- não abrir o pedido do navegador automaticamente durante o carregamento;
- não repetir o pop-up se a permissão já estiver concedida ou negada;
- se o usuário escolher **Agora não**, permitir nova tentativa depois de 7 dias;
- nunca sobrepor esse pop-up a outro modal.

---

## 2. Homepage e navegação

### 2.1 Abas de jogos

Os nomes atuais das abas que separam os jogos gratuitos e bloqueados devem ser
mantidos exatamente como estão na MR Cartas.

Não renomear essas abas durante a migração. A alteração deve ficar restrita à
estrutura, ao comportamento e ao visual necessários para aproximar o app do Jheffy.

### 2.2 Estado dos jogos

Cada jogo deve possuir um estado administrável:

- **Liberado:** pode ser aberto pelos usuários autorizados;
- **Bloqueado:** aparece visualmente bloqueado e não abre o conteúdo;
- **Oculto:** não aparece no aplicativo;
- **Em manutenção:** continua visível, mas informa indisponibilidade temporária.

O estado deve vir do backend/painel, e não de constantes espalhadas pelo frontend.

---

## 3. Sala gratuita e bloqueio dos sinais

Aplicar na sala gratuita o mesmo bloqueio visual por saldo adotado no Jheffy.

### Regra inicial

- saldo mínimo para visualizar os sinais: **R$ 10,00**;
- saldo igual ou superior a R$ 10,00: sinais visíveis normalmente;
- saldo inferior a R$ 10,00: esconder o conteúdo do sinal e mostrar o estado
  bloqueado;
- enquanto o saldo estiver sendo consultado, mostrar carregamento — nunca exibir o
  sinal por alguns instantes antes de bloqueá-lo;
- a regra é inicialmente visual e não deve impedir o carregamento do jogo, salvo se
  houver uma regra de negócio diferente configurada no painel.

### Copy recomendada

> Adicione pelo menos R$ 10,00 de saldo para liberar os sinais.

Também exibir o saldo atual, quando disponível, e um CTA **Depositar agora** que abre
o fluxo de depósito.

### Configuração administrativa

O painel deve permitir configurar:

- ativar ou desativar a trava por saldo;
- valor mínimo exigido;
- título e mensagem do bloqueio;
- texto e destino do CTA;
- aplicação global ou por sala/jogo.

Mesmo sendo uma trava visual na primeira versão, a configuração e a decisão devem
vir do servidor para evitar que o valor fique hardcoded em várias telas.

---

## 4. Banner na área de Ranking

Adicionar um espaço opcional de banner na área do Ranking.

O banner deve suportar:

- imagem para desktop;
- imagem para mobile;
- texto alternativo;
- link de destino;
- opção de abrir na mesma aba ou em nova aba;
- ativação/desativação;
- data e hora opcionais para início e término da exibição;
- ordem de exibição, caso exista mais de um banner.

Regras de interface:

- sem banner ativo, o Ranking não deve deixar espaço vazio;
- a imagem deve ser responsiva e não provocar deslocamento lateral;
- links externos devem ser validados e tratados com segurança;
- o painel deve oferecer pré-visualização antes da publicação.

---

## 5. Painel administrativo

### 5.1 Listagem de usuários

A tabela de usuários deve apresentar, no mínimo:

| Campo | Regra |
|---|---|
| E-mail | normalizado e pesquisável |
| Telefone | exibido quando existir; caso contrário, `—` |
| Primeiro acesso | primeira autenticação registrada, sem ser sobrescrita |
| Último acesso | atualizado a cada novo login/acesso válido |

Campos recomendados, seguindo o Jheffy:

- nome;
- ID do jogador;
- status da conta;
- quantidade de acessos;
- saldo conhecido mais recente;
- origem/campanha do lead, quando disponível.

### 5.2 Filtros

Adicionar filtro baseado na data de **primeiro acesso**:

- últimas 24 horas;
- últimos 7 dias;
- últimos 30 dias;
- período personalizado, recomendado;
- todos.

O filtro deve ser calculado no servidor e respeitar o fuso horário
`America/Sao_Paulo`. Deve funcionar em conjunto com busca por e-mail, telefone ou ID
do jogador e manter paginação e ordenação corretas.

### 5.3 Gestão dos jogos

O administrador deve conseguir, sem editar código:

- liberar, bloquear, ocultar ou colocar um jogo em manutenção;
- definir em qual aba o jogo aparece, sem alterar o nome das abas existentes;
- alterar título, imagem, ordem e descrição do card;
- alterar o link/rota do jogo;
- definir se exige login;
- ativar a trava de saldo e configurar o saldo mínimo por jogo;
- pré-visualizar a alteração antes de publicar.

Alterações de configuração não devem apagar o histórico nem remover fisicamente um
jogo. Utilizar estados reversíveis.

### 5.4 Gestão de banners e links

O administrador deve conseguir:

- enviar e substituir imagens de banner;
- configurar versões desktop e mobile;
- alterar link, texto alternativo, posição, ordem e período de exibição;
- ativar/desativar banners;
- configurar links de cadastro, depósito, suporte e redes sociais;
- testar o link antes de salvar.

Uploads devem validar formato e tamanho, gerar nomes seguros e armazenar somente a
URL/metadados na configuração. Não aceitar SVG ou HTML sem sanitização.

### 5.5 Personalização geral

Para que a MR Cartas não dependa de terceiros em mudanças rotineiras, disponibilizar
no painel:

- logo e favicon;
- cores principais do tema;
- textos da homepage e CTAs;
- banners e links;
- cards, ordem e disponibilidade dos jogos;
- textos dos estados bloqueado/manutenção;
- valor mínimo de saldo;
- pop-up de notificações;
- dados e link do suporte;
- modo manutenção do aplicativo.

Configurações sensíveis — URLs de API, segredos, tokens, credenciais e chaves de
push — continuam em variáveis de ambiente e não devem ser editáveis no painel.

### 5.6 Segurança e auditoria

- todas as rotas administrativas devem exigir sessão de administrador;
- validar permissões também no backend, nunca apenas pela interface;
- registrar administrador, ação, entidade alterada, valor anterior, valor novo e
  data/hora;
- salvar alterações como rascunho e publicar explicitamente quando aplicável;
- oferecer rollback para a última versão publicada das configurações;
- não registrar senhas, tokens ou cookies nos logs;
- uploads e links devem ser validados no servidor.

---

## 6. Modelo de dados sugerido

### Atividade do usuário

```ts
interface UserActivity {
  email: string
  phone: string | null
  name: string | null
  playerId: string | null
  firstAccessAt: Date
  lastAccessAt: Date
  accessCount: number
  createdAt: Date
  updatedAt: Date
}
```

O e-mail deve ser normalizado em lowercase. `firstAccessAt` é definido somente na
criação; `lastAccessAt` e `accessCount` são atualizados nos acessos seguintes.

### Configuração de jogo

```ts
interface ManagedGame {
  gameId: string
  title: string
  description: string | null
  imageUrl: string | null
  tabKey: string
  order: number
  status: 'enabled' | 'blocked' | 'hidden' | 'maintenance'
  requiresLogin: boolean
  signalBalanceGate: {
    enabled: boolean
    minimumBalance: number
    title: string
    message: string
    ctaLabel: string
    ctaUrl: string | null
  }
}
```

### Banner

```ts
interface ManagedBanner {
  placement: 'home' | 'ranking'
  desktopImageUrl: string
  mobileImageUrl: string | null
  altText: string
  targetUrl: string | null
  openInNewTab: boolean
  enabled: boolean
  order: number
  startsAt: Date | null
  endsAt: Date | null
}
```

---

## 7. Endpoints esperados

Os nomes podem ser adaptados ao padrão existente da MR Cartas, mantendo as mesmas
responsabilidades:

| Método | Rota | Finalidade |
|---|---|---|
| POST | `/api/activity/login` | registrar primeiro/último acesso e dados do usuário |
| GET | `/api/admin/users` | listar, buscar, filtrar e paginar usuários |
| GET | `/api/settings/public` | entregar configurações públicas publicadas |
| GET/POST/PATCH | `/api/admin/games` | administrar jogos e trava de saldo |
| GET/POST/PATCH | `/api/admin/banners` | administrar banners |
| GET/PATCH | `/api/admin/settings` | administrar textos, links e identidade |
| POST | `/api/admin/media` | upload validado de imagens |
| GET | `/api/admin/audit-log` | consultar histórico de alterações |

---

## 8. Critérios de aceite

### Jornada

- [ ] Link de divulgação abre a homepage pública.
- [ ] CTA protegido direciona visitante ao login.
- [ ] Após login, usuário retorna ao conteúdo que tentou abrir.
- [ ] Pop-up de notificações aparece depois do login e respeita a escolha do usuário.

### Sala gratuita

- [ ] Saldo abaixo de R$ 10,00 não revela nenhum trecho do sinal.
- [ ] Durante a consulta de saldo, aparece apenas o carregamento.
- [ ] Saldo igual ou superior a R$ 10,00 libera a visualização.
- [ ] CTA do bloqueio abre o depósito.
- [ ] Valor e textos podem ser alterados no painel.

### Ranking

- [ ] Banner opcional aparece corretamente em desktop e mobile.
- [ ] Sem banner ativo, não existe área vazia.
- [ ] Imagem, link, período e status são configuráveis no painel.

### Painel

- [ ] Lista mostra e-mail, telefone, primeiro acesso e último acesso.
- [ ] Filtros de 24h, 7d e 30d usam a data de primeiro acesso.
- [ ] Busca e filtros funcionam juntos com paginação.
- [ ] Admin consegue liberar, bloquear, ocultar e reordenar jogos.
- [ ] Nomes atuais das abas de jogos permanecem inalterados.
- [ ] Admin consegue trocar banners, links, textos e imagens sem deploy.
- [ ] Alterações administrativas possuem auditoria e opção segura de reversão.

---

## 9. Ordem recomendada de implementação

1. Portar a estrutura base e a jornada homepage → login → retorno.
2. Registrar atividade e montar a listagem/filtros de usuários.
3. Portar o convite de notificações.
4. Implementar a trava visual dos sinais por saldo.
5. Adicionar o banner de Ranking.
6. Migrar jogos, preservando os nomes atuais das abas.
7. Criar a gestão administrativa de jogos, banners, links e textos.
8. Adicionar uploads, auditoria, rascunho/publicação e rollback.
9. Executar testes responsivos e validar a jornada completa com uma conta real.

## Fora do escopo sem aprovação adicional

- alteração dos nomes atuais das abas;
- troca da casa/provedor de autenticação;
- edição de tokens, segredos e credenciais pelo painel;
- bloqueio financeiro real no backend da casa — a primeira entrega usa a condição
  visual de saldo descrita neste documento;
- exclusão definitiva de jogos ou histórico.

