import { GridFSBucket, ObjectId } from 'mongodb'
import type { AppConfig } from '../../shared/appConfig'
import { getAppConfig } from './appConfig'
import { getDb } from './mongodb'

export const MEDIA_BUCKET = 'media'
export const MAX_MEDIA_BYTES = 5 * 1024 * 1024
export const DEFAULT_MEDIA_GRACE_MS = 60 * 60 * 1000

const ALLOWED_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'image/x-icon'
])

const MEDIA_URL = /^\/api\/media\/([a-f\d]{24})$/i

export const getMediaBucket = async () =>
  new GridFSBucket(await getDb(), { bucketName: MEDIA_BUCKET })

const startsWith = (buffer: Buffer, bytes: number[]) =>
  buffer.length >= bytes.length && bytes.every((byte, index) => buffer[index] === byte)

/** Detecta o tipo real pelo conteúdo, sem confiar no MIME ou extensão enviados. */
export const sniffImageType = (buffer: Buffer): string | null => {
  if (startsWith(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'image/png'
  if (startsWith(buffer, [0xff, 0xd8, 0xff])) return 'image/jpeg'
  if (startsWith(buffer, [0x47, 0x49, 0x46, 0x38])) return 'image/gif'
  if (startsWith(buffer, [0x00, 0x00, 0x01, 0x00])) return 'image/x-icon'

  if (
    buffer.length >= 12
    && buffer.subarray(0, 4).toString('ascii') === 'RIFF'
    && buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) return 'image/webp'

  // SVG não possui assinatura binária. Limitamos a inspeção ao início do arquivo.
  const head = buffer.subarray(0, 1024).toString('utf8').replace(/^\uFEFF/, '').trimStart()
  if (head.startsWith('<?xml') || head.startsWith('<svg')) return 'image/svg+xml'

  return null
}

export interface MediaValidation {
  ok: boolean
  contentType?: string
  error?: string
}

export const validateMedia = (buffer: Buffer): MediaValidation => {
  if (!buffer?.length) return { ok: false, error: 'Arquivo vazio.' }
  if (buffer.length > MAX_MEDIA_BYTES) return { ok: false, error: 'Arquivo maior que 5 MB.' }

  const contentType = sniffImageType(buffer)
  if (!contentType || !ALLOWED_TYPES.has(contentType)) {
    return { ok: false, error: 'Formato não suportado. Use PNG, JPEG, WEBP, GIF, SVG ou ICO.' }
  }

  return { ok: true, contentType }
}

export const saveMedia = async (buffer: Buffer, filename: string, contentType: string): Promise<ObjectId> => {
  const bucket = await getMediaBucket()
  const stream = bucket.openUploadStream(filename, {
    metadata: { contentType }
  })

  await new Promise<void>((resolve, reject) => {
    stream.once('finish', resolve)
    stream.once('error', reject)
    stream.end(buffer)
  })

  return stream.id as ObjectId
}

const idFromUrl = (value: unknown): string | null => {
  if (typeof value !== 'string') return null
  return value.trim().match(MEDIA_URL)?.[1]?.toLowerCase() || null
}

/** Retorna todos os ids do GridFS atualmente referenciados pela configuração. */
export const collectMediaIds = (config: AppConfig): Set<string> => {
  const candidates: unknown[] = [
    config.brand?.logo,
    config.brand?.favicon,
    config.images?.blocked,
    config.images?.premium,
    config.images?.live,
    ...(Array.isArray(config.images?.banners) ? config.images.banners : [])
  ]

  return new Set(candidates.map(idFromUrl).filter((id): id is string => Boolean(id)))
}

export interface CleanupResult {
  removidos: number
  espacoLiberado: number
}

/** Apaga mídias órfãs mais antigas que a janela de proteção. */
export const cleanupOrphanMedia = async (
  graceMs: number = DEFAULT_MEDIA_GRACE_MS
): Promise<CleanupResult> => {
  const emUso = collectMediaIds(await getAppConfig())
  const bucket = await getMediaBucket()
  const limite = new Date(Date.now() - Math.max(0, graceMs))
  const arquivos = await bucket.find({ uploadDate: { $lte: limite } }).toArray()

  let removidos = 0
  let espacoLiberado = 0

  for (const arquivo of arquivos) {
    if (emUso.has(arquivo._id.toString().toLowerCase())) continue
    await bucket.delete(arquivo._id)
    removidos += 1
    espacoLiberado += arquivo.length
  }

  return { removidos, espacoLiberado }
}
