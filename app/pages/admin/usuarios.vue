<template>
<section class="adm-section adm-panel" ref="usersSection">
    <div class="adm-panel-head">
        <h2><Icon name="ph:users-bold" /> Usuários</h2>
        <button class="adm-btn-ghost" :disabled="exporting" @click="exportCsv">
            <Icon name="ph:download-simple-bold" /> Exportar CSV
        </button>
    </div>

    <div class="adm-filters">
        <div class="adm-search">
            <Icon name="ph:magnifying-glass-bold" />
            <input
                ref="searchInput"
                v-model="search"
                type="text"
                placeholder="Buscar e-mail, nome ou telefone..."
            />
        </div>
        <div class="adm-chips">
            <button
                v-for="c in riskChips" :key="c.value"
                class="adm-chip" :class="{ on: riskFilter === c.value }"
                @click="setRisk(c.value)"
            >{{ c.label }}</button>
        </div>
        <select v-model="subFilter" class="adm-select">
            <option value="">Assinatura: todas</option>
            <option value="paid">Pago</option>
            <option value="free">Free</option>
        </select>
        <select v-model="statusFilter" class="adm-select">
            <option value="">Status: todos</option>
            <option value="active">Ativos</option>
            <option value="blocked">Bloqueados</option>
        </select>
        <select v-model="firstAccessFilter" class="adm-select">
            <option value="">Primeiro acesso: todos</option>
            <option value="24h">Últimas 24 horas</option>
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="custom">Período personalizado</option>
        </select>
        <template v-if="firstAccessFilter === 'custom'">
            <input v-model="dateFrom" class="adm-select" type="date" aria-label="Data inicial" />
            <input v-model="dateTo" class="adm-select" type="date" aria-label="Data final" />
        </template>
        <select v-if="brands.length" v-model="brandFilter" class="adm-select">
            <option value="">Marca: todas</option>
            <option v-for="b in brands" :key="b" :value="b">{{ b }}</option>
        </select>
    </div>

    <div class="adm-table-wrap adm-scroll">
        <table class="adm-table">
            <thead>
                <tr>
                    <th>Usuário</th>
                    <th>Telefone</th>
                    <th>Tag</th>
                    <th>Contato</th>
                    <th>Assinatura</th>
                    <th>PIX</th>
                    <th>Marca</th>
                    <th>1º acesso</th>
                    <th>Último acesso</th>
                    <th>ID jogador</th>
                    <th>Acessos</th>
                    <th>Saldo</th>
                    <th>Status</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                <tr v-if="loadingUsers && !users.length">
                    <td colspan="14" class="adm-td-empty">Carregando...</td>
                </tr>
                <tr v-else-if="!users.length">
                    <td colspan="14" class="adm-td-empty">Nenhum usuário encontrado.</td>
                </tr>
                <tr v-for="u in users" :key="u.email">
                    <td>
                        <div class="adm-user">
                            <span class="adm-avatar" :style="avatarStyle(u.email)">
                                {{ (u.name || u.email).charAt(0).toUpperCase() }}
                            </span>
                            <div class="adm-user-info">
                                <strong>{{ u.name || "—" }}</strong>
                                <span>{{ u.email }}</span>
                            </div>
                        </div>
                    </td>
                    <td>
                        <div v-if="editingPhone === u.email" class="adm-phone-edit">
                            <input
                                v-model="phoneInput"
                                type="text"
                                placeholder="+55 DDD número"
                                @keydown.enter="savePhone(u)"
                                @keydown.esc="editingPhone = null"
                            />
                            <button class="adm-icon-btn ok" :disabled="busyEmail === u.email" @click="savePhone(u)">
                                <Icon name="ph:check-bold" />
                            </button>
                            <button class="adm-icon-btn" @click="editingPhone = null">
                                <Icon name="ph:x-bold" />
                            </button>
                        </div>
                        <div v-else class="adm-phone-cell">
                            <a v-if="u.phone" :href="waLink(u.phone)" target="_blank" class="adm-wa">
                                <Icon name="ph:whatsapp-logo-bold" /> {{ u.phone }}
                            </a>
                            <span v-else class="adm-faint">—</span>
                            <button
                                class="adm-phone-edit-btn"
                                :title="u.phone ? 'Editar telefone' : 'Adicionar telefone'"
                                @click="startEditPhone(u)"
                            >
                                <Icon :name="u.phone ? 'ph:pencil-simple-bold' : 'ph:plus-bold'" />
                            </button>
                        </div>
                    </td>
                    <td>
                        <select
                            class="adm-tag-select" :class="tagClass(u.risk_tag)"
                            :value="u.tag_override"
                            @change="updateTag(u, ($event.target as HTMLSelectElement).value)"
                        >
                            <option value="auto">Automática</option>
                            <option value="risk_24h">24h</option>
                            <option value="risk_48h">48h+</option>
                            <option value="risk_no_access">Pago nunca acessou</option>
                            <option value="none">Sem tag</option>
                        </select>
                    </td>
                    <td>
                        <select
                            class="adm-status-select" :class="`st-${u.contact_status}`"
                            :value="u.contact_status"
                            @change="updateStatus(u, ($event.target as HTMLSelectElement).value)"
                        >
                            <option value="pendente">Pendente</option>
                            <option value="contatado">Contatado</option>
                            <option value="respondeu">Respondeu</option>
                            <option value="convertido">Convertido</option>
                            <option value="ignorado">Ignorado</option>
                        </select>
                    </td>
                    <td>
                        <span class="adm-pill" :class="u.subscription === 'paid' ? 'pill-paid' : 'pill-free'">
                            {{ u.subscription === "paid" ? "Pago" : "Free" }}
                        </span>
                    </td>
                    <td>
                        <span v-if="u.deposits_count">{{ u.deposits_count }} · {{ fmtMoney(u.deposits_sum) }}</span>
                        <span v-else class="adm-faint">0</span>
                    </td>
                    <td>{{ u.brand_slug || "—" }}</td>
                    <td class="adm-date">{{ fmtDate(u.first_seen_at) }}</td>
                    <td class="adm-date">{{ fmtDate(u.last_seen_at) }}</td>
                    <td>{{ u.cactus_user_id ?? "—" }}</td>
                    <td>{{ u.access_count || 1 }}</td>
                    <td>{{ u.last_known_balance == null ? "—" : fmtMoney(u.last_known_balance) }}</td>
                    <td>
                        <span class="adm-pill" :class="u.blocked ? 'pill-blocked' : 'pill-active'">
                            {{ u.blocked ? "Bloqueado" : "Ativo" }}
                        </span>
                    </td>
                    <td>
                        <button
                            class="adm-icon-btn"
                            :title="u.blocked ? 'Desbloquear' : 'Bloquear'"
                            :disabled="busyEmail === u.email"
                            @click="askBlock(u)"
                        >
                            <Icon :name="u.blocked ? 'ph:lock-open-bold' : 'ph:lock-bold'" />
                        </button>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>

    <div v-if="users.length < usersTotal" class="adm-more">
        <button class="adm-btn-ghost" :disabled="loadingUsers" @click="fetchUsers(true)">
            Carregar mais ({{ users.length }}/{{ usersTotal }})
        </button>
    </div>
