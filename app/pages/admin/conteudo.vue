<template>
  <main class="content-admin">
    <header class="page-head">
      <p class="eyebrow">Experiência da marca</p>
      <h1><Icon name="ph:layout-bold" aria-hidden="true" /> Conteúdo da home</h1>
      <p class="page-hint">Atalhos, banners, live e números da home, aplicados sem novo deploy.</p>
    </header>

    <p v-if="loading" class="panel">Carregando...</p>

    <form v-else @submit.prevent="save">
      <section class="panel">
        <h2>Identidade e números</h2>
        <div class="grid">
          <label>
            <span>Nome da marca</span>
            <input v-model="draft.brandName" maxlength="120" required />
          </label>
          <label>
            <span>Cor de destaque</span>
            <span class="color-field">
              <input v-model="accentColor" type="color" aria-label="Escolher cor de destaque" />
              <input v-model="draft.accentColor" placeholder="#rrggbb (vazio usa o tema)" maxlength="7" />
            </span>
          </label>
          <label>
            <span>Rótulo da barra de XP</span>
            <input v-model="draft.xpLabel" maxlength="80" />
          </label>
          <label>
            <span>XP atual</span>
            <input v-model.number="draft.xpCurrent" type="number" min="0" />
          </label>
          <label>
            <span>Meta de XP</span>
            <input v-model.number="draft.xpGoal" type="number" min="1" />
          </label>
        </div>
      </section>

      <section class="panel">
        <h2>Ao vivo</h2>
        <div class="grid">
          <label>
            <span>Título</span>
            <input v-model="draft.liveTitle" maxlength="120" />
          </label>
          <label>
            <span>Horário</span>
            <input v-model="draft.liveAt" maxlength="80" />
          </label>
          <label>
            <span>Destino do botão</span>
            <input v-model="draft.liveHref" maxlength="2000" />
          </label>
        </div>

        <h3>Vídeo do destaque (opcional)</h3>
        <p class="field-hint">
          Aceita a chave do vídeo no bucket ou uma URL completa. Preenchido, o vídeo
          substitui o carrossel na home e passa a ser exigido antes do primeiro jogo grátis.
        </p>
        <label>
          <span>Vídeo</span>
          <input v-model="draft.heroVideo" placeholder="boas-vindas.mp4 ou https://..." maxlength="2000" />
        </label>
      </section>

      <section class="panel">
        <h2>Atalhos</h2>
        <p class="field-hint">Imagem quadrada de 128 px. Sem imagem, o atalho usa o ícone Phosphor.</p>
        <AdminEditorList :items="draft.shortcuts" add-label="Adicionar atalho" />
      </section>

      <section class="panel">
        <h2>Links de conexão</h2>
        <AdminEditorList :items="draft.connectionLinks" add-label="Adicionar link" with-description />
      </section>

      <section class="panel">
        <h2>Banners</h2>
        <p class="field-hint">Proporção ideal 3:1. Banner sem imagem não aparece na home.</p>

        <div class="banner-list">
          <article v-for="(banner, index) in draft.banners" :key="index" class="banner-row">
            <button
              type="button"
              class="banner-thumb"
              :aria-label="`Enviar imagem do banner ${index + 1}`"
              @click="pickBanner(index)"
            >
              <img v-if="banner.image" :src="banner.image" :alt="`Banner ${index + 1}`" />
              <Icon v-else name="ph:image-square-bold" aria-hidden="true" />
            </button>

            <div class="banner-fields">
              <label>
                <span>Link</span>
                <input v-model="banner.href" placeholder="/torneio ou https://..." maxlength="2000" />
              </label>
              <label class="check">
                <input v-model="banner.external" type="checkbox" />
                <span>Externo</span>
              </label>
            </div>

            <button type="button" class="row-remove" aria-label="Remover banner" @click="draft.banners.splice(index, 1)">
              <Icon name="ph:trash-bold" aria-hidden="true" />
            </button>
          </article>
        </div>

        <button type="button" class="ghost-button" @click="draft.banners.push({ image: '', href: '', external: false })">
          <Icon name="ph:plus-bold" aria-hidden="true" /> Adicionar banner
        </button>

        <input ref="bannerInput" type="file" accept="image/*" class="visually-hidden" @change="onBannerFile" />
      </section>

      <section class="panel">
        <h2>Jogos fixados</h2>
        <p class="field-hint">
          Deixe vazio para a home usar o catálogo gerenciado em <NuxtLink to="/admin/visual">Visual do app</NuxtLink>,
          que é quem conhece rotas e sinais de cada jogo.
        </p>

        <div v-for="(game, index) in draft.games" :key="index" class="game-row">
          <label><span>Id</span><input v-model="game.id" maxlength="80" /></label>
          <label><span>Nome</span><input v-model="game.name" maxlength="120" /></label>
          <label><span>Provedor</span><input v-model="game.provider" maxlength="80" /></label>
          <label>
            <span>Grupo</span>
            <select v-model="game.category">
              <option value="prime">Prime</option>
              <option value="premium">Premium</option>
              <option value="claude">Claude</option>
            </select>
          </label>
          <label><span>Imagem (URL)</span><input v-model="game.image" maxlength="2000" /></label>
          <label class="check"><input v-model="game.locked" type="checkbox" /><span>Bloqueado</span></label>
          <button type="button" class="row-remove" aria-label="Remover jogo" @click="draft.games.splice(index, 1)">
            <Icon name="ph:trash-bold" aria-hidden="true" />
          </button>
        </div>

        <button
          type="button"
          class="ghost-button"
          @click="draft.games.push({ id: '', name: '', image: '', provider: '', category: 'prime', locked: false })"
        >
          <Icon name="ph:plus-bold" aria-hidden="true" /> Fixar jogo
        </button>
      </section>

      <footer class="save-bar">
        <p v-if="message" class="save-message" :class="messageType" role="status">{{ message }}</p>
        <button class="primary-button" type="submit" :disabled="saving">
          <Icon name="ph:floppy-disk-bold" aria-hidden="true" />
          {{ saving ? "Salvando..." : "Salvar alterações" }}
        </button>
      </footer>
    </form>
  </main>
