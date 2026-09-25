<template>
  <Teleport to="body">
    <div v-if="open" class="invite-overlay" @click.self="dismiss" @keydown.esc="dismiss">
      <section ref="dialog" class="invite-modal" role="dialog" aria-modal="true" aria-labelledby="invite-title" tabindex="-1">
        <button ref="closeButton" type="button" class="invite-close" aria-label="Fechar convite" @click="dismiss">
          <Icon name="ph:x-bold" />
        </button>

        <Icon name="ph:spinner-ball-bold" class="invite-icon" aria-hidden="true" />
        <p class="invite-kicker">Uma chance por dia</p>
        <h2 id="invite-title">Sua roleta está te esperando</h2>
        <p class="invite-copy">Gire uma vez por dia e descubra o prêmio da comunidade.</p>

        <NuxtLink to="/roleta" class="invite-action" @click="dismiss">
          <Icon name="ph:sparkle-fill" /> Girar a roleta
        </NuxtLink>
        <button type="button" class="invite-action ghost" @click="dismiss">Agora não</button>
      </section>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ close: [] }>();

const dialog = ref<HTMLElement | null>(null);
const closeButton = ref<HTMLElement | null>(null);

const dismiss = () => emit("close");

watch(
    () => props.open,
    async (isOpen) => {
        if (!isOpen) return;
        await nextTick();
        (closeButton.value || dialog.value)?.focus();
    },
);
</script>

<style scoped>
.invite-overlay {
    position: fixed;
    inset: 0;
    z-index: 9999;
    display: grid;
    place-items: center;
    padding: 16px;
    background: rgb(3 4 10 / 80%);
    backdrop-filter: blur(7px);
}

.invite-modal {
    position: relative;
    display: grid;
    justify-items: center;
    gap: 8px;
    width: min(400px, 100%);
    padding: 34px 26px 24px;
    border: 1px solid color-mix(in srgb, var(--accent) 35%, var(--card-border));
    border-radius: 26px;
    background: linear-gradient(145deg, color-mix(in srgb, var(--card-bg) 94%, transparent), var(--bg-darker));
    box-shadow: 0 30px 90px rgb(0 0 0 / 55%);
    color: var(--text-main);
    outline: none;
    text-align: center;
}

.invite-close {
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

.invite-icon {
    font-size: 48px;
    color: var(--accent);
}
.invite-kicker {
    color: var(--accent-soft);
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 0.14em;
    text-transform: uppercase;
}
h2 {
    font-size: clamp(21px, 5vw, 27px);
}
.invite-copy {
    margin-bottom: 8px;
    color: var(--text-muted);
    font-size: 14px;
    line-height: 1.5;
}

.invite-action {
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
.invite-action.ghost {
    background: var(--component-bg);
    color: var(--text-muted);
}

:focus-visible {
    outline: 3px solid var(--accent);
    outline-offset: 2px;
}
</style>
