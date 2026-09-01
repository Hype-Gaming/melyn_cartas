/**
 * Formatadores compartilhados pelas rotas do painel admin.
 * Ficam em utils/ para o Nuxt auto-importar — antes eram copiados em cada pagina.
 */
export const fmtInt = (n: number) => Math.round(n || 0).toLocaleString('pt-BR')

export const fmtMoney = (n: number) =>
  (n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export const fmtPct = (n: number) => `${(n || 0).toFixed(1)}%`

export const fmtDate = (v: string | null) =>
  v ? new Date(v).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—'
