<template>
  <div class="app-shell">
    <AppSidebar />
    <div class="app-shell-main" :class="{ collapsed }"><AppMobileHeader /><slot /></div>
    <DepositModal />
    <WalletModal />
    <AppBottomNav />
  </div>
</template>

<script setup lang="ts">
const { collapsed } = useSidebarDrawer()
</script>

<style scoped>
.app-shell { min-height: 100vh; background: var(--bg-dark); }
.app-shell-main { min-width: 0; min-height: 100vh; margin-left: 300px; transition: margin-left .28s cubic-bezier(.16, 1, .3, 1); }
.app-shell-main.collapsed { margin-left: 88px; }

@media (max-width: 900px) {
  .app-shell-main {
    margin-left: 0;
    /* Espaço para a barra inferior fixa não cobrir o fim da página. */
    padding-bottom: calc(74px + env(safe-area-inset-bottom, 0px));
  }
}
</style>
