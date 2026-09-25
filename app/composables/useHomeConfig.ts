import type { HomeConfig } from '../../shared/homeConfig'
import { DEFAULT_HOME_CONFIG } from '../../shared/homeConfig'

let pending: Promise<HomeConfig> | null = null

/** Config da home (coleção `site_configs`), carregada uma vez por sessão. */
export const useHomeConfig = () => {
  const config = useState<HomeConfig>('home-config', () => ({ ...DEFAULT_HOME_CONFIG }))
  const loaded = useState('home-config-loaded', () => false)

  const load = async (force = false): Promise<HomeConfig> => {
    if (loaded.value && !force) return config.value
    if (pending) return pending

    pending = (async () => {
      try {
        const result = await $fetch<{ config: HomeConfig }>('/api/home-config', { timeout: 8000 })
        if (result?.config) {
          config.value = result.config
          loaded.value = true
        }
      } catch (error) {
        // A home precisa abrir mesmo sem a API: o padrão do código já serve.
        console.error('Usando a configuração padrão da home:', error)
      } finally {
        pending = null
      }
      return config.value
    })()

    return pending
  }

  return { config, loaded: readonly(loaded), load }
}
