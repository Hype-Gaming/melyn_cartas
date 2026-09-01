<template>
  <nav class="app-nav" aria-label="Navegação principal">
    <NuxtLink v-for="item in items" :key="item.key" :to="routeFor(item.key)" class="app-nav-item" :class="{ active: isActive(item.key) }">
      <Icon :name="item.icon" aria-hidden="true" />
      <span>{{ item.label }}</span>
    </NuxtLink>
  </nav>
</template>

<script setup lang="ts">
const { config } = useVisualConfig()
const route = useRoute()

const routes: Record<string, string> = {
  home: '/', games: '/#jogos', lessons: '/aulas', management: '/gestao',
  ranking: '/ranking', profile: '/perfil', live: '/', links: '/'
}

const items = computed(() => config.value.menu
  .filter(item => item.key in routes)
  .filter(item => config.value.features[item.key as keyof typeof config.value.features] !== false)
  .slice()
  .sort((a, b) => a.order - b.order))

const routeFor = (key: string) => routes[key] || '/'
const isActive = (key: string) => {
  if (key === 'home') return route.path === '/' && !route.hash
  if (key === 'games') return route.path.startsWith('/jogo') || (route.path === '/' && route.hash === '#jogos')
  return route.path === routeFor(key)
}
</script>

<style scoped>
.app-nav { display: grid; gap: 6px; }
.app-nav-item { display: flex; align-items: center; gap: 12px; min-height: 46px; padding: 0 14px; border: 1px solid transparent; border-radius: 11px; color: var(--text-muted); text-decoration: none; font-weight: 650; transition: transform .24s cubic-bezier(.16, 1, .3, 1); }
.app-nav-item:hover { transform: translateX(3px); color: var(--text-main); background: var(--component-bg); }
.app-nav-item.active { color: var(--text-main); border-color: var(--card-border); background: var(--component-bg); }
.app-nav-item :deep(svg) { flex: 0 0 auto; font-size: 21px; color: var(--color-primary); }
.app-nav-item:focus-visible { outline: 3px solid var(--color-primary); outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) { .app-nav-item { transition: none; } .app-nav-item:hover { transform: none; } }
</style>
