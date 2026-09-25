<template>
  <main class="roulette-page">
    <!-- Luz ambiente do topo, atrás de todo o conteúdo. -->
    <div class="page-glow" aria-hidden="true"></div>

    <header class="roulette-header">
      <span class="badge"><Icon name="ph:gift-bold" aria-hidden="true" /> Benefício diário</span>
      <h1>Roleta diária</h1>
      <p class="subtitle">Um giro por dia, renovado à meia-noite. Gire e descubra o prêmio da vez.</p>
    </header>

    <section class="roulette-card">
      <RouletteWheel :support-url="supportUrl" />
    </section>

    <section class="steps">
      <h2>Como funciona</h2>
      <ol>
        <li v-for="(step, index) in steps" :key="index">
          <span class="step-number">{{ index + 1 }}</span>
          <span class="step-text">{{ step }}</span>
        </li>
      </ol>
    </section>
  </main>
</template>

<script setup lang="ts">
definePageMeta({ layout: "default" });

const { config: appConfig } = useVisualConfig();

const steps = [
    "Cada membro tem um giro por dia de calendário.",
    "O prêmio é sorteado no servidor, na hora do giro.",
    "Prêmios em giros grátis são resgatados com o suporte.",
];

const supportUrl = computed(
    () => appConfig.value.links.whatsappSupport || appConfig.value.links.whatsappCommunity || "",
);

useHead({ title: () => `Roleta diária - ${appConfig.value.brand.name}` });
</script>

<style scoped>
.roulette-page {
    position: relative;
    /* O brilho decorativo é mais largo que a tela: recorta sem virar rolagem. */
    overflow-x: clip;
    width: min(760px, 100%);
    margin: 0 auto;
    padding: clamp(24px, 5vw, 48px) 16px 96px;
    color: var(--text-main);
}

.page-glow {
    position: absolute;
    top: -80px;
    left: 50%;
    z-index: -1;
    width: min(620px, 120%);
    aspect-ratio: 1;
    transform: translateX(-50%);
    border-radius: 50%;
    background: radial-gradient(
        circle,
        color-mix(in srgb, var(--accent) 22%, transparent) 0%,
        transparent 62%
    );
    filter: blur(26px);
    pointer-events: none;
}

.roulette-header {
    text-align: center;
}
.badge {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 7px 14px;
    border: 1px solid color-mix(in srgb, var(--accent) 35%, var(--card-border));
    border-radius: 999px;
    background: color-mix(in srgb, var(--accent) 14%, transparent);
    color: var(--accent-soft);
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 0.14em;
    text-transform: uppercase;
}
h1 {
    margin: 14px 0 8px;
    font-size: clamp(32px, 7vw, 50px);
    line-height: 1.05;
}
.subtitle {
    max-width: 440px;
    margin: 0 auto;
    color: var(--text-muted);
    line-height: 1.6;
}

.roulette-card {
    margin: 26px 0 18px;
    padding: clamp(22px, 5vw, 38px) clamp(16px, 4vw, 34px);
    border: 1px solid color-mix(in srgb, var(--accent) 20%, var(--card-border));
    border-radius: 26px;
    background:
        radial-gradient(circle at 50% 0%, color-mix(in srgb, var(--accent) 16%, transparent), transparent 60%),
        linear-gradient(170deg, var(--card-bg), var(--bg-darker));
    box-shadow: 0 26px 70px rgb(0 0 0 / 45%);
}

.steps {
    padding: clamp(18px, 4vw, 26px);
    border: 1px solid var(--card-border);
    border-radius: var(--radius-lg);
    background: color-mix(in srgb, var(--component-bg) 80%, transparent);
    backdrop-filter: blur(8px);
}
.steps h2 {
    margin-bottom: 16px;
    font-size: 13px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--accent-soft);
}
.steps ol {
    display: grid;
    gap: 14px;
    margin: 0;
    padding: 0;
    list-style: none;
}
.steps li {
    display: grid;
    grid-template-columns: 30px 1fr;
    gap: 12px;
    align-items: center;
}
.step-number {
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    border: 1px solid color-mix(in srgb, var(--accent) 40%, transparent);
    border-radius: 50%;
    background: color-mix(in srgb, var(--accent) 15%, transparent);
    color: var(--accent-soft);
    font-size: 13px;
    font-weight: 900;
}
.step-text {
    color: var(--text-muted);
    font-size: 14px;
    line-height: 1.5;
}
</style>
