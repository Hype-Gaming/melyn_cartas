<template>
  <div class="links-page">
    <header class="page-header">
      <span class="header-icon" aria-hidden="true"><Icon name="ph:link-bold" /></span>
      <div>
        <h1>{{ config.content.linksTitle || 'Links Úteis' }}</h1>
        <p>Conecte-se com nossa comunidade</p>
      </div>
    </header>

    <section class="links-grid" aria-label="Links úteis">
      <a
        v-for="link in visibleLinks"
        :key="link.key"
        :href="link.url"
        class="link-card"
        :class="link.brand"
        target="_blank"
        rel="noopener noreferrer"
      >
        <span class="card-icon" aria-hidden="true"><Icon :name="link.icon" /></span>
        <span class="card-content">
          <strong>{{ link.title }}</strong>
          <small>{{ link.description }}</small>
        </span>
        <span class="card-arrow" aria-hidden="true"><Icon name="ph:arrow-right-bold" /></span>
      </a>

      <div v-if="!visibleLinks.length" class="empty-state">
        <Icon name="ph:link-break-fill" class="empty-icon" aria-hidden="true" />
        <p>Nenhum link configurado ainda.</p>
        <small>Os endereços são preenchidos em /admin/visual, na aba Links.</small>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const { config } = useVisualConfig()

/**
 * Só links de comunidade. `register`, `checkout` e `checkoutSemGale` tambem vivem
 * em config.links, mas pertencem ao fluxo de assinatura/deposito — nao entram aqui.
 */
const CATALOG = [
  { key: 'telegram', title: 'Canal do Telegram', description: 'Receba avisos, promoções e novidades em primeira mão', icon: 'ph:telegram-logo-fill', brand: 'telegram' },
  { key: 'telegramSupport', title: 'Suporte Telegram', description: 'Tire suas dúvidas diretamente pelo Telegram', icon: 'ph:telegram-logo-fill', brand: 'telegram' },
  { key: 'whatsappSupport', title: 'Suporte WhatsApp', description: 'Atendimento rápido e personalizado via WhatsApp', icon: 'ph:whatsapp-logo-fill', brand: 'whatsapp' },
  { key: 'whatsappCommunity', title: 'Comunidade WhatsApp', description: 'Participe da nossa comunidade exclusiva de membros', icon: 'ph:users-three-fill', brand: 'whatsapp' },
  { key: 'instagram', title: 'Instagram', description: 'Siga nosso perfil no Instagram', icon: 'ph:instagram-logo-fill', brand: 'instagram' },
  { key: 'site', title: 'Site / Plataforma', description: 'Acesse nossa plataforma principal', icon: 'ph:globe-fill', brand: 'site' }
] as const

// Link vazio nao vira card morto: some da lista.
const visibleLinks = computed(() =>
  CATALOG
    .map(item => ({ ...item, url: (config.value.links as Record<string, string>)[item.key] || '' }))
    .filter(item => item.url.trim().length > 0)
)
</script>

<style scoped>
.links-page { max-width: 1100px; padding: 28px 22px 48px; }

.page-header { display: flex; align-items: center; gap: 14px; margin-bottom: 26px; }
.header-icon {
  display: grid; place-items: center;
  width: 52px; height: 52px; flex-shrink: 0;
  border-radius: 14px;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
  color: var(--text-main);
  font-size: 26px;
}
.page-header h1 { margin: 0; color: var(--text-main); font-size: 1.6rem; font-weight: 800; }
.page-header p { margin: 2px 0 0; color: var(--text-muted); font-size: .9rem; }

.links-grid { display: grid; gap: 14px; }

.link-card {
  display: grid;
  grid-template-columns: 52px 1fr 40px;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border: 1px solid color-mix(in srgb, var(--text-main) 5%, transparent);
  border-radius: 16px;
  background: color-mix(in srgb, var(--text-main) 3%, transparent);
  color: var(--text-main);
  text-decoration: none;
  transition: transform .24s cubic-bezier(.16, 1, .3, 1);
}
.link-card:hover { transform: translateY(-2px); border-color: color-mix(in srgb, var(--color-primary) 30%, transparent); }
.link-card:active { transform: scale(.995); }
.link-card:focus-visible { outline: 3px solid var(--color-primary); outline-offset: 3px; }

.card-icon { display: grid; place-items: center; width: 52px; height: 52px; border-radius: 14px; color: #fff; font-size: 26px; }
.card-content { display: grid; gap: 3px; min-width: 0; }
.card-content strong { font-size: .95rem; font-weight: 700; }
.card-content small { color: var(--text-muted); font-size: .8125rem; line-height: 1.35; }

.card-arrow {
  display: grid; place-items: center;
  width: 40px; height: 40px;
  border: 1px solid color-mix(in srgb, var(--text-main) 8%, transparent);
  border-radius: 10px;
  color: var(--text-muted);
}
.link-card:hover .card-arrow { color: var(--text-main); }

/* Cores de marca de terceiros. Sao identidade do Telegram/WhatsApp/Instagram e
   nao acompanham o tema do app — por isso ficam fixas, ao contrario do resto. */
.link-card.telegram .card-icon { background: linear-gradient(135deg, #0088cc, #0055aa); }
.link-card.whatsapp .card-icon { background: linear-gradient(135deg, #25d366, #128c7e); }
.link-card.instagram .card-icon { background: linear-gradient(135deg, #f58529, #dd2a7b, #8134af); }
.link-card.site .card-icon { background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark)); }

.empty-state { display: grid; justify-items: center; gap: 8px; padding: 56px 20px; border: 1px dashed color-mix(in srgb, var(--text-main) 12%, transparent); border-radius: 16px; text-align: center; }
.empty-icon { color: var(--text-muted); font-size: 40px; }
.empty-state p { margin: 0; color: var(--text-main); font-weight: 600; }
.empty-state small { color: var(--text-muted); }

@media (max-width: 640px) {
  .links-page { padding: 20px 14px 40px; }
  .link-card { grid-template-columns: 44px 1fr; gap: 12px; }
  .card-icon { width: 44px; height: 44px; border-radius: 12px; font-size: 22px; }
  .card-arrow { display: none; }
}

@media (prefers-reduced-motion: reduce) {
  .link-card { transition: none; }
  .link-card:hover, .link-card:active { transform: none; }
}
</style>
