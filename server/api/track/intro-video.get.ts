import { getDb } from '../../utils/mongodb'
import { requireEmail } from '../../utils/appUser'

/** O usuario ja assistiu ao video de boas-vindas? */
export default defineEventHandler(async (event) => {
  const email = requireEmail(getQuery(event).email)
  const db = await getDb()
  const user = await db.collection('app_users').findOne(
    { email },
    { projection: { intro_video_watched_at: 1 } }
  )
  return { watched: !!user?.intro_video_watched_at }
})
