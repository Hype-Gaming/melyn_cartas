import { getDb } from '../../../utils/mongodb'
import { requireAdmin } from '../../../utils/admin'
import { writeAuditLog } from '../../../utils/audit'

export default defineEventHandler(async (event) => {
  const adminEmail = await requireAdmin(event)

  const body = await readBody(event)
  const email = String(body?.email || '').trim().toLowerCase()
  const blocked = !!body?.blocked

  if (!email) {
    throw createError({ statusCode: 400, message: 'Email obrigatório' })
  }

  const db = await getDb()
  const before = await db.collection('app_users').findOne({ email })
  // upsert cobre o assinante-only (que ainda não tem registro em app_users)
  await db.collection('app_users').updateOne(
    { email },
    { $set: { email, blocked, blocked_at: blocked ? new Date() : null } },
    { upsert: true }
  )
  await writeAuditLog({ admin: adminEmail, action: blocked ? 'block' : 'unblock', entity: 'user', entityId: email, before: { blocked: before?.blocked }, after: { blocked } })

  return { ok: true, email, blocked }
})
