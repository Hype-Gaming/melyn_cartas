<template>
  <div class="home">
    <!-- Boas-vindas e saldo -->
    <section class="home-hero">
      <div class="hero-text">
        <p class="eyebrow">Área de membros</p>
        <h1>Olá, {{ firstName }}</h1>
        <p class="hero-copy">Seu conteúdo, benefícios e comunidade em um só lugar.</p>
      </div>

      <button type="button" class="hero-balance" @click="openWallet">
        <Icon name="ph:wallet-bold" aria-hidden="true" />
        <span>Seu saldo<strong>{{ formattedBalance }}</strong></span>
        <Icon name="ph:caret-right-bold" aria-hidden="true" />
      </button>
    </section>

    <!-- Atalhos -->
    <nav v-if="shortcuts.length" class="shortcuts" aria-label="Atalhos">
      <template v-for="(shortcut, index) in shortcuts" :key="`${shortcut.href}-${index}`">
        <a
          v-if="shortcut.external"
          :href="shortcut.href"
          target="_blank"
          rel="noopener noreferrer"
          class="shortcut"
        >
          <span class="shortcut-icon">
            <img v-if="shortcut.image" :src="shortcut.image" :alt="shortcut.label" />
            <Icon v-else :name="shortcut.icon" aria-hidden="true" />
          </span>
          <span class="shortcut-label">{{ shortcut.label }}</span>
        </a>
        <NuxtLink v-else :to="shortcut.href" class="shortcut">
          <span class="shortcut-icon">
            <img v-if="shortcut.image" :src="shortcut.image" :alt="shortcut.label" />
            <Icon v-else :name="shortcut.icon" aria-hidden="true" />
          </span>
          <span class="shortcut-label">{{ shortcut.label }}</span>
        </NuxtLink>
      </template>
    </nav>

    <!-- Ao vivo -->
    <section class="live-strip">
      <span class="live-dot" aria-hidden="true"></span>
      <div class="live-text">
        <strong>{{ homeConfig.liveTitle }}</strong>
        <span>{{ homeConfig.liveAt }}</span>
      </div>
      <NuxtLink :to="homeConfig.liveHref" class="live-action">Entrar</NuxtLink>
    </section>

    <!-- Destaque: vídeo ou carrossel -->
    <section v-if="heroVideoSrc" class="hero-media">
      <video
        class="hero-video"
        :src="heroVideoSrc"
        :poster="banners[0]?.image"
        controls
        playsinline
        preload="metadata"
      ></video>
    </section>

    <section v-else-if="banners.length" class="hero-media" aria-label="Campanhas">
      <div ref="carousel" class="carousel" @scroll.passive="onCarouselScroll">
        <a
          v-for="(banner, index) in banners"
          :key="index"
          class="carousel-slide"
          :href="banner.href || undefined"
          :target="banner.external ? '_blank' : undefined"
          :rel="banner.external ? 'noopener noreferrer' : undefined"
        >
          <img :src="banner.image" :alt="`Campanha ${index + 1}`" />
        </a>
      </div>
      <div v-if="banners.length > 1" class="carousel-dots">
        <button
          v-for="(banner, index) in banners"
          :key="index"
          type="button"
          class="carousel-dot"
          :class="{ active: currentBanner === index }"
          :aria-label="`Ir para a campanha ${index + 1}`"
          :aria-current="currentBanner === index"
          @click="goToBanner(index)"
        ></button>
      </div>
    </section>

    <!-- XP -->
    <section class="xp-card">
      <header>
        <span>{{ homeConfig.xpLabel }}</span>
        <strong>{{ homeConfig.xpCurrent.toLocaleString("pt-BR") }} / {{ homeConfig.xpGoal.toLocaleString("pt-BR") }}</strong>
      </header>
      <div
        class="xp-track"
        role="progressbar"
        :aria-valuenow="xpPercent"
        aria-valuemin="0"
        aria-valuemax="100"
        :aria-label="homeConfig.xpLabel"
      >
        <span :style="{ width: `${xpPercent}%` }"></span>
      </div>
    </section>

    <!-- Catálogo -->
    <section
      v-for="group in gameGroups"
      :key="group.category"
      :id="group.category === 'prime' ? 'jogos' : undefined"
      class="games-section"
    >
      <header class="games-header">
        <h2><Icon :name="group.icon" aria-hidden="true" /> {{ group.title }}</h2>
      </header>

      <div class="games-grid">
        <a
          v-for="game in group.games"
          :key="game.id"
          :href="game.href"
          class="game-card"
          :class="{ locked: game.locked }"
          @click="onGameClick($event, game)"
        >
          <div class="game-cover">
            <img v-if="game.image" :src="game.image" :alt="game.name" loading="lazy" />
            <span v-if="game.locked" class="game-lock" aria-label="Jogo bloqueado">
              <Icon name="ph:lock-key-fill" aria-hidden="true" />
            </span>
          </div>
          <div class="game-info">
            <h3>{{ game.name }}</h3>
            <span v-if="game.locked" class="game-tag">Desbloquear acesso</span>
            <span v-else-if="game.provider" class="game-tag">
              <Icon name="ph:play-fill" aria-hidden="true" /> {{ game.provider }}
            </span>
          </div>
        </a>
      </div>
    </section>

    <!-- Conecte-se -->
    <section v-if="homeConfig.connectionLinks.length" class="connect-section">
      <h2>Conecte-se</h2>
      <div class="connect-grid">
        <component
          :is="link.external ? 'a' : NuxtLink"
          v-for="(link, index) in homeConfig.connectionLinks"
          :key="`${link.href}-${index}`"
          class="connect-card"
          :href="link.external ? link.href : undefined"
          :to="link.external ? undefined : link.href"
          :target="link.external ? '_blank' : undefined"
          :rel="link.external ? 'noopener noreferrer' : undefined"
        >
          <span class="connect-icon"><Icon :name="link.icon" aria-hidden="true" /></span>
          <span class="connect-text">
            <small>Comunidade</small>
            <strong>{{ link.label }}</strong>
            <span v-if="link.description">{{ link.description }}</span>
          </span>
          <Icon name="ph:caret-right-bold" class="connect-arrow" aria-hidden="true" />
        </component>
      </div>
    </section>

    <p class="responsible">
      <Icon name="ph:warning-circle-bold" aria-hidden="true" />
      Jogue com responsabilidade. Conteúdo para maiores de 18 anos.
    </p>

    <IntroVideoModal />
    <RouletteInitialModal :open="showRouletteInvite" @close="closeRouletteInvite" />
  </div>
