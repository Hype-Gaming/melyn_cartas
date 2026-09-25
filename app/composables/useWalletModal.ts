/** Modal da carteira, aberto pela barra inferior e pela home. */
const open = ref(false)

export const useWalletModal = () => ({
  open: readonly(open),
  openWallet: () => { open.value = true },
  closeWallet: () => { open.value = false }
})
