<template>
  <Teleport to="body">
    <Transition name="wheel-modal">
      <div v-if="open" class="wheel-overlay" role="dialog" aria-modal="true" aria-labelledby="wheel-title" @click.self="$emit('close')">
        <section ref="dialogEl" class="wheel-modal" tabindex="-1">
          <button class="wheel-close" type="button" aria-label="Fechar roleta" @click="$emit('close')"><Icon name="ph:x-bold" /></button>
          <p class="wheel-kicker">Uma chance por dia</p>
          <h2 id="wheel-title">{{ config.title }}</h2>
          <p class="wheel-copy">{{ config.message }}</p>

          <div v-if="!result" class="wheel-wrap">
            <div class="wheel-pointer" aria-hidden="true" />
            <div class="wheel" :style="wheelStyle">
              <span v-for="(prize, index) in config.prizes" :key="prize.id" :style="labelStyle(index)">{{ prize.label }}</span>
            </div>
          </div>

          <div v-else class="wheel-result" aria-live="polite">
            <Icon :name="alreadyUsed ? 'ph:clock-countdown-bold' : 'ph:confetti-bold'" />
            <h3>{{ alreadyUsed ? 'Volte amanhã' : 'Parabéns!' }}</h3>
            <p>{{ alreadyUsed ? 'Seu giro de hoje já foi utilizado.' : `Você ganhou: ${result.label}` }}</p>
          </div>

          <p v-if="error" class="wheel-error" role="alert">{{ error }}</p>
          <button v-if="!result" type="button" class="wheel-action" :disabled="spinning || !config.prizes.length" @click="spin">
            {{ spinning ? 'Girando...' : 'Girar agora' }}
          </button>
          <a v-else-if="config.supportUrl && !alreadyUsed" :href="config.supportUrl" target="_blank" rel="noopener noreferrer" class="wheel-action">Resgatar com o suporte</a>
          <button v-else type="button" class="wheel-action secondary" @click="$emit('close')">Fechar</button>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { AppConfig } from '../../shared/appConfig'

const props = defineProps<{ open: boolean; config: AppConfig['memberExperience']['wheel'] }>()
defineEmits<{ close: [] }>()
const { token, cookieKey, brandSlug, isAuthenticated } = useAuth()
const dialogEl = ref<HTMLElement | null>(null)
const spinning = ref(false)
const error = ref('')
const result = ref<AppConfig['memberExperience']['wheel']['prizes'][number] | null>(null)
const alreadyUsed = ref(false)
const rotation = ref(0)

const wheelStyle = computed(() => {
  const count = Math.max(1, props.config.prizes.length)
  const pieces = props.config.prizes.map((prize, index) => `${prize.color} ${index * 360 / count}deg ${(index + 1) * 360 / count}deg`)
  return { background: `conic-gradient(${pieces.join(',')})`, transform: `rotate(${rotation.value}deg)` }
})
const labelStyle = (index: number) => ({ transform: `rotate(${index * 360 / Math.max(1, props.config.prizes.length) + 360 / Math.max(1, props.config.prizes.length) / 2}deg) translateY(-98px) rotate(90deg)` })

const spin = async () => {
  if (!isAuthenticated.value) return navigateTo('/auth/login?redirect=/')
  spinning.value = true
  error.value = ''
  try {
    const response = await $fetch<{ alreadyUsed: boolean; prize: typeof result.value }>('/api/wheel/spin', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token.value}`, 'X-Cactus-Cookie-Key': String(cookieKey.value || ''), 'X-Brand-Slug': brandSlug.value }
    })
    const index = Math.max(0, props.config.prizes.findIndex(item => item.id === response.prize?.id))
    rotation.value += 1440 + (360 - index * 360 / Math.max(1, props.config.prizes.length))
    await new Promise(resolve => setTimeout(resolve, 2400))
    result.value = response.prize
    alreadyUsed.value = response.alreadyUsed
  } catch (cause: any) {
    error.value = cause?.data?.message || 'Não foi possível girar agora. Tente novamente.'
  } finally { spinning.value = false }
}

watch(() => props.open, async value => { if (value) { result.value = null; error.value = ''; await nextTick(); dialogEl.value?.focus() } })
</script>

<style scoped>
.wheel-overlay { position: fixed; inset: 0; z-index: 10000; display: grid; place-items: center; padding: 16px; background: rgb(3 4 10 / 78%); backdrop-filter: blur(14px); }
.wheel-modal { position: relative; width: min(480px, 100%); max-height: 94dvh; overflow: auto; padding: 34px clamp(20px, 6vw, 38px); text-align: center; border: 1px solid color-mix(in srgb, var(--color-primary) 35%, var(--card-border)); border-radius: 26px; outline: none; background: linear-gradient(145deg, color-mix(in srgb, var(--card-bg) 94%, transparent), var(--bg-darker)); box-shadow: 0 30px 90px rgb(0 0 0 / 55%); color: var(--text-main); }
.wheel-close { position: absolute; top: 14px; right: 14px; display: grid; place-items: center; width: 38px; height: 38px; border: 1px solid var(--card-border); border-radius: 10px; background: var(--component-bg); color: var(--text-main); cursor: pointer; }
.wheel-kicker { color: var(--color-secondary); font-size: 11px; font-weight: 900; letter-spacing: .13em; text-transform: uppercase; }
h2 { margin: 7px 0 8px; font-size: clamp(26px, 7vw, 38px); } .wheel-copy { color: var(--text-muted); line-height: 1.5; }
.wheel-wrap { position: relative; width: 270px; height: 270px; margin: 28px auto; }
.wheel { position: relative; width: 100%; height: 100%; border: 8px solid var(--component-bg); border-radius: 50%; box-shadow: 0 0 0 2px var(--color-secondary), 0 18px 50px rgb(0 0 0 / 45%); transition: transform 2.4s cubic-bezier(.15,.7,.1,1); }
.wheel span { position: absolute; top: calc(50% - 9px); left: calc(50% - 42px); width: 84px; color: #fff; font-size: 11px; font-weight: 900; text-shadow: 0 1px 3px #000; }
.wheel-pointer { position: absolute; z-index: 2; top: -7px; left: calc(50% - 14px); width: 0; height: 0; border-left: 14px solid transparent; border-right: 14px solid transparent; border-top: 28px solid var(--color-secondary); filter: drop-shadow(0 3px 3px #000); }
.wheel-result { display: grid; justify-items: center; gap: 8px; margin: 30px 0; padding: 25px; border-radius: 20px; background: color-mix(in srgb, var(--color-primary) 12%, var(--component-bg)); }
.wheel-result :deep(svg) { color: var(--color-secondary); font-size: 54px; } .wheel-result h3 { font-size: 25px; } .wheel-result p { color: var(--text-muted); }
.wheel-action { display: inline-flex; align-items: center; justify-content: center; min-height: 48px; padding: 0 24px; border: 0; border-radius: 13px; background: var(--color-primary); color: #fff; font: inherit; font-weight: 900; text-decoration: none; cursor: pointer; }
.wheel-action.secondary { background: var(--component-bg); } .wheel-action:disabled { opacity: .6; cursor: wait; } .wheel-error { margin: 12px 0; color: var(--color-danger); font-size: 13px; }
.wheel-modal-enter-active,.wheel-modal-leave-active { transition: opacity .2s ease; } .wheel-modal-enter-from,.wheel-modal-leave-to { opacity: 0; }
@media (max-width: 380px) { .wheel-wrap { width: 235px; height: 235px; } }
</style>
