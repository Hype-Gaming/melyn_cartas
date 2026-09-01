<template>
  <Teleport to="body"><button v-if="open" class="sidebar-overlay" type="button" aria-label="Fechar navegação" @click="closeDrawer" /></Teleport>
  <aside class="app-sidebar" :class="{ open }" aria-label="Barra lateral">
    <div class="brand-block">
      <img :src="sidebarLogo" :alt="config.brand.name" @error="useFallbackLogo" />
    </div>

    <template v-if="isAuthenticated">
      <div class="user-card">
        <NuxtLink to="/perfil" class="user-link"><span class="user-avatar">{{ initials(user?.name || user?.email || 'U') }}</span><span><strong>{{ user?.name || 'Usuário' }}</strong><small>{{ user?.email }}</small></span></NuxtLink>
        <button type="button" title="Atualizar saldo" aria-label="Atualizar saldo" :disabled="profileLoading" @click="refreshBalance"><Icon name="ph:arrows-clockwise-bold" :class="{ spinning: profileLoading }" /></button>
      </div>
      <section class="balance-card" aria-label="Saldo">
        <div class="balance-main">
          <span class="coin-wrapper" aria-hidden="true"><Icon name="ph:coin-fill" /></span>
          <div class="balance-info">
            <span class="balance-label">Saldo disponível</span>
            <div v-if="profileLoading" class="balance-skeleton" aria-label="Carregando saldo" />
            <strong v-else>{{ formattedBalance }}</strong>
          </div>
        </div>
        <button type="button" @click="openModal"><Icon name="ph:pix-logo-bold" /> Depositar PIX</button>
      </section>
    </template>
    <NuxtLink v-else to="/auth/login" class="login-cta"><Icon name="ph:sign-in-bold" /> Entrar na conta</NuxtLink>

    <div class="nav-section"><span class="nav-label">NAVEGAÇÃO</span><AppNavList /></div>
    <div v-if="isAuthenticated" class="sidebar-footer">
      <button type="button" class="logout-button" @click="logout('/')"><Icon name="ph:sign-out-bold" /> Sair</button>
    </div>
  </aside>
</template>

<script setup lang="ts">
const { config, resolveAssetUrl } = useVisualConfig()
const { user, isAuthenticated, formattedBalance, profileLoading, fetchUserProfile, logout } = useAuth()
const { openModal } = useDeposit()
const { open, closeDrawer } = useSidebarDrawer()
const fallbackLogo = '/media/melyn-logo.svg'
const sidebarLogo = ref(resolveAssetUrl(config.value.brand.logo) || fallbackLogo)
watch(() => config.value.brand.logo, value => { sidebarLogo.value = resolveAssetUrl(value) || fallbackLogo })
const useFallbackLogo = () => {
  if (sidebarLogo.value !== fallbackLogo) sidebarLogo.value = fallbackLogo
}
const initials = (value: string) => value.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase() || 'MR'
const refreshBalance = () => fetchUserProfile()
</script>

