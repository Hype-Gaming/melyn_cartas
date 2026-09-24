import { requireAdmin } from '../../../utils/admin'
import { getAppConfig, saveAppConfig } from '../../../utils/appConfig'
import { writeAuditLog } from '../../../utils/audit'

const DEFAULT_TITLE = 'Em manutenção'
const DEFAULT_MESSAGE = 'Estamos realizando melhorias. Voltamos em breve.'
const TITLE_MAX_LENGTH = 120
const MESSAGE_MAX_LENGTH = 500

export default defineEventHandler(async (event) => {
  const adminEmail = await requireAdmin(event)
  const body = await readBody(event)

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw createError({ statusCode: 400, message: 'Configuração inválida' })
  }

  const { active, title, message } = body as Record<string, unknown>
  if (typeof active !== 'boolean' || typeof title !== 'string' || typeof message !== 'string') {
    throw createError({ statusCode: 400, message: 'Ativo, título e mensagem devem ter os tipos esperados' })
  }
  if (title.length > TITLE_MAX_LENGTH) {
    throw createError({ statusCode: 400, message: `O título deve ter no máximo ${TITLE_MAX_LENGTH} caracteres` })
  }
  if (message.length > MESSAGE_MAX_LENGTH) {
    throw createError({ statusCode: 400, message: `A mensagem deve ter no máximo ${MESSAGE_MAX_LENGTH} caracteres` })
  }

  const before = await getAppConfig()
  const maintenance = {
    active,
    title: title.trim() || DEFAULT_TITLE,
    message: message.trim() || DEFAULT_MESSAGE
  }
  const data = await saveAppConfig({ maintenance })

  await writeAuditLog({
    admin: adminEmail,
    action: active ? 'maintenance_enable' : 'maintenance_disable',
    entity: 'app_config',
    entityId: data.appId,
    before: before.maintenance,
    after: data.maintenance
  })

  setHeader(event, 'Cache-Control', 'no-store')
  return { success: true, data: data.maintenance }
})
