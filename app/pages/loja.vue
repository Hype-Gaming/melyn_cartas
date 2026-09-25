<template>
  <main class="store-page">
    <Icon name="ph:storefront-bold" class="store-icon" aria-hidden="true" />
    <p class="eyebrow">Em breve</p>
    <h1>Novidades chegando</h1>
    <p class="store-copy">
      A loja de benefícios da comunidade está sendo preparada. Em breve você troca
      seus pontos por vantagens aqui.
    </p>
    <NuxtLink to="/" class="store-action">
      <Icon name="ph:arrow-left-bold" aria-hidden="true" /> Voltar para a home
    </NuxtLink>
  </main>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

const { config: appConfig } = useVisualConfig()
useHead({ title: () => `Loja - ${appConfig.value.brand.name}` })
</script>

<style scoped>
.store-page {
  display: grid;
  justify-items: center;
  gap: 10px;
  width: min(520px, 100%);
  margin: 0 auto;
  padding: clamp(48px, 12vw, 110px) 16px 96px;
  color: var(--text-main);
  text-align: center;
}

.store-icon { font-size: 58px; color: var(--accent); }
.eyebrow { color: var(--accent-soft); font-size: 11px; font-weight: 900; letter-spacing: .14em; text-transform: uppercase; }
h1 { font-size: clamp(28px, 6vw, 40px); }
.store-copy { color: var(--text-muted); line-height: 1.6; }

.store-action {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 48px;
  margin-top: 14px;
  padding: 0 24px;
  border-radius: 13px;
  background: var(--accent);
  color: #fff;
  font-weight: 800;
  text-decoration: none;
}
.store-action:focus-visible { outline: 3px solid var(--accent-soft); outline-offset: 3px; }
</style>
