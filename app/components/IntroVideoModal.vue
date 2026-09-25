<template>
  <Teleport to="body">
    <div v-if="open" class="intro-overlay" role="dialog" aria-modal="true" aria-labelledby="intro-title">
      <section ref="dialog" class="intro-modal" tabindex="-1">
        <button
          v-if="unlocked"
          type="button"
          class="intro-close"
          aria-label="Fechar vídeo"
          @click="close"
        >
          <Icon name="ph:x-bold" />
        </button>

        <p class="intro-kicker">Boas-vindas</p>
        <h2 id="intro-title">{{ unlocked ? "Liberado!" : "Assista para começar" }}</h2>

        <video
          ref="videoEl"
          class="intro-video"
          :src="videoSrc"
          controls
          playsinline
          preload="auto"
          @timeupdate="onTimeUpdate"
          @seeking="onSeeking"
          @error="onError"
        ></video>

        <div
          class="intro-progress"
          role="progressbar"
          aria-label="Progresso do vídeo"
          :aria-valuenow="Math.round(progress)"
          aria-valuemin="0"
          aria-valuemax="100"
        >
          <span :style="{ width: `${progress}%` }"></span>
        </div>

        <p class="intro-hint">
          {{
            unlocked
              ? "Seu primeiro jogo grátis está liberado."
              : "Assista pelo menos 90% para liberar seu primeiro jogo grátis."
          }}
        </p>

        <button v-if="unlocked" type="button" class="intro-action" @click="play">
          <Icon name="ph:play-fill" /> Jogar agora
        </button>
      </section>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
const { videoSrc, freeGame, open, close, complete, fail } = useIntroVideo();

const dialog = ref<HTMLElement | null>(null);
const videoEl = ref<HTMLVideoElement | null>(null);
const progress = ref(0);
const unlocked = ref(false);

// Até onde o usuário realmente assistiu. Serve de teto para o avanço da barra.
let watchedUntil = 0;

const onTimeUpdate = () => {
    const video = videoEl.value;
    if (!video?.duration) return;

    watchedUntil = Math.max(watchedUntil, video.currentTime);
    progress.value = Math.min(100, (video.currentTime / video.duration) * 100);

    if (!unlocked.value && video.currentTime / video.duration >= 0.9) {
        unlocked.value = true;
        complete();
    }
};

// Voltar e pausar são livres; pular para a frente volta ao ponto já assistido.
const onSeeking = () => {
    const video = videoEl.value;
    if (!video || unlocked.value) return;
    if (video.currentTime > watchedUntil + 0.5) video.currentTime = watchedUntil;
};

const onError = () => fail();

const play = () => {
    close();
    if (freeGame.value) navigateTo(freeGame.value);
};

watch(
    () => open.value,
    async (isOpen) => {
        if (!isOpen) return;
        progress.value = 0;
        unlocked.value = false;
        watchedUntil = 0;
        await nextTick();
        dialog.value?.focus();
    },
);
</script>

<style scoped>
.intro-overlay {
    position: fixed;
    inset: 0;
    z-index: 10001;
    display: grid;
    place-items: center;
    padding: 16px;
    background: rgb(3 4 10 / 82%);
    backdrop-filter: blur(7px);
}

.intro-modal {
    position: relative;
    width: min(560px, 100%);
    max-height: 94dvh;
    overflow: auto;
    padding: 28px clamp(18px, 5vw, 32px) 26px;
    border: 1px solid color-mix(in srgb, var(--accent) 35%, var(--card-border));
    border-radius: 26px;
    background: linear-gradient(145deg, color-mix(in srgb, var(--card-bg) 94%, transparent), var(--bg-darker));
    box-shadow: 0 30px 90px rgb(0 0 0 / 55%);
    color: var(--text-main);
    outline: none;
    text-align: center;
}

.intro-close {
    position: absolute;
    top: 14px;
    right: 14px;
    display: grid;
    place-items: center;
    width: 38px;
    height: 38px;
    border: 1px solid var(--card-border);
    border-radius: 10px;
    background: var(--component-bg);
    color: var(--text-main);
    cursor: pointer;
}

.intro-kicker {
    color: var(--accent-soft);
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 0.14em;
    text-transform: uppercase;
}

h2 {
    margin: 6px 0 18px;
    font-size: clamp(22px, 5vw, 30px);
}

.intro-video {
    width: 100%;
    aspect-ratio: 16 / 9;
    border-radius: 16px;
    background: #000;
}

.intro-progress {
    height: 8px;
    margin: 16px 0 12px;
    overflow: hidden;
    border-radius: 999px;
    background: var(--component-bg);
}
.intro-progress span {
    display: block;
    height: 100%;
    border-radius: 999px;
    background: linear-gradient(90deg, var(--accent), var(--accent-soft));
    transition: width 0.2s linear;
}

.intro-hint {
    color: var(--text-muted);
    font-size: 13px;
    line-height: 1.5;
}

.intro-action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 48px;
    margin-top: 18px;
    padding: 0 26px;
    border: 0;
    border-radius: 13px;
    background: var(--accent);
    color: #fff;
    font: inherit;
    font-weight: 900;
    cursor: pointer;
}
.intro-action:hover {
    box-shadow: 0 10px 28px color-mix(in srgb, var(--accent) 45%, transparent);
}

:focus-visible {
    outline: 3px solid var(--accent);
    outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
    .intro-progress span {
        transition: none;
    }
}
</style>
