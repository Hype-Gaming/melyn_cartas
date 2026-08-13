<template>
  <AdminPasswordGate v-if="needsLogin" />

  <main class="visual-page">
    <div class="visual-wrap">
      <header class="visual-topbar">
        <div>
          <NuxtLink to="/admin" class="back-link"><Icon name="ph:arrow-left-bold" /> Painel</NuxtLink>
          <h1><Icon name="ph:palette-bold" /> Visual do app</h1>
          <p>As alterações salvas entram no app após atualizar a página.</p>
        </div>
        <button class="primary-btn" :disabled="saving || loading" @click="saveConfig">
          <Icon :name="saving ? 'ph:spinner-gap-bold' : 'ph:floppy-disk-bold'" />
          {{ saving ? 'Salvando...' : 'Salvar alterações' }}
        </button>
      </header>

      <div v-if="loading" class="state-card">Carregando configuração...</div>

      <template v-else>
        <section class="panel">
          <h2>Marca e metadados</h2>
          <div class="form-grid">
            <label v-for="field in brandFields" :key="field.key" class="field" :class="{ wide: field.wide }">
              <span>{{ field.label }}</span>
              <textarea v-if="field.multiline" v-model="draft.brand[field.key]" rows="3" />
              <input v-else v-model="draft.brand[field.key]" :placeholder="field.placeholder" />
            </label>
          </div>
          <p class="hint">Imagens aceitam caminhos públicos (ex.: /media/logo.svg) ou URLs HTTPS.</p>
        </section>

        <section class="panel">
          <h2>Cores do tema</h2>
          <div class="color-grid">
            <label v-for="field in themeFields" :key="field.key" class="color-field">
              <span>{{ field.label }}</span>
              <div>
                <input v-model="draft.theme[field.key]" type="color" />
                <input v-model="draft.theme[field.key]" class="color-text" maxlength="30" />
              </div>
            </label>
          </div>
        </section>

        <section class="panel">
          <h2>Textos</h2>
          <div class="form-grid">
            <label v-for="field in contentFields" :key="field.key" class="field">
              <span>{{ field.label }}</span>
              <input v-model="draft.content[field.key]" />
            </label>
          </div>
        </section>

        <section class="panel">
          <h2>Links</h2>
          <div class="form-grid">
            <label v-for="field in linkFields" :key="field.key" class="field">
              <span>{{ field.label }}</span>
              <input v-model="draft.links[field.key]" type="url" placeholder="https://..." />
            </label>
          </div>
        </section>

        <section class="panel">
          <h2>Imagens e banners</h2>
          <div class="form-grid">
            <label class="field wide">
              <span>Banners (uma URL ou caminho por linha)</span>
              <textarea v-model="bannerText" rows="5" placeholder="/media/banner-1.webp" />
            </label>
            <label class="field"><span>Imagem de bloqueio</span><input v-model="draft.images.blocked" /></label>
            <label class="field"><span>Imagem premium</span><input v-model="draft.images.premium" /></label>
            <label class="field"><span>Imagem da live</span><input v-model="draft.images.live" /></label>
          </div>
        </section>

        <section class="panel">
          <h2>Recursos visíveis</h2>
          <div class="toggle-grid">
            <label v-for="field in featureFields" :key="field.key" class="toggle">
              <input v-model="draft.features[field.key]" type="checkbox" />
              <span>{{ field.label }}</span>
            </label>
          </div>
        </section>

        <section class="panel">
          <div class="panel-head">
            <h2>Menu</h2>
            <button class="ghost-btn" @click="addMenuItem"><Icon name="ph:plus-bold" /> Adicionar</button>
          </div>
          <div class="menu-list">
            <div v-for="(item, index) in draft.menu" :key="index" class="menu-row">
              <input v-model="item.key" placeholder="chave" />
              <input v-model="item.label" placeholder="Nome" />
              <input v-model="item.icon" placeholder="ph:house-bold" />
              <input v-model.number="item.order" type="number" min="0" placeholder="Ordem" />
              <button class="icon-btn" title="Remover" @click="draft.menu.splice(index, 1)"><Icon name="ph:trash-bold" /></button>
            </div>
          </div>
        </section>

        <section class="panel maintenance-panel">
          <h2>Modo de manutenção</h2>
          <label class="toggle danger"><input v-model="draft.maintenance.active" type="checkbox" /><span>Bloquear o app para visitantes</span></label>
          <div class="form-grid">
            <label class="field"><span>Título</span><input v-model="draft.maintenance.title" /></label>
            <label class="field"><span>Mensagem</span><input v-model="draft.maintenance.message" /></label>
          </div>
        </section>

        <div class="bottom-actions">
          <button class="primary-btn" :disabled="saving" @click="saveConfig">
            <Icon name="ph:floppy-disk-bold" /> {{ saving ? 'Salvando...' : 'Salvar alterações' }}
          </button>
        </div>
      </template>
    </div>

    <div v-if="toast" class="toast" :class="toastType">{{ toast }}</div>
  </main>
