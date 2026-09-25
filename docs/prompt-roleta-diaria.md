# Prompt — Roleta diária (copiar para outro projeto)

Cole o texto abaixo no agente do outro projeto. Ele descreve o comportamento e o
acabamento visual, não o código: cada projeto tem seus próprios helpers, e o
agente deve reaproveitar os que já existirem por lá.

> Ajuste antes de colar: a cor de destaque, o fuso horário e os prêmios.

---

Implemente uma **roleta diária** nesta aplicação: uma página pública onde cada
membro gira uma vez por dia e ganha um prêmio.

## Regras de negócio (o que não pode ficar só na tela)

- **O prêmio é sorteado no servidor**, nunca no cliente. A tela só anima até o
  resultado que o servidor devolveu. Sorteio no front é burlável abrindo o console.
- **Um giro por dia de calendário**, no fuso do público (ex.: `America/Bahia`), não
  em UTC e não "24h desde o último giro" — o giro precisa renovar à meia-noite local.
- **A garantia do giro único é do banco, não do JavaScript.** Guarde o dia do giro no
  registro do usuário e condicione a escrita a ele. Com MongoDB:
  `updateOne({ email, spin_day: { $ne: hoje } }, { $set: {...} }, { upsert: true })`.
  Duas requisições simultâneas então gravam só uma. **Atenção:** com `upsert`, se o
  filtro não casar porque o usuário já girou, o banco tenta inserir um segundo
  documento — garanta o índice único no identificador e trate o erro de duplicata
  como "já girou hoje", devolvendo o prêmio guardado.
- **Sorteio ponderado**, com peso por prêmio: prêmio maior sai menos. Deixe os pesos
  num só lugar, legível, e extraia o sorteio numa função pura que receba o número
  aleatório por parâmetro — assim ela é testável sem banco.
- Dois endpoints: um `GET` que responde se o giro de hoje está disponível, e um
  `POST` que gira. O `POST` devolve o **índice** do prêmio, e a tela usa esse índice
  para saber onde parar a roda.
- Valide o identificador do usuário no servidor e recuse o que for inválido com 400.

## A roda (é aqui que a maioria das implementações fica pobre)

Desenhe em **SVG**, não com `conic-gradient` — o SVG dá controle de cada fatia, do
texto e do aro, e escala sem serrilhar.

- **Fatias** com gradiente radial (mais claro no miolo, mais saturado na borda) e um
  traço escuro fino de separação. Prêmio "não foi dessa vez" em tom neutro escuro,
  com o texto mais apagado que o dos prêmios reais.
- **Texto das fatias na diagonal, ao longo do raio.** Cuidado com a metade de baixo
  da roda: sem correção, o texto sai de cabeça para baixo. Gire 180° os rótulos cujo
  ângulo cai entre 0° e 180°.
- **Aro externo** na cor de destaque, com brilho (`feGaussianBlur` + `feMerge`), e um
  anel de "luzinhas" — círculos pequenos alternando duas cores ao redor da borda. É o
  detalhe que faz a roda parecer de cassino em vez de um gráfico de pizza.
- **Cubo central sobreposto à roda, fora do SVG que gira**, senão o ícone do centro
  gira junto e fica tonto.
- **Ponteiro**: um triângulo limpo apontando para baixo, com sombra. Evite formas
  arredondadas demais — em tamanho pequeno viram um borrão que parece alfinete de mapa.
- **Halo** atrás da roda: um `radial-gradient` desfocado na cor de destaque, que pulsa
  enquanto ela gira.
- **Animação do giro:** ao menos 5 voltas completas mais o ângulo do prêmio, com
  `transition: transform 4s cubic-bezier(0.16, 1, 0.3, 1)`. Essa curva desacelera no
  fim como uma roda real; `ease-out` comum para seco demais.

## O resto da tela

- **Legenda dos prêmios** em chips abaixo da roda, com a bolinha na cor da fatia. Os
  rótulos dentro das fatias precisam ser curtos e ficam inclinados; a legenda é o que
  o usuário lê de verdade. Remova rótulos repetidos da legenda.
- **Quando o giro já foi usado:** em vez de "Volte amanhã" seco, mostre a contagem
  até a virada do dia ("Próximo giro em 09h50"), calculada no mesmo fuso do servidor.
- **Resultado** num modal com o prêmio em destaque e um botão de resgate (suporte /
  WhatsApp). Não repita o mesmo texto no título e no corpo: se o prêmio for "não foi
  dessa vez", o título já diz isso — esconda o rótulo.
- **Confete** só quando o prêmio vale alguma coisa, e nunca com `prefers-reduced-motion`.
- **Botão principal** com a cor de destaque, sombra colorida no hover e uma pulsação
  discreta enquanto o giro está disponível. Desabilitado e com o ícone girando durante
  o sorteio.
- **Visitante sem login:** a página convida a entrar em vez de esconder a roleta.

## Convite na home

Um pop-up uma vez por sessão ("Sua roleta está te esperando", com *Girar a roleta* e
*Agora não*), guardado em `sessionStorage`. Para quem está logado, só apareça se o
giro do dia ainda estiver disponível. Nunca abra junto de outro pop-up.

## Acessibilidade e responsivo (não negocie)

- Contraste de 4,5:1 no texto, alvos de toque de 44 px no mínimo.
- Modal com `role="dialog"`, `aria-modal`, foco movido para dentro ao abrir e Esc
  fechando.
- `aria-label` nos botões só com ícone; `role="progressbar"` em barras de progresso.
- Toda animação some com `@media (prefers-reduced-motion: reduce)`.
- Sem rolagem horizontal a 360 px. **Cuidado com o halo decorativo**: se ele for mais
  largo que a tela, cria rolagem — use `overflow-x: clip` no contêiner da página.

## Antes de dizer que terminou

1. Gire duas vezes seguidas: a segunda deve devolver o mesmo prêmio, sem gravar de novo.
2. Dispare três giros simultâneos para o mesmo usuário e confira no banco que só um
   foi registrado e que nenhum usuário duplicado foi criado.
3. Abra a página num navegador de verdade e **olhe**: a roda tem que parar com o
   ponteiro sobre a fatia sorteada, e os rótulos das seis fatias têm que estar legíveis.
4. Meça `document.documentElement.scrollWidth` a 360 px para provar que não há
   rolagem horizontal.

---

## O mesmo tratamento para a página de torneio

A receita visual se repete: halo ambiente, cartão de vidro, selo pequeno em caixa
alta na cor clara de destaque. O que muda é o conteúdo:

- **Pódio** com os três primeiros, o campeão no meio e mais alto, em ouro, prata e
  bronze. A ordem visual é 2º, 1º, 3º.
- **Prazo** com quanto falta ("Faltam 25 dias") e uma barra de quanto do período já
  passou, em vez de só a data final.
- **Classificação** do 4º em diante, com uma barra proporcional ao líder — ela mostra
  a distância entre os participantes, que uma coluna de números não mostra.
- **Premiação** com a cor da medalha em cada colocação.
- No servidor, **só uma campanha ativa por vez**: publicar uma encerra a anterior.
