import { randomUUID } from 'node:crypto'
import type { Tournament, TournamentPrize, TournamentRankingEntry } from '../../../shared/tournament'
import { requireAdmin } from '../../utils/admin'
import { getDb } from '../../utils/mongodb'
import { writeAuditLog } from '../../utils/audit'

const text = (value: unknown, max: number) =>
  typeof value === 'string' ? value.trim().slice(0, max) : ''

export default defineEventHandler(async (event) => {
  const adminEmail = await requireAdmin(event)
  const body = await readBody(event)
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw createError({ statusCode: 400, message: 'Dados inválidos' })
  }

  const title = text(body.title, 120)
  const description = text(body.description, 1000)
  const startsAt = new Date(body.startsAt)
  const endsAt = new Date(body.endsAt)

  if (!title) throw createError({ statusCode: 400, message: 'Informe o título do torneio' })
  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) {
    throw createError({ statusCode: 400, message: 'Informe um período válido (fim depois do início)' })
  }

  // body vem como any: tipar a origem mantém o resto da cadeia tipada.
  const rawPrizes: any[] = Array.isArray(body.prizes) ? body.prizes : []
  const prizes: TournamentPrize[] = rawPrizes.slice(0, 20)
    .map((prize, index): TournamentPrize => ({
      place: Number.isFinite(Number(prize?.place)) ? Math.max(1, Math.min(999, Number(prize.place))) : index + 1,
      value: text(prize?.value, 120)
    }))
    .filter((prize) => prize.value)
    .sort((a, b) => a.place - b.place)
  if (!prizes.length) throw createError({ statusCode: 400, message: 'Cadastre ao menos uma premiação' })

  const rawRules: any[] = Array.isArray(body.rules) ? body.rules : []
  const rawRanking: any[] = Array.isArray(body.ranking) ? body.ranking : []

  const tournament: Tournament = {
    id: text(body.id, 80) || randomUUID(),
    title,
    description,
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString(),
    prizes,
    rules: rawRules.slice(0, 30)
      .map((rule) => text(rule, 300)).filter(Boolean),
    ranking: rawRanking.slice(0, 100)
      .map((entry): TournamentRankingEntry => ({
        name: text(entry?.name, 80) || 'Participante',
        points: Math.max(0, Math.round(Number(entry?.points) || 0))
      }))
      .sort((a, b) => b.points - a.points),
    status: ['draft', 'active', 'finished'].includes(body.status) ? body.status : 'draft'
  }

  const db = await getDb()
  const collection = db.collection('tournaments')
  await collection.createIndex({ id: 1 }, { unique: true })

  // Só uma campanha ativa: publicar encerra as anteriores.
  if (tournament.status === 'active') {
    await collection.updateMany(
      { id: { $ne: tournament.id }, status: 'active' },
      { $set: { status: 'finished', updatedAt: new Date() } }
    )
  }

  await collection.updateOne(
    { id: tournament.id },
    { $set: { ...tournament, updatedAt: new Date(), updatedBy: adminEmail }, $setOnInsert: { createdAt: new Date(), createdBy: adminEmail } },
    { upsert: true }
  )
  await writeAuditLog({ admin: adminEmail, action: 'publish', entity: 'tournament', entityId: tournament.id, after: tournament })

  return { success: true, tournament }
})
