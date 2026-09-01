import { ObjectId } from 'mongodb'
import { requireAdmin } from '../../../utils/admin'
import { getDb } from '../../../utils/mongodb'
import { getAppConfig, saveAppConfig } from '../../../utils/appConfig'
import { writeAuditLog } from '../../../utils/audit'

export default defineEventHandler(async (event) => {
  const adminEmail = await requireAdmin(event)
  const id = String((await readBody(event))?.versionId || '')
  if (!ObjectId.isValid(id)) throw createError({ statusCode: 400, message: 'Versão inválida' })
  const db = await getDb()
  const version = await db.collection('app_config_versions').findOne({ _id: new ObjectId(id), appId: 'main' })
  if (!version?.config) throw createError({ statusCode: 404, message: 'Versão não encontrada' })
  const before = await getAppConfig()
  const data = await saveAppConfig(version.config)
  await writeAuditLog({ admin: adminEmail, action: 'rollback', entity: 'app_config', entityId: 'main', before, after: data })
  return { success: true, data }
})
