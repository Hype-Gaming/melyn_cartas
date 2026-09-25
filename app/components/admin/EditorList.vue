<template>
  <div class="editor-list">
    <article v-for="(item, index) in items" :key="index" class="editor-row">
      <!-- Círculo de upload: com imagem vira miniatura, sem imagem mostra o ícone. -->
      <div class="editor-thumb">
        <button
          type="button"
          class="thumb-button"
          :aria-label="`Enviar imagem para ${item.label || 'o item ' + (index + 1)}`"
          @click="pickImage(index)"
        >
          <img v-if="item.image" :src="item.image" :alt="item.label" />
          <Icon v-else :name="item.icon || 'ph:image-square-bold'" aria-hidden="true" />
        </button>
        <button
          v-if="item.image"
          type="button"
          class="thumb-clear"
          aria-label="Remover imagem e voltar ao ícone"
          @click="item.image = ''"
        >
          <Icon name="ph:x-bold" aria-hidden="true" />
        </button>
      </div>

      <div class="editor-fields">
        <label>
          <span>Título</span>
          <input v-model="item.label" maxlength="60" />
        </label>
        <label>
          <span>Link</span>
          <input v-model="item.href" placeholder="/torneio ou https://..." maxlength="2000" />
        </label>
        <label>
          <span>Ícone</span>
          <input v-model="item.icon" placeholder="ph:trophy-bold" maxlength="100" />
        </label>
        <label v-if="withDescription" class="wide">
          <span>Descrição</span>
          <input v-model="item.description" maxlength="200" />
        </label>
        <label class="check">
          <input v-model="item.external" type="checkbox" />
          <span>Externo</span>
        </label>
      </div>

      <button type="button" class="editor-remove" aria-label="Remover item" @click="items.splice(index, 1)">
        <Icon name="ph:trash-bold" aria-hidden="true" />
      </button>
    </article>

    <button type="button" class="editor-add" @click="add">
      <Icon name="ph:plus-bold" aria-hidden="true" /> {{ addLabel }}
    </button>

    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      class="visually-hidden"
      @change="onFileChange"
    />
    <p v-if="error" class="editor-error" role="alert">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import type { HomeLink } from "../../../shared/homeConfig";
import { resizeImage } from "../../utils/resizeImage";

const props = withDefaults(
    defineProps<{
        items: HomeLink[];
        addLabel?: string;
        withDescription?: boolean;
        /** Lado do ícone quadrado gerado no upload. */
        imageSize?: number;
    }>(),
    { addLabel: "Adicionar item", withDescription: false, imageSize: 128 },
);

const fileInput = ref<HTMLInputElement | null>(null);
const error = ref("");
let targetIndex = -1;

const add = () =>
    props.items.push({ label: "", icon: "ph:star-bold", href: "", description: "", image: "", external: false });

const pickImage = (index: number) => {
    targetIndex = index;
    fileInput.value?.click();
};

const onFileChange = async (event: Event) => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = "";
    if (!file || targetIndex < 0) return;

    error.value = "";
    try {
        props.items[targetIndex]!.image = await resizeImage(file, { square: props.imageSize });
    } catch {
        error.value = "Não foi possível processar a imagem.";
    }
};
</script>

<style scoped>
.editor-list {
    display: grid;
    gap: 12px;
}

.editor-row {
    display: grid;
    grid-template-columns: 76px 1fr 42px;
    gap: 12px;
    align-items: start;
    padding: 14px;
    border: 1px solid var(--adm-border);
    border-radius: 14px;
    background: var(--adm-bg);
}

.editor-thumb {
    position: relative;
    width: 66px;
}
.thumb-button {
    display: grid;
    place-items: center;
    width: 66px;
    height: 66px;
    overflow: hidden;
    border: 1px dashed var(--adm-border);
    border-radius: 50%;
    background: var(--adm-panel);
    color: var(--adm-accent);
    font-size: 24px;
    cursor: pointer;
}
.thumb-button img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}
.thumb-clear {
    position: absolute;
    top: -4px;
    right: -4px;
    display: grid;
    place-items: center;
    width: 26px;
    height: 26px;
    border: 0;
    border-radius: 50%;
    background: var(--adm-panel);
    color: var(--adm-text);
    cursor: pointer;
}

.editor-fields {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 10px;
}
label {
    display: grid;
    gap: 6px;
    color: var(--adm-muted);
    font-size: 12px;
    font-weight: 700;
}
label.wide {
    grid-column: 1 / -1;
}
label.check {
    align-content: center;
    grid-auto-flow: column;
    justify-content: start;
    gap: 8px;
}
input {
    min-height: 42px;
    padding: 9px 11px;
    border: 1px solid var(--adm-border);
    border-radius: 9px;
    background: var(--adm-panel);
    color: var(--adm-text);
    font: inherit;
}
label.check input {
    width: 18px;
    min-height: 18px;
}

.editor-remove {
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

.editor-add {
    justify-self: start;
    min-height: 44px;
    padding: 0 16px;
    border: 1px solid var(--adm-border);
    border-radius: 10px;
    background: var(--adm-panel);
    color: var(--adm-text);
    font: inherit;
    font-weight: 700;
    cursor: pointer;
}

.editor-error {
    color: var(--adm-red, #ff6b81);
    font-size: 13px;
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
    .editor-row {
        grid-template-columns: 66px 1fr;
    }
    .editor-remove {
        grid-column: 2;
        justify-self: end;
    }
}
</style>
