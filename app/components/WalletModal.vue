<template>
  <Teleport to="body">
    <div v-if="open" class="wallet-overlay" @click.self="closeWallet" @keydown.esc="closeWallet">
      <section ref="dialog" class="wallet-modal" role="dialog" aria-modal="true" aria-labelledby="wallet-title" tabindex="-1">
        <button ref="closeButton" type="button" class="wallet-close" aria-label="Fechar carteira" @click="closeWallet">
          <Icon name="ph:x-bold" />
        </button>

        <p class="wallet-kicker">Sua carteira</p>
        <h2 id="wallet-title">{{ formattedBalance }}</h2>
        <p class="wallet-hint">Saldo disponível na sua conta da casa.</p>

        <div class="wallet-actions">
          <button type="button" class="wallet-action" @click="deposit">
            <Icon name="ph:arrow-circle-down-bold" aria-hidden="true" /> Depositar
          </button>
          <a
            :href="withdrawUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="wallet-action ghost"
            @click="closeWallet"
          >
            <Icon name="ph:arrow-circle-up-bold" aria-hidden="true" /> Sacar
          </a>
        </div>
      </section>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { getBrand } from '../../shared/brands'

const { open, closeWallet } = useWalletModal()
const { formattedBalance, brandSlug, isAuthenticated } = useAuth()
const { openModal: openDepositModal } = useDeposit()

const dialog = ref<HTMLElement | null>(null)
const closeButton = ref<HTMLElement | null>(null)

// O saque acontece na casa, não no app: abre o painel da marca em nova aba.
const withdrawUrl = computed(() => getBrand(brandSlug.value).withdrawUrl)

const deposit = () => {
  closeWallet()
  if (!isAuthenticated.value) return navigateTo({ path: '/auth/login', query: { redirect: '/' } })
  openDepositModal()
}

watch(open, async value => {
  if (!value) return
  await nextTick()
  ;(closeButton.value || dialog.value)?.focus()
})
</script>

<style scoped>
.wallet-overlay {
  position: fixed;
  inset: 0;
  z-index: 9998;
  display: grid;
  place-items: center;
  padding: 16px;
  background: rgb(3 4 10 / 80%);
  backdrop-filter: blur(7px);
}

.wallet-modal {
  position: relative;
  display: grid;
  justify-items: center;
  gap: 6px;
  width: min(400px, 100%);
  padding: 34px 24px 24px;
  border: 1px solid color-mix(in srgb, var(--accent) 32%, var(--card-border));
  border-radius: 26px;
  background: linear-gradient(145deg, color-mix(in srgb, var(--card-bg) 94%, transparent), var(--bg-darker));
  box-shadow: 0 30px 90px rgb(0 0 0 / 55%);
  color: var(--text-main);
  outline: none;
  text-align: center;
}

.wallet-close {
  position: absolute;
  top: 14px;
  right: 14px;
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border: 1px solid var(--card-border);
  border-radius: 10px;
  background: var(--component-bg);
  color: var(--text-main);
  cursor: pointer;
}

.wallet-kicker { color: var(--accent-soft); font-size: 11px; font-weight: 900; letter-spacing: .14em; text-transform: uppercase; }
h2 { font-size: clamp(28px, 7vw, 38px); }
.wallet-hint { margin-bottom: 18px; color: var(--text-muted); font-size: 13px; }

.wallet-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; width: 100%; }
.wallet-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 48px;
  border: 0;
  border-radius: 13px;
  background: var(--accent);
  color: #fff;
  font: inherit;
  font-weight: 800;
  text-decoration: none;
  cursor: pointer;
}
.wallet-action.ghost { border: 1px solid var(--card-border); background: var(--component-bg); color: var(--text-main); }
:focus-visible { outline: 3px solid var(--accent-soft); outline-offset: 2px; }

@media (max-width: 380px) { .wallet-actions { grid-template-columns: 1fr; } }
</style>