</section>

<!-- Depósitos -->

  <!-- Modal de bloqueio -->

<!-- Modal bloqueio -->
<Teleport to="body">
    <div v-if="blockTarget" class="adm-modal-overlay" @click.self="blockTarget = null">
        <div class="adm-modal">
            <Icon :name="blockTarget.blocked ? 'ph:lock-open-bold' : 'ph:lock-bold'" class="adm-modal-ic" />
            <h3>{{ blockTarget.blocked ? "Desbloquear" : "Bloquear" }} usuário</h3>
            <p>{{ blockTarget.email }}</p>
            <div class="adm-modal-actions">
                <button class="adm-btn-ghost" @click="blockTarget = null">Cancelar</button>
                <button class="adm-btn-primary" :disabled="busyEmail" @click="confirmBlock">Confirmar</button>
            </div>
        </div>
    </div>
</Teleport>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'admin', layout: 'admin' })

const { adminFetch, needsLogin } = useAdmin()
const {
  users, usersTotal, brands, loadingUsers,
  search, riskFilter, subFilter, statusFilter, brandFilter, firstAccessFilter, dateFrom, dateTo,
  showToast, fetchUsers, fetchStats
} = useAdminData()

const PAGE = USERS_PAGE_SIZE
const busyEmail = ref<string | null>(null)
const blockTarget = ref<AppUser | null>(null)
const exporting = ref(false)
const searchInput = ref<HTMLInputElement | null>(null)
const editingPhone = ref<string | null>(null)
const phoneInput = ref("")

const riskChips = [
    { value: "", label: "Todos" },
    { value: "24h", label: "Risco 24h" },
    { value: "48h", label: "Risco 48h+" },
    { value: "no_access", label: "Pago s/ acesso" },
];

