<template>
  <header class="mobile-header">
    <button type="button" aria-label="Abrir navegação" @click="openDrawer">
      <Icon name="ph:list-bold" />
    </button>

    <AppLogo class="mobile-logo" />

    <div class="header-right">
      <button
        v-if="isAuthenticated"
        type="button"
        class="header-balance"
        aria-label="Abrir carteira"
        @click="openWallet"
      >
        <Icon name="ph:wallet-bold" aria-hidden="true" />
        <span>{{ formattedBalance }}</span>
      </button>
      <NuxtLink to="/perfil" aria-label="Abrir perfil"><Icon name="ph:user-circle-bold" /></NuxtLink>
    </div>
  </header>
</template>

<script setup lang="ts">
const { openDrawer } = useSidebarDrawer()
const { openWallet } = useWalletModal()
const { formattedBalance, isAuthenticated } = useAuth()
</script>

<style scoped>
.mobile-header {
  display: none;
  position: sticky;
  top: 0;
  z-index: 80;
  height: 62px;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 0 16px;
  border-bottom: 1px solid var(--card-border);
  background: color-mix(in srgb, var(--bg-darker) 86%, transparent);
  backdrop-filter: blur(14px);
}

.mobile-header > button,
.mobile-header a {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border: 0;
  border-radius: 10px;
  background: var(--component-bg);
  color: var(--text-main);
  font-size: 23px;
  cursor: pointer;
}

.mobile-logo { width: 112px; max-height: 40px; object-fit: contain; }

.header-right { display: flex; align-items: center; gap: 8px; }

/* Saldo no header: atalho para a carteira sem sair da página. */
.header-balance {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  width: auto !important;
  min-height: 44px;
  padding: 0 12px;
  border: 1px solid var(--card-border) !important;
  border-radius: 12px;
  background: var(--component-bg);
  color: var(--text-main);
  font: inherit;
  font-size: 13px !important;
  font-weight: 800;
  white-space: nowrap;
  cursor: pointer;
}
.header-balance :deep(svg) { color: var(--accent); font-size: 17px; }

.mobile-header button:focus-visible,
.mobile-header a:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }

@media (max-width: 900px) { .mobile-header { display: flex; } }
@media (max-width: 360px) { .mobile-logo { width: 84px; } }
</style>
