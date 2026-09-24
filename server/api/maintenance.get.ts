import { getAppConfig } from '../utils/appConfig'

const DEFAULT_TITLE = 'Em manutenção'
const DEFAULT_MESSAGE = 'Estamos realizando melhorias. Voltamos em breve.'

export default defineEventHandler(async (event) => {
  setHeaders(event, {
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
    Pragma: 'no-cache',
    Expires: '0',
    'Surrogate-Control': 'no-store'
  })

  try {
    const { maintenance, updatedAt } = await getAppConfig()
    return {
      active: maintenance.active,
      title: maintenance.title.trim() || DEFAULT_TITLE,
      message: maintenance.message.trim() || DEFAULT_MESSAGE,
      updatedAt: updatedAt || null
    }
  } catch (error) {
    console.error('Falha ao consultar modo de manutenção:', error)
    throw createError({ statusCode: 503, message: 'Status de manutenção temporariamente indisponível' })
  }
})
