import { requireAdmin } from '../utils/admin'
import { saveMedia, validateMedia } from '../utils/media'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const parts = await readMultipartFormData(event)
  const file = parts?.find(part => part.name === 'file' && part.filename)
  if (!file) throw createError({ statusCode: 400, message: 'Nenhum arquivo enviado.' })

  const check = validateMedia(file.data)
  if (!check.ok) throw createError({ statusCode: 400, message: check.error })

  const filename = String(file.filename).replace(/[\r\n]/g, '').slice(0, 200) || 'imagem'
  const id = await saveMedia(file.data, filename, check.contentType!)

  return {
    id: id.toString(),
    url: `/api/media/${id.toString()}`,
    filename,
    size: file.data.length,
    contentType: check.contentType
  }
})
