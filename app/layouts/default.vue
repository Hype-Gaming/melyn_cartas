<template>
  <div class="app-shell">
    <AppSidebar />
    <div class="app-shell-main"><AppMobileHeader /><slot /></div>
    <DepositModal />
  </div>
</template>

<style scoped>
.app-shell { min-height: 100vh; background: var(--bg-dark); }
.app-shell-main { min-width: 0; min-height: 100vh; margin-left: 288px; }
@media (max-width: 900px) { .app-shell-main { margin-left: 0; } }
</style>
