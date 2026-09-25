import { requireAdmin } from '../../utils/admin'
import { getDb } from '../../utils/mongodb'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const db = await getDb()
  const tournaments = await db.collection('tournaments')
    .find({}, { projection: { _id: 0 } })
    .sort({ startsAt: -1 })
    .limit(50)
    .toArray()
  return { tournaments }
})
