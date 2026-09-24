<template>
  <main class="maintenance-admin">
    <header class="page-head">
      <div>
        <p class="eyebrow">Configurações do aplicativo</p>
        <h1><Icon name="ph:wrench-bold" /> Modo de manutenção</h1>
        <p>Interrompa temporariamente o acesso dos usuários sem bloquear este painel.</p>
      </div>
      <span class="status-pill" :class="form.active ? 'active' : 'inactive'">
        <span aria-hidden="true" /> {{ form.active ? 'Manutenção ativa' : 'Aplicativo disponível' }}
      </span>
    </header>

    <section v-if="loading" class="panel state-card" role="status">Carregando configuração...</section>

    <form v-else class="panel" @submit.prevent="save">
      <div class="toggle-row">
        <div>
          <strong>Bloquear telas dos usuários</strong>
          <p>Administradores continuarão acessando normalmente as rotas do painel.</p>
        </div>
        <label class="switch">
          <input v-model="form.active" type="checkbox" />
          <span aria-hidden="true" />
          <b>{{ form.active ? 'Ativado' : 'Desativado' }}</b>
        </label>
      </div>

      <div class="fields">
        <label>
          <span>Título</span>
          <input v-model="form.title" maxlength="120" placeholder="Em manutenção" />
          <small>{{ form.title.length }}/120 caracteres</small>
        </label>
        <label>
          <span>Mensagem</span>
          <textarea v-model="form.message" maxlength="500" rows="5" placeholder="Estamos realizando melhorias. Voltamos em breve." />
          <small>{{ form.message.length }}/500 caracteres</small>
        </label>
      </div>

      <aside class="safe-defaults">
        <Icon name="ph:info-bold" aria-hidden="true" />
        <span>Campos vazios serão substituídos por uma mensagem segura antes da publicação.</span>
      </aside>

      <div class="actions">
        <button type="button" class="secondary-btn" :disabled="saving" @click="load">Descartar alterações</button>
        <button type="submit" class="primary-btn" :disabled="saving">
          <Icon :name="saving ? 'ph:spinner-gap-bold' : 'ph:floppy-disk-bold'" :class="{ spinning: saving }" />
          {{ saving ? 'Aplicando...' : 'Salvar e aplicar' }}
        </button>
      </div>
    </form>

    <Transition name="toast">
      <div v-if="feedback" class="feedback" :class="feedbackType" role="alert">{{ feedback }}</div>
    </Transition>
  </main>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'admin', layout: 'admin' })

const DEFAULT_TITLE = 'Em manutenção'
const DEFAULT_MESSAGE = 'Estamos realizando melhorias. Voltamos em breve.'
const { adminFetch, needsLogin } = useAdmin()
const { check: checkMaintenance } = useMaintenanceStatus()
const loading = ref(true)
const saving = ref(false)
const feedback = ref('')
const feedbackType = ref<'ok' | 'error'>('ok')
const form = reactive({ active: false, title: DEFAULT_TITLE, message: DEFAULT_MESSAGE })
let feedbackTimer: ReturnType<typeof setTimeout> | undefined

const notify = (message: string, type: 'ok' | 'error' = 'ok') => {
  clearTimeout(feedbackTimer)
  feedback.value = message
  feedbackType.value = type
  feedbackTimer = setTimeout(() => { feedback.value = '' }, 4000)
}

const load = async () => {
  loading.value = true
  try {
    const result = await adminFetch<{ success: boolean; data: { maintenance: typeof form } }>('/api/app-config')
    Object.assign(form, result.data.maintenance)
  } catch {
    if (!needsLogin.value) notify('Não foi possível carregar a configuração.', 'error')
  } finally {
    loading.value = false
  }
}

const save = async () => {
  saving.value = true
  try {
    const result = await adminFetch<{ success: boolean; data: typeof form }>('/api/admin/settings/maintenance', {
      method: 'PUT',
      body: { active: form.active, title: form.title, message: form.message }
    })
    Object.assign(form, result.data)
    await checkMaintenance()
    notify(form.active ? 'Modo de manutenção ativado.' : 'Modo de manutenção desativado.')
  } catch (error: any) {
    const message = error?.data?.message || error?.message || 'Não foi possível salvar a configuração.'
    notify(message, 'error')
  } finally {
    saving.value = false
  }
}

watch(needsLogin, (value) => { if (!value) load() }, { immediate: true })
onBeforeUnmount(() => clearTimeout(feedbackTimer))
</script>

