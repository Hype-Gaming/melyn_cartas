<template>
  <AdminPasswordGate v-if="needsLogin" @authed="refreshAll" />

  <div class="adm-shell adm-scroll">
    <div class="adm-aurora" />

    <aside class="adm-sidebar">
      <NuxtLink to="/admin" class="adm-brand">
        <Icon name="ph:shield-check-bold" aria-hidden="true" />
        <span>{{ appConfig.brand.name }}</span>
      </NuxtLink>
      <AdminNav />
      <div class="adm-sidebar-foot">
        <span v-if="adminEmail" class="adm-email" :title="adminEmail">{{ adminEmail }}</span>
        <button type="button" class="adm-logout" @click="logout">
          <Icon name="ph:sign-out-bold" aria-hidden="true" /> Sair
        </button>
      </div>
    </aside>

    <div class="adm-main">
      <slot />
    </div>

    <Transition name="adm-toast">
      <div v-if="toast" class="adm-toast" :class="toastType" role="alert" aria-live="assertive">{{ toast }}</div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
const { config: appConfig } = useVisualConfig()
const { adminEmail, needsLogin, logout } = useAdmin()
const { toast, toastType, refreshAll } = useAdminData()
</script>

<style scoped>
.adm-shell { display: flex; min-height: 100vh; background: var(--adm-bg); color: var(--adm-text); }

.adm-sidebar {
  position: sticky; top: 0; z-index: 5;
  display: flex; flex-direction: column; gap: 22px;
  width: 244px; flex-shrink: 0; height: 100vh;
  padding: 22px 16px;
  border-right: 1px solid var(--adm-border);
  background: var(--adm-panel);
  overflow-y: auto;
}

.adm-brand { display: flex; align-items: center; gap: 10px; color: var(--adm-text); font-weight: 800; text-decoration: none; }
.adm-brand :deep(svg) { font-size: 22px; color: var(--adm-accent); }
.adm-brand span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.adm-sidebar-foot { display: grid; gap: 8px; margin-top: auto; padding-top: 16px; border-top: 1px solid var(--adm-border); }
.adm-email { overflow: hidden; color: var(--adm-faint); font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }

.adm-logout {
  display: flex; align-items: center; gap: 9px;
  min-height: 42px; padding: 0 13px;
  border: 1px solid color-mix(in srgb, var(--adm-red) 22%, transparent);
  border-radius: 10px;
  background: color-mix(in srgb, var(--adm-red) 10%, transparent);
  color: var(--adm-red);
  font: inherit; font-size: 13px; font-weight: 700;
  cursor: pointer;
}
.adm-logout:hover { background: var(--adm-red); color: #fff; }
.adm-logout:focus-visible { outline: 3px solid var(--adm-accent); outline-offset: 2px; }

.adm-main { position: relative; z-index: 1; flex: 1; min-width: 0; padding: 26px 28px 56px; }

.adm-toast {
  position: fixed; right: 24px; bottom: 24px; z-index: 60;
  padding: 14px 18px; border-radius: 10px;
  background: var(--adm-green); color: #fff;
  box-shadow: var(--adm-shadow);
}
.adm-toast.error { background: var(--adm-red); }
.adm-toast-enter-active, .adm-toast-leave-active { transition: opacity .2s ease, transform .2s var(--adm-ease); }
.adm-toast-enter-from, .adm-toast-leave-to { opacity: 0; transform: translateY(8px); }

@media (max-width: 900px) {
  .adm-shell { display: block; }
  .adm-sidebar { position: static; flex-direction: row; align-items: center; gap: 14px; width: auto; height: auto; padding: 12px 14px; border-right: 0; border-bottom: 1px solid var(--adm-border); }
  .adm-brand span { display: none; }
  .adm-sidebar-foot { display: none; }
  .adm-main { padding: 18px 14px 40px; }
}

@media (prefers-reduced-motion: reduce) {
  .adm-toast-enter-active, .adm-toast-leave-active { transition: none; }
}
</style>
