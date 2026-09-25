<template>
  <main class="tournaments-admin">
    <header class="page-head">
      <div>
        <p class="eyebrow">Conteúdo</p>
        <h1><Icon name="ph:trophy-bold" aria-hidden="true" /> Torneios</h1>
      </div>
      <button type="button" class="ghost-button" @click="startNew">
        <Icon name="ph:plus-bold" aria-hidden="true" /> Novo torneio
      </button>
    </header>

    <div class="layout">
      <section class="panel list-panel">
        <h2>Campanhas</h2>
        <p v-if="loading" class="hint">Carregando...</p>
        <p v-else-if="!tournaments.length" class="hint">Nenhum torneio criado ainda.</p>

        <ul v-else class="tournament-list">
          <li v-for="item in tournaments" :key="item.id">
            <button type="button" :class="{ selected: item.id === draft.id }" @click="edit(item)">
              <span class="item-title">{{ item.title }}</span>
              <span class="item-status" :class="item.status">{{ statusLabel[item.status] }}</span>
            </button>
          </li>
        </ul>
      </section>

      <form class="panel" @submit.prevent="save">
        <h2>{{ draft.id ? "Editar torneio" : "Criar torneio" }}</h2>

        <div class="grid">
          <label class="wide">
            <span>Título</span>
            <input v-model="draft.title" maxlength="120" required />
          </label>
          <label>
            <span>Status</span>
            <select v-model="draft.status">
              <option value="draft">Rascunho</option>
              <option value="active">Publicar (ativo)</option>
              <option value="finished">Encerrado</option>
            </select>
          </label>
          <label>
            <span>Início</span>
            <input v-model="startsAtLocal" type="datetime-local" required />
          </label>
          <label>
            <span>Fim</span>
            <input v-model="endsAtLocal" type="datetime-local" required />
          </label>
          <label class="wide">
            <span>Descrição</span>
            <textarea v-model="draft.description" rows="3" maxlength="1000"></textarea>
          </label>
        </div>
        <p class="hint">Publicar um torneio encerra o que estiver ativo: só uma campanha por vez aparece na página pública.</p>

        <h3>Premiações</h3>
        <div v-for="(prize, index) in draft.prizes" :key="`prize-${index}`" class="row">
          <label class="narrow">
            <span>Colocação</span>
            <input v-model.number="prize.place" type="number" min="1" />
          </label>
          <label>
            <span>Prêmio</span>
            <input v-model="prize.value" maxlength="120" />
          </label>
          <button type="button" class="row-remove" aria-label="Remover premiação" @click="draft.prizes.splice(index, 1)">
            <Icon name="ph:trash-bold" aria-hidden="true" />
          </button>
        </div>
        <button
          type="button"
          class="ghost-button"
          @click="draft.prizes.push({ place: draft.prizes.length + 1, value: '' })"
        >
          <Icon name="ph:plus-bold" aria-hidden="true" /> Adicionar premiação
        </button>

        <h3>Regras</h3>
        <label>
          <span>Uma regra por linha</span>
          <textarea v-model="rulesText" rows="5"></textarea>
        </label>

        <h3>Ranking</h3>
        <label>
          <span>Uma linha por participante, no formato <code>Nome | pontos</code></span>
          <textarea v-model="rankingText" rows="6" placeholder="Ana M. | 9850"></textarea>
        </label>

        <footer class="save-bar">
          <p v-if="message" class="save-message" :class="messageType" role="status">{{ message }}</p>
          <button class="primary-button" type="submit" :disabled="saving">
            <Icon name="ph:floppy-disk-bold" aria-hidden="true" />
            {{ saving ? "Salvando..." : "Salvar torneio" }}
          </button>
        </footer>
      </form>
    </div>
  </main>
</template>

<script setup lang="ts">
import type { Tournament } from "../../../shared/tournament";

definePageMeta({ middleware: "admin", layout: "admin" });

const { adminFetch, needsLogin } = useAdmin();

const statusLabel = { draft: "Rascunho", active: "Ativo", finished: "Encerrado" } as const;

const emptyDraft = (): Tournament => ({
    id: "",
    title: "",
    description: "",
    startsAt: "",
    endsAt: "",
    prizes: [{ place: 1, value: "" }],
    rules: [],
    ranking: [],
    status: "draft",
});

const tournaments = ref<Tournament[]>([]);
const draft = reactive<Tournament>(emptyDraft());
const rulesText = ref("");
const rankingText = ref("");
const loading = ref(true);
const saving = ref(false);
const message = ref("");
const messageType = ref<"ok" | "error">("ok");

// <input type="datetime-local"> fala horário local; a API guarda ISO.
const localDate = (key: "startsAt" | "endsAt") =>
    computed({
        get: () => (draft[key] ? new Date(draft[key]).toISOString().slice(0, 16) : ""),
        set: (value: string) => {
            draft[key] = value ? new Date(value).toISOString() : "";
        },
    });
