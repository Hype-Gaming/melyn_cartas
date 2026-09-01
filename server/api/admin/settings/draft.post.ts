import { requireAdmin } from '../../../utils/admin'
import { getDb } from '../../../utils/mongodb'
import { normalizeAppConfig } from '../../../utils/appConfig'
import { writeAuditLog } from '../../../utils/audit'

export default defineEventHandler(async (event) => {
  const adminEmail = await requireAdmin(event)
  const body = await readBody(event)
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw createError({ statusCode: 400, message: 'Configuração inválida' })
  const config = normalizeAppConfig(body)
  const db = await getDb()
  const before = await db.collection('app_config_drafts').findOne({ appId: 'main' })
  await db.collection('app_config_drafts').updateOne({ appId: 'main' }, { $set: { config, updatedAt: new Date(), updatedBy: adminEmail }, $setOnInsert: { appId: 'main', createdAt: new Date() } }, { upsert: true })
  await writeAuditLog({ admin: adminEmail, action: 'save_draft', entity: 'app_config', entityId: 'main', before: before?.config, after: config })
  return { success: true, data: config }
})
