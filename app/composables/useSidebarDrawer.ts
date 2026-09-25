const drawerOpen = ref(false)

// Recolhida ou não (só no desktop). A escolha é lembrada entre visitas.
const COLLAPSE_KEY = 'sidebar_collapsed'
const collapsed = ref(false)
let restored = false

export const useSidebarDrawer = () => {
  const route = useRoute()
  const openDrawer = () => { drawerOpen.value = true }
  const closeDrawer = () => { drawerOpen.value = false }
  const toggleDrawer = () => { drawerOpen.value = !drawerOpen.value }

  if (import.meta.client && !restored) {
    restored = true
    try {
      collapsed.value = localStorage.getItem(COLLAPSE_KEY) === '1'
    } catch {
      /* navegação privada: começa expandida, sem quebrar */
    }
  }

  const toggleCollapse = () => {
    collapsed.value = !collapsed.value
    try {
      localStorage.setItem(COLLAPSE_KEY, collapsed.value ? '1' : '0')
    } catch {
      /* sem persistência, a escolha vale só para esta visita */
    }
  }

  watch(() => route.fullPath, closeDrawer)

  onMounted(() => window.addEventListener('keydown', onEscape))
  onUnmounted(() => window.removeEventListener('keydown', onEscape))

  function onEscape(event: KeyboardEvent) {
    if (event.key === 'Escape') closeDrawer()
  }

  return {
    open: readonly(drawerOpen),
    collapsed: readonly(collapsed),
    openDrawer,
    closeDrawer,
    toggleDrawer,
    toggleCollapse
  }
}
