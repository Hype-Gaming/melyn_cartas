export interface TournamentPrize { place: number; value: string }
export interface TournamentRankingEntry { name: string; points: number }

export interface Tournament {
  id: string
  title: string
  description: string
  startsAt: string
  endsAt: string
  prizes: TournamentPrize[]
  rules: string[]
  ranking: TournamentRankingEntry[]
  status: 'draft' | 'active' | 'finished'
}

/** Torneio de exemplo: a página pública nunca fica vazia, mesmo sem Mongo. */
export const MOCK_TOURNAMENT: Tournament = {
  id: 'mock-tournament',
  title: 'Desafio dos Membros',
  description: 'Participe, acumule pontos e concorra a benefícios exclusivos da comunidade.',
  startsAt: new Date().toISOString(),
  endsAt: new Date(Date.now() + 7 * 86_400_000).toISOString(),
  prizes: [
    { place: 1, value: 'Prêmio VIP + destaque no ranking' },
    { place: 2, value: 'Bônus especial' },
    { place: 3, value: 'Kit exclusivo' }
  ],
  rules: [
    'Válido para membros ativos no período da campanha.',
    'Tempo de sessão vale 1 ponto por minuto, até 120 pontos por sessão.',
    'Lucro da sessão vale 1 ponto por R$ 1, até 500 pontos por sessão. Prejuízo vale 0.',
    'A pontuação final soma todas as sessões do período.'
  ],
  ranking: [
    { name: 'Ana M.', points: 9850 },
    { name: 'Carlos R.', points: 8720 },
    { name: 'Bia S.', points: 7990 },
    { name: 'Rafael P.', points: 6840 },
    { name: 'Luiza C.', points: 6210 }
  ],
  status: 'active'
}
