import type { AppConfig } from '../../shared/appConfig'
import { APP_ID, DEFAULT_APP_CONFIG, THEME_KEYS, cloneDefaultAppConfig } from '../../shared/appConfig'
import { getDb } from './mongodb'

const text = (value: unknown, fallback: string, max = 300) =>
  typeof value === 'string' ? value.trim().slice(0, max) : fallback

const nullableAsset = (value: unknown, fallback: string | null) => {
  if (value === null || value === '') return null
  if (typeof value !== 'string') return fallback
  const result = value.trim().slice(0, 2000)
  if (!result || /^(?:javascript|data):/i.test(result)) return fallback
  return result
}

const url = (value: unknown, fallback: string) => {
  if (value === '') return ''
  const result = nullableAsset(value, fallback)
  return result || ''
}

const color = (value: unknown, fallback: string) => {
  const result = typeof value === 'string' ? value.trim() : ''
  return /^(#[0-9a-f]{3,8}|(?:rgb|hsl)a?\([\d\s.,%+-]+\))$/i.test(result) ? result : fallback
}

export const normalizeAppConfig = (input: unknown): AppConfig => {
  const source = input && typeof input === 'object' ? input as Record<string, any> : {}
  const defaults = cloneDefaultAppConfig()
  const config = cloneDefaultAppConfig()

  for (const key of THEME_KEYS) config.theme[key] = color(source.theme?.[key], defaults.theme[key])

  for (const key of Object.keys(config.brand) as Array<keyof AppConfig['brand']>) {
    config.brand[key] = (key === 'logo' || key === 'favicon')
      ? nullableAsset(source.brand?.[key], defaults.brand[key]) as never
      : text(source.brand?.[key], defaults.brand[key] || '', key === 'description' ? 500 : 200) as never
  }

  for (const key of Object.keys(config.content) as Array<keyof AppConfig['content']>) {
    config.content[key] = text(source.content?.[key], defaults.content[key], 500)
  }

  const rawBanners = Array.isArray(source.images?.banners) ? source.images.banners : defaults.images.banners
  config.images.banners = rawBanners.slice(0, 10)
    .map((item: unknown) => nullableAsset(item, null))
    .filter((item: string | null): item is string => Boolean(item))
  config.images.blocked = nullableAsset(source.images?.blocked, defaults.images.blocked)
  config.images.premium = nullableAsset(source.images?.premium, defaults.images.premium)
  config.images.live = nullableAsset(source.images?.live, defaults.images.live)

  for (const key of Object.keys(config.links) as Array<keyof AppConfig['links']>) {
    config.links[key] = url(source.links?.[key], defaults.links[key])
  }

  for (const key of Object.keys(config.features) as Array<keyof AppConfig['features']>) {
    config.features[key] = typeof source.features?.[key] === 'boolean'
      ? source.features[key]
      : defaults.features[key]
  }

  if (Array.isArray(source.menu)) {
    config.menu = source.menu.slice(0, 20).map((item: any, index: number) => ({
      key: text(item?.key, `item-${index + 1}`, 50).replace(/[^a-z0-9_-]/gi, ''),
      label: text(item?.label, `Item ${index + 1}`, 80),
      icon: text(item?.icon, '', 100),
      order: Number.isFinite(Number(item?.order)) ? Math.max(0, Math.min(999, Number(item.order))) : index + 1
    })).filter(item => item.key && item.label)
  }

  config.maintenance.active = typeof source.maintenance?.active === 'boolean'
    ? source.maintenance.active : defaults.maintenance.active
  config.maintenance.title = text(source.maintenance?.title, defaults.maintenance.title, 120)
  config.maintenance.message = text(source.maintenance?.message, defaults.maintenance.message, 500)
  config.appId = APP_ID
  if (source.updatedAt) config.updatedAt = source.updatedAt
  return config
}

export const getAppConfig = async (): Promise<AppConfig> => {
  const db = await getDb()
  const collection = db.collection('app_config')
  await collection.createIndex({ appId: 1 }, { unique: true })
  const now = new Date()
  await collection.updateOne(
    { appId: APP_ID },
    { $setOnInsert: { ...DEFAULT_APP_CONFIG, createdAt: now, updatedAt: now } },
    { upsert: true }
  )
  return normalizeAppConfig(await collection.findOne({ appId: APP_ID }))
}

export const saveAppConfig = async (input: unknown): Promise<AppConfig> => {
  const db = await getDb()
  const collection = db.collection('app_config')
  await collection.createIndex({ appId: 1 }, { unique: true })
  const current = await collection.findOne({ appId: APP_ID })
  const patch = input && typeof input === 'object' ? input as Record<string, any> : {}
  const merged = cloneDefaultAppConfig() as Record<string, any>
  const existing = current || {}

  for (const group of ['brand', 'theme', 'content', 'images', 'links', 'features', 'maintenance']) {
    merged[group] = { ...merged[group], ...(existing as any)[group], ...(patch as any)[group] }
  }
  merged.menu = Array.isArray(patch.menu)
    ? patch.menu
    : Array.isArray((existing as any).menu) ? (existing as any).menu : merged.menu

  const config = normalizeAppConfig(merged)
  const now = new Date()
  const { appId: _appId, updatedAt: _updatedAt, ...editable } = config
  const result = await collection.findOneAndUpdate(
    { appId: APP_ID },
    {
      $set: { ...editable, updatedAt: now },
      $setOnInsert: { appId: APP_ID, createdAt: now }
    },
    { upsert: true, returnDocument: 'after' }
  )
  return normalizeAppConfig(result)
}
