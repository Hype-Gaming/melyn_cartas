import { BRANDS } from '../../shared/brands'

export default defineEventHandler((event) => {
  const isDev = process.env.NODE_ENV !== 'production'
  const turnstile = 'https://challenges.cloudflare.com'
  const brandApis = [...new Set(BRANDS.map(brand => brand.apiBaseUrl))]
  const scriptSrc = ["'self'", "'unsafe-inline'", turnstile, ...(isDev ? ["'unsafe-eval'"] : [])]
  const connectSrc = ["'self'", ...brandApis, turnstile, 'https:', 'wss:', 'ws:']
  const imgSrc = ["'self'", 'data:', 'blob:', 'https:', turnstile]

  setHeaders(event, {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Content-Security-Policy': [
      "default-src 'self'",
      `script-src ${scriptSrc.join(' ')}`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      `img-src ${imgSrc.join(' ')}`,
      `connect-src ${connectSrc.join(' ')}`,
      'frame-src https:',
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
      "object-src 'none'"
    ].join('; ')
  })
})
