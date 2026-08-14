import assert from 'node:assert/strict'
import { createRequire } from 'node:module'

const BASE = process.env.APP_URL || 'http://127.0.0.1:3098'
const requireFrom = process.env.PLAYWRIGHT_ROOT
  ? createRequire(`${process.env.PLAYWRIGHT_ROOT.replace(/[/\\]$/, '')}/package.json`)
  : createRequire(import.meta.url)
const { chromium } = requireFrom('playwright-core')

const theme = {
  colorPrimary: '#123456', colorPrimaryDark: '#102030',
  colorSecondary: '#abcdef', colorSecondaryDark: '#8899aa',
  bgDark: '#07111b', bgDarker: '#03070b', cardBg: '#112233',
  inputBg: '#0a1520', componentBg: '#152535', cardBorder: '#334455',
  textMain: '#fefefe', textMuted: '#aabbcc', colorGold: '#c9a227',
  colorFire: '#e65c3a', colorDanger: '#dd3344'
}

const config = {
  appId: 'main',
  brand: { name: 'Teste', description: 'Teste', keywords: 'teste', logo: null, favicon: null },
  theme,
  content: {
    newsTitle: 'Notícias', newsBadge: 'NOVO', newsHeadline: 'Notícias', primeTitle: 'Prime',
    premiumTitle: 'Premium', claudeTitle: 'Claude', linksTitle: 'Links', highlightsTitle: 'Destaques',
    depositButton: 'Depositar', subscribeButton: 'Assinar', supportTitle: 'Suporte',
    supportMessage: 'Ajuda', unlockButton: 'Liberar', accessButton: 'Acessar'
  },
  images: { banners: [], blocked: null, premium: null, live: null },
  links: {
    register: '', checkout: '', checkoutSemGale: '', whatsappSupport: '',
    whatsappCommunity: '', telegram: '', instagram: '', site: ''
  },
  features: {
    home: true, games: true, lessons: true, ranking: true,
    links: true, highlights: true, management: true, live: true
  },
  menu: [],
  maintenance: { active: false, title: '', message: '' }
}

const chrome = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const browser = await chromium.launch({ executablePath: chrome, headless: true })
const page = await browser.newPage()

try {
  await page.route('**/api/app-config', async (route) => {
    await new Promise(resolve => setTimeout(resolve, 1500))
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: config })
    })
  })

  const navigation = page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.waitForSelector('.visual-bootstrap', { state: 'visible' })
  assert.equal(await page.locator('#app').count(), 0, 'o app não deve pintar com o tema padrão')
  assert.equal(
    await page.evaluate(() => document.documentElement.classList.contains('visual-theme-ready')),
    false,
    'o tema não deve ser marcado como pronto antes da API'
  )

  await navigation
  await page.waitForSelector('#app', { state: 'attached', timeout: 10000 })
  assert.equal(await page.locator('.visual-bootstrap').count(), 0)
  assert.equal(
    await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim()),
    theme.colorPrimary
  )
  assert.equal(
    await page.evaluate(() => document.documentElement.classList.contains('visual-theme-ready')),
    true
  )

  console.log('OK: 07-tema-inicial')
} finally {
  await browser.close()
}
