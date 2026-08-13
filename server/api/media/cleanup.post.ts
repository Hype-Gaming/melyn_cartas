import { requireAdmin } from '../../utils/admin'
import { DEFAULT_MEDIA_GRACE_MS, cleanupOrphanMedia } from '../../utils/media'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const raw = getQuery(event).graceMs
  const parsed = typeof raw === 'string' && raw.trim() !== '' ? Number(raw) : Number.NaN
  const graceMs = Number.isFinite(parsed) && parsed >= 0 ? parsed : DEFAULT_MEDIA_GRACE_MS

  return cleanupOrphanMedia(graceMs)
})
