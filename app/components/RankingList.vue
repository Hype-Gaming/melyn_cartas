<template>
  <div class="ranking-list" aria-live="polite">
    <div v-if="loading" class="ranking-skeletons" aria-label="Carregando ranking"><span v-for="n in 6" :key="n" /></div>
    <div v-else-if="error" class="ranking-state"><Icon name="ph:warning-circle-bold" /><p>{{ error }}</p><button type="button" @click="$emit('retry')">Tentar novamente</button></div>
    <div v-else-if="!items.length" class="ranking-state"><Icon name="ph:trophy-bold" /><p>Ainda não há participantes neste período.</p></div>
    <ol v-else>
      <li v-for="item in items" :key="item.position" :class="{ podium: item.position <= 3, current: item.position === currentPosition }">
        <span class="position"><Icon v-if="item.position <= 3" name="ph:medal-fill" /><template v-else>{{ item.position }}</template></span>
        <span class="rank-name">{{ item.position === currentPosition && currentName ? currentName : item.name }}<small v-if="item.position === currentPosition">Você</small></span>
        <strong>{{ formatScore(item.score) }}</strong>
      </li>
    </ol>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ items: Array<{ position: number; name: string; score: number }>; loading: boolean; error: string; mode: 'activity' | 'deposits'; currentPosition: number | null; currentName?: string }>()
defineEmits<{ retry: [] }>()
const formatScore = (score: number) => props.mode === 'deposits'
  ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(score)
  : `${score.toLocaleString('pt-BR')} ${score === 1 ? 'acesso' : 'acessos'}`
</script>

<style scoped>
.ranking-list ol { display: grid; gap: 9px; list-style: none; }
.ranking-list li { display: grid; grid-template-columns: 48px 1fr auto; align-items: center; gap: 12px; min-height: 64px; padding: 10px 16px; border: 1px solid var(--card-border); border-radius: 13px; background: var(--card-bg); }
.ranking-list li.podium { border-color: var(--color-secondary); }
.ranking-list li.current { box-shadow: inset 3px 0 var(--color-primary); background: var(--component-bg); }
.position { display: grid; place-items: center; width: 38px; height: 38px; border-radius: 50%; background: var(--component-bg); color: var(--color-primary); font-weight: 900; }
.podium .position { color: var(--color-secondary); }
.rank-name { display: flex; align-items: center; gap: 8px; min-width: 0; font-weight: 750; }
.rank-name small { padding: 3px 7px; border-radius: 999px; background: var(--color-primary); color: var(--bg-darker); }
.ranking-skeletons { display: grid; gap: 9px; }
.ranking-skeletons span { height: 64px; border-radius: 13px; background: var(--card-bg); animation: pulse 1.2s ease-in-out infinite; }
.ranking-state { display: grid; place-items: center; gap: 12px; min-height: 250px; padding: 30px; text-align: center; border: 1px dashed var(--card-border); border-radius: 15px; color: var(--text-muted); }
.ranking-state :deep(svg) { font-size: 42px; color: var(--color-primary); }
.ranking-state button { min-height: 42px; padding: 0 18px; border: 0; border-radius: 9px; background: var(--color-primary); color: var(--bg-darker); font-weight: 800; cursor: pointer; }
button:focus-visible { outline: 3px solid var(--color-primary); outline-offset: 2px; }
@keyframes pulse { 50% { opacity: .45; } }
@media (prefers-reduced-motion: reduce) { .ranking-skeletons span { animation: none; } }
@media (max-width: 520px) { .ranking-list li { grid-template-columns: 42px 1fr; } .ranking-list li > strong { grid-column: 2; font-size: 13px; color: var(--text-muted); } }
</style>
