import { requireAdmin } from '../../utils/admin'
import { getDb } from '../../utils/mongodb'
import { APP_ID } from '../../../shared/appConfig'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const db = await getDb()
  return { tournaments: await db.collection('tournaments').find({ appId: APP_ID }).sort({ createdAt: -1 }).limit(100).toArray() }
})
