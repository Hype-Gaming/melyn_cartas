import { getDb } from '../../utils/mongodb'
import { appUserOnInsert, requireEmail } from '../../utils/appUser'

/** Marca o video de boas-vindas como assistido. */
export default defineEventHandler(async (event) => {
  const email = requireEmail((await readBody(event))?.email)
  const db = await getDb()
  await db.collection('app_users').updateOne(
    { email },
    { $set: { intro_video_watched_at: new Date() }, $setOnInsert: appUserOnInsert(email) },
    { upsert: true }
  )
  return { watched: true }
})
