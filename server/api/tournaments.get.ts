import type { Tournament } from '../../shared/tournament'
import { MOCK_TOURNAMENT } from '../../shared/tournament'
import { getDb } from '../utils/mongodb'

/** Torneio ativo mais recente. Sem torneio (ou sem Mongo), devolve o exemplo. */
export default defineEventHandler(async () => {
  try {
    const db = await getDb()
    const doc = await db.collection('tournaments').findOne(
      { status: 'active' },
      { sort: { startsAt: -1 }, projection: { _id: 0, createdBy: 0, updatedBy: 0 } }
    )
    return { tournament: (doc as Tournament | null) || MOCK_TOURNAMENT, mock: !doc }
  } catch (error) {
    console.error('Torneio indisponivel, usando o exemplo:', error)
    return { tournament: MOCK_TOURNAMENT, mock: true }
  }
})
