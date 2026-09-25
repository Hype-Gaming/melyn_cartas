import type { HomeConfig } from '../../../shared/homeConfig'
import { DEFAULT_HOME_CONFIG } from '../../../shared/homeConfig'
import { requireAdmin } from '../../utils/admin'
import { getDb } from '../../utils/mongodb'
import { writeAuditLog } from '../../utils/audit'
import { TENANT } from '../../utils/homeConfig'

const text = (value: unknown, fallback = '', max = 300) =>
  typeof value === 'string' ? value.trim().slice(0, max) : fallback

const count = (value: unknown, fallback = 0) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.max(0, Math.min(10_000_000, Math.round(parsed))) : fallback
}

const bool = (value: unknown) => value === true

// Data URL de imagem (gerado pelo resizeImage) ou URL http(s). Bloqueia javascript:.
const image = (value: unknown, max = 3_000_000) => {
  const raw = text(value, '', max)
  if (!raw) return ''
  return /^(https?:\/\/|data:image\/)/i.test(raw) ? raw : ''
}

const link = (value: unknown) => {
  const raw = text(value, '', 2000)
  if (!raw) return ''
  return /^(https?:\/\/|\/|#)/i.test(raw) ? raw : ''
}

const links = (value: unknown, max: number) =>
  (Array.isArray(value) ? value : []).slice(0, max).map((item: any) => ({
    label: text(item?.label, '', 60),
    icon: text(item?.icon, 'ph:star-bold', 100),
    href: link(item?.href),
    description: text(item?.description, '', 200),
    image: image(item?.image),
    external: bool(item?.external)
  })).filter(item => item.label && item.href)

export default defineEventHandler(async (event) => {
  const adminEmail = await requireAdmin(event)
  const body = await readBody(event)
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw createError({ statusCode: 400, message: 'Configuracao invalida' })
  }

  const tenant = text(body.tenant, TENANT, 60).replace(/[^a-z0-9_-]/gi, '')
  const brandName = text(body.brandName, '', 120)
  const accentColor = text(body.accentColor, '', 7)
  if (!tenant) throw createError({ statusCode: 400, message: 'Tenant invalido' })
  if (!brandName) throw createError({ statusCode: 400, message: 'Informe o nome da marca' })
  if (accentColor && !/^#[0-9a-f]{6}$/i.test(accentColor)) {
    throw createError({ statusCode: 400, message: 'Cor de destaque deve estar no formato #rrggbb' })
  }

  const config: HomeConfig = {
    tenant,
    brandName,
    accentColor,
    liveTitle: text(body.liveTitle, DEFAULT_HOME_CONFIG.liveTitle, 120),
    liveAt: text(body.liveAt, DEFAULT_HOME_CONFIG.liveAt, 80),
    liveHref: link(body.liveHref) || DEFAULT_HOME_CONFIG.liveHref,
    heroVideo: text(body.heroVideo, '', 2000),
    banners: (Array.isArray(body.banners) ? body.banners : []).slice(0, 10).map((item: any) => ({
      image: image(item?.image),
      href: link(item?.href),
      external: bool(item?.external)
    })).filter((banner: any) => banner.image),
    xpLabel: text(body.xpLabel, DEFAULT_HOME_CONFIG.xpLabel, 80),
    xpCurrent: count(body.xpCurrent),
    // Meta zero dividiria por zero na barra de progresso.
    xpGoal: Math.max(1, count(body.xpGoal, DEFAULT_HOME_CONFIG.xpGoal)),
    shortcuts: links(body.shortcuts, 12),
    connectionLinks: links(body.connectionLinks, 12),
    games: (Array.isArray(body.games) ? body.games : []).slice(0, 60).map((item: any, index: number) => ({
      id: text(item?.id, `jogo-${index + 1}`, 80),
      name: text(item?.name, '', 120),
      image: image(item?.image),
      provider: text(item?.provider, '', 80),
      category: ['prime', 'premium', 'claude'].includes(item?.category) ? item.category : 'prime',
      locked: bool(item?.locked)
    })).filter((game: any) => game.name)
  }

  const db = await getDb()
  await db.collection('site_configs').updateOne(
    { tenant },
    { $set: { ...config, updatedAt: new Date(), updatedBy: adminEmail } },
    { upsert: true }
  )
  await writeAuditLog({ admin: adminEmail, action: 'publish', entity: 'home_config', entityId: tenant, after: config })

  return { success: true, config }
})