</template>

<script setup lang="ts">
import type { AppConfig, ThemeKey } from '../../../shared/appConfig'
import { cloneDefaultAppConfig } from '../../../shared/appConfig'

definePageMeta({ middleware: 'admin' })

type BrandKey = keyof AppConfig['brand']
type ContentKey = keyof AppConfig['content']
type LinkKey = keyof AppConfig['links']
type FeatureKey = keyof AppConfig['features']

const { adminFetch, needsLogin } = useAdmin()
const { loadAppConfig, applyTheme } = useVisualConfig()
const draft = reactive<AppConfig>(cloneDefaultAppConfig())
const bannerText = ref('')
const loading = ref(true)
const saving = ref(false)
const toast = ref('')
const toastType = ref<'ok' | 'error'>('ok')

const brandFields: Array<{ key: BrandKey; label: string; placeholder?: string; multiline?: boolean; wide?: boolean }> = [
  { key: 'name', label: 'Nome do app' },
  { key: 'keywords', label: 'Palavras-chave' },
  { key: 'description', label: 'Descrição', multiline: true, wide: true },
  { key: 'logo', label: 'Logo', placeholder: '/media/melyn-logo.svg' },
  { key: 'favicon', label: 'Favicon', placeholder: '/media/melyn-mark.svg' }
]

const themeFields: Array<{ key: ThemeKey; label: string }> = [
  { key: 'colorPrimary', label: 'Primária' }, { key: 'colorPrimaryDark', label: 'Primária escura' },
  { key: 'colorSecondary', label: 'Secundária' }, { key: 'colorSecondaryDark', label: 'Secundária escura' },
  { key: 'bgDark', label: 'Fundo' }, { key: 'bgDarker', label: 'Fundo profundo' },
  { key: 'cardBg', label: 'Cards' }, { key: 'inputBg', label: 'Campos' },
  { key: 'componentBg', label: 'Componentes' }, { key: 'cardBorder', label: 'Bordas' },
  { key: 'textMain', label: 'Texto principal' }, { key: 'textMuted', label: 'Texto suave' },
  { key: 'colorGold', label: 'Dourado' }, { key: 'colorFire', label: 'Destaque' },
  { key: 'colorDanger', label: 'Perigo' }
]

const contentFields: Array<{ key: ContentKey; label: string }> = [
  { key: 'newsTitle', label: 'Título das notícias' }, { key: 'newsBadge', label: 'Selo das notícias' },
  { key: 'newsHeadline', label: 'Manchete das notícias' }, { key: 'primeTitle', label: 'Título da seção Prime' },
  { key: 'premiumTitle', label: 'Título da seção Premium' }, { key: 'claudeTitle', label: 'Título da seção Sem Gale' },
  { key: 'linksTitle', label: 'Título dos links úteis' }, { key: 'highlightsTitle', label: 'Título dos destaques' },
  { key: 'depositButton', label: 'Botão de depósito' }, { key: 'subscribeButton', label: 'Botão de assinatura' },
  { key: 'supportTitle', label: 'Título do suporte' }, { key: 'supportMessage', label: 'Mensagem do suporte' },
  { key: 'unlockButton', label: 'Botão bloqueado' }, { key: 'accessButton', label: 'Botão liberado' }
]

const linkFields: Array<{ key: LinkKey; label: string }> = [
  { key: 'register', label: 'Cadastro' }, { key: 'checkout', label: 'Checkout' },
  { key: 'checkoutSemGale', label: 'Checkout Sem Gale' },
  { key: 'whatsappSupport', label: 'WhatsApp suporte' }, { key: 'whatsappCommunity', label: 'WhatsApp comunidade' },
  { key: 'telegram', label: 'Telegram' }, { key: 'instagram', label: 'Instagram' }, { key: 'site', label: 'Site' }
]

const featureFields: Array<{ key: FeatureKey; label: string }> = [
  { key: 'home', label: 'Início' }, { key: 'games', label: 'Jogos' },
  { key: 'lessons', label: 'Aulas' }, { key: 'ranking', label: 'Ranking' },
  { key: 'links', label: 'Links úteis' }, { key: 'management', label: 'Gestão' }, { key: 'live', label: 'Live' }
]

const notify = (message: string, type: 'ok' | 'error' = 'ok') => {
  toast.value = message
  toastType.value = type
  window.setTimeout(() => { toast.value = '' }, 3500)
}

const applyDraft = (config: AppConfig) => {
  Object.assign(draft, JSON.parse(JSON.stringify(config)))
  bannerText.value = config.images.banners.join('\n')
}

