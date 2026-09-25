import { getDb } from '../utils/mongodb'
import { APP_ID } from '../../shared/appConfig'

export default defineEventHandler(async () => {
  const db = await getDb()
  const now = new Date()
  const tournament = await db.collection('tournaments').findOne(
    { appId: APP_ID, status: 'published' },
    { sort: { active: -1, startsAt: -1 }, projection: { createdBy: 0 } }
  )
  if (!tournament) return { tournament: null }
  return {
    tournament: {
      ...tournament,
      active: tournament.active === true && new Date(tournament.startsAt) <= now && new Date(tournament.endsAt) >= now
    }
  }
})
