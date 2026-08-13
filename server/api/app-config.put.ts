import { requireAdmin } from '../utils/admin'
import { saveAppConfig } from '../utils/appConfig'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readBody(event)
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw createError({ statusCode: 400, message: 'Configuração inválida' })
  }

  return { success: true, data: await saveAppConfig(body) }
})
