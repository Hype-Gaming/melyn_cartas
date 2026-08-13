import { ObjectId } from 'mongodb'
import { getMediaBucket } from '../../utils/media'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id') || ''
  if (!/^[a-f\d]{24}$/i.test(id)) {
    throw createError({ statusCode: 400, message: 'Identificador inválido.' })
  }

  const objectId = new ObjectId(id)
  const bucket = await getMediaBucket()
  const [file] = await bucket.find({ _id: objectId }).limit(1).toArray()
  if (!file) throw createError({ statusCode: 404, message: 'Arquivo não encontrado.' })

  const etag = `"${objectId.toString()}"`
  setHeader(event, 'ETag', etag)
  setHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')
  setHeader(event, 'Content-Type', String(file.metadata?.contentType || file.contentType || 'application/octet-stream'))
  setHeader(event, 'X-Content-Type-Options', 'nosniff')
  setHeader(event, 'Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'")

  if (getHeader(event, 'if-none-match') === etag) {
    setResponseStatus(event, 304)
    return null
  }

  setHeader(event, 'Content-Length', String(file.length))
  return sendStream(event, bucket.openDownloadStream(objectId))
})