<style scoped>
.app-sidebar { position: fixed; inset: 0 auto 0 0; z-index: 90; display: flex; flex-direction: column; width: min(300px, 86vw); padding: 24px; border: 1px solid color-mix(in srgb, var(--color-primary) 15%, transparent); border-radius: 0 24px 24px 0; background: var(--component-bg); color: var(--text-main); overflow-y: auto; }
.brand-block { display: grid; place-items: center; min-height: 72px; margin-bottom: 18px; }
.brand-block img { max-width: 190px; max-height: 68px; object-fit: contain; }
.user-avatar { display: grid; place-items: center; border-radius: 12px; background: var(--color-primary); color: var(--bg-darker); font-weight: 900; }
.user-card { display: grid; grid-template-columns: 1fr 34px; align-items: center; gap: 10px; padding: 12px; border: 1px solid color-mix(in srgb, var(--text-main) 5%, transparent); border-radius: 20px; background: color-mix(in srgb, var(--text-main) 3%, transparent); color: var(--text-main); }
.user-link { display: grid; grid-template-columns: 42px 1fr; align-items: center; gap: 10px; min-width: 0; color: var(--text-main); text-decoration: none; }
.user-avatar { width: 42px; height: 42px; }
.user-link > span:nth-child(2) { min-width: 0; display: grid; gap: 3px; }
.user-card strong, .user-card small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.user-card small { color: var(--text-muted); }
.user-card button { display: grid; place-items: center; width: 34px; height: 34px; border: 0; border-radius: 9px; background: var(--component-bg); color: var(--text-main); cursor: pointer; }
.balance-card { display: grid; gap: 16px; margin-top: 12px; padding: 16px; border: 1px solid color-mix(in srgb, var(--text-main) 5%, transparent); border-radius: 20px; background: color-mix(in srgb, var(--text-main) 3%, transparent); }
.balance-main { display: flex; align-items: center; gap: 12px; }
.coin-wrapper { display: grid; place-items: center; padding: 8px; border-radius: 12px; background: rgba(0, 0, 0, .4); color: var(--color-gold); font-size: 24px; }
.balance-info { display: flex; flex-direction: column; min-width: 0; }
.balance-label { color: var(--text-muted); font-size: .7rem; font-weight: 600; text-transform: uppercase; }
.balance-info strong { font-size: 1.1rem; font-weight: 800; }
.balance-card button, .login-cta { display: flex; align-items: center; justify-content: center; gap: 8px; min-height: 44px; padding: .8rem; border: 0; border-radius: 12px; background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark)); color: var(--text-main); font-weight: 700; cursor: pointer; text-decoration: none; }
.balance-card button:hover, .login-cta:hover { transform: translateY(-2px); box-shadow: 0 8px 20px color-mix(in srgb, var(--color-primary) 30%, transparent); }
.balance-skeleton { width: 80px; height: 1.1rem; border-radius: 6px; background: color-mix(in srgb, var(--text-main) 10%, transparent); animation: pulse 1.2s ease-in-out infinite; }
.login-cta { margin-bottom: 12px; }
.nav-section { margin-top: 24px; }
.nav-label { display: block; margin: 0 12px 10px; color: var(--text-muted); font-size: 10px; font-weight: 800; letter-spacing: .14em; }
.sidebar-footer { margin-top: auto; padding-top: 16px; border-top: 1px solid color-mix(in srgb, var(--text-main) 8%, transparent); }
.logout-button { display: flex; align-items: center; gap: 12px; width: 100%; min-height: 46px; padding: 0 16px; border: 1px solid color-mix(in srgb, var(--color-danger) 20%, transparent); border-radius: 12px; background: color-mix(in srgb, var(--color-danger) 10%, transparent); color: var(--color-danger); font-size: .9rem; font-weight: 600; cursor: pointer; }
.logout-button:hover { background: var(--color-danger); border-color: var(--color-danger); color: var(--text-main); }
button, a { transition: transform .24s cubic-bezier(.16, 1, .3, 1); }
button:focus-visible, a:focus-visible { outline: 3px solid var(--color-primary); outline-offset: 2px; }
.spinning { animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes pulse { 50% { opacity: .45; } }
@media (max-width: 900px) { .app-sidebar { transform: translateX(-105%); box-shadow: 20px 0 60px color-mix(in srgb, var(--bg-darker) 70%, transparent); transition: transform .32s cubic-bezier(.16, 1, .3, 1); } .app-sidebar.open { transform: translateX(0); } }
@media (prefers-reduced-motion: reduce) { button, a, .app-sidebar { transition: none; } .logout-button:hover { transform: none; } .spinning, .balance-skeleton { animation: none; } }
</style>

<style>
.sidebar-overlay { position: fixed; inset: 0; z-index: 85; display: none; border: 0; background: color-mix(in srgb, var(--bg-darker) 72%, transparent); backdrop-filter: blur(3px); }
@media (max-width: 900px) { .sidebar-overlay { display: block; } }
</style>
