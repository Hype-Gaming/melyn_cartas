export interface AppUser {
  email: string
  name: string | null
  phone: string | null
  brand_slug: string | null
  blocked: boolean
  last_seen_at: string | null
  first_seen_at: string | null
  subscription: 'paid' | 'free'
  deposits_count: number
  deposits_sum: number
  risk_tag: 'risk_24h' | 'risk_48h' | 'risk_no_access' | null
  auto_risk_tag: 'risk_24h' | 'risk_48h' | 'risk_no_access' | null
  tag_override: 'auto' | 'none' | 'risk_24h' | 'risk_48h' | 'risk_no_access'
  contact_status: 'pendente' | 'contatado' | 'respondeu' | 'convertido' | 'ignorado'
  cactus_user_id?: string | number | null
  access_count?: number
  last_known_balance?: number | null
}

export interface AdminDeposit {
  email: string
  amount: number
  transaction_id: string | null
  brand_slug: string | null
  is_ftd: boolean
  status: string | null
  created_at: string | null
}

export const USERS_PAGE_SIZE = 50

/**
 * Estado do painel admin, compartilhado entre as rotas do layout `admin`.
 *
 * Vive no escopo do modulo (mesmo padrao de useSidebarDrawer) porque as secoes
 * se cruzam: registrar um FTD precisa recarregar metricas, depositos e usuarios,
 * e o card de risco na visao geral filtra a tabela em outra rota.
 */
const metrics = reactive({
  totalUsers: 0, active48h: 0, depositsCount: 0, depositsSum: 0,
  newToday: 0, new7d: 0, avgTicket: 0, atRisk: 0, conversionRate: 0
})

const users = ref<AppUser[]>([])
const usersTotal = ref(0)
const brands = ref<string[]>([])
const loadingUsers = ref(false)

const search = ref('')
const riskFilter = ref('')
const subFilter = ref('')
const statusFilter = ref('')
const brandFilter = ref('')
const firstAccessFilter = ref('')
const dateFrom = ref('')
const dateTo = ref('')

const deposits = ref<AdminDeposit[]>([])

const activityDays = ref<Array<{ date: string; users: number; deposits: number }>>([])
const loadingActivity = ref(false)
const activityError = ref<string | null>(null)

const supportInput = ref('')
const supportHref = ref('')
const savingSupport = ref(false)

const toast = ref('')
const toastType = ref<'ok' | 'error'>('ok')
let toastTimer: ReturnType<typeof setTimeout> | undefined

export const useAdminData = () => {
  const { adminFetch } = useAdmin()

  const showToast = (message: string, type: 'ok' | 'error' = 'ok') => {
    clearTimeout(toastTimer)
    toast.value = message
    toastType.value = type
    toastTimer = setTimeout(() => { toast.value = '' }, 3000)
  }

  const fetchStats = async () => {
    try {
      Object.assign(metrics, await adminFetch<typeof metrics>('/api/admin/stats'))
    } catch { /* silencioso: metrica ausente nao bloqueia o painel */ }
  }

  const fetchUsers = async (append = false) => {
    loadingUsers.value = true
    try {
      const res = await adminFetch<{ users: AppUser[]; total: number; brands: string[] }>('/api/admin/users', {
        params: {
          search: search.value.trim(),
          risk: riskFilter.value,
          subscription: subFilter.value,
          status: statusFilter.value,
          brand: brandFilter.value,
          firstAccess: firstAccessFilter.value,
          dateFrom: dateFrom.value,
          dateTo: dateTo.value,
          skip: append ? users.value.length : 0,
          limit: USERS_PAGE_SIZE
        }
      })
      users.value = append ? [...users.value, ...res.users] : res.users
      usersTotal.value = res.total
      brands.value = res.brands
    } catch {
      showToast('Erro ao carregar usuários.', 'error')
    } finally {
      loadingUsers.value = false
    }
  }

  const fetchDeposits = async () => {
    try {
      const res = await adminFetch<{ deposits: AdminDeposit[] }>('/api/admin/deposits', { params: { limit: 50 } })
      deposits.value = res.deposits
    } catch { /* silencioso */ }
  }

  const fetchActivity = async () => {
    loadingActivity.value = true
    activityError.value = null
    try {
      const res = await adminFetch<{ days: typeof activityDays.value }>('/api/admin/activity')
      activityDays.value = res.days
    } catch {
      activityError.value = 'Erro ao carregar atividade.'
    } finally {
      loadingActivity.value = false
    }
  }

  const fetchSupport = async () => {
    try {
      const res = await $fetch<{ value: string; href: string }>('/api/settings/support')
      supportInput.value = res.value
      supportHref.value = res.href
    } catch { /* silencioso */ }
  }

  const saveSupport = async () => {
    savingSupport.value = true
    try {
      const res = await adminFetch<{ href: string }>('/api/admin/settings/support', {
        method: 'POST',
        body: { value: supportInput.value.trim() }
      })
      supportHref.value = res.href
      showToast('Suporte salvo.')
    } catch {
      showToast('Erro ao salvar suporte.', 'error')
    } finally {
      savingSupport.value = false
    }
  }

  const refreshAll = () =>
    Promise.all([fetchStats(), fetchUsers(), fetchDeposits(), fetchActivity(), fetchSupport()])

  return {
    metrics,
    users, usersTotal, brands, loadingUsers,
    search, riskFilter, subFilter, statusFilter, brandFilter, firstAccessFilter, dateFrom, dateTo,
    deposits,
    activityDays, loadingActivity, activityError,
    supportInput, supportHref, savingSupport,
    toast, toastType, showToast,
    fetchStats, fetchUsers, fetchDeposits, fetchActivity, fetchSupport, saveSupport, refreshAll
  }
}