</template>

<script setup lang="ts">
import { NuxtLink } from "#components";
import { CHECKOUT_URLS } from "../constants/checkoutLinks";
import { videoUrl } from "../../shared/videos";

definePageMeta({ layout: "default" });

const { user, isAuthenticated, formattedBalance, fetchUserProfile } = useAuth();
const { isSubscribed, init: initSubscription } = useSubscription();
const { config: appConfig, resolveAssetUrl } = useVisualConfig();
const { config: homeConfigState, load: loadHomeConfig } = useHomeConfig();
const { openWallet } = useWalletModal();
const intro = useIntroVideo();

const homeConfig = homeConfigState;

const firstName = computed(
    () => user.value?.first_name || user.value?.name?.split(" ")[0] || "membro",
);

const checkoutUrl = computed(() => appConfig.value.links.checkout || CHECKOUT_URLS.main);

const shortcuts = computed(() => homeConfig.value.shortcuts);
const heroVideoSrc = computed(() => videoUrl(homeConfig.value.heroVideo));

const banners = computed(() =>
    homeConfig.value.banners.length
        ? homeConfig.value.banners
        : // Sem banners na config da home, usa os do painel visual.
          appConfig.value.images.banners.map((image) => ({
              image: resolveAssetUrl(image),
              href: appConfig.value.links.whatsappCommunity || "",
              external: true,
          })),
);

const xpPercent = computed(() =>
    Math.min(100, Math.round((homeConfig.value.xpCurrent / Math.max(1, homeConfig.value.xpGoal)) * 100)),
);

/*
 * Catálogo: a config da home pode fixar jogos, mas o padrão é o catálogo
 * gerenciado em /admin/visual, que é quem conhece rotas, sinais e status.
 */
const managedGames = (category: "prime" | "premium" | "claude") =>
    appConfig.value.games
        .filter((game) => game.tabKey === category && game.status !== "hidden")
        .sort((a, b) => a.order - b.order)
        .map((game) => ({
            id: game.gameId,
            name: game.title,
            provider: game.description || "",
            image: resolveAssetUrl(game.imageUrl),
            href: game.route,
            category,
            status: game.status,
            requiresLogin: game.requiresLogin,
            locked: category !== "prime" && !isSubscribed.value,
        }));

