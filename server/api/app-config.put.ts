import { requireAdmin } from '../utils/admin'
import { saveAppConfig } from '../utils/appConfig'
import { cleanupOrphanMedia } from '../utils/media'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readBody(event)
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw createError({ statusCode: 400, message: 'Configuração inválida' })
  }

  const data = await saveAppConfig(body)

  // A configuração já foi persistida; falhas da manutenção não podem derrubar o save.
  try {
    await cleanupOrphanMedia()
  } catch (error) {
    console.error('Falha ao limpar mídias órfãs:', error)
  }

  return { success: true, data }
})
