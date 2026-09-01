<template>
<section class="adm-section adm-panel">
    <div class="adm-panel-head">
        <h2><Icon name="ph:hand-coins-bold" /> Depósitos</h2>
    </div>
    <div class="adm-table-wrap adm-scroll">
        <table class="adm-table">
            <thead>
                <tr><th>E-mail</th><th>Valor</th><th>Transação</th><th>Marca</th><th>FTD</th><th>Status</th><th>Data</th></tr>
            </thead>
            <tbody>
                <tr v-if="!deposits.length">
                    <td colspan="7" class="adm-td-empty">Nenhum depósito registrado.</td>
                </tr>
                <tr v-for="(d, i) in deposits" :key="i">
                    <td>{{ d.email }}</td>
                    <td>{{ fmtMoney(d.amount) }}</td>
                    <td>{{ d.transaction_id || "—" }}</td>
                    <td>{{ d.brand_slug || "—" }}</td>
                    <td>{{ d.is_ftd ? "Sim" : "—" }}</td>
                    <td>{{ d.status || "—" }}</td>
                    <td class="adm-date">{{ fmtDate(d.created_at) }}</td>
                </tr>
            </tbody>
        </table>
    </div>
</section>

<!-- Registrar FTD -->
<section class="adm-section adm-panel">
    <div class="adm-panel-head">
        <h2><Icon name="ph:plus-circle-bold" /> Registrar FTD (1º depósito)</h2>
    </div>
    <div class="adm-ftd">
        <input v-model="ftd.email" type="email" placeholder="email@cliente.com" class="adm-input" />
        <input v-model.number="ftd.amount" type="number" min="1" step="0.01" placeholder="Valor (R$)" class="adm-input" />
        <button class="adm-btn-primary" :disabled="savingFtd" @click="registerFtd">
            <Icon name="ph:check-bold" /> Registrar
        </button>
    </div>
</section>

<!-- Configurações -->
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'admin', layout: 'admin' })

const { adminFetch, needsLogin } = useAdmin()
const { deposits, showToast, fetchDeposits, fetchStats, fetchUsers } = useAdminData()

const ftd = reactive({ email: "", amount: null as number | null })
const savingFtd = ref(false)


const waLink = (phone: string) => `https://wa.me/${phone.replace(/\D/g, "")}`;

const registerFtd = async () => {
    if (!ftd.email || !ftd.amount) {
        showToast("Preencha e-mail e valor.", "error");
        return;
    }
    savingFtd.value = true;
    try {
        await adminFetch("/api/admin/ftd", { method: "POST", body: { email: ftd.email.trim().toLowerCase(), amount: ftd.amount } });
        showToast("FTD registrado.");
        ftd.email = ""; ftd.amount = null;
        await Promise.all([fetchStats(), fetchDeposits(), fetchUsers()]);
    } catch {
        showToast("Erro ao registrar FTD.", "error");
    } finally {
        savingFtd.value = false;
    }
};


onMounted(() => { if (!needsLogin.value) fetchDeposits() })
</script>

<style>
@import "~/assets/css/admin-theme.css";
</style>
