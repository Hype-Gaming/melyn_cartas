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

export const useVisualConfig = () => {
  const config = useState<AppConfig>('app-config', cloneDefaultAppConfig)
  const loaded = useState('app-config-loaded', () => false)
  const loading = useState('app-config-loading', () => false)

  const resolveAssetUrl = (path?: string | null) => path || ''

  // "#8b7cf6" -> "139, 124, 246". Usado por rgba(var(--color-primary-rgb), .3),
  // que é como os tons translúcidos da cor primária são escritos no CSS.
  const toRgbTriplet = (value: string): string | null => {
    const hex = value.trim().replace('#', '')
    const full = hex.length === 3 ? hex.split('').map(c => c + c).join('') : hex
    if (!/^[0-9a-f]{6}$/i.test(full)) return null
    const n = parseInt(full, 16)
    return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`
  }

  const applyTheme = (next = config.value) => {
    if (!import.meta.client) return
    for (const key of THEME_KEYS) {
      document.documentElement.style.setProperty(CSS_VARIABLES[key], next.theme[key])
    }
    const rgb = toRgbTriplet(next.theme.colorPrimary)
    if (rgb) document.documentElement.style.setProperty('--color-primary-rgb', rgb)
  }

  const loadAppConfig = async (force = false) => {
    if ((loaded.value && !force) || loading.value) return config.value
    loading.value = true
    try {
      const result = await $fetch<{ success: boolean; data: AppConfig }>('/api/app-config')
      if (result?.data) config.value = result.data
      loaded.value = true
    } catch (error) {
      console.error('Usando configuração visual padrão:', error)
    } finally {
      loading.value = false
      applyTheme()
    }
    return config.value
  }

  return {
    config: readonly(config), loaded: readonly(loaded), loading: readonly(loading),
    loadAppConfig, applyTheme, resolveAssetUrl
  }
}
