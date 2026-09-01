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
        <button class="ghost-btn" :disabled="savingDraft || loading" @click="saveDraft">
          <Icon name="ph:file-dashed-bold" /> {{ savingDraft ? 'Salvando...' : 'Salvar rascunho' }}
        </button>
        <button class="primary-btn" :disabled="saving || loading" @click="saveConfig">
          <Icon :name="saving ? 'ph:spinner-gap-bold' : 'ph:floppy-disk-bold'" />
          {{ saving ? 'Publicando...' : 'Publicar alterações' }}
        </button>
      </header>

      <div v-if="loading" class="state-card">Carregando configuração...</div>

      <template v-else>
        <nav class="tabs" aria-label="Seções da configuração visual">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            type="button"
            class="tab"
            :class="{ ativa: abaAtiva === tab.id }"
            :aria-current="abaAtiva === tab.id ? 'page' : undefined"
            @click="selecionarAba(tab.id)"
          >
            <Icon :name="tab.icon" /> {{ tab.label }}
          </button>
        </nav>

        <section v-show="abaAtiva === 'marca'" class="panel">
          <h2>Marca e metadados</h2>
          <div class="form-grid">
            <label v-for="field in brandFields" :key="field.key" class="field" :class="{ wide: field.wide }">
              <span>{{ field.label }}</span>
              <textarea v-if="field.multiline" v-model="draft.brand[field.key]" rows="3" />
              <input v-else v-model="draft.brand[field.key]" />
            </label>
          </div>
        </section>

        <section v-show="abaAtiva === 'cores'" class="panel">
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

        <section v-show="abaAtiva === 'textos'" class="panel">
          <h2>Textos</h2>
          <div class="form-grid">
            <label v-for="field in contentFields" :key="field.key" class="field">
              <span>{{ field.label }}</span><input v-model="draft.content[field.key]" />
            </label>
          </div>
        </section>

        <section v-show="abaAtiva === 'links'" class="panel">
          <h2>Links</h2>
          <div class="form-grid">
            <label v-for="field in linkFields" :key="field.key" class="field">
              <span>{{ field.label }}</span><input v-model="draft.links[field.key]" type="url" placeholder="https://..." />
            </label>
          </div>
        </section>

        <section v-show="abaAtiva === 'midia'" class="panel">
          <div class="panel-head">
            <div>
              <h2>Mídia</h2>
              <p class="hint">PNG, JPEG, WEBP, GIF ou ICO, com até 5 MB.</p>
            </div>
            <button type="button" class="ghost-btn" :disabled="cleaning" @click="cleanupMedia">
              <Icon :name="cleaning ? 'ph:spinner-gap-bold' : 'ph:broom-bold'" />
              {{ cleaning ? 'Limpando...' : 'Limpar mídias não usadas' }}
            </button>
          </div>

          <div class="media-grid">
            <AdminMediaField v-model="draft.brand.logo" label="Logo" hint="Logo principal do cabeçalho." />
            <AdminMediaField v-model="draft.brand.favicon" label="Favicon" hint="Ícone exibido na aba do navegador." />
            <AdminMediaField v-model="draft.images.blocked" label="Imagem de bloqueio" />
            <AdminMediaField v-model="draft.images.premium" label="Imagem premium" />
            <AdminMediaField v-model="draft.images.live" label="Imagem da live" />
          </div>

          <div class="banners-head">
            <h3>Banners</h3>
            <button type="button" class="ghost-btn" @click="draft.images.banners.push('')">
              <Icon name="ph:plus-bold" /> Adicionar banner
            </button>
          </div>
          <div v-if="!draft.images.banners.length" class="empty-banners">Nenhum banner configurado.</div>
          <div v-else class="media-grid">
            <div v-for="(_, index) in draft.images.banners" :key="index" class="banner-item">
              <AdminMediaField v-model="draft.images.banners[index]" :label="`Banner ${index + 1}`" />
              <button type="button" class="icon-btn" title="Remover banner" @click="draft.images.banners.splice(index, 1)">
                <Icon name="ph:trash-bold" />
              </button>
            </div>
          </div>
        </section>

        <section v-show="abaAtiva === 'recursos'" class="panel">
          <h2>Recursos visíveis</h2>
          <div class="toggle-grid">
            <label v-for="field in featureFields" :key="field.key" class="toggle">
              <input v-model="draft.features[field.key]" type="checkbox" /><span>{{ field.label }}</span>
            </label>
          </div>
        </section>

        <section v-show="abaAtiva === 'operacao'" class="panel">
          <h2>Notificações e trava de saldo</h2>
          <div class="toggle-grid">
            <label class="toggle"><input v-model="draft.notificationPrompt.enabled" type="checkbox" /><span>Exibir convite de notificações</span></label>
            <label class="toggle"><input v-model="draft.signalBalanceGate.enabled" type="checkbox" /><span>Ativar trava global de saldo</span></label>
          </div>
          <div class="form-grid">
            <label class="field"><span>Título das notificações</span><input v-model="draft.notificationPrompt.title" /></label>
            <label class="field"><span>Mensagem das notificações</span><input v-model="draft.notificationPrompt.message" /></label>
            <label class="field"><span>Botão ativar</span><input v-model="draft.notificationPrompt.activateLabel" /></label>
            <label class="field"><span>Botão adiar</span><input v-model="draft.notificationPrompt.laterLabel" /></label>
            <label class="field"><span>Nova tentativa (dias)</span><input v-model.number="draft.notificationPrompt.retryDays" type="number" min="1" /></label>
            <label class="field"><span>Saldo mínimo (R$)</span><input v-model.number="draft.signalBalanceGate.minimumBalance" type="number" min="0" step="0.01" /></label>
            <label class="field"><span>Título do bloqueio</span><input v-model="draft.signalBalanceGate.title" /></label>
            <label class="field"><span>Mensagem do bloqueio</span><input v-model="draft.signalBalanceGate.message" /></label>
            <label class="field"><span>Texto do CTA</span><input v-model="draft.signalBalanceGate.ctaLabel" /></label>
            <label class="field"><span>Destino do CTA (vazio abre depósito)</span><input v-model="draft.signalBalanceGate.ctaUrl" type="url" /></label>
          </div>

          <div class="panel-head"><h2>Jogos</h2><button type="button" class="ghost-btn" @click="addGame"><Icon name="ph:plus-bold" /> Adicionar</button></div>
          <div class="managed-list">
            <div v-for="(game, index) in draft.games" :key="game.gameId || index" class="managed-card">
              <div class="form-grid">
                <label class="field"><span>ID</span><input v-model="game.gameId" /></label>
                <label class="field"><span>Título</span><input v-model="game.title" /></label>
                <label class="field"><span>Descrição</span><input v-model="game.description" /></label>
                <label class="field"><span>Rota</span><input v-model="game.route" /></label>
                <label class="field"><span>Aba</span><select v-model="game.tabKey"><option value="prime">Prime</option><option value="premium">Premium</option><option value="claude">Sem Gale</option></select></label>
                <label class="field"><span>Estado</span><select v-model="game.status"><option value="enabled">Liberado</option><option value="blocked">Bloqueado</option><option value="hidden">Oculto</option><option value="maintenance">Em manutenção</option></select></label>
                <label class="field"><span>Ordem</span><input v-model.number="game.order" type="number" min="0" /></label>
                <label class="toggle"><input v-model="game.requiresLogin" type="checkbox" /><span>Exige login</span></label>
                <label class="toggle"><input v-model="game.signalBalanceGate.enabled" type="checkbox" /><span>Trava de saldo neste jogo</span></label>
                <label class="field"><span>Saldo mínimo do jogo</span><input v-model.number="game.signalBalanceGate.minimumBalance" type="number" min="0" step="0.01" /></label>
              </div>
              <AdminMediaField v-model="game.imageUrl" label="Imagem do card" />
              <button type="button" class="icon-btn" title="Remover" @click="draft.games.splice(index, 1)"><Icon name="ph:trash-bold" /></button>
            </div>
          </div>

          <div class="panel-head"><h2>Banners de Ranking</h2><button type="button" class="ghost-btn" @click="addRankingBanner"><Icon name="ph:plus-bold" /> Adicionar</button></div>
          <div class="managed-list">
            <div v-for="banner in rankingBanners" :key="banner.id" class="managed-card">
              <div class="form-grid">
                <label class="field"><span>Texto alternativo</span><input v-model="banner.altText" /></label>
                <label class="field"><span>Link</span><input v-model="banner.targetUrl" type="url" /></label>
                <label class="field"><span>Início</span><input v-model="banner.startsAt" type="datetime-local" /></label>
                <label class="field"><span>Fim</span><input v-model="banner.endsAt" type="datetime-local" /></label>
                <label class="field"><span>Ordem</span><input v-model.number="banner.order" type="number" min="0" /></label>
                <label class="toggle"><input v-model="banner.enabled" type="checkbox" /><span>Ativo</span></label>
                <label class="toggle"><input v-model="banner.openInNewTab" type="checkbox" /><span>Abrir em nova aba</span></label>
              </div>
              <div class="media-grid"><AdminMediaField v-model="banner.desktopImageUrl" label="Desktop" /><AdminMediaField v-model="banner.mobileImageUrl" label="Mobile" /></div>
              <a v-if="safePreviewUrl(banner.targetUrl)" :href="safePreviewUrl(banner.targetUrl)!" target="_blank" rel="noopener noreferrer" class="ghost-btn">Testar link</a>
              <button type="button" class="icon-btn" title="Remover" @click="removeBanner(banner.id)"><Icon name="ph:trash-bold" /></button>
            </div>
          </div>
        </section>

        <section v-show="abaAtiva === 'menu'" class="panel">
          <div class="panel-head">
            <h2>Menu</h2>
            <button type="button" class="ghost-btn" @click="addMenuItem"><Icon name="ph:plus-bold" /> Adicionar</button>
          </div>
          <div class="menu-list">
            <div v-for="(item, index) in draft.menu" :key="index" class="menu-row">
              <input v-model="item.key" placeholder="chave" />
              <input v-model="item.label" placeholder="Nome" />
              <input v-model="item.icon" placeholder="ph:house-bold" />
              <input v-model.number="item.order" type="number" min="0" placeholder="Ordem" />
              <button type="button" class="icon-btn" title="Remover" @click="draft.menu.splice(index, 1)"><Icon name="ph:trash-bold" /></button>
            </div>
          </div>
        </section>

        <section v-show="abaAtiva === 'manutencao'" class="panel maintenance-panel">
          <h2>Modo de manutenção</h2>
          <label class="toggle danger"><input v-model="draft.maintenance.active" type="checkbox" /><span>Bloquear o app para visitantes</span></label>
          <div class="form-grid">
            <label class="field"><span>Título</span><input v-model="draft.maintenance.title" /></label>
            <label class="field"><span>Mensagem</span><input v-model="draft.maintenance.message" /></label>
          </div>
          <div v-if="versions.length" class="managed-list">
            <h3>Versões publicadas</h3>
            <div v-for="version in versions" :key="version._id" class="managed-card">
              <span>{{ new Date(version.publishedAt).toLocaleString('pt-BR') }} · {{ version.publishedBy }}</span>
              <button type="button" class="ghost-btn" @click="rollback(version._id)">Restaurar</button>
            </div>
          </div>
        </section>

        <div class="bottom-actions">
          <button class="primary-btn" :disabled="saving" @click="saveConfig">
            <Icon name="ph:floppy-disk-bold" /> {{ saving ? 'Publicando...' : 'Publicar alterações' }}
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
type TabId = 'marca' | 'cores' | 'textos' | 'links' | 'midia' | 'recursos' | 'operacao' | 'menu' | 'manutencao'