</template>

<script setup lang="ts">
import type { HomeConfig } from "../../../shared/homeConfig";
import { DEFAULT_HOME_CONFIG } from "../../../shared/homeConfig";
import { resizeImage } from "../../utils/resizeImage";

definePageMeta({ middleware: "admin", layout: "admin" });

const { adminFetch, needsLogin } = useAdmin();

const draft = reactive<HomeConfig>(JSON.parse(JSON.stringify(DEFAULT_HOME_CONFIG)));
const loading = ref(true);
const saving = ref(false);
const message = ref("");
const messageType = ref<"ok" | "error">("ok");

const bannerInput = ref<HTMLInputElement | null>(null);
let bannerIndex = -1;

// O seletor de cor exige #rrggbb; o campo de texto aceita vazio (usa o tema).
const accentColor = computed({
    get: () => draft.accentColor || "#8b7cf6",
    set: (value: string) => {
        draft.accentColor = value;
    },
});

const load = async () => {
    loading.value = true;
    try {
        const result = await adminFetch<{ config: HomeConfig }>("/api/admin/home-config");
        Object.assign(draft, JSON.parse(JSON.stringify(result.config)));
    } catch {
        message.value = "Não foi possível carregar a configuração.";
        messageType.value = "error";
    } finally {
        loading.value = false;
    }
};

const pickBanner = (index: number) => {
    bannerIndex = index;
    bannerInput.value?.click();
};

const onBannerFile = async (event: Event) => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = "";
    if (!file || bannerIndex < 0) return;

    try {
        draft.banners[bannerIndex]!.image = await resizeImage(file, { maxWidth: 1280 });
    } catch {
        message.value = "Não foi possível processar a imagem do banner.";
        messageType.value = "error";
    }
};

const save = async () => {
    saving.value = true;
    message.value = "";
    try {
        await adminFetch("/api/admin/home-config", { method: "PUT", body: draft });
        message.value = "Conteúdo publicado com sucesso.";
        messageType.value = "ok";
    } catch (error: any) {
        message.value = error?.data?.message || "Erro ao publicar.";
        messageType.value = "error";
    } finally {
        saving.value = false;
    }
};

watch(needsLogin, (pending) => {
    if (!pending) load();
}, { immediate: true });

useHead({ title: "Conteúdo da home — Admin" });
</script>

