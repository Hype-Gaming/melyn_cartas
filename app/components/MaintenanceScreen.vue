<template>
  <main class="maintenance-screen" aria-labelledby="maintenance-title">
    <div class="maintenance-glow" aria-hidden="true" />
    <section class="maintenance-card">
      <AppLogo class="maintenance-logo" />
      <div class="maintenance-icon" aria-hidden="true">
        <Icon name="ph:wrench-bold" />
      </div>
      <p class="maintenance-eyebrow">Indisponibilidade temporária</p>
      <h1 id="maintenance-title">{{ title }}</h1>
      <p class="maintenance-message">{{ message }}</p>
      <button type="button" class="maintenance-retry" :disabled="checking" @click="$emit('retry')">
        <Icon :name="checking ? 'ph:spinner-gap-bold' : 'ph:arrow-clockwise-bold'" :class="{ spinning: checking }" />
        {{ checking ? 'Verificando...' : 'Verificar novamente' }}
      </button>
      <p v-if="error" class="maintenance-error" role="status">{{ error }}</p>
      <p class="maintenance-note">Agradecemos a compreensão. O acesso será restabelecido assim que possível.</p>
    </section>
  </main>
</template>

<script setup lang="ts">
defineProps<{ title: string; message: string; checking: boolean; error: string | null }>()
defineEmits<{ retry: [] }>()
</script>

<style scoped>
.maintenance-screen { position: fixed; inset: 0; z-index: 100000; display: grid; place-items: center; min-height: 100dvh; padding: 24px; overflow: auto; background: radial-gradient(circle at 50% 0%, color-mix(in srgb, var(--color-primary) 15%, transparent), transparent 44%), var(--bg-darker); color: var(--text-main); }
.maintenance-glow { position: fixed; width: 360px; height: 360px; border-radius: 50%; background: color-mix(in srgb, var(--color-primary) 12%, transparent); filter: blur(80px); pointer-events: none; }
.maintenance-card { position: relative; width: min(540px, 100%); padding: clamp(28px, 6vw, 48px); text-align: center; border: 1px solid var(--card-border); border-radius: 24px; background: color-mix(in srgb, var(--card-bg) 94%, transparent); box-shadow: 0 24px 80px rgb(0 0 0 / 35%); }
.maintenance-logo { max-width: 170px; max-height: 72px; margin: 0 auto 24px; object-fit: contain; }
.maintenance-icon { display: grid; place-items: center; width: 58px; height: 58px; margin: 0 auto 18px; border-radius: 18px; background: color-mix(in srgb, var(--color-primary) 16%, transparent); color: var(--color-primary); font-size: 28px; }
.maintenance-eyebrow { margin-bottom: 8px; color: var(--color-secondary); font-size: 12px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
h1 { margin: 0; color: var(--text-main); font-size: clamp(28px, 7vw, 42px); line-height: 1.1; overflow-wrap: anywhere; }
.maintenance-message { margin: 16px auto 26px; color: var(--text-muted); font-size: clamp(15px, 3.8vw, 17px); line-height: 1.65; white-space: pre-line; overflow-wrap: anywhere; }
.maintenance-retry { display: inline-flex; align-items: center; justify-content: center; gap: 9px; min-height: 46px; padding: 0 20px; border: 0; border-radius: 12px; background: var(--color-primary); color: #fff; font: inherit; font-weight: 800; cursor: pointer; transition: transform .18s ease, opacity .18s ease; }
.maintenance-retry:hover:not(:disabled) { transform: translateY(-1px); }
.maintenance-retry:disabled { opacity: .65; cursor: wait; }
.maintenance-retry:focus-visible { outline: 3px solid var(--color-secondary); outline-offset: 3px; }
.maintenance-error { margin-top: 14px; color: var(--color-danger); font-size: 13px; }
.maintenance-note { margin-top: 24px; color: var(--text-muted); font-size: 12px; line-height: 1.5; }
.spinning { animation: maintenance-spin .8s linear infinite; }
@keyframes maintenance-spin { to { transform: rotate(360deg); } }
@media (max-width: 480px) { .maintenance-screen { padding: 14px; } .maintenance-card { border-radius: 18px; } }
@media (prefers-reduced-motion: reduce) { .maintenance-retry { transition: none; } .spinning { animation: none; } }
</style>