const tabs: Array<{ id: TabId; label: string; icon: string }> = [
  { id: 'marca', label: 'Marca', icon: 'ph:identification-card-bold' },
  { id: 'cores', label: 'Cores', icon: 'ph:palette-bold' },
  { id: 'textos', label: 'Textos', icon: 'ph:text-t-bold' },
  { id: 'links', label: 'Links', icon: 'ph:link-bold' },
  { id: 'midia', label: 'Mídia', icon: 'ph:image-square-bold' },
  { id: 'recursos', label: 'Recursos', icon: 'ph:toggles-bold' },
  { id: 'operacao', label: 'Operação', icon: 'ph:sliders-horizontal-bold' },
  { id: 'menu', label: 'Menu', icon: 'ph:list-bold' },
  { id: 'manutencao', label: 'Manutenção', icon: 'ph:wrench-bold' }
]

const route = useRoute()
const router = useRouter()
const { adminFetch, needsLogin } = useAdmin()
const { loadAppConfig, applyTheme } = useVisualConfig()
const draft = reactive<AppConfig>(cloneDefaultAppConfig())
const loading = ref(true)
const saving = ref(false)
const savingDraft = ref(false)
const cleaning = ref(false)
const toast = ref('')
const toastType = ref<'ok' | 'error'>('ok')
const versions = ref<Array<{ _id: string; publishedAt: string; publishedBy: string }>>([])

