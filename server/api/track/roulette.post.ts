import { getDb } from '../../utils/mongodb'
import { appUserOnInsert, requireEmail } from '../../utils/appUser'
import { ROULETTE_PRIZES, drawPrizeIndex, rouletteDay } from '../../utils/roulette'

/**
 * Gira a roleta. O premio sai do servidor e o filtro `roulette_spin_day: { $ne: hoje }`
 * garante um giro por dia: duas requisicoes simultaneas so gravam uma.
 */
export default defineEventHandler(async (event) => {
  const email = requireEmail((await readBody(event))?.email)
  const day = rouletteDay()
  const prizeIndex = drawPrizeIndex()

  const db = await getDb()
  const collection = db.collection('app_users')
  // Sem o indice unico, o upsert abaixo criaria um segundo usuario com o mesmo
  // e-mail quando o giro do dia ja existisse. Com ele, a tentativa vira 11000.
  await collection.createIndex({ email: 1 }, { unique: true })

  const alreadySpun = async () => {
    const user = await collection.findOne({ email }, { projection: { roulette_prize_index: 1 } })
    const savedIndex = Number(user?.roulette_prize_index ?? 0)
    return { available: false, alreadySpun: true, prizeIndex: savedIndex, prize: ROULETTE_PRIZES[savedIndex] }
  }

  let result
  try {
    result = await collection.updateOne(
      { email, roulette_spin_day: { $ne: day } },
      {
        $set: { roulette_spin_day: day, roulette_spun_at: new Date(), roulette_prize_index: prizeIndex },
        $setOnInsert: appUserOnInsert(email)
      },
      { upsert: true }
    )
  } catch (error: any) {
    // O usuario existe e ja girou hoje: o filtro nao casou e o upsert bateu no indice.
    if (error?.code === 11000) return alreadySpun()
    throw error
  }

  if (!result.modifiedCount && !result.upsertedCount) return alreadySpun()

  return { available: false, alreadySpun: false, prizeIndex, prize: ROULETTE_PRIZES[prizeIndex] }
})
