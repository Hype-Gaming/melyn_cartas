<template>
  <div class="app-shell">
    <AppSidebar />
    <div class="app-shell-main"><AppMobileHeader /><slot /></div>
    <DepositModal />
    <WalletModal />
    <AppBottomNav />
  </div>
</template>

<style scoped>
.app-shell { min-height: 100vh; background: var(--bg-dark); }
.app-shell-main { min-width: 0; min-height: 100vh; margin-left: 300px; }

@media (max-width: 900px) {
  .app-shell-main {
    margin-left: 0;
    /* Espaço para a barra inferior fixa não cobrir o fim da página. */
    padding-bottom: calc(74px + env(safe-area-inset-bottom, 0px));
  }
}
</style>