const validTab = (value: unknown): value is TabId => tabs.some(tab => tab.id === value)
const abaAtiva = computed<TabId>(() => validTab(route.query.tab) ? route.query.tab : 'marca')

const selecionarAba = (tab: TabId) => {
  router.replace({ query: { ...route.query, tab } })
}

const brandFields: Array<{ key: BrandKey; label: string; multiline?: boolean; wide?: boolean }> = [
  { key: 'name', label: 'Nome do app' },
  { key: 'keywords', label: 'Palavras-chave' },
  { key: 'description', label: 'Descrição', multiline: true, wide: true }
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
  { key: 'links', label: 'Links úteis' }, { key: 'highlights', label: 'Destaques' },
  { key: 'management', label: 'Gestão' }, { key: 'live', label: 'Live' }
]

let toastTimer: number | undefined
const notify = (message: string, type: 'ok' | 'error' = 'ok') => {
  window.clearTimeout(toastTimer)
  toast.value = message
  toastType.value = type
  toastTimer = window.setTimeout(() => { toast.value = '' }, 3500)
}

const applyDraft = (config: AppConfig) => Object.assign(draft, JSON.parse(JSON.stringify(config)))

const loadConfig = async () => {
  loading.value = true
  try {
    const result = await $fetch<{ success: boolean; data: AppConfig }>('/api/app-config')
    applyDraft(result.data)
    const [savedDraft, savedVersions] = await Promise.all([
      adminFetch<{ data: AppConfig | null }>('/api/admin/settings/draft'),
      adminFetch<{ versions: typeof versions.value }>('/api/admin/settings/versions')
    ])
    if (savedDraft.data) applyDraft(savedDraft.data)
    versions.value = savedVersions.versions
  } catch {
    notify('Não foi possível carregar a configuração.', 'error')
  } finally {
    loading.value = false
  }
}

