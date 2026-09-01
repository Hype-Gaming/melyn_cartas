<template>
  <header class="mobile-header">
    <button type="button" aria-label="Abrir navegação" @click="openDrawer"><Icon name="ph:list-bold" /></button>
    <AppLogo class="mobile-logo" />
    <NuxtLink to="/perfil" aria-label="Abrir perfil"><Icon name="ph:user-circle-bold" /></NuxtLink>
  </header>
</template>

<script setup lang="ts">
const { openDrawer } = useSidebarDrawer()
</script>

<style scoped>
.mobile-header { display: none; position: sticky; top: 0; z-index: 80; height: 62px; align-items: center; justify-content: space-between; padding: 0 16px; border-bottom: 1px solid var(--card-border); background: var(--bg-darker); }
.mobile-header button, .mobile-header a { display: grid; place-items: center; width: 42px; height: 42px; border: 0; border-radius: 10px; background: var(--component-bg); color: var(--text-main); font-size: 23px; cursor: pointer; }
.mobile-logo { width: 132px; max-height: 40px; object-fit: contain; }
.mobile-header button:focus-visible, .mobile-header a:focus-visible { outline: 3px solid var(--color-primary); outline-offset: 2px; }
@media (max-width: 900px) { .mobile-header { display: flex; } }
</style>
