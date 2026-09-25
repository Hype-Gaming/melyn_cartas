import { readHomeConfig } from '../utils/homeConfig'

export default defineEventHandler(async () => ({ config: await readHomeConfig() }))