const saveConfig = async () => {
  saving.value = true
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

const saveDraft = async () => {
  savingDraft.value = true
  try {
    const result = await adminFetch<{ success: boolean; data: AppConfig }>('/api/admin/settings/draft', { method: 'POST', body: JSON.parse(JSON.stringify(draft)) })
    applyDraft(result.data)
    notify('Rascunho salvo. O app público não foi alterado.')
  } catch (error: any) {
    notify(error?.data?.message || 'Erro ao salvar rascunho.', 'error')
  } finally { savingDraft.value = false }
}

const rollback = async (versionId: string) => {
  if (!window.confirm('Restaurar esta versão publicada?')) return
  try {
    const result = await adminFetch<{ success: boolean; data: AppConfig }>('/api/admin/settings/rollback', { method: 'POST', body: { versionId } })
    applyDraft(result.data)
    await loadAppConfig(true)
    notify('Versão restaurada e publicada.')
  } catch (error: any) { notify(error?.data?.message || 'Erro ao restaurar versão.', 'error') }
}

const cleanupMedia = async () => {
  cleaning.value = true
  try {
    const result = await adminFetch<{ removidos: number; espacoLiberado: number }>('/api/media/cleanup', { method: 'POST' })
    const size = result.espacoLiberado < 1024 * 1024
      ? `${Math.round(result.espacoLiberado / 1024)} KB`
      : `${(result.espacoLiberado / 1024 / 1024).toFixed(1)} MB`
    notify(`${result.removidos} mídia(s) removida(s); ${size} liberados.`)
  } catch (error: any) {
    notify(error?.data?.message || 'Erro ao limpar mídias.', 'error')
  } finally {
    cleaning.value = false
  }
}

const addMenuItem = () => draft.menu.push({ key: '', label: '', icon: '', order: draft.menu.length + 1 })
const addGame = () => draft.games.push({ gameId: '', title: '', description: null, imageUrl: null, route: '', tabKey: 'prime', order: draft.games.length + 1, status: 'enabled', requiresLogin: true, signalBalanceGate: {} })
const rankingBanners = computed(() => draft.banners.filter(banner => banner.placement === 'ranking'))
const addRankingBanner = () => draft.banners.push({ id: `ranking-${Date.now()}`, placement: 'ranking', desktopImageUrl: '', mobileImageUrl: null, altText: '', targetUrl: null, openInNewTab: false, enabled: false, order: rankingBanners.value.length + 1, startsAt: null, endsAt: null })
const removeBanner = (id: string) => { const index = draft.banners.findIndex(banner => banner.id === id); if (index >= 0) draft.banners.splice(index, 1) }
const safePreviewUrl = (value: string | null) => {
  if (!value) return null
  try { const parsed = new URL(value, window.location.origin); return ['http:', 'https:'].includes(parsed.protocol) ? parsed.href : null } catch { return null }
}

watch(needsLogin, value => { if (!value) loadConfig() })
onMounted(() => { if (!needsLogin.value) loadConfig() })
onBeforeUnmount(() => window.clearTimeout(toastTimer))
useHead({ title: 'Visual do app - Painel Admin' })
</script>

<style scoped>
.visual-page { min-height: 100vh; background: #08090d; color: #f5f6fa; padding: 28px 20px 64px; font-family: Manrope, sans-serif; }
.visual-wrap { width: min(1120px, 100%); margin: 0 auto; }
.visual-topbar { display: flex; align-items: end; justify-content: space-between; gap: 24px; margin-bottom: 28px; }
.visual-topbar h1 { display: flex; align-items: center; gap: 10px; margin: 12px 0 6px; font-size: 30px; }
.visual-topbar p, .hint { margin: 0; color: #9095a5; }
.back-link { display: inline-flex; align-items: center; gap: 6px; color: #a78bfa; text-decoration: none; }
.tabs { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 18px; }
.tab { display: inline-flex; align-items: center; gap: 7px; padding: 10px 15px; border: 1px solid #252936; border-radius: 10px; background: #11131a; color: #9095a5; cursor: pointer; font: inherit; font-size: 13px; font-weight: 700; transition: border-color .15s, color .15s, background .15s; }
.tab:hover { color: #dcdff0; border-color: #343847; }
.tab.ativa { border-color: #8b7cf6; background: #171531; color: #fff; }
.panel, .state-card { margin-bottom: 18px; padding: 24px; border: 1px solid #252936; border-radius: 16px; background: #11131a; }
.panel h2 { margin: 0 0 20px; font-size: 18px; }
.panel-head { display: flex; justify-content: space-between; align-items: center; gap: 16px; }
.panel-head > div h2 { margin-bottom: 5px; }
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
.media-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px; margin-top: 22px; }
.banners-head { display: flex; align-items: center; justify-content: space-between; margin: 26px 0 14px; }
.banners-head h3 { margin: 0; font-size: 15px; }
.banner-item { position: relative; }
.banner-item > .icon-btn { position: absolute; top: 26px; right: 8px; width: 30px; height: 30px; }
.empty-banners { padding: 22px; border: 1px dashed #303544; border-radius: 10px; color: #6f7488; text-align: center; }
.managed-list { display: grid; gap: 16px; }
.managed-card { position: relative; padding: 18px; border: 1px solid #303544; border-radius: 12px; background: #10131d; }
.managed-card > .icon-btn { position: absolute; top: 10px; right: 10px; }
.managed-card select { min-height: 42px; border: 1px solid #303544; border-radius: 8px; background: #0c0f18; color: #fff; padding: 0 10px; }
.toggle-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.toggle { display: flex; align-items: center; gap: 10px; padding: 12px; border: 1px solid #2d3140; border-radius: 10px; background: #0c0e14; }
.toggle input { width: 18px; height: 18px; accent-color: #8b7cf6; }
.toggle.danger { width: max-content; margin-bottom: 18px; border-color: #69313b; }
.menu-list { display: grid; gap: 10px; }
.menu-row { display: grid; grid-template-columns: 1fr 1.5fr 1.5fr 90px 42px; gap: 8px; }
.primary-btn, .ghost-btn, .icon-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; border-radius: 9px; cursor: pointer; font-weight: 800; }
.primary-btn { padding: 12px 18px; border: 0; color: #fff; background: linear-gradient(135deg, #8b7cf6, #6657d8); }
.primary-btn:disabled, .ghost-btn:disabled { opacity: .55; cursor: wait; }
.ghost-btn { padding: 9px 13px; border: 1px solid #343847; color: #eee; background: #191c25; }
.icon-btn { border: 0; color: #d9b76e; background: #242033; }
.bottom-actions { display: flex; justify-content: flex-end; margin-top: 24px; }
.toast { position: fixed; right: 24px; bottom: 24px; z-index: 20; padding: 14px 18px; border-radius: 10px; color: #fff; background: #16794d; box-shadow: 0 14px 40px #0008; }
.toast.error { background: #a82e42; }
@media (max-width: 980px) { .media-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 780px) {
  .visual-topbar, .panel-head { align-items: stretch; flex-direction: column; }
  .form-grid, .color-grid, .media-grid { grid-template-columns: 1fr; }
  .toggle-grid { grid-template-columns: repeat(2, 1fr); }
  .menu-row { grid-template-columns: 1fr 1fr; padding-bottom: 14px; border-bottom: 1px solid #252936; }
  .icon-btn { min-height: 42px; }
}
@media (max-width: 520px) { .toggle-grid { grid-template-columns: 1fr; } .tab { flex: 1 1 42%; } }
</style>
