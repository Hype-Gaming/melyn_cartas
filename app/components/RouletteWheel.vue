<template>
  <div class="roulette">
    <div class="roulette-stage" :class="{ spinning }">
      <!-- Brilho ambiente atrás da roda, puramente decorativo. -->
      <div class="stage-glow" aria-hidden="true"></div>

      <div class="roulette-pointer" aria-hidden="true">
        <svg viewBox="0 0 28 30" width="26" height="28">
          <path d="M14 29 L4 5 L24 5 Z" fill="var(--accent-soft)" />
        </svg>
      </div>

      <svg
        class="roulette-wheel"
        viewBox="0 0 220 220"
        :style="{ transform: `rotate(${rotation}deg)` }"
        role="img"
        :aria-label="`Roleta com ${prizes.length} prêmios`"
      >
        <defs>
          <radialGradient v-for="(prize, index) in prizes" :id="`slice-${index}`" :key="`grad-${index}`" cx="50%" cy="50%" r="50%">
            <stop offset="55%" :stop-color="prize.color" stop-opacity="0.82" />
            <stop offset="100%" :stop-color="prize.color" />
          </radialGradient>

          <filter id="rim-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        <g v-for="(prize, index) in prizes" :key="index">
          <path :d="slicePath(index)" :fill="`url(#slice-${index})`" stroke="rgb(0 0 0 / 35%)" stroke-width="0.6" />
          <text
            :transform="labelTransform(index)"
            :fill="prize.spins > 0 ? '#fff' : 'rgb(255 255 255 / 55%)'"
            font-size="8"
            font-weight="800"
            letter-spacing="0.2"
            text-anchor="middle"
            dominant-baseline="middle"
          >{{ shortLabel(prize.label) }}</text>
        </g>

        <!-- Aro externo com as luzinhas de cassino. -->
        <circle cx="110" cy="110" r="104" fill="none" stroke="var(--accent)" stroke-width="3.5" filter="url(#rim-glow)" />
        <circle cx="110" cy="110" r="97" fill="none" stroke="rgb(0 0 0 / 45%)" stroke-width="5" />
        <circle
          v-for="bulb in bulbs"
          :key="`bulb-${bulb.index}`"
          :cx="bulb.x"
          :cy="bulb.y"
          r="2.4"
          :fill="bulb.index % 2 === 0 ? 'var(--accent-soft)' : '#fff'"
          :opacity="bulb.index % 2 === 0 ? 0.95 : 0.5"
        />

        <circle cx="110" cy="110" r="22" fill="var(--bg-darker)" stroke="var(--accent)" stroke-width="3" />
        <circle cx="110" cy="110" r="14" fill="none" stroke="var(--accent-soft)" stroke-width="1" opacity="0.5" />
      </svg>

      <span class="roulette-hub" aria-hidden="true"><Icon name="ph:sparkle-fill" /></span>
    </div>

    <!-- Legenda: o que cada cor vale, legível sem girar a cabeça. -->
    <ul class="prize-legend">
      <li v-for="(prize, index) in legend" :key="index">
        <span class="legend-dot" :style="{ background: prize.color }"></span>
        {{ prize.label }}
      </li>
    </ul>

    <p v-if="!loggedIn" class="roulette-note">Entre na sua conta para usar o giro diário.</p>
    <p v-else-if="error" class="roulette-note error" role="alert">{{ error }}</p>
    <p v-else-if="!available && !result" class="roulette-note">
      <Icon name="ph:clock-countdown-bold" aria-hidden="true" />
      Próximo giro em {{ nextSpinIn }}
    </p>

    <button
      type="button"
      class="roulette-button"
      :class="{ ready: loggedIn && available && !spinning }"
      :disabled="spinning || !loggedIn || !available"
      @click="spin"
    >
      <Icon :name="spinning ? 'ph:circle-notch-bold' : 'ph:spinner-ball-bold'" :class="{ turning: spinning }" />
      {{ spinning ? "Girando..." : available ? "Girar agora" : "Volte amanhã" }}
    </button>

    <!-- Confete só depois do resultado, e nunca para quem pediu menos animação. -->
    <div v-if="showConfetti" class="confetti" aria-hidden="true">
      <span v-for="piece in confettiPieces" :key="piece.id" :style="piece.style"></span>
    </div>

    <Teleport to="body">
      <div v-if="result" class="result-overlay" role="dialog" aria-modal="true" aria-labelledby="result-title">
        <section ref="resultDialog" class="result-modal" tabindex="-1">
          <Icon :name="result.spins > 0 ? 'ph:confetti-bold' : 'ph:clock-countdown-bold'" class="result-icon" />
          <h2 id="result-title">{{ result.spins > 0 ? "Parabéns!" : "Não foi dessa vez" }}</h2>
          <!-- Sem prêmio o rótulo repetiria o título; só aparece quando há o que ganhar. -->
          <p v-if="result.spins > 0" class="result-prize">{{ result.label }}</p>
          <p class="result-hint">
            {{
              result.spins > 0
                ? "Fale com o suporte para resgatar o seu prêmio."
                : "Você tem um novo giro amanhã. Boa sorte!"
            }}
          </p>
          <a v-if="result.spins > 0 && supportUrl" :href="supportUrl" target="_blank" rel="noopener noreferrer" class="result-action">
            <Icon name="ph:whatsapp-logo-bold" /> Resgatar com o suporte
          </a>
          <button type="button" class="result-action ghost" @click="result = null">Fechar</button>
        </section>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
