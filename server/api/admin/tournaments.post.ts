import { ObjectId } from 'mongodb'
import { requireAdmin } from '../../utils/admin'
import { getDb } from '../../utils/mongodb'
import { APP_ID } from '../../../shared/appConfig'

const clean = (value: unknown, max: number) => typeof value === 'string' ? value.trim().slice(0, max) : ''

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const body = await readBody(event)
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw createError({ statusCode: 400, message: 'Dados inválidos' })
  const title = clean(body.title, 120)
  const description = clean(body.description, 1000)
  const startsAt = new Date(body.startsAt)
  const endsAt = new Date(body.endsAt)
  const status = body.status === 'published' ? 'published' : 'draft'
  const active = body.active === true
  if (!title || !description || Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) {
    throw createError({ statusCode: 400, message: 'Preencha título, descrição e um período válido' })
  }
  const prizes = Array.isArray(body.prizes) ? body.prizes.slice(0, 20).map((item: any) => clean(item, 120)).filter(Boolean) : []
  const rules = Array.isArray(body.rules) ? body.rules.slice(0, 30).map((item: any) => clean(item, 300)).filter(Boolean) : []
  const ranking = Array.isArray(body.ranking) ? body.ranking.slice(0, 100).map((item: any, index: number) => ({
    position: index + 1, name: clean(item?.name, 80) || 'Participante', score: Math.max(0, Number(item?.score) || 0)
  })) : []
  const db = await getDb()
  const collection = db.collection('tournaments')
  await collection.createIndex(
    { appId: 1, active: 1 },
    { unique: true, partialFilterExpression: { active: true }, name: 'one_active_tournament_per_app' }
  )
  const _id = ObjectId.isValid(body._id) ? new ObjectId(body._id) : new ObjectId()
  if (active) await collection.updateMany({ appId: APP_ID, _id: { $ne: _id } }, { $set: { active: false, updatedAt: new Date() } })
  const tournament = { appId: APP_ID, title, description, startsAt, endsAt, status, active, prizes, rules, ranking, updatedAt: new Date(), updatedBy: admin }
  await collection.updateOne({ appId: APP_ID, _id }, { $set: tournament, $setOnInsert: { createdAt: new Date(), createdBy: admin } }, { upsert: true })
  return { success: true, tournament: { _id, ...tournament } }
})
