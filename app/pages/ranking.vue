<template>
  <main class="ranking-page">
    <header><span>COMUNIDADE</span><h1>Ranking</h1><p>Veja quem mais participa e movimenta a comunidade.</p></header>
    <section v-if="activeBanners.length" class="ranking-page-banners">
      <a v-for="banner in activeBanners" :key="banner.id" :href="banner.targetUrl || undefined" :target="banner.openInNewTab ? '_blank' : '_self'" :rel="banner.openInNewTab ? 'noopener noreferrer' : undefined">
        <picture><source v-if="banner.mobileImageUrl" media="(max-width: 640px)" :srcset="resolveAssetUrl(banner.mobileImageUrl)" /><img :src="resolveAssetUrl(banner.desktopImageUrl)" :alt="banner.altText" /></picture>
      </a>
    </section>
    <section class="ranking-card">
      <div class="ranking-controls">
        <div class="segmented"><button v-for="option in modes" :key="option.value" type="button" :class="{ active: mode === option.value }" @click="mode = option.value">{{ option.label }}</button></div>
        <select v-model="period" aria-label="Período do ranking"><option value="7d">7 dias</option><option value="30d">30 dias</option><option value="all">Todo o período</option></select>
      </div>
      <RankingList :items="rows" :loading="loading" :error="error" :mode="mode" :current-position="currentPosition" :current-name="user?.name" @retry="loadRanking" />
    </section>
  </main>
</template>

<script setup lang="ts">
const { config, resolveAssetUrl } = useVisualConfig()
const { user } = useAuth()
const mode = ref<'activity' | 'deposits'>('activity')
const period = ref<'7d' | '30d' | 'all'>('7d')
const rows = ref<Array<{ position: number; name: string; score: number }>>([])
const currentPosition = ref<number | null>(null)
const loading = ref(true)
const error = ref('')
const modes = [{ value: 'activity' as const, label: 'Atividade' }, { value: 'deposits' as const, label: 'Depósitos' }]
const activeBanners = computed(() => { const now = Date.now(); return config.value.banners.filter(b => b.placement === 'ranking' && b.enabled && (!b.startsAt || Date.parse(b.startsAt) <= now) && (!b.endsAt || Date.parse(b.endsAt) >= now)).sort((a, b) => a.order - b.order) })
const loadRanking = async () => {
  loading.value = true; error.value = ''
  try {
    const result = await $fetch<{ rows: typeof rows.value; currentPosition: number | null }>('/api/ranking', { params: { mode: mode.value, period: period.value, currentEmail: user.value?.email || '' } })
    rows.value = result.rows; currentPosition.value = result.currentPosition
  } catch { error.value = 'Não foi possível carregar o ranking.' } finally { loading.value = false }
}
watch([mode, period, () => user.value?.email], loadRanking)
onMounted(loadRanking)
useHead({ title: () => `Ranking - ${config.value.brand.name}` })
</script>

<style scoped>
.ranking-page { width: min(980px, 100%); margin: 0 auto; padding: 48px 28px 80px; color: var(--text-main); }
.ranking-page > header span { color: var(--color-primary); font-size: 11px; font-weight: 900; letter-spacing: .16em; }
.ranking-page h1 { margin: 8px 0; font-size: clamp(34px, 5vw, 54px); }
.ranking-page header p { color: var(--text-muted); }
.ranking-page-banners { display: grid; gap: 14px; margin-top: 28px; }
.ranking-page-banners a, .ranking-page-banners picture, .ranking-page-banners img { display: block; width: 100%; }
.ranking-page-banners img { height: auto; border-radius: 16px; }
.ranking-card { margin-top: 28px; padding: 22px; border: 1px solid var(--card-border); border-radius: 18px; background: var(--component-bg); }
.ranking-controls { display: flex; justify-content: space-between; gap: 14px; margin-bottom: 20px; }
.segmented { display: flex; padding: 4px; border-radius: 11px; background: var(--card-bg); }
.segmented button { min-height: 38px; padding: 0 16px; border: 0; border-radius: 8px; background: transparent; color: var(--text-muted); cursor: pointer; }
.segmented button.active { background: var(--color-primary); color: var(--bg-darker); font-weight: 800; }
.ranking-controls select { min-height: 46px; padding: 0 14px; border: 1px solid var(--card-border); border-radius: 10px; background: var(--card-bg); color: var(--text-main); }
button:focus-visible, select:focus-visible, a:focus-visible { outline: 3px solid var(--color-primary); outline-offset: 2px; }
@media (max-width: 560px) { .ranking-page { padding: 28px 16px 60px; } .ranking-card { padding: 14px; } .ranking-controls { align-items: stretch; flex-direction: column; } .segmented button { flex: 1; } }
</style>
