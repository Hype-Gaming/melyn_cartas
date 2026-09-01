export const APP_ID = 'main' as const

export const THEME_KEYS = [
  'colorPrimary', 'colorPrimaryDark', 'colorSecondary', 'colorSecondaryDark',
  'bgDark', 'bgDarker', 'cardBg', 'inputBg', 'componentBg', 'cardBorder',
  'textMain', 'textMuted', 'colorGold', 'colorFire', 'colorDanger'
] as const

export type ThemeKey = typeof THEME_KEYS[number]

export type ManagedGameStatus = 'enabled' | 'blocked' | 'hidden' | 'maintenance'

export interface SignalBalanceGate {
  enabled: boolean
  minimumBalance: number
  title: string
  message: string
  ctaLabel: string
  ctaUrl: string | null
}

export interface ManagedGame {
  gameId: string
  title: string
  description: string | null
  imageUrl: string | null
  route: string
  tabKey: 'prime' | 'premium' | 'claude'
  order: number
  status: ManagedGameStatus
  requiresLogin: boolean
  signalBalanceGate: Partial<SignalBalanceGate>
}

export interface ManagedBanner {
  id: string
  placement: 'home' | 'ranking'
  desktopImageUrl: string
  mobileImageUrl: string | null
  altText: string
  targetUrl: string | null
  openInNewTab: boolean
  enabled: boolean
  order: number
  startsAt: string | null
  endsAt: string | null
}

export interface AppConfig {
  appId: typeof APP_ID
  brand: {
    name: string
    description: string
    keywords: string
    logo: string | null
    favicon: string | null
  }
  theme: Record<ThemeKey, string>
  content: {
    newsTitle: string
    newsBadge: string
    newsHeadline: string
    primeTitle: string
    premiumTitle: string
    claudeTitle: string
    linksTitle: string
    highlightsTitle: string
    depositButton: string
    subscribeButton: string
    supportTitle: string
    supportMessage: string
    unlockButton: string
    accessButton: string
  }
  images: {
    banners: string[]
    blocked: string | null
    premium: string | null
    live: string | null
  }
  links: {
    register: string
    checkout: string
    checkoutSemGale: string
    whatsappSupport: string
    whatsappCommunity: string
    telegram: string
    telegramSupport: string
    instagram: string
    site: string
  }
  features: {
    home: boolean
    games: boolean
    lessons: boolean
    ranking: boolean
    profile: boolean
    links: boolean
    highlights: boolean
    management: boolean
    live: boolean
  }
  menu: Array<{ key: string; label: string; icon: string; order: number }>
  maintenance: { active: boolean; title: string; message: string }
  notificationPrompt: {
    enabled: boolean
    title: string
    message: string
    activateLabel: string
    laterLabel: string
    retryDays: number
  }
  signalBalanceGate: SignalBalanceGate
  games: ManagedGame[]
  banners: ManagedBanner[]
  updatedAt?: string | Date
}

