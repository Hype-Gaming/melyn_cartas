<template>
    <div v-if="!appReady" class="visual-bootstrap" role="status" aria-label="Verificando disponibilidade">
        <div class="visual-bootstrap-spinner"></div>
    </div>

    <MaintenanceScreen
        v-else-if="showMaintenance"
        :title="maintenanceStatus.title"
        :message="maintenanceStatus.message"
        :checking="maintenanceChecking"
        :error="maintenanceError"
        @retry="checkMaintenance"
    />

    <div v-else id="app">
        <PageLoader />
        <NuxtLayout><NuxtPage /></NuxtLayout>
        <UpdateNotification />
        <KycModal :show="showKycModal" @dismiss="kycDismissed = true" />
        <BlockedOverlay v-if="isBlocked" />
        <NotificationPrompt :allowed="!showKycModal && !isBlocked" />
    </div>
</template>

<script setup lang="ts">
const { needsKyc, kycChecked, isAuthenticated, fetchUserProfile } =
    useAuth();
const { send: sendHeartbeat } = useHeartbeat();
const { isBlocked } = useAccountBlocked();
const route = useRoute();
const { config: appConfig, ready: visualReady, loadAppConfig, resolveAssetUrl } = useVisualConfig();
const {
    status: maintenanceStatus,
    checked: maintenanceChecked,
    checking: maintenanceChecking,
    error: maintenanceError,
    check: checkMaintenance,
} = useMaintenanceStatus();
const kycDismissed = ref(false);
let maintenanceTimer: ReturnType<typeof setInterval> | undefined;

const showMaintenance = computed(() =>
    maintenanceStatus.value.active && !route.path.startsWith("/admin"),
);
const appReady = computed(() => visualReady.value && maintenanceChecked.value);

// Mostrar modal de KYC quando necessário (apenas em rotas autenticadas e após verificação)
const showKycModal = computed(() => {
    const isAuthRoute = route.path.startsWith("/auth");
    // Só mostra se: está autenticado, KYC já foi verificado, precisa de KYC, e não está em rota de auth
    return (
        isAuthenticated.value &&
        kycChecked.value &&
        needsKyc.value &&
        !kycDismissed.value &&
        !isAuthRoute &&
        !isBlocked.value
    );
});

// Verificar KYC ao carregar a página
onMounted(async () => {
    await Promise.all([loadAppConfig(), checkMaintenance()]);
    if (isAuthenticated.value) {
        await fetchUserProfile();
        sendHeartbeat();
    }
    maintenanceTimer = setInterval(checkMaintenance, 60_000);
});

onBeforeUnmount(() => {
    if (maintenanceTimer) clearInterval(maintenanceTimer);
});

// Observar mudanças na rota para verificar KYC
watch(
    () => route.path,
    async () => {
        await checkMaintenance();
        kycDismissed.value = false;
        if (isAuthenticated.value && !route.path.startsWith("/auth")) {
            await fetchUserProfile();
            sendHeartbeat();
        }
    },
);

// Componente raiz da aplicação Nuxt
useHead(() => ({
    title: appConfig.value.brand.name || "App",
    meta: [
        { name: "description", content: appConfig.value.brand.description },
        { name: "keywords", content: appConfig.value.brand.keywords },
    ],
    link: [{
        rel: "icon",
        href: resolveAssetUrl(appConfig.value.brand.favicon || appConfig.value.brand.logo) || "/favicon.ico",
    }],
}));
</script>

<style>
:root {
    --color-primary: #8b7cf6;
    --color-primary-rgb: 139, 124, 246;
    --color-primary-dark: #6657d8;
    --color-secondary: #d9b76e;
    --color-secondary-dark: #a9853f;
    --bg-dark: #080b16;
    --bg-darker: #050711;
    --card-bg: #101322;
    --input-bg: #0c0f1c;
    --component-bg: #171a2d;
    --card-border: #292d45;
    --text-main: #f7f5ff;
    --text-muted: #a9a6ba;
    --color-gold: #d9b76e;
    --color-fire: #b49af8;
    --color-danger: #ef6a86;
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

html,
body {
    background: var(--bg-dark);
    color: var(--text-main);
}

/* Antes da configuração chegar, mantém somente um fundo neutro. */
html:not(.visual-theme-ready),
html:not(.visual-theme-ready) body {
    background: #08090d;
}

body {
    font-family: "Manrope", "Space Grotesk", sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}

#app {
    min-height: 100vh;
    background: transparent;
}

.visual-bootstrap {
    position: fixed;
    inset: 0;
    z-index: 1000000;
    display: grid;
    place-items: center;
    background: #08090d;
}

.visual-bootstrap-spinner {
    width: 42px;
    height: 42px;
    border: 3px solid #282b35;
    border-top-color: #f5f6fa;
    border-radius: 50%;
    animation: visual-bootstrap-spin .8s linear infinite;
}

@keyframes visual-bootstrap-spin {
    to { transform: rotate(360deg); }
}

</style>
