<template>
  <Teleport to="body">
    <div v-if="visible" class="notification-prompt-overlay" role="presentation">
      <section class="notification-prompt" role="dialog" aria-modal="true" aria-labelledby="notification-prompt-title">
        <Icon name="ph:bell-ringing-bold" class="notification-icon" />
        <h2 id="notification-prompt-title">{{ config.title }}</h2>
        <p>{{ config.message }}</p>
        <div class="notification-actions">
          <button type="button" class="notification-primary" @click="activate">{{ config.activateLabel }}</button>
          <button type="button" class="notification-later" @click="later">{{ config.laterLabel }}</button>
        </div>
      </section>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
const props = defineProps<{ allowed: boolean }>()
const { config: appConfig } = useVisualConfig()
const { isAuthenticated } = useAuth()
const { requestPermission } = useNotificationPermission()
const visible = ref(false)
const config = computed(() => appConfig.value.notificationPrompt)
const storageKey = 'mr_cartas_notification_prompt_after'

const evaluate = () => {
  if (!import.meta.client || !props.allowed || !isAuthenticated.value || !config.value.enabled || !('Notification' in window)) {
    visible.value = false
    return
  }
  if (Notification.permission !== 'default') {
    visible.value = false
    return
  }
  const retryAfter = Number(localStorage.getItem(storageKey) || 0)
  visible.value = Date.now() >= retryAfter
}

const activate = async () => {
  visible.value = false
  await requestPermission()
}

const later = () => {
  const days = Math.max(1, config.value.retryDays || 7)
  localStorage.setItem(storageKey, String(Date.now() + days * 86_400_000))
  visible.value = false
}

watch([() => props.allowed, isAuthenticated, config], () => nextTick(evaluate), { deep: true })
onMounted(evaluate)
</script>

<style scoped>
.notification-prompt-overlay { position: fixed; inset: 0; z-index: 99990; display: grid; place-items: center; padding: 20px; background: rgba(0,0,0,.72); backdrop-filter: blur(6px); }
.notification-prompt { width: min(430px, 100%); padding: 32px; text-align: center; border: 1px solid var(--card-border); border-radius: 18px; background: var(--card-bg); box-shadow: 0 24px 70px rgba(0,0,0,.5); }
.notification-icon { font-size: 44px; color: var(--color-primary); }
.notification-prompt h2 { margin: 14px 0 8px; }
.notification-prompt p { color: var(--text-muted); line-height: 1.55; }
.notification-actions { display: grid; gap: 10px; margin-top: 24px; }
.notification-actions button { min-height: 44px; border-radius: 10px; font-weight: 700; cursor: pointer; }
.notification-primary { border: 0; background: var(--color-primary); color: #090909; }
.notification-later { border: 1px solid var(--card-border); background: transparent; color: var(--text-main); }
</style>
