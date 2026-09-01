import { requireAdmin } from '../../utils/admin'
import { getDb } from '../../utils/mongodb'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const limit = Math.min(200, Math.max(1, Number(getQuery(event).limit) || 50))
  const db = await getDb()
  return { entries: await db.collection('admin_audit_log').find({}, { projection: { before: 0, after: 0 } }).sort({ createdAt: -1 }).limit(limit).toArray() }
})
