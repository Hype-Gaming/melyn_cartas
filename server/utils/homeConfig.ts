import type { HomeConfig } from '../../shared/homeConfig'
import { DEFAULT_HOME_CONFIG } from '../../shared/homeConfig'
import { getDb } from './mongodb'

export const TENANT = DEFAULT_HOME_CONFIG.tenant

/**
 * Config da home guardada em `site_configs`. Mongo fora do ar nao pode derrubar
 * a home: qualquer falha cai no padrao do codigo.
 */
export const readHomeConfig = async (tenant = TENANT): Promise<HomeConfig> => {
  try {
    const db = await getDb()
    const saved = await db.collection('site_configs').findOne({ tenant })
    if (!saved) return { ...DEFAULT_HOME_CONFIG, tenant }
    const { _id, ...rest } = saved as Record<string, any>
    return { ...DEFAULT_HOME_CONFIG, ...rest, tenant }
  } catch (error) {
    console.error('Config da home indisponivel, usando o padrao:', error)
    return { ...DEFAULT_HOME_CONFIG, tenant }
  }
}
