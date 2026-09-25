<template>
  <main class="tournament-page">
    <div class="page-glow" aria-hidden="true"></div>

    <header class="tournament-hero">
      <p class="eyebrow">
        <span class="dot" aria-hidden="true"></span>
        {{ tournament.status === "active" ? "Torneio ativo" : "Campanha em destaque" }}
      </p>
      <h1>{{ tournament.title }}</h1>
      <p v-if="tournament.description" class="hero-copy">{{ tournament.description }}</p>

      <!-- Prazo: quanto falta e quanto da campanha já passou. -->
      <div class="hero-deadline">
        <div class="deadline-row">
          <span><Icon name="ph:clock-countdown-bold" aria-hidden="true" /> {{ remaining }}</span>
          <span class="deadline-date">até {{ formatDate(tournament.endsAt) }}</span>
        </div>
        <div
          class="deadline-track"
          role="progressbar"
          :aria-valuenow="elapsedPercent"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-label="Progresso do torneio"
        >
          <span :style="{ width: `${elapsedPercent}%` }"></span>
        </div>
      </div>
    </header>

    <!-- Pódio: os três primeiros em destaque, com o 1º no meio e mais alto. -->
    <section v-if="podium.length" class="podium" aria-label="Pódio">
      <article
        v-for="entry in podium"
        :key="entry.position"
        class="podium-card"
        :class="`place-${entry.position}`"
      >
        <Icon :name="entry.position === 1 ? 'ph:crown-fill' : 'ph:medal-fill'" class="podium-icon" aria-hidden="true" />
        <strong class="podium-name">{{ entry.name }}</strong>
        <span class="podium-points">{{ entry.points.toLocaleString("pt-BR") }} pts</span>
        <span v-if="prizeFor(entry.position)" class="podium-prize">{{ prizeFor(entry.position) }}</span>
        <span class="podium-place">{{ entry.position }}º</span>
      </article>
    </section>

    <div class="tournament-columns">
      <section v-if="tournament.prizes.length" class="info-card">
        <h2><Icon name="ph:trophy-bold" aria-hidden="true" /> Premiações</h2>
        <ul class="prize-list">
          <li v-for="prize in tournament.prizes" :key="prize.place" :class="`prize-${prize.place}`">
            <span class="prize-place">{{ prize.place }}º</span>
            <span class="prize-value">{{ prize.value }}</span>
          </li>
        </ul>
      </section>

      <section v-if="tournament.rules.length" class="info-card">
        <h2><Icon name="ph:list-checks-bold" aria-hidden="true" /> Regras</h2>
        <ul class="rule-list">
          <li v-for="(rule, index) in tournament.rules" :key="index">{{ rule }}</li>
        </ul>
      </section>
    </div>

    <section class="ranking-card">
      <header>
        <div>
          <p class="eyebrow">Classificação</p>
          <h2>Ranking geral</h2>
        </div>
        <small v-if="mock">Dados de exemplo</small>
      </header>

      <ol v-if="rest.length" class="ranking-list">
        <li v-for="entry in rest" :key="entry.position">
          <span class="ranking-position">{{ entry.position }}º</span>
          <span class="ranking-name">{{ entry.name }}</span>
          <span class="ranking-bar" aria-hidden="true">
            <span :style="{ width: `${barWidth(entry.points)}%` }"></span>
          </span>
          <strong class="ranking-points">{{ entry.points.toLocaleString("pt-BR") }} pts</strong>
        </li>
      </ol>
      <p v-else class="ranking-empty">
        {{
          podium.length
            ? "Do 4º lugar em diante ainda não há participantes."
            : "A classificação aparece assim que os primeiros pontos forem contabilizados."
        }}
      </p>
    </section>
  </main>
</template>

<script setup lang="ts">
import type { Tournament } from "../../shared/tournament";
import { MOCK_TOURNAMENT } from "../../shared/tournament";

definePageMeta({ layout: "default", alias: ["/torneios"] });

const { config: appConfig } = useVisualConfig();

const { data } = await useFetch<{ tournament: Tournament; mock: boolean }>("/api/tournaments");

const tournament = computed(() => data.value?.tournament || MOCK_TOURNAMENT);
const mock = computed(() => data.value?.mock !== false);

// O ranking chega ordenado por pontos; a posição é o índice.
const ranked = computed(() =>
    tournament.value.ranking.map((entry, index) => ({ ...entry, position: index + 1 })),
);