const startEditPhone = (u: AppUser) => {
    editingPhone.value = u.email;
    phoneInput.value = u.phone || "";
};
const savePhone = async (u: AppUser) => {
    busyEmail.value = u.email;
    try {
        const phone = phoneInput.value.trim();
        await adminFetch("/api/admin/users/phone", {
            method: "POST",
            body: { email: u.email, phone },
        });
        u.phone = phone || null;
        editingPhone.value = null;
        showToast("Telefone salvo.");
    } catch {
        showToast("Erro ao salvar telefone.", "error");
    } finally {
        busyEmail.value = null;
    }
};

// --- Toast ---
const toast = ref("");
const toastType = ref<"ok" | "error">("ok");

const waLink = (phone: string) => `https://wa.me/${phone.replace(/\D/g, "")}`;

const avatarStyle = (email: string) => {
    let h = 0;
    for (let i = 0; i < email.length; i++) h = (h * 31 + email.charCodeAt(i)) % 360;
    return { background: `linear-gradient(135deg, hsl(${h} 70% 45%), hsl(${(h + 40) % 360} 70% 35%))` };
};

const tagClass = (tag: string | null) =>
    tag === "risk_24h" ? "tag-24" : tag === "risk_48h" ? "tag-48" : tag === "risk_no_access" ? "tag-na" : "tag-none";

const effectiveTag = (ov: string, auto: string | null) =>
    ov === "none" ? null : ov === "auto" ? auto : (ov as AppUser["risk_tag"]);

// --- Fetchers ---

// Busca com debounce; os demais filtros recarregam direto.
let searchTimer: ReturnType<typeof setTimeout> | null = null;
watch(search, () => {
    if (searchTimer) clearTimeout(searchTimer);
    searchTimer = setTimeout(() => fetchUsers(), 300);
});
watch([riskFilter, subFilter, statusFilter, brandFilter, firstAccessFilter, dateFrom, dateTo], () => fetchUsers());

const setRisk = (v: string) => { riskFilter.value = v; };
// --- Ações de linha ---
const updateStatus = async (u: AppUser, value: string) => {
    const prev = u.contact_status;
    u.contact_status = value as AppUser["contact_status"];
    try {
        await adminFetch("/api/admin/users/status", { method: "POST", body: { email: u.email, status: value } });
    } catch {
        u.contact_status = prev;
        showToast("Erro ao salvar status.", "error");
    }
};

const updateTag = async (u: AppUser, value: string) => {
    const a = u.tag_override, b = u.risk_tag;
    u.tag_override = value as AppUser["tag_override"];
    u.risk_tag = effectiveTag(value, u.auto_risk_tag);
    try {
        await adminFetch("/api/admin/users/tag", { method: "POST", body: { email: u.email, tag: value } });
        fetchStats();
    } catch {
        u.tag_override = a; u.risk_tag = b;
        showToast("Erro ao salvar tag.", "error");
    }
};

const askBlock = (u: AppUser) => { blockTarget.value = u; };
const confirmBlock = async () => {
    const u = blockTarget.value;
    if (!u) return;
    busyEmail.value = u.email;
    try {
        await adminFetch("/api/admin/users/block", { method: "POST", body: { email: u.email, blocked: !u.blocked } });
        u.blocked = !u.blocked;
        showToast(u.blocked ? "Usuário bloqueado." : "Usuário desbloqueado.");
        blockTarget.value = null;
    } catch {
        showToast("Erro ao atualizar bloqueio.", "error");
    } finally {
        busyEmail.value = null;
    }
};


const exportCsv = async () => {
    exporting.value = true;
    try {
        const blob = await adminFetch<Blob>("/api/admin/users/export", {
            params: {
                search: search.value.trim(), risk: riskFilter.value, subscription: subFilter.value,
                status: statusFilter.value, brand: brandFilter.value,
            },
            responseType: "blob",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "usuarios-melyn.csv";
        a.click();
        URL.revokeObjectURL(url);
    } catch {
        showToast("Erro ao exportar.", "error");
    } finally {
        exporting.value = false;
    }
};

// --- Atalhos ---
const onKey = (e: KeyboardEvent) => {
    if (e.key === "/" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        searchInput.value?.focus();
    } else if (e.key === "Escape") {
        blockTarget.value = null;
    }
};


onMounted(() => {
  if (!needsLogin.value) fetchUsers()
  window.addEventListener("keydown", onKey)
})
onBeforeUnmount(() => window.removeEventListener("keydown", onKey))
</script>

<style>
@import "~/assets/css/admin-theme.css";
</style>
