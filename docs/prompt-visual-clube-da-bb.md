# Prompt — Melhorar o visual da roleta e do torneio (Clube da BB)

Cole no agente do repositório `Clube-da-BB`. É um prompt **só de acabamento visual**:
a roleta e o torneio já funcionam lá, então nada de mexer em sorteio, limite diário
ou publicação de campanha.

---

Melhore o visual da **roleta diária** e da **página de torneio** deste app. As duas
telas funcionam, mas estão simples demais para o que são: benefício e competição
deveriam ser as páginas mais chamativas do app.

**Não mude comportamento.** O sorteio continua no servidor, o limite de um giro por
dia no fuso `America/Bahia` continua como está, e só uma campanha fica ativa por vez.
Se precisar tocar em lógica para um efeito visual, pare e pergunte antes.

Comece lendo os arquivos que existem hoje — provavelmente `app/components/RouletteWheel.vue`,
`app/pages/roleta.vue`, `app/pages/torneio.vue` e `shared/tournament.ts`. Confirme os
caminhos antes de editar; reaproveite os componentes e tokens que já estiverem lá.

## Linguagem visual (vale para as duas telas)

Tema escuro cinematográfico, com a cor de destaque da marca (`#ff1493`) usada com
parcimônia: brilho e acento, não grandes áreas chapadas.

- **Tokens, não hex solto.** Se o projeto não tiver `--accent` e `--accent-soft`
  disponíveis globalmente, crie-os no lugar onde o tema já é aplicado. **Confira se o
  CSS global é de fato importado** — um arquivo `main.css` que ninguém importa faz as
  variáveis resolverem vazias e os componentes saem cinzas, sem erro nenhum no console.
- **Halo ambiente**: um `radial-gradient` desfocado na cor de destaque atrás do
  cabeçalho e atrás da roda. Dá profundidade barata.
- **Cartões de vidro**: fundo com `color-mix` do tom de superfície, borda fina
  `rgba` (nunca cinza sólido), raio de 18 a 26 px, sombra difusa e larga.
- **Selo pequeno** em caixa alta com `letter-spacing: .14em` no tom claro do destaque,
  acima de cada título.
- Transições de 180 a 200 ms; movimento maior com `cubic-bezier(0.16, 1, 0.3, 1)`.

## Roleta

A roda é o que mais rende:

- Desenhe em **SVG** (se hoje for `conic-gradient`, migre): fatias com gradiente
  radial, mais claras no miolo, e traço escuro fino separando.
- **Aro externo** na cor de destaque com brilho (`feGaussianBlur` + `feMerge`) e um
  anel de luzinhas — círculos pequenos alternando duas cores ao redor da borda. É esse
  detalhe que faz parecer cassino em vez de gráfico de pizza.
- **Cubo central** sobreposto, fora do SVG que gira, senão o ícone roda junto.
- **Ponteiro**: triângulo limpo com sombra. Formas arredondadas demais viram borrão em
  tamanho pequeno e parecem alfinete de mapa.
- **Halo pulsando** enquanto gira, e frenagem com
  `transition: transform 4s cubic-bezier(0.16, 1, 0.3, 1)`.
- **Rótulos na diagonal**: gire 180° os que caírem na metade de baixo, senão saem de
  cabeça para baixo. Prêmio vazio ("não foi dessa vez") com texto mais apagado.
- **Legenda em chips** abaixo da roda, com a bolinha na cor da fatia, sem repetir
  rótulos iguais. Os textos dentro das fatias são curtos e inclinados; a legenda é o
  que a pessoa lê.
- **Giro já usado**: troque o "Volte amanhã" seco por contagem até a virada do dia
  ("Próximo giro em 09h50"), no mesmo fuso do servidor.
- **Modal de resultado**: prêmio em destaque e botão de resgate. Se não houver prêmio,
  não repita a mesma frase no título e no corpo — esconda o rótulo.
- **Botão** com pulsação discreta enquanto o giro está disponível; ícone girando
  durante o sorteio.

## Torneio

- **Pódio** com os três primeiros: ordem visual 2º, 1º, 3º, o campeão no meio, mais
  alto e em ouro. Prata e bronze nos lados, com a cor na borda e no ícone.
- **Prazo** com quanto falta ("Faltam 25 dias") e uma barra de quanto do período já
  correu — só a data final não dá noção de urgência.
- **Classificação** do 4º em diante, cada linha com uma barra proporcional ao líder.
  A barra mostra a distância entre participantes, que uma coluna de números esconde.
- **Premiação** com a cor da medalha por colocação.
- Esconda cartões vazios: torneio sem regras não deve renderizar um cartão "Regras" em
  branco.

## Acessibilidade e responsivo

- Contraste de 4,5:1, alvos de toque de 44 px, foco visível em tudo que é clicável.
- Modais com `role="dialog"`, `aria-modal`, foco movido para dentro e Esc fechando.
- `aria-label` em botão só com ícone; `role="progressbar"` nas barras.
- Toda animação desligada em `@media (prefers-reduced-motion: reduce)`.
- **Sem rolagem horizontal a 360 px.** O halo decorativo é a causa mais provável se
  aparecer: ele costuma ser mais largo que a tela. Resolva com `overflow-x: clip` no
  contêiner da página, não escondendo o efeito.

## Antes de dizer que terminou

Não entregue sem rodar. Suba o app, abra num navegador de verdade e **olhe as telas**:

1. Roleta nos três estados: giro disponível, girando e já usado.
2. Um giro completo até o modal de resultado — a roda tem que parar com o ponteiro
   sobre a fatia sorteada.
3. Torneio com e sem participantes.
4. Meça `document.documentElement.scrollWidth` contra `clientWidth` a 360 px nas duas
   páginas e prove que não há rolagem horizontal.
5. Confira que nenhuma variável CSS resolveu vazia (inspecione a cor computada de um
   ícone de destaque: se vier cinza, o token não chegou).
