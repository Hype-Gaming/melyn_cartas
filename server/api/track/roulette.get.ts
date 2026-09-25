import { getDb } from '../../utils/mongodb'
import { requireEmail } from '../../utils/appUser'
import { ROULETTE_PRIZES, rouletteDay } from '../../utils/roulette'

/** O giro de hoje ainda esta disponivel? */
export default defineEventHandler(async (event) => {
  const email = requireEmail(getQuery(event).email)
  const db = await getDb()
  const user = await db.collection('app_users').findOne(
    { email },
    { projection: { roulette_spin_day: 1, roulette_prize_index: 1 } }
  )

  const spunToday = user?.roulette_spin_day === rouletteDay()
  return {
    available: !spunToday,
    prizeIndex: spunToday ? user?.roulette_prize_index ?? null : null,
    prize: spunToday ? ROULETTE_PRIZES[user?.roulette_prize_index as number] ?? null : null
  }
})
