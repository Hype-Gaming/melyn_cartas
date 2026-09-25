<template>
  <div class="roulette">
    <div class="roulette-stage">
      <div class="roulette-pointer" aria-hidden="true"></div>

      <svg
        class="roulette-wheel"
        viewBox="0 0 200 200"
        :style="{ transform: `rotate(${rotation}deg)` }"
        role="img"
        :aria-label="`Roleta com ${prizes.length} prêmios`"
      >
        <defs>
          <filter id="wheel-glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        <g v-for="(prize, index) in prizes" :key="index">
          <path :d="slicePath(index)" :fill="prize.color" stroke="var(--bg-darker)" stroke-width="0.8" />
          <text
            :transform="labelTransform(index)"
            fill="#fff"
            font-size="7.5"
            font-weight="800"
            text-anchor="middle"
            dominant-baseline="middle"
          >{{ shortLabel(prize.label) }}</text>
        </g>

        <circle cx="100" cy="100" r="96" fill="none" stroke="var(--accent)" stroke-width="3" filter="url(#wheel-glow)" />
        <circle cx="100" cy="100" r="16" fill="var(--bg-darker)" stroke="var(--accent)" stroke-width="2.5" />
      </svg>
    </div>

    <p v-if="!loggedIn" class="roulette-note">Entre na sua conta para usar o giro diário.</p>
    <p v-else-if="error" class="roulette-note error" role="alert">{{ error }}</p>
    <p v-else-if="!available && !result" class="roulette-note">
      Seu giro de hoje já foi usado. Volte amanhã!
    </p>

    <button
      type="button"
      class="roulette-button"
      :disabled="spinning || !loggedIn || !available"
      @click="spin"
    >
      <Icon name="ph:spinner-ball-bold" />
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

// Fatia em coordenadas SVG: centro 100,100 e raio 94.
const slicePath = (index: number) => {
    const start = ((index * slice - 90) * Math.PI) / 180;
    const end = (((index + 1) * slice - 90) * Math.PI) / 180;
    const x1 = 100 + 94 * Math.cos(start);
    const y1 = 100 + 94 * Math.sin(start);
    const x2 = 100 + 94 * Math.cos(end);
    const y2 = 100 + 94 * Math.sin(end);
    return `M100 100 L${x1.toFixed(2)} ${y1.toFixed(2)} A94 94 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`;
};

const labelTransform = (index: number) => {
    const angle = index * slice + slice / 2 - 90;
    const radians = (angle * Math.PI) / 180;
    const x = 100 + 62 * Math.cos(radians);
    const y = 100 + 62 * Math.sin(radians);
    // Na metade de baixo da roda o texto sairia de cabeça para baixo: gira 180°.
    const upsideDown = angle > 0 && angle < 180;
    const rotation = angle + (upsideDown ? -90 : 90);
    return `translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${rotation.toFixed(2)})`;
};

const shortLabel = (label: string) => (label === "Não foi dessa vez" ? "Quase!" : label.replace(" grátis", ""));

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
    width: min(320px, 82vw);
    aspect-ratio: 1;
}

.roulette-wheel {
    width: 100%;
    height: 100%;
    filter: drop-shadow(0 18px 50px rgb(0 0 0 / 45%));
    transition: transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99);
}

.roulette-pointer {
    position: absolute;
    top: -6px;
    left: 50%;
    z-index: 2;
    width: 0;
    height: 0;
    margin-left: -13px;
    border-left: 13px solid transparent;
    border-right: 13px solid transparent;
    border-top: 26px solid var(--accent);
    filter: drop-shadow(0 3px 5px rgb(0 0 0 / 60%));
}

.roulette-note {
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
}
</style>