const pinnedGames = (category: "prime" | "premium" | "claude") =>
    homeConfig.value.games
        .filter((game) => game.category === category)
        .map((game) => ({
            id: game.id,
            name: game.name,
            provider: game.provider,
            image: game.image,
            href: `/jogo/${game.id}`,
            category,
            status: "enabled" as const,
            requiresLogin: true,
            locked: game.locked || (category !== "prime" && !isSubscribed.value),
        }));

type HomeGameCard = ReturnType<typeof managedGames>[number];

const gameGroups = computed(() =>
    (
        [
            { category: "prime" as const, title: appConfig.value.content.primeTitle, icon: "ph:sparkle-bold" },
            { category: "premium" as const, title: appConfig.value.content.premiumTitle, icon: "ph:crown-bold" },
            { category: "claude" as const, title: appConfig.value.content.claudeTitle, icon: "ph:lightning-fill" },
        ]
    )
        .map((group) => ({
            ...group,
            games: homeConfig.value.games.length ? pinnedGames(group.category) : managedGames(group.category),
        }))
        .filter((group) => group.games.length),
);

const redirectToLogin = (destination = "/") =>
    navigateTo({ path: "/auth/login", query: { redirect: destination } });

const onGameClick = (event: MouseEvent, game: HomeGameCard) => {
    event.preventDefault();

    if (game.status !== "enabled") {
        window.alert(
            game.status === "maintenance"
                ? "Este jogo está temporariamente em manutenção."
                : "Este jogo está bloqueado no momento.",
        );
        return;
    }

    if (game.requiresLogin && !isAuthenticated.value) return redirectToLogin(game.href);

    // Jogo pago sem assinatura vai para o checkout, como antes.
    if (game.locked) {
        window.open(checkoutUrl.value, "_blank", "noopener,noreferrer");
        return;
    }

    // Primeiro jogo grátis só abre depois do vídeo de boas-vindas.
    if (game.category === "prime" && intro.required.value) {
        intro.show(game.href);
        return;
    }

    navigateTo(game.href);
};

// --- Carrossel -------------------------------------------------------------
const carousel = ref<HTMLElement | null>(null);
const currentBanner = ref(0);
let autoplay: ReturnType<typeof setInterval> | null = null;

const scrollToBanner = (index: number) => {
    const element = carousel.value;
    if (!element) return;
    element.scrollTo({ left: element.clientWidth * index, behavior: "smooth" });
};

const goToBanner = (index: number) => {
    currentBanner.value = index;
    scrollToBanner(index);
};

const onCarouselScroll = () => {
    const element = carousel.value;
    if (!element?.clientWidth) return;
    currentBanner.value = Math.round(element.scrollLeft / element.clientWidth);
};

// --- Convite da roleta -----------------------------------------------------
const showRouletteInvite = ref(false);
const closeRouletteInvite = () => {
    showRouletteInvite.value = false;
    sessionStorage.setItem("roulette_invite_seen", "1");
};

onMounted(async () => {
    loadHomeConfig();

    if (isAuthenticated.value) {
        fetchUserProfile();
        await initSubscription(user.value?.email || null);
    }

    await intro.autoOpen();

    // O convite da roleta não disputa a tela com o vídeo de boas-vindas.
    if (isAuthenticated.value && !intro.open.value && !sessionStorage.getItem("roulette_invite_seen")) {
        const available = await $fetch<{ available: boolean }>("/api/track/roulette", {
            params: { email: user.value?.email || "" },
        }).catch(() => null);
        if (available?.available) {
            setTimeout(() => (showRouletteInvite.value = true), 900);
        }
    }

    autoplay = setInterval(() => {
        if (banners.value.length > 1) goToBanner((currentBanner.value + 1) % banners.value.length);
    }, 5000);
});

onUnmounted(() => {
    if (autoplay) clearInterval(autoplay);
});

useHead({ title: () => appConfig.value.brand.name });
</script>

<style scoped>
.home {
    width: min(1100px, 100%);
    margin: 0 auto;
    padding: clamp(18px, 4vw, 34px) 16px 60px;
    color: var(--text-main);
}

.eyebrow {
    color: var(--accent-soft);
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 0.14em;
    text-transform: uppercase;
}

