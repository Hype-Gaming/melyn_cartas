import { getAppConfig } from '../../utils/appConfig'

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'no-store')
  return { success: true, data: await getAppConfig() }
})