const startsAtLocal = localDate("startsAt");
const endsAtLocal = localDate("endsAt");

const apply = (source: Tournament) => {
    Object.assign(draft, JSON.parse(JSON.stringify(source)));
    rulesText.value = source.rules.join("\n");
    rankingText.value = source.ranking.map((entry) => `${entry.name} | ${entry.points}`).join("\n");
};

const startNew = () => {
    apply(emptyDraft());
    message.value = "";
};

const edit = (item: Tournament) => {
    apply(item);
    message.value = "";
};

const load = async () => {
    loading.value = true;
    try {
        const result = await adminFetch<{ tournaments: Tournament[] }>("/api/admin/tournaments");
        tournaments.value = result.tournaments;
    } catch {
        message.value = "Não foi possível carregar os torneios.";
        messageType.value = "error";
    } finally {
        loading.value = false;
    }
};

const save = async () => {
    saving.value = true;
    message.value = "";
    try {
        const body: Tournament = {
            ...draft,
            rules: rulesText.value.split("\n").map((rule) => rule.trim()).filter(Boolean),
            ranking: rankingText.value
                .split("\n")
                .map((line) => line.trim())
                .filter(Boolean)
                .map((line) => {
                    const [name, points] = line.split("|");
                    return { name: (name || "").trim(), points: Number(points) || 0 };
                }),
        };

        const result = await adminFetch<{ tournament: Tournament }>("/api/admin/tournaments", {
            method: "POST",
            body,
        });
        apply(result.tournament);
        message.value = "Torneio salvo com sucesso.";
        messageType.value = "ok";
        await load();
    } catch (error: any) {
        message.value = error?.data?.message || "Erro ao salvar o torneio.";
        messageType.value = "error";
    } finally {
        saving.value = false;
    }
};

watch(needsLogin, (pending) => {
    if (!pending) load();
}, { immediate: true });

useHead({ title: "Torneios — Admin" });
</script>

<style scoped>
.tournaments-admin {
    max-width: 1100px;
    margin: 0 auto;
    padding-bottom: 60px;
    color: var(--adm-text);
}

.page-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
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
    margin-top: 6px;
}

.layout {
    display: grid;
    grid-template-columns: 300px 1fr;
    gap: 16px;
    align-items: start;
}

.panel {
    display: grid;
    gap: 14px;
    padding: clamp(16px, 4vw, 24px);
    border: 1px solid var(--adm-border);
    border-radius: 16px;
    background: var(--adm-panel);
}
.panel h2 {
    font-size: 17px;
}
.panel h3 {
    margin-top: 8px;
    padding-top: 12px;
    border-top: 1px solid var(--adm-border);
    font-size: 14px;
}
.hint {
    color: var(--adm-muted);
    font-size: 13px;
    line-height: 1.5;
}

.tournament-list {
    display: grid;
    gap: 8px;
    margin: 0;
    padding: 0;
    list-style: none;
}
.tournament-list button {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    width: 100%;
    min-height: 52px;
    padding: 10px 14px;
    border: 1px solid transparent;
    border-radius: 10px;
    background: var(--adm-bg);
    color: var(--adm-text);
    font: inherit;
    text-align: left;
    cursor: pointer;
}
.tournament-list button.selected {
    border-color: var(--adm-accent);
    background: var(--adm-accent-soft);
}
.item-title {
    font-weight: 700;
}
.item-status {
    padding: 3px 9px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--adm-text) 10%, transparent);
    font-size: 11px;
    font-weight: 800;
}
.item-status.active {
    background: color-mix(in srgb, #4ade80 22%, transparent);
    color: #9ff0c4;
}

.grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 14px;
}
label {
    display: grid;
    gap: 7px;
    color: var(--adm-muted);
    font-size: 12px;
    font-weight: 700;
}
label.wide {
    grid-column: 1 / -1;
}
label.narrow {
    max-width: 130px;
}
input,
select,
textarea {
    min-height: 44px;
    padding: 10px 12px;
    border: 1px solid var(--adm-border);
    border-radius: 9px;
    background: var(--adm-bg);
    color: var(--adm-text);
    font: inherit;
}

.row {
    display: flex;
    gap: 10px;
    align-items: end;
    flex-wrap: wrap;
}
.row label {
    flex: 1;
    min-width: 130px;
}
.row-remove {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 1px solid var(--adm-border);
    border-radius: 10px;
    background: var(--adm-bg);
    color: var(--adm-red, #ff6b81);
    cursor: pointer;
}

.ghost-button {
    justify-self: start;
    display: inline-flex;
    align-items: center;
    gap: 8px;
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

.save-bar {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 14px;
    margin-top: 8px;
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

:focus-visible {
    outline: 3px solid var(--adm-accent);
    outline-offset: 2px;
}

@media (max-width: 860px) {
    .layout {
        grid-template-columns: 1fr;
    }
}
</style>
