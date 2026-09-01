const drawerOpen = ref(false)

export const useSidebarDrawer = () => {
  const route = useRoute()
  const openDrawer = () => { drawerOpen.value = true }
  const closeDrawer = () => { drawerOpen.value = false }
  const toggleDrawer = () => { drawerOpen.value = !drawerOpen.value }

  watch(() => route.fullPath, closeDrawer)

  onMounted(() => window.addEventListener('keydown', onEscape))
  onUnmounted(() => window.removeEventListener('keydown', onEscape))

  function onEscape(event: KeyboardEvent) {
    if (event.key === 'Escape') closeDrawer()
  }

  return { open: readonly(drawerOpen), openDrawer, closeDrawer, toggleDrawer }
}
