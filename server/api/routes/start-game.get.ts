import { BRANDS } from '../../../shared/brands'

const KYC_PATTERN = /\bkyc\b|verifica(?:ç|c)[aã]o|identity|documento|selfie/i

const safeUpstreamText = (value: unknown): string => {
  try {
    return (typeof value === 'string' ? value : JSON.stringify(value)).slice(0, 2000)
  } catch {
    return '[corpo não serializável]'
  }
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const gameSlug = String(query.slug || '').trim()
  const platform = query.platform === 'MOBILE' ? 'MOBILE' : 'WEB'
  const brandSlug = String(getHeader(event, 'x-brand-slug') || '').trim()
  const brand = BRANDS.find(item => item.slug === brandSlug)
  const authorization = getHeader(event, 'authorization')
  const cookieKey = getHeader(event, 'x-cactus-cookie-key')
  const email = String(getHeader(event, 'x-app-user-email') || '').slice(0, 254)

  if (!gameSlug || !brand || !authorization || !cookieKey) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Requisição inválida',
      data: { code: 'START_GAME_REJECTED' }
    })
  }

  let response
  try {
    response = await $fetch.raw<any>(`${brand.apiBaseUrl}/api/start-game`, {
      method: 'GET',
      query: { slug: gameSlug, platform, use_demo: 0 },
      headers: {
        Authorization: authorization,
        'X-Brand-Slug': brand.slug,
        'X-Base-Domain': brand.baseDomain,
        'X-Cactus-Cookie-Key': cookieKey
      },
      ignoreResponseError: true
    })
  } catch (error) {
    console.error('[start-game] indisponível', JSON.stringify({ email, gameSlug, reason: 'START_GAME_REJECTED' }))
    throw createError({
      statusCode: 502,
      statusMessage: 'Serviço de jogos indisponível',
      data: { code: 'START_GAME_REJECTED' },
      cause: error
    })
  }

  const status = response.status
  const upstream = response._data

  if (status === 401) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Sessão expirada',
      data: { code: 'SESSION_EXPIRED' }
    })
  }

  const upstreamText = safeUpstreamText(upstream)
  const rejected = status >= 400 || upstream?.error === true || upstream?.success === false || upstream?.payload?.error === true

  if (rejected) {
    const code = KYC_PATTERN.test(upstreamText) ? 'KYC_REQUIRED' : 'START_GAME_REJECTED'
    console.error('[start-game] recusado', JSON.stringify({
      email,
      gameSlug,
      status,
      reason: code,
      upstream: upstreamText
    }))
    throw createError({
      statusCode: code === 'KYC_REQUIRED' ? 403 : (status >= 400 && status < 600 ? status : 502),
      statusMessage: code === 'KYC_REQUIRED' ? 'Verificação necessária' : 'Jogo recusado',
      data: { code }
    })
  }

  return upstream
})
