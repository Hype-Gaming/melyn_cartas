import { getDb } from '../../../utils/mongodb'
import { requireAdmin } from '../../../utils/admin'
import { writeAuditLog } from '../../../utils/audit'

export default defineEventHandler(async (event) => {
  const adminEmail = await requireAdmin(event)

  const body = await readBody(event)
  const email = String(body?.email || '').trim().toLowerCase()
  const raw = String(body?.phone || '').trim()
  const phone = raw || null

  if (!email) {
    throw createError({ statusCode: 400, message: 'Email obrigatório' })
  }

  const db = await getDb()
  const before = await db.collection('app_users').findOne({ email })
  // grava no registro de usuário (cria se for assinante-only) e na assinatura, se existir
  await db.collection('app_users').updateOne(
    { email },
    { $set: { email, phone } },
    { upsert: true }
  )
  await db.collection('subscriptions').updateOne({ email }, { $set: { phone } })
  await writeAuditLog({ admin: adminEmail, action: 'update_phone', entity: 'user', entityId: email, before: { phone: before?.phone || null }, after: { phone } })

  return { ok: true, email, phone }
})
