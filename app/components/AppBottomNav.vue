<template>
  <nav class="bottom-nav" aria-label="Navegação principal">
    <NuxtLink to="/" class="bottom-item">
      <Icon name="ph:house-bold" aria-hidden="true" />
      <span>Início</span>
    </NuxtLink>
    <!--
      Mesma rota da home, só com âncora: sem uma classe ativa própria, este item
      e "Início" acenderiam juntos. String vazia o NuxtLink ignora, daí o nome.
    -->
    <NuxtLink to="/#jogos" class="bottom-item" active-class="is-anchor" exact-active-class="is-anchor">
      <Icon name="ph:game-controller-bold" aria-hidden="true" />
      <span>Jogos</span>
    </NuxtLink>
    <button type="button" class="bottom-item" @click="openWallet">
      <Icon name="ph:wallet-bold" aria-hidden="true" />
      <span>Carteira</span>
    </button>
    <NuxtLink to="/torneio" class="bottom-item">
      <Icon name="ph:trophy-bold" aria-hidden="true" />
      <span>Torneio</span>
    </NuxtLink>
    <NuxtLink to="/perfil" class="bottom-item">
      <Icon name="ph:user-circle-bold" aria-hidden="true" />
      <span>Perfil</span>
    </NuxtLink>
  </nav>
</template>

<script setup lang="ts">
const { openWallet } = useWalletModal()
</script>

<style scoped>
.bottom-nav {
  display: none;
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 90;
  grid-template-columns: repeat(5, 1fr);
  padding: 6px 4px calc(6px + env(safe-area-inset-bottom, 0px));
  border-top: 1px solid var(--card-border);
  background: color-mix(in srgb, var(--bg-darker) 88%, transparent);
  backdrop-filter: blur(14px);
}

.bottom-item {
  display: grid;
  justify-items: center;
  gap: 3px;
  min-height: 52px;
  padding: 7px 2px;
  border: 0;
  border-radius: 12px;
  background: none;
  color: var(--text-muted);
  font: inherit;
  font-size: 10px;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
  transition: color var(--transition);
}
.bottom-item :deep(svg) { font-size: 22px; }
.bottom-item.router-link-exact-active { color: var(--accent); }
.bottom-item:focus-visible { outline: 3px solid var(--accent); outline-offset: -3px; }

@media (max-width: 900px) { .bottom-nav { display: grid; } }
</style>
