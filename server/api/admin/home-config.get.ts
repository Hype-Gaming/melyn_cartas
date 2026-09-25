import { requireAdmin } from '../../utils/admin'
import { readHomeConfig } from '../../utils/homeConfig'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  return { config: await readHomeConfig() }
})
