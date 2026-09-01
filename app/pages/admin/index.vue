<template>
  <section class="adm-cards">
    <div class="adm-card adm-fade-up">
      <Icon name="ph:users-three-bold" class="adm-card-ic" />
      <div class="adm-card-val">{{ fmtInt(dTotal) }}</div>
      <div class="adm-card-lbl">Usuários</div>
    </div>
    <div class="adm-card adm-fade-up">
      <Icon name="ph:pulse-bold" class="adm-card-ic" />
      <div class="adm-card-val">{{ fmtInt(dActive) }}</div>
      <div class="adm-card-lbl">Ativos 48h</div>
    </div>
    <div class="adm-card adm-fade-up">
      <Icon name="ph:hand-coins-bold" class="adm-card-ic" />
      <div class="adm-card-val">{{ fmtInt(dPix) }}</div>
      <div class="adm-card-lbl">PIX gerados</div>
    </div>
    <div class="adm-card adm-fade-up">
      <Icon name="ph:currency-circle-dollar-bold" class="adm-card-ic" />
      <div class="adm-card-val">{{ fmtMoney(dValue) }}</div>
      <div class="adm-card-lbl">Valor total</div>
    </div>
    <div class="adm-card adm-fade-up">
      <Icon name="ph:percent-bold" class="adm-card-ic" />
      <div class="adm-card-val">{{ fmtPct(dConv) }}</div>
      <div class="adm-card-lbl">Conversão</div>
    </div>
    <div class="adm-card adm-fade-up">
      <Icon name="ph:user-plus-bold" class="adm-card-ic" />
      <div class="adm-card-val">{{ fmtInt(dNew7) }}</div>
      <div class="adm-card-lbl">Novos 7d</div>
    </div>
    <div class="adm-card adm-fade-up">
      <Icon name="ph:receipt-bold" class="adm-card-ic" />
      <div class="adm-card-val">{{ fmtMoney(dTicket) }}</div>
      <div class="adm-card-lbl">Ticket médio</div>
    </div>
    <!-- Antes rolava ate a tabela na mesma pagina; agora leva para a rota de
         usuarios ja com o filtro de risco aplicado. -->
    <button class="adm-card adm-card-risk adm-fade-up" @click="verEmRisco">
      <Icon name="ph:warning-octagon-bold" class="adm-card-ic" />
      <div class="adm-card-val">{{ fmtInt(dRisk) }}</div>
      <div class="adm-card-lbl">Em risco</div>
    </button>
  </section>

  <section class="adm-section">
    <AdminActivityChart :days="activityDays" :loading="loadingActivity" :error="activityError" />
  </section>

  <section class="adm-section adm-panel">
    <div class="adm-panel-head"><h2><Icon name="ph:gear-six-bold" /> Configurações</h2></div>
    <label class="adm-field-label" for="support-input">WhatsApp de suporte (link ou número)</label>
    <div class="adm-ftd">
      <input id="support-input" v-model="supportInput" type="text" class="adm-input" placeholder="https://wa.me/message/XXXX ou 5571993870957" />
      <button class="adm-btn-primary" :disabled="savingSupport" @click="saveSupport">
        <Icon name="ph:check-bold" /> Salvar
      </button>
    </div>
    <p class="adm-field-hint">
      Botão "Falar com o suporte" na tela de bloqueio.
      <a v-if="supportHref" :href="supportHref" target="_blank" rel="noopener noreferrer" class="adm-wa">
        <Icon name="ph:whatsapp-logo-bold" /> testar link
      </a>
    </p>
  </section>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'admin', layout: 'admin' })

const { needsLogin } = useAdmin()
const {
  metrics, riskFilter,
  activityDays, loadingActivity, activityError,
  supportInput, supportHref, savingSupport, saveSupport,
  fetchStats, fetchActivity, fetchSupport
} = useAdminData()

const dTotal = useCountUp(() => metrics.totalUsers)
const dActive = useCountUp(() => metrics.active48h)
const dPix = useCountUp(() => metrics.depositsCount)
const dValue = useCountUp(() => metrics.depositsSum)
const dConv = useCountUp(() => metrics.conversionRate)
const dNew7 = useCountUp(() => metrics.new7d)
const dTicket = useCountUp(() => metrics.avgTicket)
const dRisk = useCountUp(() => metrics.atRisk)


const verEmRisco = () => {
  riskFilter.value = 'any'
  navigateTo('/admin/usuarios')
}

onMounted(() => {
  // O portao de login dispara refreshAll pelo layout; aqui so evitamos o 401.
  if (!needsLogin.value) Promise.all([fetchStats(), fetchActivity(), fetchSupport()])
})
</script>

<style>
@import "~/assets/css/admin-theme.css";
</style>
