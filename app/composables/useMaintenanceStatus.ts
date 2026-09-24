export interface MaintenanceStatus {
  active: boolean
  title: string
  message: string
  updatedAt: string | null
}

export const DEFAULT_MAINTENANCE_STATUS: MaintenanceStatus = {
  active: false,
  title: 'Em manutenção',
  message: 'Estamos realizando melhorias. Voltamos em breve.',
  updatedAt: null
}

let pendingRequest: Promise<MaintenanceStatus> | null = null

export const useMaintenanceStatus = () => {
  const status = useState<MaintenanceStatus>('maintenance-status', () => ({ ...DEFAULT_MAINTENANCE_STATUS }))
  const checked = useState('maintenance-status-checked', () => false)
  const checking = useState('maintenance-status-checking', () => false)
  const error = useState<string | null>('maintenance-status-error', () => null)

  const check = async (): Promise<MaintenanceStatus> => {
    if (pendingRequest) return pendingRequest

    checking.value = true
    error.value = null
    pendingRequest = (async () => {
      try {
        const result = await $fetch<MaintenanceStatus>('/api/maintenance', {
          cache: 'no-store',
          timeout: 8000,
          query: { t: Date.now() }
        })
        status.value = {
          active: result.active === true,
          title: result.title?.trim() || DEFAULT_MAINTENANCE_STATUS.title,
          message: result.message?.trim() || DEFAULT_MAINTENANCE_STATUS.message,
          updatedAt: result.updatedAt || null
        }
      } catch (cause) {
        console.error('Falha ao verificar modo de manutenção:', cause)
        error.value = 'Não foi possível verificar o status agora.'
      } finally {
        checked.value = true
        checking.value = false
        pendingRequest = null
      }
      return status.value
    })()

    return pendingRequest
  }

  return {
    status: readonly(status),
    checked: readonly(checked),
    checking: readonly(checking),
    error: readonly(error),
    check
  }
}
