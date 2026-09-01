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

const wsUrl = (value: unknown) => {
  const raw = typeof value === 'string' ? value.trim().slice(0, 300) : ''
  if (!raw) return ''
  return /^wss?:\/\//i.test(raw) ? raw : ''
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

const bool = (value: unknown, fallback: boolean) => typeof value === 'boolean' ? value : fallback
const number = (value: unknown, fallback: number, min = 0, max = 1_000_000) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback
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
    for (const required of defaults.menu.filter(item => item.key === 'ranking' || item.key === 'profile' || item.key === 'links')) {
      if (!config.menu.some(item => item.key === required.key)) config.menu.push(required)
    }
  }

  config.maintenance.active = typeof source.maintenance?.active === 'boolean'
    ? source.maintenance.active : defaults.maintenance.active
  config.maintenance.title = text(source.maintenance?.title, defaults.maintenance.title, 120)
  config.maintenance.message = text(source.maintenance?.message, defaults.maintenance.message, 500)

  config.notificationPrompt = {
    enabled: bool(source.notificationPrompt?.enabled, defaults.notificationPrompt.enabled),
    title: text(source.notificationPrompt?.title, defaults.notificationPrompt.title, 120),
    message: text(source.notificationPrompt?.message, defaults.notificationPrompt.message, 500),
    activateLabel: text(source.notificationPrompt?.activateLabel, defaults.notificationPrompt.activateLabel, 80),
    laterLabel: text(source.notificationPrompt?.laterLabel, defaults.notificationPrompt.laterLabel, 80),
    retryDays: number(source.notificationPrompt?.retryDays, defaults.notificationPrompt.retryDays, 1, 365)
  }

  config.signalBalanceGate = {
    enabled: bool(source.signalBalanceGate?.enabled, defaults.signalBalanceGate.enabled),
    minimumBalance: number(source.signalBalanceGate?.minimumBalance, defaults.signalBalanceGate.minimumBalance),
    title: text(source.signalBalanceGate?.title, defaults.signalBalanceGate.title, 120),
    message: text(source.signalBalanceGate?.message, defaults.signalBalanceGate.message, 500),
    ctaLabel: text(source.signalBalanceGate?.ctaLabel, defaults.signalBalanceGate.ctaLabel, 80),
    ctaUrl: nullableAsset(source.signalBalanceGate?.ctaUrl, defaults.signalBalanceGate.ctaUrl)
  }

  const statuses = new Set(['enabled', 'blocked', 'hidden', 'maintenance'])
  const tabs = new Set(['prime', 'premium', 'claude'])
  const rawGames = Array.isArray(source.games) ? source.games : defaults.games
  config.games = rawGames.slice(0, 100).map((game: any, index: number) => ({
    gameId: text(game?.gameId, '', 80).replace(/[^a-z0-9_-]/gi, ''),
    title: text(game?.title, `Jogo ${index + 1}`, 120),
    description: game?.description == null ? null : text(game.description, '', 300),
    imageUrl: nullableAsset(game?.imageUrl, null),
    route: url(game?.route, ''),
    tabKey: tabs.has(game?.tabKey) ? game.tabKey : 'prime',
    order: number(game?.order, index + 1, 0, 999),
    status: statuses.has(game?.status) ? game.status : 'enabled',
    requiresLogin: bool(game?.requiresLogin, true),
    startGameSlug: text(game?.startGameSlug, '', 200),
    catalogadorCollection: text(game?.catalogadorCollection, '', 120),
    catalogadorGame: text(game?.catalogadorGame, '', 200),
    catalogadorFallbackGames: Array.isArray(game?.catalogadorFallbackGames)
      ? game.catalogadorFallbackGames.slice(0, 10).map((name: any) => text(name, '', 200)).filter(Boolean)
      : [],
    signalUrl: wsUrl(game?.signalUrl),
    signalCollection: text(game?.signalCollection, '', 120),
    signalName: text(game?.signalName, '', 200),
    outcomePlayerLabel: text(game?.outcomePlayerLabel, '', 40),
    outcomePlayerLetter: text(game?.outcomePlayerLetter, '', 3),
    outcomeBankerLabel: text(game?.outcomeBankerLabel, '', 40),
    outcomeBankerLetter: text(game?.outcomeBankerLetter, '', 3),
    outcomeTieLabel: text(game?.outcomeTieLabel, '', 40),
    outcomeTieLetter: text(game?.outcomeTieLetter, '', 3),
    signalBalanceGate: {
      enabled: typeof game?.signalBalanceGate?.enabled === 'boolean' ? game.signalBalanceGate.enabled : undefined,
      minimumBalance: game?.signalBalanceGate?.minimumBalance == null ? undefined : number(game.signalBalanceGate.minimumBalance, config.signalBalanceGate.minimumBalance),
      title: game?.signalBalanceGate?.title ? text(game.signalBalanceGate.title, '', 120) : undefined,
      message: game?.signalBalanceGate?.message ? text(game.signalBalanceGate.message, '', 500) : undefined,
      ctaLabel: game?.signalBalanceGate?.ctaLabel ? text(game.signalBalanceGate.ctaLabel, '', 80) : undefined,
      ctaUrl: game?.signalBalanceGate?.ctaUrl == null ? undefined : nullableAsset(game.signalBalanceGate.ctaUrl, null)
    }
  })).filter(game => game.gameId && game.route)

  const rawManagedBanners = Array.isArray(source.banners) ? source.banners : defaults.banners
  config.banners = rawManagedBanners.slice(0, 50).map((banner: any, index: number) => ({
    id: text(banner?.id, `banner-${index + 1}`, 80).replace(/[^a-z0-9_-]/gi, ''),
    placement: banner?.placement === 'ranking' ? 'ranking' : 'home',
    desktopImageUrl: nullableAsset(banner?.desktopImageUrl, '') || '',
    mobileImageUrl: nullableAsset(banner?.mobileImageUrl, null),
    altText: text(banner?.altText, config.brand.name, 200),
    targetUrl: nullableAsset(banner?.targetUrl, null),
    openInNewTab: bool(banner?.openInNewTab, false),
    enabled: bool(banner?.enabled, true),
    order: number(banner?.order, index + 1, 0, 999),
    startsAt: banner?.startsAt && !Number.isNaN(Date.parse(banner.startsAt)) ? new Date(banner.startsAt).toISOString() : null,
    endsAt: banner?.endsAt && !Number.isNaN(Date.parse(banner.endsAt)) ? new Date(banner.endsAt).toISOString() : null
  })).filter(banner => banner.id && banner.desktopImageUrl)
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

  for (const group of ['brand', 'theme', 'content', 'images', 'links', 'features', 'maintenance', 'notificationPrompt', 'signalBalanceGate']) {
    merged[group] = { ...merged[group], ...(existing as any)[group], ...(patch as any)[group] }
  }
  merged.menu = Array.isArray(patch.menu)
    ? patch.menu
    : Array.isArray((existing as any).menu) ? (existing as any).menu : merged.menu
  merged.games = Array.isArray(patch.games) ? patch.games : Array.isArray((existing as any).games) ? (existing as any).games : merged.games
  merged.banners = Array.isArray(patch.banners) ? patch.banners : Array.isArray((existing as any).banners) ? (existing as any).banners : merged.banners

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
