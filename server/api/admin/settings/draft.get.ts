import { requireAdmin } from '../../../utils/admin'
import { getDb } from '../../../utils/mongodb'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const db = await getDb()
  const draft = await db.collection('app_config_drafts').findOne({ appId: 'main' })
  return { data: draft?.config || null, updatedAt: draft?.updatedAt || null }
})
