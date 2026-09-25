/** Premios da roleta diaria, na ordem em que aparecem na roda. */
export const ROULETTE_PRIZES = [
  { label: '20 giros grátis', spins: 20, color: '#8b7cf6' },
  { label: 'Não foi dessa vez', spins: 0, color: '#1d2133' },
  { label: '30 giros grátis', spins: 30, color: '#d9b76e' },
  { label: 'Não foi dessa vez', spins: 0, color: '#1d2133' },
  { label: '40 giros grátis', spins: 40, color: '#4ade80' },
  { label: '50 giros grátis', spins: 50, color: '#ef6a86' }
] as const

/** Peso de cada premio, na mesma ordem: premio maior sai menos. */
const WEIGHTS = [30, 25, 18, 15, 8, 4]

/** Dia de calendario no fuso America/Bahia — o giro vira a meia-noite daqui. */
export const rouletteDay = (now = new Date()): string =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bahia', year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(now)

/** Sorteia o indice do premio. `rand` em [0,1) — injetavel para teste. */
export const drawPrizeIndex = (rand = Math.random()): number => {
  const total = WEIGHTS.reduce((sum, weight) => sum + weight, 0)
  let ticket = rand * total
  for (let index = 0; index < WEIGHTS.length; index++) {
    ticket -= WEIGHTS[index]!
    if (ticket < 0) return index
  }
  return WEIGHTS.length - 1
}
