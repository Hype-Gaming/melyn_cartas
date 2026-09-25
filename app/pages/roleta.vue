<template>
  <main class="roulette-page">
    <header class="roulette-header">
      <p class="eyebrow">Benefício diário</p>
      <h1>Roleta diária</h1>
      <p class="subtitle">Um giro por dia, sempre à meia-noite. Gire e descubra o prêmio da vez.</p>
    </header>

    <section class="roulette-card">
      <RouletteWheel :support-url="supportUrl" />
    </section>

    <section class="roulette-rules">
      <h2>Como funciona</h2>
      <ul>
        <li>Cada membro tem um giro por dia de calendário.</li>
        <li>O prêmio é sorteado no servidor, na hora do giro.</li>
        <li>Prêmios em giros grátis são resgatados com o suporte.</li>
      </ul>
    </section>
  </main>
</template>

<script setup lang="ts">
definePageMeta({ layout: "default" });

const { config: appConfig } = useVisualConfig();

const supportUrl = computed(
    () => appConfig.value.links.whatsappSupport || appConfig.value.links.whatsappCommunity || "",
);

useHead({ title: () => `Roleta diária - ${appConfig.value.brand.name}` });
</script>

<style scoped>
.roulette-page {
    width: min(760px, 100%);
    margin: 0 auto;
    padding: clamp(24px, 5vw, 48px) 16px 96px;
    color: var(--text-main);
}

.roulette-header {
    text-align: center;
}
.eyebrow {
    color: var(--accent-soft);
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 0.14em;
    text-transform: uppercase;
}
h1 {
    margin: 8px 0;
    font-size: clamp(30px, 6vw, 46px);
}
.subtitle {
    max-width: 460px;
    margin: 0 auto;
    color: var(--text-muted);
    line-height: 1.6;
}

.roulette-card {
    margin: 28px 0 20px;
    padding: clamp(20px, 4vw, 34px);
    border: 1px solid var(--card-border);
    border-radius: var(--radius-lg);
    background: linear-gradient(160deg, color-mix(in srgb, var(--accent) 12%, var(--card-bg)), var(--bg-darker));
    box-shadow: 0 20px 60px rgb(0 0 0 / 35%);
}

.roulette-rules {
    padding: clamp(18px, 4vw, 26px);
    border: 1px solid var(--card-border);
    border-radius: var(--radius-lg);
    background: var(--component-bg);
}
.roulette-rules h2 {
    margin-bottom: 14px;
    font-size: 15px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
}
.roulette-rules ul {
    display: grid;
    gap: 10px;
    margin: 0;
    padding: 0;
    list-style: none;
}
.roulette-rules li {
    padding-left: 14px;
    border-left: 2px solid var(--accent);
    color: var(--text-muted);
    font-size: 14px;
    line-height: 1.5;
}
</style>