<style scoped>
.content-admin {
    max-width: 980px;
    margin: 0 auto;
    padding-bottom: 96px;
    color: var(--adm-text);
}

.page-head {
    margin-bottom: 22px;
}
.eyebrow {
    color: var(--adm-accent);
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 0.12em;
    text-transform: uppercase;
}
h1 {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 6px 0;
}
.page-hint,
.field-hint {
    color: var(--adm-muted);
    font-size: 13px;
    line-height: 1.5;
}
.field-hint {
    margin: -4px 0 4px;
}

.panel {
    display: grid;
    gap: 16px;
    margin-bottom: 16px;
    padding: clamp(18px, 4vw, 28px);
    border: 1px solid var(--adm-border);
    border-radius: 16px;
    background: var(--adm-panel);
}
.panel h2 {
    font-size: 17px;
}
.panel h3 {
    margin-top: 6px;
    font-size: 14px;
}

.grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
    gap: 14px;
}
label {
    display: grid;
    gap: 7px;
    color: var(--adm-muted);
    font-size: 12px;
    font-weight: 700;
}
label.check {
    align-content: center;
    grid-auto-flow: column;
    justify-content: start;
    gap: 8px;
}
input,
select {
    min-height: 44px;
    padding: 10px 12px;
    border: 1px solid var(--adm-border);
    border-radius: 9px;
    background: var(--adm-bg);
    color: var(--adm-text);
    font: inherit;
}
label.check input {
    width: 18px;
    min-height: 18px;
}

.color-field {
    display: grid;
    grid-template-columns: 54px 1fr;
    gap: 8px;
}
.color-field input[type="color"] {
    padding: 4px;
}

.banner-list {
    display: grid;
    gap: 12px;
}
.banner-row {
    display: grid;
    grid-template-columns: 132px 1fr 42px;
    gap: 12px;
    align-items: center;
    padding: 12px;
    border: 1px solid var(--adm-border);
    border-radius: 14px;
    background: var(--adm-bg);
}
.banner-thumb {
    display: grid;
    place-items: center;
    aspect-ratio: 3 / 1;
    overflow: hidden;
    border: 1px dashed var(--adm-border);
    border-radius: 10px;
    background: var(--adm-panel);
    color: var(--adm-accent);
    font-size: 22px;
    cursor: pointer;
}
.banner-thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}
.banner-fields {
    display: grid;
    gap: 10px;
}

.game-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)) 42px;
    gap: 10px;
    align-items: end;
    padding: 12px;
    border: 1px solid var(--adm-border);
    border-radius: 14px;
    background: var(--adm-bg);
}

.row-remove {
    display: grid;
    place-items: center;
    width: 42px;
    height: 42px;
    border: 1px solid var(--adm-border);
    border-radius: 10px;
    background: var(--adm-panel);
    color: var(--adm-red, #ff6b81);
    cursor: pointer;
}

.ghost-button {
    justify-self: start;
    min-height: 44px;
    padding: 0 16px;
    border: 1px solid var(--adm-border);
    border-radius: 10px;
    background: var(--adm-bg);
    color: var(--adm-text);
    font: inherit;
    font-weight: 700;
    cursor: pointer;
}

/* Barra de salvar fixa: o formulário é longo, o botão não pode sumir. */
.save-bar {
    position: sticky;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 14px;
    padding: 14px 0;
    background: linear-gradient(180deg, transparent, var(--adm-bg) 40%);
}
.save-message {
    font-size: 13px;
    font-weight: 700;
}
.save-message.ok {
    color: var(--adm-green, #4ade80);
}
.save-message.error {
    color: var(--adm-red, #ff6b81);
}

.primary-button {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-height: 48px;
    padding: 0 22px;
    border: 0;
    border-radius: 12px;
    background: var(--adm-accent);
    color: #fff;
    font: inherit;
    font-weight: 800;
    cursor: pointer;
}
.primary-button:disabled {
    opacity: 0.6;
    cursor: wait;
}

.visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
}

:focus-visible {
    outline: 3px solid var(--adm-accent);
    outline-offset: 2px;
}

@media (max-width: 620px) {
    .banner-row {
        grid-template-columns: 1fr;
    }
    .row-remove {
        justify-self: end;
    }
}
</style>
