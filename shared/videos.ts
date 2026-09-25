// Vídeos ficam num bucket público; a config guarda só a chave do objeto.
// Uma URL completa passa direto, para quem prefere hospedar em outro lugar.
const VIDEO_BUCKET_BASE = 'https://pub-melyn-media.r2.dev'

export const videoUrl = (keyOrUrl: string): string => {
  const value = (keyOrUrl || '').trim()
  if (!value) return ''
  if (/^https?:\/\//i.test(value)) return value
  return `${VIDEO_BUCKET_BASE}/${value.replace(/^\/+/, '')}`
}