interface Prize { label: string; spins: number; color: string }

const props = defineProps<{ supportUrl?: string }>();

// Mesma ordem do servidor (server/utils/roulette.ts): o índice sorteado lá
// aponta para a fatia desenhada aqui.
const prizes: Prize[] = [
    { label: "20 giros grátis", spins: 20, color: "#8b7cf6" },
    { label: "Não foi dessa vez", spins: 0, color: "#1d2133" },
    { label: "30 giros grátis", spins: 30, color: "#d9b76e" },
    { label: "Não foi dessa vez", spins: 0, color: "#1d2133" },
    { label: "40 giros grátis", spins: 40, color: "#4ade80" },
    { label: "50 giros grátis", spins: 50, color: "#ef6a86" },
];

const { user, isAuthenticated } = useAuth();

const rotation = ref(0);
const spinning = ref(false);
const available = ref(false);
const error = ref("");
const result = ref<Prize | null>(null);
const showConfetti = ref(false);
const resultDialog = ref<HTMLElement | null>(null);

const loggedIn = computed(() => isAuthenticated.value && !!user.value?.email);
const slice = 360 / prizes.length;

const confettiPieces = Array.from({ length: 24 }, (_, index) => ({
    id: index,
    style: {
        left: `${(index * 97) % 100}%`,
        background: prizes[index % prizes.length]!.color,
        animationDelay: `${(index % 8) * 0.12}s`,
    },
}));

// Coordenadas SVG: centro 110,110 e raio 94 (o aro ocupa o resto).
const CENTER = 110;
const RADIUS = 94;

const slicePath = (index: number) => {
    const start = ((index * slice - 90) * Math.PI) / 180;
    const end = (((index + 1) * slice - 90) * Math.PI) / 180;
    const x1 = CENTER + RADIUS * Math.cos(start);
    const y1 = CENTER + RADIUS * Math.sin(start);
    const x2 = CENTER + RADIUS * Math.cos(end);
    const y2 = CENTER + RADIUS * Math.sin(end);
    return `M${CENTER} ${CENTER} L${x1.toFixed(2)} ${y1.toFixed(2)} A${RADIUS} ${RADIUS} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`;
};

// Luzinhas do aro, como as de uma roda de cassino.
const bulbs = Array.from({ length: 24 }, (_, index) => {
    const radians = ((index * (360 / 24) - 90) * Math.PI) / 180;
    return {
        index,
        x: (CENTER + 100.5 * Math.cos(radians)).toFixed(2),
        y: (CENTER + 100.5 * Math.sin(radians)).toFixed(2)
    };
});

// Legenda sem repetir "Não foi dessa vez" uma vez por fatia.
const legend = prizes.filter(
    (prize, index) => prizes.findIndex((other) => other.label === prize.label) === index,
);

const labelTransform = (index: number) => {
    const angle = index * slice + slice / 2 - 90;
    const radians = (angle * Math.PI) / 180;
    const x = CENTER + 66 * Math.cos(radians);
    const y = CENTER + 66 * Math.sin(radians);
    // Na metade de baixo da roda o texto sairia de cabeça para baixo: gira 180°.
    const upsideDown = angle > 0 && angle < 180;
    const rotation = angle + (upsideDown ? -90 : 90);
    return `translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${rotation.toFixed(2)})`;
};

