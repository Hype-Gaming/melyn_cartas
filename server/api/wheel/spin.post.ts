import { randomInt } from 'node:crypto'
import { BRANDS } from '../../../shared/brands'
import { getAppConfig } from '../../utils/appConfig'
import { getDb } from '../../utils/mongodb'

const dayInBahia = () => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Bahia', year: 'numeric', month: '2-digit', day: '2-digit'
}).format(new Date())

export default defineEventHandler(async (event) => {
  const authorization = getHeader(event, 'authorization') || ''
  const cookieKey = getHeader(event, 'x-cactus-cookie-key') || ''
  const brandSlug = getHeader(event, 'x-brand-slug') || ''
  const brand = BRANDS.find(item => item.slug === brandSlug)
  if (!authorization.startsWith('Bearer ') || !cookieKey || !brand) {
    throw createError({ statusCode: 401, message: 'Entre na sua conta para girar a roleta' })
  }

  let profile: any
  try {
    profile = await $fetch(`${brand.apiBaseUrl}/api/auth/user`, {
      headers: {
        Authorization: authorization,
        'X-Brand-Slug': brand.slug,
        'X-Base-Domain': brand.baseDomain,
        'X-Cactus-Cookie-Key': cookieKey
      },
      query: { collection: brand.userCollection }
    })
  } catch {
    throw createError({ statusCode: 401, message: 'Sessão inválida ou expirada' })
  }

  const userKey = `${brand.slug}:${String(profile?.email || profile?.id || '').trim().toLowerCase()}`
  if (!userKey.split(':')[1]) throw createError({ statusCode: 401, message: 'Usuário não identificado' })

  const config = await getAppConfig()
  if (!config.memberExperience.wheel.enabled) throw createError({ statusCode: 403, message: 'Roleta indisponível' })
  const prizes = config.memberExperience.wheel.prizes.filter(prize => prize.weight > 0)
  if (!prizes.length) throw createError({ statusCode: 503, message: 'Prêmios não configurados' })

  const db = await getDb()
  const collection = db.collection('daily_wheel_spins')
  await collection.createIndex({ appId: 1, userKey: 1, day: 1 }, { unique: true })
  const day = dayInBahia()
  const existing = await collection.findOne({ appId: config.appId, userKey, day })
  if (existing) return { alreadyUsed: true, prize: existing.prize, spunAt: existing.spunAt }

  const totalWeight = prizes.reduce((sum, prize) => sum + prize.weight, 0)
  let draw = randomInt(Math.max(1, Math.ceil(totalWeight)))
  const prize = prizes.find(item => (draw -= item.weight) < 0) || prizes[prizes.length - 1]!
  const spin = { appId: config.appId, userKey, day, prize, spunAt: new Date() }
  try {
    await collection.insertOne(spin)
  } catch (error: any) {
    if (error?.code === 11000) {
      const won = await collection.findOne({ appId: config.appId, userKey, day })
      return { alreadyUsed: true, prize: won?.prize, spunAt: won?.spunAt }
    }
    throw error
  }
  return { alreadyUsed: false, prize, spunAt: spin.spunAt }
})
