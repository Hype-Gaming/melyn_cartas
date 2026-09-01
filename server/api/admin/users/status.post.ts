import { getDb } from '../../../utils/mongodb'
import { requireAdmin } from '../../../utils/admin'
import { writeAuditLog } from '../../../utils/audit'

const ALLOWED = ['pendente', 'contatado', 'respondeu', 'convertido', 'ignorado']

export default defineEventHandler(async (event) => {
  const adminEmail = await requireAdmin(event)

  const body = await readBody(event)
  const email = String(body?.email || '').trim().toLowerCase()
  const status = String(body?.status || '')

  if (!email) {
    throw createError({ statusCode: 400, message: 'Email obrigatório' })
  }
  if (!ALLOWED.includes(status)) {
    throw createError({ statusCode: 400, message: 'Status inválido' })
  }

  const db = await getDb()
  const before = await db.collection('user_contact_status').findOne({ email })
  await db.collection('user_contact_status').updateOne(
    { email },
    { $set: { email, status, updated_at: new Date(), updated_by: adminEmail } },
    { upsert: true }
  )
  await writeAuditLog({ admin: adminEmail, action: 'update_status', entity: 'user', entityId: email, before: { status: before?.status }, after: { status } })

  return { ok: true, email, status }
})