/* Boas-vindas */
.home-hero {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 22px;
    padding: clamp(18px, 4vw, 26px);
    border: 1px solid var(--card-border);
    border-radius: var(--radius-lg);
    background: linear-gradient(125deg, color-mix(in srgb, var(--accent) 13%, var(--card-bg)), var(--card-bg));
    box-shadow: 0 16px 45px rgb(0 0 0 / 22%);
}
.home-hero h1 {
    margin: 5px 0;
    font-size: clamp(24px, 4vw, 34px);
}
.hero-copy {
    color: var(--text-muted);
    font-size: 14px;
}

.hero-balance {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 200px;
    min-height: 56px;
    padding: 12px 15px;
    border: 1px solid var(--card-border);
    border-radius: var(--radius-md);
    background: color-mix(in srgb, var(--component-bg) 86%, transparent);
    color: var(--text-main);
    font: inherit;
    cursor: pointer;
    transition: transform var(--transition), border-color var(--transition);
}
.hero-balance:hover {
    transform: translateY(-3px);
    border-color: var(--accent);
}
.hero-balance :deep(svg):first-child {
    color: var(--accent);
    font-size: 22px;
}
.hero-balance span {
    display: grid;
    flex: 1;
    color: var(--text-muted);
    font-size: 11px;
    text-align: left;
}
.hero-balance strong {
    color: var(--text-main);
    font-size: 16px;
}

/* Atalhos */
.shortcuts {
    display: flex;
    gap: 14px;
    margin: 22px 0;
    padding-bottom: 4px;
    overflow-x: auto;
    scrollbar-width: none;
}
.shortcuts::-webkit-scrollbar {
    display: none;
}
.shortcut {
    display: grid;
    flex: 0 0 auto;
    justify-items: center;
    gap: 9px;
    width: 74px;
    color: var(--text-muted);
    font-size: 11px;
    font-weight: 700;
    text-align: center;
    text-decoration: none;
}
.shortcut-icon {
    display: grid;
    place-items: center;
    width: 58px;
    height: 58px;
    overflow: hidden;
    border: 1px solid color-mix(in srgb, var(--accent) 25%, var(--card-border));
    border-radius: 50%;
    background: linear-gradient(145deg, var(--component-bg), var(--card-bg));
    color: var(--accent);
    font-size: 23px;
    box-shadow: 0 10px 24px rgb(0 0 0 / 25%);
    transition: transform var(--transition), border-color var(--transition);
}
.shortcut-icon img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}
.shortcut:hover .shortcut-icon {
    transform: translateY(-3px);
    border-color: var(--accent);
}
.shortcut:focus-visible {
    outline: 3px solid var(--accent);
    outline-offset: 3px;
    border-radius: 14px;
}

/* Ao vivo */
.live-strip {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    border: 1px solid var(--card-border);
    border-radius: var(--radius-md);
    background: var(--component-bg);
}
.live-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #4ade80;
    box-shadow: 0 0 0 5px #4ade8022;
}
.live-text {
    display: grid;
    flex: 1;
    gap: 2px;
    font-size: 14px;
}
.live-text span {
    color: var(--text-muted);
    font-size: 12px;
}
.live-action {
    min-height: 44px;
    padding: 0 18px;
    border-radius: 12px;
    background: var(--accent);
    color: #fff;
    font-size: 13px;
    font-weight: 800;
    line-height: 44px;
    text-decoration: none;
}

/* Destaque */
.hero-media {
    margin: 18px 0;
}
.hero-video {
    width: 100%;
    aspect-ratio: 16 / 9;
    border-radius: var(--radius-lg);
    background: #000;
}

.carousel {
    display: flex;
    gap: 12px;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    scrollbar-width: none;
}
.carousel::-webkit-scrollbar {
    display: none;
}
.carousel-slide {
    flex: 0 0 100%;
    scroll-snap-align: center;
}
.carousel-slide img {
    width: 100%;
    aspect-ratio: 3 / 1;
    border-radius: var(--radius-lg);
    object-fit: cover;
}
.carousel-dots {
    display: flex;
    justify-content: center;
    gap: 6px;
    margin-top: 12px;
}
.carousel-dot {
    width: 8px;
    height: 8px;
    border: 0;
    border-radius: 999px;
    background: var(--card-border);
    cursor: pointer;
    transition: width var(--transition), background var(--transition);
}
.carousel-dot.active {
    width: 22px;
    background: var(--accent);
}
.carousel-dot:focus-visible {
    outline: 3px solid var(--accent);
    outline-offset: 3px;
}

