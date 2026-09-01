export const useNotificationPermission = () => {
  const permission = ref<NotificationPermission | 'unsupported'>('unsupported')
  const supported = computed(() => permission.value !== 'unsupported')
  const refresh = () => {
    permission.value = import.meta.client && 'Notification' in window ? Notification.permission : 'unsupported'
  }
  const requestPermission = async () => {
    if (!import.meta.client || !('Notification' in window)) return 'unsupported' as const
    try { permission.value = await Notification.requestPermission() } catch { refresh() }
    return permission.value
  }
  onMounted(refresh)
  return { permission: readonly(permission), supported, refresh, requestPermission }
}
