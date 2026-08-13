import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { BASE, png } from './_helpers.mjs'

const requireFrom = process.env.PLAYWRIGHT_ROOT
  ? createRequire(`${process.env.PLAYWRIGHT_ROOT.replace(/[/\\]$/, '')}/package.json`)
  : createRequire(import.meta.url)
const { chromium } = requireFrom('playwright-core')
const chrome = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const browser = await chromium.launch({ executablePath: chrome, headless: true })
const context = await browser.newContext({ viewport: { width: 1440, height: 950 } })
const page = await context.newPage()
const pageErrors = []
let originalConfig
page.on('pageerror', error => pageErrors.push(String(error)))

try {
  await page.goto(`${BASE}/admin/visual`, { waitUntil: 'domcontentloaded', timeout: 120000 })
  await page.waitForTimeout(1500)
  const email = page.locator('input[type=email]').first()
  if (await email.isVisible().catch(() => false)) {
    await email.fill(process.env.VERIFY_ADMIN_EMAIL || 'devhypegaming@gmail.com')
    await page.locator('input[type=password]').first().fill(process.env.VERIFY_ADMIN_PASSWORD || 'Rainha@Adm2026')
    await page.locator('button[type=submit]').first().click()
  }

  await page.locator('.tabs').waitFor({ timeout: 60000 })
  originalConfig = await page.evaluate(async () => (await (await fetch('/api/app-config')).json()).data)
  assert.equal(await page.locator('.tab').count(), 8)
  await page.locator('.tab', { hasText: 'Mídia' }).click()
  await page.waitForTimeout(300)
  assert.match(page.url(), /[?&]tab=midia(?:&|$)/)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.locator('.tab.ativa', { hasText: 'Mídia' }).waitFor()

  const logo = page.locator('.media-field', { hasText: 'Logo' }).first()
  await logo.locator('input[type=file]').setInputFiles({ name: 'logo-e2e.png', mimeType: 'image/png', buffer: png })
  await logo.locator('img.preview').waitFor({ timeout: 30000 })
  const src = await logo.locator('img.preview').getAttribute('src')
  assert.match(src, /^\/api\/media\/[a-f\d]{24}$/)

  const favicon = page.locator('.media-field', { hasText: 'Favicon' }).first()
  await favicon.locator('input[type=file]').setInputFiles({ name: 'falso.png', mimeType: 'image/png', buffer: Buffer.from('falso') })
  await favicon.locator('.erro-msg').waitFor({ timeout: 30000 })
  assert.match(await favicon.locator('.erro-msg').textContent(), /Formato não suportado/)

  const premium = page.locator('.media-field', { hasText: 'Imagem premium' }).first()
  await premium.locator('.dropzone').evaluate((element) => {
    const transfer = new DataTransfer()
    transfer.items.add(new File(['<svg xmlns="http://www.w3.org/2000/svg"></svg>'], 'drop.svg', { type: 'image/svg+xml' }))
    element.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: transfer }))
  })
  await premium.locator('img.preview').waitFor({ timeout: 30000 })
  assert.match(await premium.locator('img.preview').getAttribute('src'), /^\/api\/media\/[a-f\d]{24}$/)

  const live = page.locator('.media-field', { hasText: 'Imagem da live' }).first()
  await live.locator('input[type=file]').setInputFiles({
    name: 'grande.png', mimeType: 'image/png', buffer: Buffer.alloc(5 * 1024 * 1024 + 1)
  })
  await live.locator('.erro-msg').waitFor()
  assert.match(await live.locator('.erro-msg').textContent(), /maior que 5 MB/)

  await page.screenshot({ path: 'verify-admin-media.png', fullPage: true })
  await page.locator('.visual-topbar .primary-btn').click()
  await page.locator('.toast.ok').waitFor({ timeout: 30000 })
  const saved = await page.evaluate(async () => (await (await fetch('/api/app-config')).json()).data)
  assert.equal(saved.brand.logo, src)

  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded', timeout: 120000 })
  await page.locator(`img[src="${src}"]`).first().waitFor({ timeout: 30000 })
  await page.screenshot({ path: 'verify-home.png', fullPage: true })
  assert.deepEqual(pageErrors, [], `erros na página: ${pageErrors.join(' | ')}`)
  console.log('OK: 06-navegador')
} finally {
  if (originalConfig) {
    await page.evaluate(async (config) => {
      const token = localStorage.getItem('rdb_admin_token')
      await fetch('/api/app-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(config)
      })
      await fetch('/api/media/cleanup?graceMs=0', {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }
      })
    }, originalConfig).catch(() => {})
  }
  await browser.close()
}
