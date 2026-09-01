import { requireAdmin } from '../../../utils/admin'
import { getDb } from '../../../utils/mongodb'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const db = await getDb()
  return { versions: await db.collection('app_config_versions').find({ appId: 'main' }, { projection: { config: 0 } }).sort({ publishedAt: -1 }).limit(20).toArray() }
})
