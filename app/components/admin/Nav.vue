<template>
  <nav class="adm-nav" aria-label="Seções do painel">
    <NuxtLink v-for="item in items" :key="item.to" :to="item.to" class="adm-nav-item">
      <Icon :name="item.icon" aria-hidden="true" />
      <span>{{ item.label }}</span>
    </NuxtLink>
  </nav>
</template>

<script setup lang="ts">
const items = [
  { to: '/admin', label: 'Visão geral', icon: 'ph:chart-line-up-bold' },
  { to: '/admin/usuarios', label: 'Usuários', icon: 'ph:users-bold' },
  { to: '/admin/depositos', label: 'Depósitos', icon: 'ph:hand-coins-bold' },
  { to: '/admin/visual', label: 'Visual do app', icon: 'ph:palette-bold' },
  { to: '/admin/webhook', label: 'Liberar acesso', icon: 'ph:plug-bold' }
]
</script>

<style scoped>
.adm-nav { display: grid; gap: 4px; }

.adm-nav-item {
  display: flex; align-items: center; gap: 11px;
  min-height: 44px; padding: 0 13px;
  border-radius: 10px;
  border-left: 2px solid transparent;
  color: var(--adm-muted);
  font-size: 13px; font-weight: 700;
  text-decoration: none;
  transition: transform .22s var(--adm-ease);
}
.adm-nav-item :deep(svg) { font-size: 18px; color: currentColor; }
.adm-nav-item:hover { transform: translateX(2px); color: var(--adm-text); background: color-mix(in srgb, var(--adm-text) 5%, transparent); }

/* exact evita "Visão geral" ficar ativo em todas as subrotas de /admin */
.adm-nav-item.router-link-exact-active {
  color: var(--adm-text);
  background: var(--adm-accent-soft);
  border-left-color: var(--adm-accent);
  border-radius: 4px 10px 10px 4px;
}
.adm-nav-item.router-link-exact-active :deep(svg) { color: var(--adm-accent); }
.adm-nav-item:focus-visible { outline: 3px solid var(--adm-accent); outline-offset: 2px; }

@media (max-width: 900px) {
  /* trilho rolavel no lugar da coluna */
  .adm-nav { grid-auto-flow: column; grid-auto-columns: max-content; overflow-x: auto; scrollbar-width: none; }
  .adm-nav::-webkit-scrollbar { display: none; }
  .adm-nav-item { border-left: 0; border-bottom: 2px solid transparent; border-radius: 10px; }
  .adm-nav-item.router-link-exact-active { border-radius: 10px; border-bottom-color: var(--adm-accent); }
}

@media (prefers-reduced-motion: reduce) {
  .adm-nav-item { transition: none; }
  .adm-nav-item:hover { transform: none; }
}
</style>
