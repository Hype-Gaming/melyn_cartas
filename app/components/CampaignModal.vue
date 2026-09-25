<template>
  <Teleport to="body">
    <Transition name="campaign">
      <div v-if="open" class="campaign-overlay" role="dialog" aria-modal="true" aria-labelledby="campaign-title" @click.self="$emit('close')">
        <section class="campaign-card">
          <button type="button" aria-label="Fechar campanha" @click="$emit('close')"><Icon name="ph:x-bold" /></button>
          <img v-if="campaign.imageUrl" :src="campaign.imageUrl" alt="" />
          <div class="campaign-body"><span>Oferta para membros</span><h2 id="campaign-title">{{ campaign.title }}</h2><p>{{ campaign.message }}</p><a v-if="campaign.ctaUrl" :href="campaign.ctaUrl" @click="$emit('close')">{{ campaign.ctaLabel }}</a></div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>
<script setup lang="ts">
import type { AppConfig } from '../../shared/appConfig'
defineProps<{ open: boolean; campaign: AppConfig['memberExperience']['campaign'] }>()
defineEmits<{ close: [] }>()
</script>
<style scoped>
.campaign-overlay { position: fixed; inset: 0; z-index: 9000; display: grid; place-items: center; padding: 18px; background: rgb(2 3 8 / 76%); backdrop-filter: blur(14px); }
.campaign-card { position: relative; width: min(520px,100%); overflow: hidden; border: 1px solid var(--card-border); border-radius: 24px; background: var(--card-bg); box-shadow: 0 30px 90px #0009; }
.campaign-card>button { position: absolute; z-index: 2; top: 12px; right: 12px; display:grid;place-items:center;width:38px;height:38px;border:0;border-radius:50%;background:#000a;color:#fff;cursor:pointer; }
.campaign-card>img { width:100%; max-height:270px; object-fit:cover; } .campaign-body { padding:28px; } .campaign-body>span { color:var(--color-secondary);font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:.12em; }
h2 { margin:7px 0 10px;font-size:30px; } p { color:var(--text-muted);line-height:1.6; } a { display:inline-flex;margin-top:20px;padding:13px 20px;border-radius:12px;background:var(--color-primary);color:#fff;font-weight:800;text-decoration:none; }
.campaign-enter-active,.campaign-leave-active{transition:opacity .2s}.campaign-enter-from,.campaign-leave-to{opacity:0}
</style>