export const DEFAULT_APP_CONFIG: AppConfig = {
  appId: APP_ID,
  brand: {
    name: 'Melyn Cartas',
    description: 'Um espaço de clareza, intuição e novas perspectivas.',
    keywords: 'cartas, autoconhecimento, intuição, orientação',
    logo: '/media/melyn-logo.svg',
    favicon: '/media/melyn-mark.svg'
  },
  theme: {
    colorPrimary: '#8b7cf6',
    colorPrimaryDark: '#6657d8',
    colorSecondary: '#d9b76e',
    colorSecondaryDark: '#a9853f',
    bgDark: '#080b16',
    bgDarker: '#050711',
    cardBg: '#101322',
    inputBg: '#0c0f1c',
    componentBg: '#171a2d',
    cardBorder: '#292d45',
    textMain: '#f7f5ff',
    textMuted: '#a9a6ba',
    colorGold: '#d9b76e',
    colorFire: '#b49af8',
    colorDanger: '#ef6a86'
  },
  content: {
    newsTitle: 'Notícias recentes',
    newsBadge: 'ÚLTIMAS',
    newsHeadline: 'NOTÍCIAS',
    primeTitle: 'Inteligência Artificial Prime',
    premiumTitle: 'Inteligência Artificial Premium',
    claudeTitle: 'IA Claude – Operações Sem Gale',
    linksTitle: 'Links úteis',
    highlightsTitle: 'Destaques',
    depositButton: 'DEPOSITAR',
    subscribeButton: 'Confirmar compra',
    supportTitle: 'Precisa de ajuda com seu acesso?',
    supportMessage: 'Nossa equipe está pronta para orientar você.',
    unlockButton: 'Liberar acesso',
    accessButton: 'Acessar agora'
  },
  images: {
    banners: ['/media/melyn-hero.png'],
    blocked: '/media/melyn-mark.svg',
    premium: null,
    live: null
  },
  // Links da Melyn ainda não definidos — preencher em /admin/visual.
  // Enquanto vazios, o código cai nos fallbacks de app/constants/checkoutLinks.ts.
  links: {
    register: '',
    checkout: '',
    checkoutSemGale: '',
    whatsappSupport: '',
    whatsappCommunity: '',
    telegram: '',
    telegramSupport: '',
    instagram: '',
    site: ''
  },
  features: {
    home: true, games: true, lessons: true, ranking: true, profile: true,
    links: true, highlights: true, management: true, live: true
  },
  menu: [
    { key: 'home', label: 'Início', icon: 'ph:house-bold', order: 1 },
    { key: 'games', label: 'Jogos', icon: 'ph:game-controller-bold', order: 2 },
    { key: 'lessons', label: 'Aulas', icon: 'ph:graduation-cap-bold', order: 3 },
    { key: 'management', label: 'Gestão de Banca', icon: 'ph:wallet-bold', order: 4 },
    { key: 'ranking', label: 'Ranking', icon: 'ph:trophy-bold', order: 5 },
    { key: 'profile', label: 'Perfil', icon: 'ph:user-circle-bold', order: 6 },
    { key: 'links', label: 'Links', icon: 'ph:link-bold', order: 7 }
  ],
  maintenance: {
    active: false,
    title: 'Em manutenção',
    message: 'Estamos realizando melhorias. Voltamos em breve.'
  },
  notificationPrompt: {
    enabled: true,
    title: 'Ative as notificações',
    message: 'Receba avisos sobre novos sinais e novidades da MR Cartas.',
    activateLabel: 'Ativar notificações',
    laterLabel: 'Agora não',
    retryDays: 7
  },
  signalBalanceGate: {
    enabled: true,
    minimumBalance: 10,
    title: 'Sinais bloqueados',
    message: 'Adicione pelo menos R$ 10,00 de saldo para liberar os sinais.',
    ctaLabel: 'Depositar agora',
    ctaUrl: null
  },
  games: [
    { gameId: 'football-studio', title: 'FOOTBALL STUDIO', description: 'Evolution', imageUrl: '/games/football-studio.png', route: '/jogo/football-studio', tabKey: 'prime', order: 1, status: 'enabled', requiresLogin: true, signalBalanceGate: {} },
    { gameId: 'bac-bo-en', title: 'BAC BO EN', description: null, imageUrl: '/games/bac-bo-en.png', route: '/jogo/bac-bo-en', tabKey: 'premium', order: 1, status: 'enabled', requiresLogin: true, signalBalanceGate: {} },
    { gameId: 'bac-bo-brasileiro', title: 'BAC BO BRASILEIRO', description: null, imageUrl: '/games/bac-bo-ao-vivo.png', route: '/jogo/bac-bo-brasileiro', tabKey: 'premium', order: 2, status: 'enabled', requiresLogin: true, signalBalanceGate: {} },
    { gameId: 'football-studio-ao-vivo', title: 'FUTEBOL STUDIO AO VIVO', description: null, imageUrl: '/games/football-studio-br.png', route: '/jogo/football-studio-ao-vivo', tabKey: 'premium', order: 3, status: 'enabled', requiresLogin: true, signalBalanceGate: {} },
    { gameId: 'football-studio-premium', title: 'FOOTBALL STUDIO', description: null, imageUrl: '/games/football-studio.png', route: '/jogo/football-studio', tabKey: 'premium', order: 4, status: 'enabled', requiresLogin: true, signalBalanceGate: {} },
    { gameId: 'baccarat', title: 'BACCARAT', description: null, imageUrl: '/games/baccarat.png', route: '/jogo/baccarat', tabKey: 'premium', order: 5, status: 'enabled', requiresLogin: true, signalBalanceGate: {} },
    { gameId: 'dragon-tiger', title: 'DRAGON TIGER', description: null, imageUrl: '/games/dragon-tiger.png', route: '/jogo/dragon-tiger', tabKey: 'premium', order: 6, status: 'enabled', requiresLogin: true, signalBalanceGate: {} },
    { gameId: 'aviator', title: 'AVIATOR', description: null, imageUrl: '/games/aviator.png', route: '/jogo/aviator', tabKey: 'premium', order: 7, status: 'enabled', requiresLogin: true, signalBalanceGate: {} },
    { gameId: 'football-studio-sem-gale', title: 'FOOTBALL STUDIO ENGLISH', description: null, imageUrl: '/games/football-studio.png', route: '/jogo/football-studio', tabKey: 'claude', order: 1, status: 'enabled', requiresLogin: true, signalBalanceGate: {} }
  ],
  banners: []
}

export const cloneDefaultAppConfig = (): AppConfig =>
  JSON.parse(JSON.stringify(DEFAULT_APP_CONFIG)) as AppConfig
