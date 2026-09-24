interface LoginBody {
  email: string
  password: string
  brandSlug?: string
  baseDomain?: string
  captchaToken?: string
}

export default defineEventHandler(async (event) => {
  const body = await readBody<LoginBody>(event)
  const email = body?.email?.trim()
  const password = body?.password
  const brandSlug = body?.brandSlug?.trim() || 'esportiva'
  const baseDomain = body?.baseDomain?.trim() || 'bet.br'
  const captchaToken = body?.captchaToken || ''

  if (!email || !password) {
    throw createError({ statusCode: 400, statusMessage: 'E-mail/CPF e senha são obrigatórios' })
  }

  const config = useRuntimeConfig()
  const routesApi = config.public.routesApiBase as string

  try {
    return await $fetch(`${routesApi}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Brand-Slug': brandSlug,
        'X-Base-Domain': baseDomain
      },
      body: {
        email,
        password,
        save_cookies: true,
        brand_slug: brandSlug,
        base_domain: baseDomain,
        app_source: 'web',
        captcha_token: captchaToken
      }
    })
  } catch (error: any) {
    const upstreamStatus = Number(error?.response?.status || error?.statusCode || 0)
    const status = upstreamStatus >= 400 && upstreamStatus < 500
      ? upstreamStatus
      : upstreamStatus === 504 ? 504 : 502
    console.warn(`[session/login] ${brandSlug}.${baseDomain}: upstream=${upstreamStatus || 'sem resposta'}; retorno=${status}`)
    throw createError({
      statusCode: status,
      statusMessage: 'Falha no login',
      data: error?.data
    })
  }
})