const shortLabel = (label: string) => (label === "Não foi dessa vez" ? "Quase!" : label.replace(" grátis", ""));

// O giro renova à meia-noite de Brasília: a contagem usa esse mesmo fuso.
const nextSpinIn = ref("00:00");
let countdown: ReturnType<typeof setInterval> | null = null;

const updateCountdown = () => {
    const agora = new Date();
    const brasilia = new Date(agora.toLocaleString("en-US", { timeZone: "America/Bahia" }));
    const faltam = 86_400_000 - (brasilia.getHours() * 3600 + brasilia.getMinutes() * 60 + brasilia.getSeconds()) * 1000;
    const horas = Math.floor(faltam / 3_600_000);
    const minutos = Math.floor((faltam % 3_600_000) / 60_000);
    nextSpinIn.value = `${String(horas).padStart(2, "0")}h${String(minutos).padStart(2, "0")}`;
};

onMounted(() => {
    updateCountdown();
    countdown = setInterval(updateCountdown, 30_000);
});
onUnmounted(() => {
    if (countdown) clearInterval(countdown);
});

const loadStatus = async () => {
    if (!loggedIn.value) return;
    try {
        const data = await $fetch<{ available: boolean }>("/api/track/roulette", {
            params: { email: user.value!.email },
        });
        available.value = data.available;
    } catch {
        error.value = "Não foi possível carregar o seu giro.";
    }
};

const spin = async () => {
    if (spinning.value || !loggedIn.value) return;
    spinning.value = true;
    error.value = "";

    try {
        const data = await $fetch<{ prizeIndex: number; alreadySpun: boolean }>("/api/track/roulette", {
            method: "POST",
            body: { email: user.value!.email },
        });

        // O servidor escolhe o prêmio; a roda só para onde ele mandou.
        const target = 360 - (data.prizeIndex * slice + slice / 2);
        rotation.value += 360 * 5 + (target - (rotation.value % 360));
        await new Promise((resolve) => setTimeout(resolve, 4200));

        const prize = prizes[data.prizeIndex] || prizes[0]!;
        available.value = false;
        result.value = prize;

        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (prize.spins > 0 && !reducedMotion) {
            showConfetti.value = true;
            setTimeout(() => (showConfetti.value = false), 3500);
        }
        await nextTick();
        resultDialog.value?.focus();
    } catch (cause: any) {
        error.value = cause?.data?.message || "Não foi possível girar agora. Tente novamente.";
    } finally {
        spinning.value = false;
    }
};

watch(loggedIn, loadStatus, { immediate: true });
</script>

<style scoped>
.roulette {
    display: grid;
    justify-items: center;
    gap: 16px;
}

.roulette-stage {
    position: relative;
    width: min(330px, 84vw);
    aspect-ratio: 1;
}

/* Halo atrás da roda: dá profundidade sem pesar no render. */
.stage-glow {
    position: absolute;
    inset: -14%;
    border-radius: 50%;
    background: radial-gradient(
        circle,
        color-mix(in srgb, var(--accent) 34%, transparent) 0%,
        transparent 68%
    );
    filter: blur(14px);
    opacity: 0.75;
    transition: opacity 0.4s ease;
}
.roulette-stage.spinning .stage-glow {
    opacity: 1;
    animation: glow-pulse 1.4s ease-in-out infinite;
}
@keyframes glow-pulse {
    50% {
        transform: scale(1.06);
    }
}

.roulette-wheel {
    position: relative;
    width: 100%;
    height: 100%;
    filter: drop-shadow(0 22px 55px rgb(0 0 0 / 55%));
    /* Desacelera no fim como uma roda de verdade. */
    transition: transform 4s cubic-bezier(0.16, 1, 0.3, 1);
}

/* Cubo central sobreposto: o ícone não gira junto com a roda. */
.roulette-hub {
    position: absolute;
    top: 50%;
    left: 50%;
    display: grid;
    place-items: center;
    width: 17%;
    aspect-ratio: 1;
    transform: translate(-50%, -50%);
    color: var(--accent-soft);
    font-size: clamp(16px, 5vw, 21px);
    pointer-events: none;
}

