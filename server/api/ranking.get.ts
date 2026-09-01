import { getDb } from '../utils/mongodb'

const maskName = (name: unknown) => {
  const parts = String(name || 'Participante').trim().split(/\s+/).filter(Boolean)
  return parts.length > 1 ? `${parts[0]} ${parts[1][0].toUpperCase()}.` : parts[0] || 'Participante'
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const mode = query.mode === 'deposits' ? 'deposits' : 'activity'
  const period = ['7d', '30d', 'all'].includes(String(query.period)) ? String(query.period) : '7d'
  const currentEmail = String(query.currentEmail || '').trim().toLowerCase()
  const days = period === '7d' ? 7 : period === '30d' ? 30 : null
  const since = days ? new Date(Date.now() - days * 86_400_000) : null
  const db = await getDb()

  let rows: Array<Record<string, any>>
  if (mode === 'deposits') {
    rows = await db.collection('deposits').aggregate([
      ...(since ? [{ $match: { created_at: { $gte: since } } }] : []),
      { $group: { _id: '$email', score: { $sum: { $convert: { input: '$amount', to: 'double', onError: 0, onNull: 0 } } } } },
      { $lookup: { from: 'app_users', localField: '_id', foreignField: 'email', as: 'user' } },
      { $project: { email: '$_id', score: 1, name: { $ifNull: [{ $arrayElemAt: ['$user.name', 0] }, 'Participante'] } } },
      { $sort: { score: -1, email: 1 } }, { $limit: 50 }
    ]).toArray()
  } else {
    rows = await db.collection('app_users').aggregate([
      ...(since ? [{ $match: { last_seen_at: { $gte: since } } }] : []),
      { $project: { email: 1, name: 1, last_seen_at: 1, score: { $max: [{ $ifNull: ['$access_count', 1] }, 1] } } },
      { $sort: { score: -1, last_seen_at: -1, email: 1 } }, { $limit: 50 }
    ]).toArray()
  }

  const currentPosition = currentEmail ? rows.findIndex(row => String(row.email).toLowerCase() === currentEmail) + 1 : 0
  return {
    mode, period,
    currentPosition: currentPosition || null,
    rows: rows.map((row, index) => ({ position: index + 1, name: maskName(row.name), score: Number(row.score) || 0 }))
  }
})