// Ordem visual do pódio: 2º, 1º, 3º — o campeão no meio.
const podium = computed(() => {
    const [primeiro, segundo, terceiro] = ranked.value;
    return [segundo, primeiro, terceiro].filter(Boolean);
});
const rest = computed(() => ranked.value.slice(3));

const topPoints = computed(() => ranked.value[0]?.points || 1);
const barWidth = (points: number) => Math.max(4, Math.round((points / topPoints.value) * 100));

const prizeFor = (place: number) =>
    tournament.value.prizes.find((prize) => prize.place === place)?.value || "";

const remaining = computed(() => {
    const faltam = new Date(tournament.value.endsAt).getTime() - Date.now();
    if (faltam <= 0) return "Torneio encerrado";
    const dias = Math.floor(faltam / 86_400_000);
    if (dias >= 1) return `Faltam ${dias} dia${dias > 1 ? "s" : ""}`;
    const horas = Math.max(1, Math.floor(faltam / 3_600_000));
    return `Falta${horas > 1 ? "m" : ""} ${horas} hora${horas > 1 ? "s" : ""}`;
});

// Quanto do período já correu, para a barra do cabeçalho.
const elapsedPercent = computed(() => {
    const inicio = new Date(tournament.value.startsAt).getTime();
    const fim = new Date(tournament.value.endsAt).getTime();
    if (!(fim > inicio)) return 0;
    return Math.min(100, Math.max(0, Math.round(((Date.now() - inicio) / (fim - inicio)) * 100)));
});

const formatDate = (value: string) =>
    new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));

useHead({ title: () => `Torneio - ${appConfig.value.brand.name}` });
</script>

<style scoped>
.tournament-page {
    position: relative;
    /* O brilho decorativo é mais largo que a tela: recorta sem virar rolagem. */
    overflow-x: clip;
    width: min(1000px, 100%);
    margin: 0 auto;
    padding: clamp(24px, 5vw, 48px) 16px 96px;
    color: var(--text-main);
}

.page-glow {
    position: absolute;
    top: -90px;
    left: 50%;
    z-index: -1;
    width: min(760px, 130%);
    aspect-ratio: 1;
    transform: translateX(-50%);
    border-radius: 50%;
    background: radial-gradient(
        circle,
        color-mix(in srgb, var(--accent) 20%, transparent) 0%,
        transparent 62%
    );
    filter: blur(28px);
    pointer-events: none;
}

.eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: var(--accent-soft);
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 0.14em;
    text-transform: uppercase;
}
.dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #4ade80;
    box-shadow: 0 0 0 5px #4ade8022;
}

/* Cabeçalho */
.tournament-hero {
    padding: clamp(24px, 5vw, 46px);
    border: 1px solid color-mix(in srgb, var(--accent) 20%, var(--card-border));
    border-radius: 26px;
    background:
        radial-gradient(circle at 15% 0%, color-mix(in srgb, var(--accent) 20%, transparent), transparent 55%),
        linear-gradient(140deg, var(--card-bg), var(--bg-darker));
    box-shadow: 0 26px 70px rgb(0 0 0 / 40%);
}
.tournament-hero h1 {
    max-width: 700px;
    margin: 12px 0;
    font-size: clamp(30px, 6vw, 54px);
    line-height: 1.05;
}
.hero-copy {
    max-width: 640px;
    color: var(--text-muted);
    font-size: 16px;
    line-height: 1.65;
}

.hero-deadline {
    max-width: 440px;
    margin-top: 24px;
}
.deadline-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 8px;
    font-size: 13px;
    font-weight: 800;
}
.deadline-row > span:first-child {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    color: var(--accent-soft);
}
.deadline-date {
    color: var(--text-muted);
    font-weight: 600;
}
.deadline-track {
    height: 7px;
    overflow: hidden;
    border-radius: 999px;
    background: color-mix(in srgb, var(--bg-darker) 70%, transparent);
}
.deadline-track span {
    display: block;
    height: 100%;
    border-radius: 999px;
    background: linear-gradient(90deg, var(--accent), var(--accent-soft));
}