<style scoped>
.maintenance-admin { max-width: 980px; margin: 0 auto; }
.page-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; margin-bottom: 24px; }
.eyebrow { margin-bottom: 7px; color: var(--adm-accent); font-size: 11px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
h1 { display: flex; align-items: center; gap: 10px; margin: 0; color: var(--adm-text); font-size: clamp(25px, 4vw, 34px); }
.page-head p:last-child { margin-top: 8px; color: var(--adm-muted); line-height: 1.5; }
.status-pill { display: inline-flex; align-items: center; gap: 8px; flex: none; padding: 9px 13px; border: 1px solid var(--adm-border); border-radius: 999px; color: var(--adm-muted); background: var(--adm-panel); font-size: 12px; font-weight: 800; }
.status-pill span { width: 8px; height: 8px; border-radius: 50%; background: var(--adm-green); }
.status-pill.active { color: var(--adm-red); border-color: color-mix(in srgb, var(--adm-red) 30%, transparent); background: color-mix(in srgb, var(--adm-red) 8%, var(--adm-panel)); }
.status-pill.active span { background: var(--adm-red); box-shadow: 0 0 0 4px color-mix(in srgb, var(--adm-red) 15%, transparent); }
.panel { padding: clamp(20px, 4vw, 32px); border: 1px solid var(--adm-border); border-radius: 16px; background: var(--adm-panel); box-shadow: var(--adm-shadow); }
.state-card { color: var(--adm-muted); }
.toggle-row { display: flex; align-items: center; justify-content: space-between; gap: 24px; padding-bottom: 26px; border-bottom: 1px solid var(--adm-border); }
.toggle-row strong { display: block; margin-bottom: 5px; color: var(--adm-text); }
.toggle-row p { color: var(--adm-muted); font-size: 13px; }
.switch { display: flex; align-items: center; gap: 9px; cursor: pointer; }
.switch input { position: absolute; opacity: 0; pointer-events: none; }
.switch > span { position: relative; width: 48px; height: 26px; border-radius: 999px; background: var(--adm-border); transition: background .2s ease; }
.switch > span::after { content: ''; position: absolute; top: 4px; left: 4px; width: 18px; height: 18px; border-radius: 50%; background: #fff; transition: transform .2s ease; }
.switch input:checked + span { background: var(--adm-red); }
.switch input:checked + span::after { transform: translateX(22px); }
.switch input:focus-visible + span { outline: 3px solid var(--adm-accent); outline-offset: 2px; }
.switch b { min-width: 78px; color: var(--adm-muted); font-size: 12px; }
.fields { display: grid; gap: 20px; margin-top: 26px; }
.fields label { display: grid; gap: 8px; color: var(--adm-text); font-size: 13px; font-weight: 700; }
.fields input, .fields textarea { width: 100%; padding: 12px 14px; border: 1px solid var(--adm-border); border-radius: 10px; outline: none; resize: vertical; background: var(--adm-input); color: var(--adm-text); font: inherit; line-height: 1.5; }
.fields input:focus, .fields textarea:focus { border-color: var(--adm-accent); box-shadow: 0 0 0 3px var(--adm-accent-soft); }
.fields small { justify-self: end; color: var(--adm-faint); font-weight: 500; }
.safe-defaults { display: flex; align-items: flex-start; gap: 9px; margin-top: 20px; padding: 12px 14px; border-radius: 10px; background: var(--adm-accent-soft); color: var(--adm-muted); font-size: 12px; line-height: 1.5; }
.safe-defaults :deep(svg) { flex: none; margin-top: 2px; color: var(--adm-accent); }
.actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 28px; }
.actions button { min-height: 44px; padding: 0 17px; border-radius: 10px; font: inherit; font-size: 13px; font-weight: 800; cursor: pointer; }
.secondary-btn { border: 1px solid var(--adm-border); background: transparent; color: var(--adm-muted); }
.primary-btn { display: inline-flex; align-items: center; gap: 8px; border: 0; background: var(--adm-accent); color: #fff; }
.actions button:disabled { opacity: .6; cursor: wait; }
.feedback { position: fixed; right: 24px; bottom: 24px; z-index: 70; padding: 14px 18px; border-radius: 10px; background: var(--adm-green); color: #fff; box-shadow: var(--adm-shadow); }
.feedback.error { background: var(--adm-red); }
.toast-enter-active, .toast-leave-active { transition: opacity .2s ease, transform .2s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(8px); }
.spinning { animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 640px) { .page-head, .toggle-row { align-items: stretch; flex-direction: column; } .status-pill { align-self: flex-start; } .switch { justify-content: space-between; } .actions { flex-direction: column-reverse; } .actions button { width: 100%; justify-content: center; } }
@media (prefers-reduced-motion: reduce) { .switch > span, .switch > span::after, .toast-enter-active, .toast-leave-active { transition: none; } .spinning { animation: none; } }
</style>
