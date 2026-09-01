import { getDb } from '../utils/mongodb'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default defineEventHandler(async (event) => {
  const email = String(getQuery(event).email || '').trim().toLowerCase()
  if (!EMAIL_RE.test(email)) throw createError({ statusCode: 400, message: 'E-mail inválido' })
  const db = await getDb()
  const user = await db.collection('app_users').findOne({ email }, { projection: { first_seen_at: 1, last_seen_at: 1, access_count: 1 } })
  if (!user) return { activity: null, ranking: { activity: null, deposits: null } }

  const activityScore = Math.max(1, Number(user.access_count) || 1)
  const activityAhead = await db.collection('app_users').countDocuments({ access_count: { $gt: activityScore } })
  const depositRows = await db.collection('deposits').aggregate([
    { $group: { _id: '$email', score: { $sum: { $convert: { input: '$amount', to: 'double', onError: 0, onNull: 0 } } } } },
    { $sort: { score: -1 } }
  ]).toArray()
  const depositIndex = depositRows.findIndex(row => String(row._id).toLowerCase() === email)

  return {
    activity: { firstAccessAt: user.first_seen_at || null, lastAccessAt: user.last_seen_at || null, accessCount: activityScore },
    ranking: { activity: activityAhead + 1, deposits: depositIndex >= 0 ? depositIndex + 1 : null }
  }
})
