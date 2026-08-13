<template>
  <img :src="logo" :alt="config.brand.name" />
</template>

<script setup lang="ts">
const { config, resolveAssetUrl } = useVisualConfig()
const logo = computed(() => resolveAssetUrl(config.value.brand.logo) || '/media/melyn-logo.svg')
</script>
