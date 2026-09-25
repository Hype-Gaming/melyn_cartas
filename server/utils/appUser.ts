const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** E-mail normalizado dos endpoints publicos de /api/track/*. Lanca 400 se invalido. */
export const requireEmail = (value: unknown): string => {
  const email = String(value || '').trim().toLowerCase()
  if (!EMAIL_RE.test(email)) throw createError({ statusCode: 400, message: 'E-mail inválido' })
  return email
}

/** Campos gravados na criacao do usuario do app, iguais aos do heartbeat. */
export const appUserOnInsert = (email: string) => ({
  email,
  first_seen_at: new Date(),
  blocked: false,
  blocked_at: null
})
