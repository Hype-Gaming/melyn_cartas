<template>
  <Teleport to="body">
    <div v-if="show" class="game-error-overlay" role="dialog" aria-modal="true" aria-labelledby="game-error-title">
      <div class="game-error-card">
        <div class="game-error-icon"><Icon name="ph:warning-circle-bold" /></div>
        <h2 id="game-error-title">Não foi possível abrir o jogo</h2>
        <p>A casa recusou a abertura da sessão. Isso pode acontecer por instabilidade, restrição temporária ou dados pendentes na conta.</p>
        <button class="primary-action" :disabled="retrying" @click="$emit('retry')">
          <Icon :name="retrying ? 'ph:spinner-bold' : 'ph:arrow-clockwise-bold'" :class="{ spin: retrying }" />
          {{ retrying ? 'Tentando...' : 'Tentar novamente' }}
        </button>
        <a v-if="supportLink" :href="supportLink" target="_blank" rel="noopener noreferrer" class="secondary-action">
          <Icon name="ph:whatsapp-logo-bold" />
          Falar com o suporte
        </a>
        <button v-else class="secondary-action" @click="$emit('close')">Fechar</button>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
defineProps<{ show: boolean; retrying?: boolean }>()
defineEmits<{ retry: []; close: [] }>()

const { config: appConfig } = useVisualConfig()
const fetchedSupportLink = ref('')
const supportLink = computed(() => appConfig.value.links.whatsappSupport || fetchedSupportLink.value)

onMounted(async () => {
  if (supportLink.value) return
  try {
    const result = await $fetch<{ value?: string; href?: string }>('/api/settings/support')
    // Só considera configurado quando há valor salvo; sem config, o CTA vira "Fechar".
    if (result.value && result.href) fetchedSupportLink.value = result.href
  } catch {
    // O fechamento continua disponível como fallback.
  }
})
</script>

<style scoped>
.game-error-overlay {
  position: fixed;
  inset: 0;
  z-index: 100001;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(4, 6, 12, .9);
  backdrop-filter: blur(9px);
}
.game-error-card {
  width: min(440px, 100%);
  padding: 30px;
  border: 1px solid var(--card-border);
  border-radius: 18px;
  background: var(--card-bg);
  color: var(--text-main);
  text-align: center;
  box-shadow: 0 24px 70px rgba(0, 0, 0, .55);
}
.game-error-icon { margin-bottom: 14px; color: var(--color-danger); font-size: 48px; }
h2 { margin-bottom: 12px; font-size: 23px; }
p { margin-bottom: 24px; color: var(--text-muted); line-height: 1.55; }
.primary-action, .secondary-action {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  min-height: 48px;
  border-radius: 10px;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
}
.primary-action { border: 0; background: var(--color-primary); color: #08090d; }
.primary-action:disabled { opacity: .65; cursor: wait; }
.secondary-action { margin-top: 10px; border: 1px solid var(--card-border); background: transparent; color: var(--text-main); }
.spin { animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
