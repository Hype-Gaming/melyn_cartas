import type { AppConfig } from '../../shared/appConfig'
import { THEME_KEYS, cloneDefaultAppConfig } from '../../shared/appConfig'

const CSS_VARIABLES: Record<(typeof THEME_KEYS)[number], string> = {
  colorPrimary: '--color-primary', colorPrimaryDark: '--color-primary-dark',
  colorSecondary: '--color-secondary', colorSecondaryDark: '--color-secondary-dark',
  bgDark: '--bg-dark', bgDarker: '--bg-darker', cardBg: '--card-bg',
  inputBg: '--input-bg', componentBg: '--component-bg', cardBorder: '--card-border',
  textMain: '--text-main', textMuted: '--text-muted', colorGold: '--color-gold',
  colorFire: '--color-fire', colorDanger: '--color-danger'
}

let pendingConfigRequest: Promise<AppConfig> | null = null

export const useVisualConfig = () => {
  const config = useState<AppConfig>('app-config', cloneDefaultAppConfig)
  const loaded = useState('app-config-loaded', () => false)
  const ready = useState('app-config-ready', () => false)
  const loading = useState('app-config-loading', () => false)

  const resolveAssetUrl = (path?: string | null) => path || ''

  // "#8b7cf6" -> "139, 124, 246", usado pelos tons translúcidos do tema.
  const toRgbTriplet = (value: string): string | null => {
    const hex = value.trim().replace('#', '')
    const full = hex.length === 3 ? hex.split('').map(char => char + char).join('') : hex
    if (!/^[0-9a-f]{6}$/i.test(full)) return null
    const number = parseInt(full, 16)
    return `${(number >> 16) & 255}, ${(number >> 8) & 255}, ${number & 255}`
  }

  const applyTheme = (next = config.value) => {
    if (!import.meta.client) return
    for (const key of THEME_KEYS) {
      document.documentElement.style.setProperty(CSS_VARIABLES[key], next.theme[key])
    }
    const rgb = toRgbTriplet(next.theme.colorPrimary)
    if (rgb) document.documentElement.style.setProperty('--color-primary-rgb', rgb)
  }

  const loadAppConfig = async (force = false): Promise<AppConfig> => {
    if (loaded.value && !force) return config.value
    if (pendingConfigRequest) return pendingConfigRequest

    loading.value = true
    pendingConfigRequest = (async () => {
      try {
        const result = await $fetch<{ success: boolean; data: AppConfig }>('/api/app-config', {
          timeout: 8000
        })
        if (result?.data) {
          config.value = result.data
          loaded.value = true
        }
      } catch (error) {
        console.error('Usando configuração visual padrão:', error)
      } finally {
        // As variáveis são aplicadas antes de liberar a primeira pintura do app.
        applyTheme()
        if (import.meta.client) document.documentElement.classList.add('visual-theme-ready')
        loading.value = false
        ready.value = true
        pendingConfigRequest = null
      }
      return config.value
    })()

    return pendingConfigRequest
  }

  return {
    config: readonly(config),
    loaded: readonly(loaded),
    ready: readonly(ready),
    loading: readonly(loading),
    loadAppConfig,
    applyTheme,
    resolveAssetUrl
  }
}
