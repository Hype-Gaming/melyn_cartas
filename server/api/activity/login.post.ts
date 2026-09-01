import { getDb } from '../../utils/mongodb'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const email = String(body?.email || '').trim().toLowerCase()
  if (!EMAIL_RE.test(email)) throw createError({ statusCode: 400, message: 'E-mail inválido' })

  const now = new Date()
  const set: Record<string, unknown> = { email, last_seen_at: now }
  if (body?.phone) set.phone = String(body.phone).trim().slice(0, 40)
  if (body?.name) set.name = String(body.name).trim().slice(0, 160)
  if (body?.playerId != null) set.cactus_user_id = body.playerId
  if (body?.brandSlug) set.brand_slug = String(body.brandSlug).trim().slice(0, 80)
  if (Number.isFinite(Number(body?.balance))) set.last_known_balance = Number(body.balance)

  const db = await getDb()
  await db.collection('app_users').createIndex({ email: 1 }, { unique: true })
  await db.collection('app_users').updateOne(
    { email },
    {
      $set: set,
      $setOnInsert: { first_seen_at: now, blocked: false },
      $inc: { access_count: 1 }
    },
    { upsert: true }
  )
  return { ok: true }
})
