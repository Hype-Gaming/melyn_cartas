import { getDb } from '../../../utils/mongodb'
import { requireAdmin } from '../../../utils/admin'
import { writeAuditLog } from '../../../utils/audit'

const ALLOWED = ['auto', 'none', 'risk_24h', 'risk_48h', 'risk_no_access']

export default defineEventHandler(async (event) => {
  const adminEmail = await requireAdmin(event)

  const body = await readBody(event)
  const email = String(body?.email || '').trim().toLowerCase()
  const tag = String(body?.tag || '')

  if (!email) {
    throw createError({ statusCode: 400, message: 'Email obrigatório' })
  }
  if (!ALLOWED.includes(tag)) {
    throw createError({ statusCode: 400, message: 'Tag inválida' })
  }

  const db = await getDb()
  const before = await db.collection('user_contact_status').findOne({ email })
  await db.collection('user_contact_status').updateOne(
    { email },
    { $set: { email, tag, updated_at: new Date(), updated_by: adminEmail } },
    { upsert: true }
  )
  await writeAuditLog({ admin: adminEmail, action: 'update_tag', entity: 'user', entityId: email, before: { tag: before?.tag }, after: { tag } })

  return { ok: true, email, tag }
})
