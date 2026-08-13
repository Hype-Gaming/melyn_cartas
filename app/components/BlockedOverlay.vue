<template>
    <div class="blk-overlay">
        <div class="blk-glow"></div>
        <div class="blk-card">
            <button class="blk-close" @click="onLogout" aria-label="Voltar para o login">
                <Icon name="ph:x-bold" />
            </button>

            <img
                :src="blockedImage"
                :alt="appConfig.content.supportTitle"
                class="blk-img"
            />

            <div class="blk-copy">
                <h2>{{ appConfig.content.supportTitle }}</h2>
                <p>{{ appConfig.content.supportMessage }}</p>
            </div>

            <a :href="supportLink" target="_blank" rel="noopener" class="blk-btn">
                <Icon name="ph:whatsapp-logo-bold" />
                Falar com o suporte
            </a>
        </div>
    </div>
</template>

<script setup lang="ts">
// Link de suporte configurável pelo admin (/api/settings/support). Fallback usa o link padrão.
const FALLBACK_SUPPORT_LINK = "https://wa.me/5571993887915";
const supportLink = ref(FALLBACK_SUPPORT_LINK);
const { config: appConfig, resolveAssetUrl } = useVisualConfig();
const blockedImage = computed(() =>
    resolveAssetUrl(appConfig.value.images.blocked) || "/media/melyn-mark.svg",
);

const { logout } = useAuth();
const { setBlocked } = useAccountBlocked();

const loadSupportLink = async () => {
    if (appConfig.value.links.whatsappSupport) {
        supportLink.value = appConfig.value.links.whatsappSupport;
        return;
    }
    try {
        const res = await $fetch<{ href: string }>("/api/settings/support");
        if (res?.href) supportLink.value = res.href;
    } catch {
        // mantém o fallback
    }
};

// X: fecha o overlay e volta para a tela de autenticação (logout redireciona pro login).
const onLogout = async () => {
    setBlocked(false);
    await logout();
};

// Trava o scroll do body enquanto o overlay estiver ativo.
onMounted(() => {
    if (import.meta.client) document.body.style.overflow = "hidden";
    loadSupportLink();
});
onUnmounted(() => {
    if (import.meta.client) document.body.style.overflow = "";
});
</script>

<style scoped>
.blk-overlay {
    position: fixed;
    inset: 0;
    z-index: 100000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: rgba(7, 6, 10, 0.92);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    font-family: "Manrope", sans-serif;
}

.blk-copy { text-align: center; }
.blk-copy h2 { margin: 0 0 6px; color: var(--text-main); }
.blk-copy p { margin: 0; color: var(--text-muted); }
.blk-glow {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background:
        radial-gradient(50% 40% at 50% 0%, rgba(var(--color-primary-rgb), 0.18), transparent 60%),
        radial-gradient(50% 40% at 50% 100%, rgba(255, 93, 108, 0.1), transparent 60%);
}
.blk-card {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: 400px;
    background: #0e1320;
    border: 1px solid rgba(var(--color-primary-rgb), 0.22);
    border-radius: 20px;
    padding: 16px;
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.6);
    animation: blk-pop 0.4s cubic-bezier(0.22, 1, 0.36, 1) both;
}
@keyframes blk-pop {
    from { opacity: 0; transform: scale(0.94) translateY(10px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
}
.blk-close {
    position: absolute;
    top: 14px;
    right: 14px;
    z-index: 2;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.55);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 50%;
    color: #fff;
    font-size: 18px;
    cursor: pointer;
    transition: background 0.2s ease, transform 0.15s ease;
}
.blk-close:hover {
    background: rgba(0, 0, 0, 0.8);
    transform: scale(1.05);
}
.blk-img {
    width: 100%;
    height: auto;
    display: block;
    border-radius: 14px;
    margin-bottom: 16px;
}
.blk-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 9px;
    width: 100%;
    background: linear-gradient(135deg, #25d366, #1fae54);
    color: #04210f;
    border: none;
    border-radius: 12px;
    padding: 15px;
    font-size: 15px;
    font-weight: 800;
    text-decoration: none;
    cursor: pointer;
    transition: transform 0.15s ease, box-shadow 0.2s ease;
    box-shadow: 0 10px 26px rgba(37, 211, 102, 0.3);
}
.blk-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 14px 32px rgba(37, 211, 102, 0.4);
}
.blk-btn :deep(svg) { font-size: 20px; }
</style>