const loadConfig = async () => {
  loading.value = true
  try {
    const result = await $fetch<{ success: boolean; data: AppConfig }>('/api/app-config')
    applyDraft(result.data)
  } catch {
    notify('Não foi possível carregar a configuração.', 'error')
  } finally {
    loading.value = false
  }
}

const saveConfig = async () => {
  saving.value = true
  draft.images.banners = bannerText.value.split(/\r?\n/).map(value => value.trim()).filter(Boolean)
  try {
    const result = await adminFetch<{ success: boolean; data: AppConfig }>('/api/app-config', {
      method: 'PUT', body: JSON.parse(JSON.stringify(draft))
    })
    applyDraft(result.data)
    await loadAppConfig(true)
    applyTheme(result.data)
    notify('Configuração visual salva.')
  } catch (error: any) {
    notify(error?.data?.message || 'Erro ao salvar a configuração.', 'error')
  } finally {
    saving.value = false
  }
}

const addMenuItem = () => draft.menu.push({ key: '', label: '', icon: '', order: draft.menu.length + 1 })

// O gate emite 'authed' já desmontado (o login marca a sessão antes de retornar,
// e o v-if remove o componente antes do emit), então observamos needsLogin.
watch(needsLogin, value => { if (!value) loadConfig() })
onMounted(() => { if (!needsLogin.value) loadConfig() })
useHead({ title: 'Visual do app - Painel Admin' })
</script>

<style scoped>
.visual-page { min-height: 100vh; background: #08090d; color: #f5f6fa; padding: 28px 20px 64px; font-family: Manrope, sans-serif; }
.visual-wrap { width: min(1120px, 100%); margin: 0 auto; }
.visual-topbar { display: flex; align-items: end; justify-content: space-between; gap: 24px; margin-bottom: 28px; }
.visual-topbar h1 { display: flex; align-items: center; gap: 10px; margin: 12px 0 6px; font-size: 30px; }
.visual-topbar p, .hint { color: #9095a5; }
.back-link { display: inline-flex; align-items: center; gap: 6px; color: #a78bfa; text-decoration: none; }
.panel, .state-card { margin-bottom: 18px; padding: 24px; border: 1px solid #252936; border-radius: 16px; background: #11131a; }
.panel h2 { margin: 0 0 20px; font-size: 18px; }
.panel-head { display: flex; justify-content: space-between; align-items: center; }
.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.field { display: grid; gap: 7px; color: #cdd0db; font-size: 13px; font-weight: 700; }
.field.wide { grid-column: 1 / -1; }
input, textarea { width: 100%; padding: 11px 12px; border: 1px solid #303544; border-radius: 9px; outline: none; background: #0b0d12; color: #fff; font: inherit; }
input:focus, textarea:focus { border-color: #8b7cf6; box-shadow: 0 0 0 3px rgba(139, 124, 246, .12); }
.color-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
.color-field { display: grid; gap: 7px; color: #cdd0db; font-size: 13px; font-weight: 700; }
.color-field > div { display: flex; gap: 8px; }
.color-field input[type='color'] { width: 46px; min-width: 46px; height: 42px; padding: 4px; cursor: pointer; }
.color-text { min-width: 0; }
.toggle-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.toggle { display: flex; align-items: center; gap: 10px; padding: 12px; border: 1px solid #2d3140; border-radius: 10px; background: #0c0e14; }
.toggle input { width: 18px; height: 18px; accent-color: #8b7cf6; }
.toggle.danger { width: max-content; margin-bottom: 18px; border-color: #69313b; }
.menu-list { display: grid; gap: 10px; }
.menu-row { display: grid; grid-template-columns: 1fr 1.5fr 1.5fr 90px 42px; gap: 8px; }
.primary-btn, .ghost-btn, .icon-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; border: 0; border-radius: 9px; cursor: pointer; font-weight: 800; }
.primary-btn { padding: 12px 18px; color: #fff; background: linear-gradient(135deg, #8b7cf6, #6657d8); }
.primary-btn:disabled { opacity: .55; cursor: wait; }
.ghost-btn { padding: 9px 13px; border: 1px solid #343847; color: #eee; background: #191c25; }
.icon-btn { color: #d9b76e; background: #242033; }
.bottom-actions { display: flex; justify-content: flex-end; margin-top: 24px; }
.toast { position: fixed; right: 24px; bottom: 24px; z-index: 20; padding: 14px 18px; border-radius: 10px; color: #fff; background: #16794d; box-shadow: 0 14px 40px #0008; }
.toast.error { background: #a82e42; }
@media (max-width: 780px) {
  .visual-topbar { align-items: stretch; flex-direction: column; }
  .form-grid, .color-grid { grid-template-columns: 1fr; }
  .toggle-grid { grid-template-columns: repeat(2, 1fr); }
  .menu-row { grid-template-columns: 1fr 1fr; padding-bottom: 14px; border-bottom: 1px solid #252936; }
  .icon-btn { min-height: 42px; }
}
</style>
