<template>
  <main class="profile-page">
    <header><span>MINHA CONTA</span><h1>Perfil</h1><p>Seus dados e preferências em um só lugar.</p></header>
    <div class="profile-grid">
      <section class="profile-card identity-card">
        <div class="profile-avatar">{{ initials }}</div>
        <div><h2>{{ user?.name || 'Usuário' }}</h2><p>{{ user?.email }}</p></div>
        <dl><div><dt>Telefone</dt><dd>{{ user?.phone || '—' }}</dd></div><div><dt>Primeiro acesso</dt><dd>{{ formatDate(activity?.firstAccessAt) }}</dd></div><div><dt>Último acesso</dt><dd>{{ formatDate(activity?.lastAccessAt) }}</dd></div></dl>
      </section>

      <section class="profile-card balance-profile-card">
        <span>Saldo disponível</span>
        <div v-if="profileLoading" class="profile-skeleton" />
        <strong v-else>{{ formattedBalance }}</strong>
        <button type="button" @click="openModal"><Icon name="ph:pix-logo-bold" /> Depositar PIX</button>
      </section>

      <section class="profile-card ranking-summary">
        <h2>Suas posições</h2>
        <div v-if="loadingActivity" class="profile-skeleton wide" />
        <div v-else-if="activityError" class="inline-error"><span>{{ activityError }}</span><button type="button" @click="loadActivity">Tentar novamente</button></div>
        <div v-else class="rank-stats"><NuxtLink to="/ranking"><span>Atividade</span><strong>{{ positionLabel(ranking.activity) }}</strong></NuxtLink><NuxtLink to="/ranking"><span>Depósitos</span><strong>{{ positionLabel(ranking.deposits) }}</strong></NuxtLink></div>
      </section>

      <section class="profile-card preferences-card">
        <h2>Notificações</h2><p>{{ notificationDescription }}</p>
        <button type="button" :disabled="!supported || permission !== 'default'" @click="requestPermission"><Icon name="ph:bell-ringing-bold" /> {{ notificationLabel }}</button>
      </section>
    </div>
    <button type="button" class="profile-logout" @click="logout('/')"><Icon name="ph:sign-out-bold" /> Sair da conta</button>
  </main>
</template>

<script setup lang="ts">
const { user, formattedBalance, profileLoading, fetchUserProfile, logout } = useAuth()
const { openModal } = useDeposit()
const { permission, supported, requestPermission } = useNotificationPermission()
const activity = ref<{ firstAccessAt: string | null; lastAccessAt: string | null; accessCount: number } | null>(null)
const ranking = reactive<{ activity: number | null; deposits: number | null }>({ activity: null, deposits: null })
const loadingActivity = ref(true)
const activityError = ref('')
const initials = computed(() => String(user.value?.name || user.value?.email || 'U').trim().split(/\s+/).slice(0, 2).map(p => p[0]).join('').toUpperCase())
const formatDate = (value?: string | null) => value ? new Date(value).toLocaleString('pt-BR', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Sao_Paulo' }) : '—'
const positionLabel = (value: number | null) => value ? `${value}º lugar` : 'Sem posição'
const notificationLabel = computed(() => !supported.value ? 'Não disponível' : permission.value === 'granted' ? 'Notificações ativadas' : permission.value === 'denied' ? 'Permissão bloqueada' : 'Ativar notificações')
const notificationDescription = computed(() => permission.value === 'granted' ? 'Você receberá novidades e alertas permitidos.' : permission.value === 'denied' ? 'Altere a permissão nas configurações do navegador.' : 'Ative para receber avisos sobre sinais e novidades.')
const loadActivity = async () => {
  if (!user.value?.email) return
  loadingActivity.value = true; activityError.value = ''
  try {
    const result = await $fetch<{ activity: typeof activity.value; ranking: typeof ranking }>('/api/activity', { params: { email: user.value.email } })
    activity.value = result.activity; Object.assign(ranking, result.ranking)
  } catch { activityError.value = 'Não foi possível carregar sua atividade.' } finally { loadingActivity.value = false }
}
onMounted(() => { fetchUserProfile(); loadActivity() })
watch(() => user.value?.email, loadActivity)
useHead({ title: 'Perfil' })
</script>

<style scoped>
.profile-page { width: min(980px, 100%); margin: 0 auto; padding: 48px 28px 80px; color: var(--text-main); }
.profile-page > header span { color: var(--color-primary); font-size: 11px; font-weight: 900; letter-spacing: .16em; }
.profile-page h1 { margin: 8px 0; font-size: clamp(34px, 5vw, 54px); }
.profile-page header p, .profile-card p { color: var(--text-muted); }
.profile-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin-top: 30px; }
.profile-card { padding: 24px; border: 1px solid var(--card-border); border-radius: 17px; background: var(--card-bg); }
.identity-card { grid-column: 1 / -1; display: grid; grid-template-columns: 68px 1fr; align-items: center; gap: 16px; }
.profile-avatar { display: grid; place-items: center; width: 68px; height: 68px; border-radius: 18px; background: var(--color-primary); color: var(--bg-darker); font-size: 24px; font-weight: 900; }
.identity-card dl { grid-column: 1 / -1; display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 8px; }
.identity-card dl div { padding: 12px; border-radius: 11px; background: var(--component-bg); }
dt { color: var(--text-muted); font-size: 11px; } dd { margin-top: 5px; font-weight: 700; }
.balance-profile-card { display: grid; gap: 10px; }.balance-profile-card > span { color: var(--text-muted); }.balance-profile-card > strong { font-size: 30px; }
.profile-card button, .profile-logout { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 44px; padding: 0 16px; border: 0; border-radius: 10px; background: var(--color-primary); color: var(--bg-darker); font-weight: 800; cursor: pointer; }
.rank-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 16px; }.rank-stats a { display: grid; gap: 6px; padding: 14px; border-radius: 11px; background: var(--component-bg); color: var(--text-main); text-decoration: none; }.rank-stats span { color: var(--text-muted); font-size: 12px; }
.preferences-card p { margin: 8px 0 18px; line-height: 1.5; }.preferences-card button:disabled { opacity: .55; cursor: not-allowed; }
.profile-skeleton { width: 140px; height: 36px; border-radius: 8px; background: var(--component-bg); animation: pulse 1.2s ease-in-out infinite; }.profile-skeleton.wide { width: 100%; margin-top: 18px; }
.inline-error { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 16px; color: var(--color-danger); }.inline-error button { min-height: 38px; }
.profile-logout { margin-top: 22px; border: 1px solid var(--card-border); background: transparent; color: var(--text-main); }
button, a { transition: transform .24s cubic-bezier(.16, 1, .3, 1); } button:hover:not(:disabled), a:hover { transform: translateY(-2px); } button:focus-visible, a:focus-visible { outline: 3px solid var(--color-primary); outline-offset: 2px; }
@keyframes pulse { 50% { opacity: .45; } }
@media (max-width: 650px) { .profile-page { padding: 28px 16px 60px; }.profile-grid { grid-template-columns: 1fr; }.identity-card dl { grid-template-columns: 1fr; }.balance-profile-card, .ranking-summary, .preferences-card { grid-column: 1; } }
@media (prefers-reduced-motion: reduce) { button, a { transition: none; } button:hover:not(:disabled), a:hover { transform: none; } .profile-skeleton { animation: none; } }
</style>
