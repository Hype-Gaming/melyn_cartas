/**
 * Configuração pública de autenticação da casa (routes-eb → Cactus).
 * Informa se o login exige captcha e qual serviço deve ser exibido.
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const brandSlug = String(query.brandSlug || 'esportiva')
  const baseDomain = String(query.baseDomain || 'bet.br')
  const config = useRuntimeConfig()
  const routesApi = config.public.routesApiBase as string

  try {
    const data = await $fetch<any>(`${routesApi}/api/auth-configs`, {
      headers: {
        'X-Brand-Slug': brandSlug,
        'X-Base-Domain': baseDomain
      }
    })

    const payload = data?.data ?? data
    const featureSet = Array.isArray(payload)
      ? payload.find((item: any) => item?.is_default) || payload[0] || {}
      : payload && typeof payload === 'object' ? payload : {}

    let auth: any = featureSet?.auth_configs ?? {}
    if (typeof auth === 'string') {
      try { auth = JSON.parse(auth) } catch { auth = {} }
    }

    return {
      enableCaptcha: auth?.enable_captcha === true,
      enableCaptchaLogin: auth?.enable_captcha_login === true,
      captchaServices: auth?.captcha_services ?? [],
      turnstileSiteKey: auth?.turnstile_site_key ?? '',
      captchaStyle: auth?.captcha_style ?? 'dark'
    }
  } catch {
    return {
      enableCaptcha: false,
      enableCaptchaLogin: false,
      captchaServices: [],
      turnstileSiteKey: '',
      captchaStyle: 'dark'
    }
  }
})
