import assert from 'node:assert/strict'

export const BASE = process.env.APP_URL || 'http://127.0.0.1:3098'

export const login = async () => {
  const response = await fetch(`${BASE}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: process.env.VERIFY_ADMIN_EMAIL || 'devhypegaming@gmail.com',
      password: process.env.VERIFY_ADMIN_PASSWORD || 'Rainha@Adm2026'
    })
  })
  assert.equal(response.status, 200, 'login do admin deveria funcionar')
  return (await response.json()).token
}

export const authHeaders = token => ({ Authorization: `Bearer ${token}` })

export const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64'
)

export const upload = async (token, { name = 'imagem.png', type = 'image/png', data = png } = {}) => {
  const form = new FormData()
  form.append('file', new Blob([data], { type }), name)
  return fetch(`${BASE}/api/media`, { method: 'POST', headers: authHeaders(token), body: form })
}
