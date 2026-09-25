<template>
  <main class="tournament-page">
    <header class="tournament-hero">
      <p class="eyebrow">
        <span class="dot" aria-hidden="true"></span>
        {{ tournament.status === "active" ? "Torneio ativo" : "Campanha em destaque" }}
      </p>
      <h1>{{ tournament.title }}</h1>
      <p v-if="tournament.description" class="hero-copy">{{ tournament.description }}</p>
      <p class="hero-deadline">
        <Icon name="ph:calendar-check-bold" aria-hidden="true" />
        Encerra em {{ formatDate(tournament.endsAt) }}
      </p>
    </header>

    <div class="tournament-columns">
      <section v-if="tournament.prizes.length" class="info-card">
        <h2><Icon name="ph:trophy-bold" aria-hidden="true" /> Premiações</h2>
        <ul class="prize-list">
          <li v-for="prize in tournament.prizes" :key="prize.place">
            <span class="prize-place">{{ prize.place }}º</span>
            <span>{{ prize.value }}</span>
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

      <ol class="ranking-list">
        <li v-for="(entry, index) in tournament.ranking" :key="`${entry.name}-${index}`" :class="{ first: index === 0 }">
          <span class="ranking-position">{{ index + 1 }}º</span>
          <span class="ranking-name">{{ entry.name }}</span>
          <strong class="ranking-points">{{ entry.points.toLocaleString("pt-BR") }} pts</strong>
        </li>
      </ol>
      <p v-if="!tournament.ranking.length" class="ranking-empty">
        A classificação aparece assim que os primeiros pontos forem contabilizados.
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

const formatDate = (value: string) =>
    new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));

useHead({ title: () => `Torneio - ${appConfig.value.brand.name}` });
</script>

<style scoped>
.tournament-page {
    width: min(1000px, 100%);
    margin: 0 auto;
    padding: clamp(24px, 5vw, 48px) 16px 96px;
    color: var(--text-main);
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

.tournament-hero {
    padding: clamp(24px, 5vw, 48px);
    border: 1px solid var(--card-border);
    border-radius: 26px;
    background: linear-gradient(140deg, color-mix(in srgb, var(--accent) 13%, var(--card-bg)), var(--bg-darker));
    box-shadow: 0 25px 70px rgb(0 0 0 / 35%);
}
.tournament-hero h1 {
    max-width: 700px;
    margin: 12px 0;
    font-size: clamp(30px, 6vw, 56px);
    line-height: 1.05;
}
.hero-copy {
    max-width: 640px;
    color: var(--text-muted);
    font-size: 16px;
    line-height: 1.65;
}
.hero-deadline {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-top: 20px;
    color: var(--accent-soft);
    font-size: 14px;
    font-weight: 700;
}

.tournament-columns {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin: 18px 0;
}
.info-card,
.ranking-card {
    padding: clamp(18px, 4vw, 26px);
    border: 1px solid var(--card-border);
    border-radius: var(--radius-lg);
    background: var(--component-bg);
}
.info-card h2,
.ranking-card h2 {
    display: flex;
    align-items: center;
    gap: 9px;
    margin-bottom: 16px;
    font-size: 16px;
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
    grid-template-columns: 42px 1fr;
    align-items: center;
    color: var(--text-main);
    font-size: 14px;
}
.prize-place {
    color: var(--accent-soft);
    font-weight: 900;
}
.rule-list li {
    padding-left: 14px;
    border-left: 2px solid var(--accent);
    color: var(--text-muted);
    font-size: 14px;
    line-height: 1.5;
}

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
    grid-template-columns: 48px 1fr auto;
    align-items: center;
    gap: 12px;
    padding: 13px 14px;
    border-radius: var(--radius-sm);
    background: var(--card-bg);
}
.ranking-list li.first {
    border: 1px solid var(--color-gold);
    background: linear-gradient(120deg, color-mix(in srgb, var(--color-gold) 16%, var(--card-bg)), var(--card-bg));
}
.ranking-list li.first .ranking-position,
.ranking-list li.first .ranking-points {
    color: var(--color-gold);
}
.ranking-position {
    color: var(--text-muted);
    font-size: 13px;
    font-weight: 900;
}
.ranking-points {
    color: var(--accent);
    font-size: 14px;
}
.ranking-empty {
    color: var(--text-muted);
    font-size: 14px;
}

@media (max-width: 720px) {
    .tournament-columns {
        grid-template-columns: 1fr;
    }
    .ranking-list li {
        grid-template-columns: 38px 1fr;
    }
    .ranking-points {
        grid-column: 2;
    }
}
</style>