/* Pódio */
.podium {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    align-items: end;
    margin: 22px 0 16px;
}
.podium-card {
    position: relative;
    display: grid;
    justify-items: center;
    gap: 5px;
    padding: 24px 12px 30px;
    border: 1px solid var(--card-border);
    border-radius: 20px 20px 10px 10px;
    background: linear-gradient(180deg, var(--card-bg), var(--bg-darker));
    text-align: center;
}
/* O campeão fica mais alto que os vizinhos, como num pódio de verdade. */
.podium-card.place-1 {
    padding-top: 34px;
    border-color: color-mix(in srgb, var(--color-gold) 55%, transparent);
    background: linear-gradient(180deg, color-mix(in srgb, var(--color-gold) 14%, var(--card-bg)), var(--bg-darker));
    box-shadow: 0 0 40px color-mix(in srgb, var(--color-gold) 18%, transparent);
}
.podium-card.place-2 {
    border-color: #c7ccd855;
}
.podium-card.place-3 {
    border-color: #c8823c55;
}
.podium-icon {
    font-size: 30px;
}
.place-1 .podium-icon {
    font-size: 38px;
    color: var(--color-gold);
}
.place-2 .podium-icon {
    color: #c7ccd8;
}
.place-3 .podium-icon {
    color: #c8823c;
}
.podium-name {
    font-size: 14px;
}
.podium-points {
    color: var(--accent);
    font-size: 16px;
    font-weight: 900;
}
.place-1 .podium-points {
    color: var(--color-gold);
    font-size: 19px;
}
.podium-prize {
    color: var(--text-muted);
    font-size: 11px;
    line-height: 1.35;
}
.podium-place {
    position: absolute;
    bottom: -13px;
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    border: 1px solid var(--card-border);
    border-radius: 50%;
    background: var(--component-bg);
    font-size: 12px;
    font-weight: 900;
}
.place-1 .podium-place {
    border-color: var(--color-gold);
    color: var(--color-gold);
}

/* Cartões de informação */
.tournament-columns {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin: 26px 0 16px;
}
.info-card,
.ranking-card {
    padding: clamp(18px, 4vw, 26px);
    border: 1px solid var(--card-border);
    border-radius: var(--radius-lg);
    background: color-mix(in srgb, var(--component-bg) 82%, transparent);
    backdrop-filter: blur(8px);
}
.info-card h2,
.ranking-card h2 {
    display: flex;
    align-items: center;
    gap: 9px;
    margin-bottom: 16px;
    font-size: 16px;
}
.info-card h2 :deep(svg) {
    color: var(--accent);
}

.prize-list,
.rule-list,
.ranking-list {
    display: grid;
    gap: 10px;
    margin: 0;
    padding: 0;
    list-style: none;
}
.prize-list li {
    display: grid;
    grid-template-columns: 44px 1fr;
    align-items: center;
    padding: 11px 12px;
    border-radius: var(--radius-sm);
    background: var(--card-bg);
    font-size: 14px;
}
.prize-place {
    color: var(--text-muted);
    font-weight: 900;
}
.prize-1 {
    border: 1px solid color-mix(in srgb, var(--color-gold) 40%, transparent);
}
.prize-1 .prize-place {
    color: var(--color-gold);
}
.prize-2 .prize-place {
    color: #c7ccd8;
}
.prize-3 .prize-place {
    color: #c8823c;
}

.rule-list li {
    padding-left: 14px;
    border-left: 2px solid var(--accent);
    color: var(--text-muted);
    font-size: 14px;
    line-height: 1.5;
}

/* Classificação */
.ranking-card header {
    display: flex;
    align-items: end;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 16px;
}
.ranking-card header h2 {
    margin: 4px 0 0;
}
.ranking-card small {
    color: var(--text-muted);
    font-size: 12px;
}

.ranking-list li {
    display: grid;
    grid-template-columns: 44px minmax(90px, 1fr) minmax(60px, 1.4fr) auto;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    border-radius: var(--radius-sm);
    background: var(--card-bg);
}
.ranking-position {
    color: var(--text-muted);
    font-size: 13px;
    font-weight: 900;
}
/* Barra proporcional ao líder: dá a escala da diferença de pontos. */
.ranking-bar {
    height: 6px;
    overflow: hidden;
    border-radius: 999px;
    background: color-mix(in srgb, var(--bg-darker) 70%, transparent);
}
.ranking-bar span {
    display: block;
    height: 100%;
    border-radius: 999px;
    background: color-mix(in srgb, var(--accent) 70%, transparent);
}
.ranking-points {
    color: var(--accent);
    font-size: 14px;
    white-space: nowrap;
}
.ranking-empty {
    color: var(--text-muted);
    font-size: 14px;
}

@media (max-width: 720px) {
    .tournament-columns {
        grid-template-columns: 1fr;
    }
    .podium {
        gap: 8px;
    }
    .podium-card {
        padding: 18px 8px 26px;
    }
    .podium-name {
        font-size: 12px;
    }
    .podium-prize {
        display: none;
    }
    .ranking-list li {
        grid-template-columns: 38px 1fr auto;
    }
    .ranking-bar {
        display: none;
    }
}
</style>
