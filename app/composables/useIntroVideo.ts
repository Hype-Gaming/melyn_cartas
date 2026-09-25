import { videoUrl } from '../../shared/videos'

/**
 * Vídeo de boas-vindas obrigatório antes do primeiro jogo grátis.
 * Só existe se houver `heroVideo` na config da home. Qualquer falha libera o
 * jogo: o vídeo é um convite, não um portão que pode prender o usuário fora.
 */
const state = reactive({
  videoSrc: '',
  watched: false,
  paid: false,
  failed: false,
  open: false,
  loadedFor: '' as string
})

/** Jogo liberado depois do vídeo. A home passa o destino no clique. */
const freeGame = ref('')

export const useIntroVideo = () => {
  const { user, isAuthenticated } = useAuth()

  const required = computed(() =>
    Boolean(state.videoSrc) && !state.watched && !state.paid && !state.failed
  )

  const load = async (force = false) => {
    const email = user.value?.email?.toLowerCase() || ''
    // Cache por e-mail: trocar de conta recarrega, revisitar a home não.
    if (!force && state.loadedFor === email) return
    state.loadedFor = email

    const [config, watched, subscription] = await Promise.all([
      $fetch<{ config: { heroVideo: string } }>('/api/home-config').catch(() => null),
      email
        ? $fetch<{ watched: boolean }>('/api/track/intro-video', { params: { email } }).catch(() => null)
        : Promise.resolve(null),
      email
        ? $fetch<{ active: boolean }>('/api/subscription/check', { params: { email } }).catch(() => null)
        : Promise.resolve(null)
    ])

    state.videoSrc = videoUrl(config?.config?.heroVideo || '')
    state.watched = !!watched?.watched
    state.paid = !!subscription?.active
  }

  const show = (destination = '') => {
    freeGame.value = destination
    state.open = true
  }

  const close = () => {
    state.open = false
  }

  const complete = async () => {
    state.watched = true
    state.open = false
    const email = user.value?.email?.toLowerCase()
    if (!email) return
    try {
      await $fetch('/api/track/intro-video', { method: 'POST', body: { email } })
    } catch (error) {
      // Já liberamos na tela; na próxima visita o vídeo volta, sem travar nada.
      console.error('Não foi possível registrar o vídeo assistido:', error)
    }
  }

  /** Vídeo quebrado ou bloqueado: libera o jogo em vez de prender o usuário. */
  const fail = () => {
    state.failed = true
    state.open = false
  }

  let autoOpened = false
  const autoOpen = async () => {
    if (autoOpened || !isAuthenticated.value) return
    autoOpened = true
    await load()
    if (required.value) show()
  }

  return {
    videoSrc: computed(() => state.videoSrc),
    freeGame,
    watched: computed(() => state.watched),
    paid: computed(() => state.paid),
    failed: computed(() => state.failed),
    open: computed(() => state.open),
    required,
    load,
    show,
    close,
    complete,
    fail,
    autoOpen
  }
}