/* XP */
.xp-card {
    margin-bottom: 24px;
    padding: 16px 18px;
    border: 1px solid var(--card-border);
    border-radius: var(--radius-md);
    background: var(--component-bg);
}
.xp-card header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 10px;
    color: var(--text-muted);
    font-size: 12px;
    font-weight: 700;
}
.xp-card strong {
    color: var(--text-main);
}
.xp-track {
    height: 10px;
    overflow: hidden;
    border-radius: 999px;
    background: var(--card-bg);
}
.xp-track span {
    display: block;
    height: 100%;
    border-radius: 999px;
    background: linear-gradient(90deg, var(--accent), var(--accent-soft));
    transition: width 0.4s ease;
}

/* Catálogo */
.games-section {
    margin-bottom: 30px;
    scroll-margin-top: 80px;
}
.games-header h2 {
    display: flex;
    align-items: center;
    gap: 9px;
    margin-bottom: 14px;
    font-size: 15px;
    letter-spacing: 0.05em;
    text-transform: uppercase;
}
.games-header :deep(svg) {
    color: var(--accent);
    font-size: 19px;
}

.games-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(168px, 1fr));
    gap: 14px;
}
.game-card {
    display: grid;
    overflow: hidden;
    border: 1px solid var(--card-border);
    border-radius: var(--radius-md);
    background: linear-gradient(170deg, var(--card-bg), var(--bg-darker));
    color: var(--text-main);
    text-decoration: none;
    transition: transform var(--transition), border-color var(--transition);
}
.game-card:hover {
    transform: translateY(-5px);
    border-color: var(--accent);
}
.game-card:focus-visible {
    outline: 3px solid var(--accent);
    outline-offset: 2px;
}

.game-cover {
    position: relative;
    aspect-ratio: 3 / 4;
    background: var(--component-bg);
}
.game-cover img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}
.game-lock {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    background: rgb(5 6 12 / 62%);
    color: var(--accent-soft);
    font-size: 30px;
}

.game-info {
    display: grid;
    gap: 4px;
    padding: 11px 12px 13px;
}
.game-info h3 {
    font-size: 13px;
    font-weight: 800;
}
.game-tag {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    color: var(--text-muted);
    font-size: 11px;
}
.game-card.locked .game-tag {
    color: var(--accent-soft);
}

/* Conecte-se */
.connect-section h2 {
    margin-bottom: 14px;
    font-size: 15px;
    letter-spacing: 0.05em;
    text-transform: uppercase;
}
.connect-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 12px;
}
.connect-card {
    position: relative;
    display: flex;
    align-items: center;
    gap: 13px;
    padding: 16px 16px 16px 20px;
    overflow: hidden;
    border: 1px solid var(--card-border);
    border-radius: var(--radius-md);
    background: var(--component-bg);
    color: var(--text-main);
    text-decoration: none;
    transition: transform var(--transition), border-color var(--transition);
}
/* Faixa lateral colorida */
.connect-card::before {
    content: "";
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    width: 4px;
    background: var(--accent);
}
.connect-card:hover {
    transform: translateY(-3px);
    border-color: var(--accent);
}
.connect-icon {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border-radius: 13px;
    background: color-mix(in srgb, var(--accent) 16%, transparent);
    color: var(--accent);
    font-size: 21px;
}
.connect-text {
    display: grid;
    flex: 1;
    gap: 2px;
}
.connect-text small {
    color: var(--accent-soft);
    font-size: 10px;
    font-weight: 900;
    letter-spacing: 0.12em;
    text-transform: uppercase;
}
.connect-text > span {
    color: var(--text-muted);
    font-size: 12px;
    line-height: 1.4;
}
.connect-arrow {
    color: var(--text-muted);
    font-size: 17px;
}

.responsible {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-top: 28px;
    color: var(--text-muted);
    font-size: 12px;
    text-align: center;
}

@media (max-width: 720px) {
    .home-hero {
        flex-direction: column;
        align-items: stretch;
    }
    .hero-balance {
        width: 100%;
    }
    .games-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (max-width: 380px) {
    .shortcut {
        width: 64px;
    }
    .shortcut-icon {
        width: 52px;
        height: 52px;
        font-size: 20px;
    }
}

@media (prefers-reduced-motion: reduce) {
    .game-card:hover,
    .connect-card:hover,
    .hero-balance:hover,
    .shortcut:hover .shortcut-icon {
        transform: none;
    }
    .xp-track span {
        transition: none;
    }
}
</style>
