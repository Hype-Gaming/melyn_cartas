// Configuração da home, editável em /admin/conteudo e guardada na coleção `site_configs`.
// Convive com o appConfig (marca, tema, jogos gerenciados): aqui ficam só os blocos
// da home — atalhos, banners, live, XP, números da comunidade e links de conexão.

export interface HomeLink {
  label: string
  icon: string
  href: string
  description?: string
  /** Data URL gerado em /admin/conteudo. Se vazio, o atalho usa o ícone. */
  image?: string
  external?: boolean
}

export interface HomeBanner {
  image: string
  href: string
  external?: boolean
}

export interface HomeGame {
  id: string
  name: string
  image: string
  provider: string
  category: 'prime' | 'premium' | 'claude'
  locked?: boolean
}

export interface HomeConfig {
  tenant: string
  brandName: string
  /** Cor de destaque em #rrggbb. Vazia mantém a cor do tema do app. */
  accentColor: string

  liveTitle: string
  liveAt: string
  liveHref: string

  /** Chave do vídeo no bucket ou URL completa. Preenchido, substitui o carrossel. */
  heroVideo: string
  banners: HomeBanner[]

  xpLabel: string
  xpCurrent: number
  xpGoal: number

  shortcuts: HomeLink[]
  connectionLinks: HomeLink[]

  /** Jogos fixados. Vazio faz a home usar o catálogo gerenciado do appConfig. */
  games: HomeGame[]
}

export const DEFAULT_HOME_CONFIG: HomeConfig = {
  tenant: 'melyn',
  brandName: 'Melyn Cartas',
  accentColor: '',

  liveTitle: 'Sala ao vivo com a mentora',
  liveAt: 'Todos os dias, 20h',
  liveHref: '/aulas',

  heroVideo: '',
  banners: [],

  xpLabel: 'Sua jornada',
  xpCurrent: 0,
  xpGoal: 1000,

  shortcuts: [
    { label: 'Jogos', icon: 'ph:game-controller-bold', href: '/#jogos' },
    { label: 'Roleta diária', icon: 'ph:spinner-ball-bold', href: '/roleta' },
    { label: 'Torneios', icon: 'ph:trophy-bold', href: '/torneio' },
    { label: 'Aulas', icon: 'ph:graduation-cap-bold', href: '/aulas' },
    { label: 'Comunidade', icon: 'ph:users-three-bold', href: '/links' }
  ],

  connectionLinks: [
    {
      label: 'Comunidade',
      icon: 'ph:whatsapp-logo-bold',
      href: '/links',
      description: 'Novidades, avisos e suporte com o time.'
    },
    {
      label: 'Aulas',
      icon: 'ph:graduation-cap-bold',
      href: '/aulas',
      description: 'Conteúdo para você evoluir no seu ritmo.'
    },
    {
      label: 'Ranking',
      icon: 'ph:ranking-bold',
      href: '/ranking',
      description: 'Veja quem mais participa da comunidade.'
    }
  ],

  games: []
}
