<template>
  <div class="media-field">
    <span class="media-label">{{ label }}</span>

    <div
      class="dropzone"
      :class="{ dragging, erro: !!erro, enviando }"
      role="button"
      :tabindex="enviando ? -1 : 0"
      @click="abrirSeletor"
      @keydown.enter.prevent="abrirSeletor"
      @keydown.space.prevent="abrirSeletor"
      @dragover.prevent="dragging = true"
      @dragleave.prevent="dragging = false"
      @drop.prevent="aoSoltar"
    >
      <img v-if="modelValue && !enviando" :src="modelValue" class="preview" alt="" />

      <div v-else-if="enviando" class="progresso">
        <div class="barra"><div class="barra-fill" :style="{ width: `${progresso}%` }" /></div>
        <span>{{ progresso }}%</span>
      </div>

      <div v-else class="vazio">
        <Icon name="ph:image-square-bold" />
        <span>Arraste uma imagem ou clique para escolher</span>
      </div>

      <input
        ref="inputFile"
        type="file"
        class="input-oculto"
        :accept="ACCEPT"
        :disabled="enviando"
        @change="aoEscolher"
      />
    </div>

    <p v-if="erro" class="erro-msg">{{ erro }}</p>
    <p v-else-if="hint" class="hint">{{ hint }}</p>

    <div class="acoes">
      <button v-if="modelValue" type="button" class="link-btn" :disabled="enviando" @click.stop="limpar">
        <Icon name="ph:trash-bold" /> Remover
      </button>
      <button type="button" class="link-btn" :disabled="enviando" @click.stop="mostrarUrl = !mostrarUrl">
        <Icon name="ph:link-bold" /> {{ mostrarUrl ? 'Ocultar URL' : 'Usar URL' }}
      </button>
    </div>

    <input
      v-if="mostrarUrl"
      v-model="modelValue"
      class="url-input"
      placeholder="/media/logo.svg ou https://..."
    />
  </div>
</template>

<script setup lang="ts">
const ACCEPT = 'image/png,image/jpeg,image/webp,image/gif,image/svg+xml,image/x-icon,.ico'
const MAX_BYTES = 5 * 1024 * 1024

defineProps<{ label: string; hint?: string }>()
const modelValue = defineModel<string | null>()

const inputFile = ref<HTMLInputElement | null>(null)
const dragging = ref(false)
const enviando = ref(false)
const progresso = ref(0)
const erro = ref('')
const mostrarUrl = ref(false)

const abrirSeletor = () => {
  if (!enviando.value) inputFile.value?.click()
}

const limpar = () => {
  erro.value = ''
  modelValue.value = null
}

const aoEscolher = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) enviar(file)
  target.value = ''
}

const aoSoltar = (event: DragEvent) => {
  dragging.value = false
  if (enviando.value) return
  const file = event.dataTransfer?.files?.[0]
  if (file) enviar(file)
}

// XMLHttpRequest é usado porque $fetch não expõe progresso de upload.
const enviar = (file: File) => {
  erro.value = ''
  if (file.size > MAX_BYTES) {
    erro.value = 'Arquivo maior que 5 MB.'
    return
  }

  enviando.value = true
  progresso.value = 0
  const form = new FormData()
  form.append('file', file, file.name)

  const xhr = new XMLHttpRequest()
  xhr.open('POST', '/api/media')
  const token = localStorage.getItem('rdb_admin_token')
  if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)

  xhr.upload.onprogress = (event) => {
    if (event.lengthComputable) progresso.value = Math.round((event.loaded / event.total) * 100)
  }

  xhr.onload = () => {
    enviando.value = false
    try {
      const response = JSON.parse(xhr.responseText)
      if (xhr.status >= 200 && xhr.status < 300 && response.url) {
        modelValue.value = response.url
        progresso.value = 100
      } else {
        erro.value = response.message || response.statusMessage || 'Falha ao enviar o arquivo.'
      }
    } catch {
      erro.value = 'Resposta inválida do servidor.'
    }
  }

  xhr.onerror = () => {
    enviando.value = false
    erro.value = 'Falha de rede ao enviar o arquivo.'
  }

  xhr.send(form)
}
</script>

<style scoped>
.media-field { display: grid; gap: 8px; }
.media-label { color: #cdd0db; font-size: 13px; font-weight: 700; }
.dropzone { display: flex; align-items: center; justify-content: center; min-height: 140px; padding: 14px; border: 1px dashed #303544; border-radius: 12px; background: #0b0d12; cursor: pointer; transition: border-color .15s, background .15s; }
.dropzone:hover, .dropzone:focus-visible, .dropzone.dragging { border-color: #8b7cf6; outline: none; }
.dropzone.dragging { background: #121420; }
.dropzone.erro { border-color: #a82e42; }
.dropzone.enviando { cursor: wait; }
.preview { max-width: 100%; max-height: 150px; object-fit: contain; }
.vazio { display: grid; justify-items: center; gap: 8px; color: #6f7488; font-size: 13px; text-align: center; }
.vazio :deep(svg) { width: 28px; height: 28px; }
.progresso { display: grid; gap: 8px; justify-items: center; width: 80%; color: #a9a6ba; font-size: 12px; }
.barra { width: 100%; height: 6px; border-radius: 99px; background: #22263a; overflow: hidden; }
.barra-fill { height: 100%; background: linear-gradient(90deg, #8b7cf6, #6657d8); transition: width .2s; }
.input-oculto { display: none; }
.erro-msg, .hint { margin: 0; font-size: 12px; }
.erro-msg { color: #ef6a86; }
.hint { color: #6f7488; }
.acoes { display: flex; gap: 14px; }
.link-btn { display: inline-flex; align-items: center; gap: 5px; padding: 0; border: 0; background: none; color: #a78bfa; cursor: pointer; font-size: 12px; font-weight: 700; }
.link-btn:disabled { opacity: .5; cursor: wait; }
.url-input { width: 100%; padding: 9px 11px; border: 1px solid #303544; border-radius: 8px; background: #0b0d12; color: #fff; font: inherit; font-size: 13px; }
</style>
