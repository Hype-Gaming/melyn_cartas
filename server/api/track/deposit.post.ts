import { getDb } from '../../utils/mongodb'

const MAX_DEPOSIT_AMOUNT = 1_000_000
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const cleanString = (value: unknown, maxLength = 200): string | null => {
  if (typeof value !== 'string' && typeof value !== 'number') return null
  const trimmed = String(value).trim()
  return trimmed ? trimmed.slice(0, maxLength) : null
}

export default defineEventHandler(async (event) => {
  const body = await readBody<{
    email?: unknown
    userId?: unknown
    brandSlug?: unknown
    amount?: unknown
    transactionId?: unknown
  }>(event)

  const email = cleanString(body?.email)?.toLowerCase() || ''
  const transactionId = cleanString(body?.transactionId)
  const amount = Number(body?.amount)

  if (!EMAIL_RE.test(email)) throw createError({ statusCode: 400, message: 'E-mail inválido' })
  if (!transactionId) throw createError({ statusCode: 400, message: 'ID da transação obrigatório' })
  if (!Number.isFinite(amount) || amount <= 0 || amount > MAX_DEPOSIT_AMOUNT) {
    throw createError({ statusCode: 400, message: 'Valor inválido' })
  }

  const db = await getDb()
  const deposits = db.collection('deposits')
  await deposits.createIndex(
    { transaction_id: 1 },
    { unique: true, partialFilterExpression: { transaction_id: { $type: 'string' } } }
  )

  const result = await deposits.updateOne(
    { transaction_id: transactionId },
    {
      $set: {
        email,
        cactus_user_id: Number.isFinite(Number(body?.userId)) ? Number(body?.userId) : null,
        brand_slug: cleanString(body?.brandSlug, 50),
        amount,
        status: 'generated',
        source: 'app-pix',
        updated_at: new Date()
      },
      $setOnInsert: { transaction_id: transactionId, is_ftd: false, created_at: new Date() }
    },
    { upsert: true }
  )

  return { success: true, created: result.upsertedCount === 1 }
})
