import { requireAdmin } from '../utils/admin'
import { getAppConfig, saveAppConfig } from '../utils/appConfig'
import { cleanupOrphanMedia } from '../utils/media'
import { getDb } from '../utils/mongodb'
import { writeAuditLog } from '../utils/audit'

export default defineEventHandler(async (event) => {
  const adminEmail = await requireAdmin(event)
  const body = await readBody(event)
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw createError({ statusCode: 400, message: 'Configuração inválida' })
  }

  const before = await getAppConfig()
  const db = await getDb()
  await db.collection('app_config_versions').insertOne({ appId: before.appId, config: before, publishedAt: new Date(), publishedBy: adminEmail })
  const data = await saveAppConfig(body)
  await writeAuditLog({ admin: adminEmail, action: 'publish', entity: 'app_config', entityId: data.appId, before, after: data })

  // A configuração já foi persistida; falhas da manutenção não podem derrubar o save.
  try {
    await cleanupOrphanMedia()
  } catch (error) {
    console.error('Falha ao limpar mídias órfãs:', error)
  }

  return { success: true, data }
})
