# Identidade visual — Melyn Cartas

## Conceito

Melyn é uma experiência de cartas voltada a clareza, intuição e novas
perspectivas. A linguagem visual evita referências a cassino e aposta. O centro
da marca é a ideia de pausa, contemplação e movimento consciente.

## Direção visual

- **Atmosfera:** editorial mística contemporânea, sofisticada e acolhedora.
- **Símbolo:** duas cartas sobrepostas com uma estrela central.
- **Formas:** círculos orbitais, arcos, linhas finas e cantos amplos.
- **Imagem:** cartas abstratas, luz violeta e detalhes dourados; sem texto
  incorporado, permitindo que o conteúdo continue editável pelo painel.
- **Tipografia:** Georgia para títulos editoriais e Manrope/Segoe UI para
  interface e textos funcionais.

## Paleta

| Token | Cor | Uso |
| --- | --- | --- |
| `colorPrimary` | `#8b7cf6` | Ações, foco e destaque violeta |
| `colorPrimaryDark` | `#6657d8` | Gradientes e estados ativos |
| `colorSecondary` | `#d9b76e` | Detalhes premium e símbolos |
| `bgDark` | `#080b16` | Fundo principal |
| `bgDarker` | `#050711` | Profundidade e manutenção |
| `cardBg` | `#101322` | Cards e menus |
| `componentBg` | `#171a2d` | Elementos elevados |
| `cardBorder` | `#292d45` | Divisores e contornos |
| `textMain` | `#f7f5ff` | Texto de maior contraste |
| `textMuted` | `#a9a6ba` | Texto secundário |

## Estrutura do produto

- `/`: experiência pública da marca.
- `/admin`: dashboard operacional, métricas, usuários e acessos.
- `/admin/visual`: edição independente de marca, tema, textos, imagens, links,
  recursos, menu e manutenção.

## Assets oficiais

- `public/media/melyn-logo.svg`: assinatura horizontal.
- `public/media/melyn-mark.svg`: ícone e favicon.
- `public/media/melyn-hero.png`: imagem editorial principal.

O hero foi produzido sem texto. Títulos, chamadas e botões ficam em HTML e são
configurados pelo documento `app_config` no MongoDB.
