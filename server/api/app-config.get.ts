import { getAppConfig } from '../utils/appConfig'

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'no-store')
  try {
    return { success: true, data: await getAppConfig() }
  } catch (error) {
    console.error('Falha ao carregar app_config:', error)
    throw createError({ statusCode: 503, message: 'Configuração temporariamente indisponível' })
  }
})