.roulette-pointer {
    position: absolute;
    top: -12px;
    left: 50%;
    z-index: 2;
    transform: translateX(-50%);
    filter: drop-shadow(0 4px 8px rgb(0 0 0 / 70%));
}

/* Legenda dos prêmios */
.prize-legend {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px 14px;
    margin: 4px 0 0;
    padding: 0;
    list-style: none;
}
.prize-legend li {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 6px 12px;
    border: 1px solid var(--card-border);
    border-radius: 999px;
    background: color-mix(in srgb, var(--component-bg) 70%, transparent);
    color: var(--text-muted);
    font-size: 12px;
    font-weight: 700;
}
.legend-dot {
    width: 9px;
    height: 9px;
    border-radius: 50%;
}

.roulette-note {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    color: var(--text-muted);
    font-size: 14px;
    text-align: center;
}
.roulette-note.error {
    color: var(--color-danger);
}

.roulette-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 9px;
    min-height: 52px;
    padding: 0 32px;
    border: 0;
    border-radius: 14px;
    background: var(--accent);
    color: #fff;
    font: inherit;
    font-size: 15px;
    font-weight: 900;
    cursor: pointer;
    transition: box-shadow 0.18s ease, transform 0.18s ease;
}
.roulette-button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 12px 30px color-mix(in srgb, var(--accent) 45%, transparent);
}
/* Chamada de atenção enquanto o giro do dia está disponível. */
.roulette-button.ready {
    animation: button-breathe 2.6s ease-in-out infinite;
}
@keyframes button-breathe {
    50% {
        box-shadow: 0 10px 34px color-mix(in srgb, var(--accent) 55%, transparent);
    }
}
.roulette-button :deep(svg.turning) {
    animation: turning 1s linear infinite;
}
@keyframes turning {
    to {
        transform: rotate(360deg);
    }
}
.roulette-button:disabled {
    opacity: 0.55;
    cursor: not-allowed;
}

.confetti {
    position: fixed;
    inset: 0;
    z-index: 10002;
    pointer-events: none;
}
.confetti span {
    position: absolute;
    top: -12px;
    width: 9px;
    height: 14px;
    border-radius: 2px;
    animation: confetti-fall 3.2s linear forwards;
}
@keyframes confetti-fall {
    to {
        transform: translateY(105vh) rotate(540deg);
        opacity: 0;
    }
}

.result-overlay {
    position: fixed;
    inset: 0;
    z-index: 10003;
    display: grid;
    place-items: center;
    padding: 16px;
    background: rgb(3 4 10 / 82%);
    backdrop-filter: blur(7px);
}
.result-modal {
    display: grid;
    justify-items: center;
    gap: 10px;
    width: min(420px, 100%);
    padding: 34px 26px 26px;
    border: 1px solid color-mix(in srgb, var(--accent) 35%, var(--card-border));
    border-radius: 26px;
    background: linear-gradient(145deg, color-mix(in srgb, var(--card-bg) 94%, transparent), var(--bg-darker));
    box-shadow: 0 30px 90px rgb(0 0 0 / 55%);
    color: var(--text-main);
    outline: none;
    text-align: center;
}
.result-icon {
    font-size: 54px;
    color: var(--accent);
}
.result-prize {
    font-size: 20px;
    font-weight: 900;
    color: var(--accent-soft);
}
.result-hint {
    color: var(--text-muted);
    font-size: 14px;
    line-height: 1.5;
}
.result-action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    min-height: 48px;
    border: 0;
    border-radius: 13px;
    background: var(--accent);
    color: #fff;
    font: inherit;
    font-weight: 900;
    text-decoration: none;
    cursor: pointer;
}
.result-action.ghost {
    background: var(--component-bg);
    color: var(--text-main);
}

:focus-visible {
    outline: 3px solid var(--accent);
    outline-offset: 3px;
}

@media (prefers-reduced-motion: reduce) {
    .roulette-wheel {
        transition-duration: 0.5s;
    }
    .confetti {
        display: none;
    }
    .roulette-button.ready,
    .roulette-stage.spinning .stage-glow,
    .roulette-button :deep(svg.turning) {
        animation: none;
    }
}
</style>
