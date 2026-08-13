import assert from 'node:assert/strict'
import { BASE, login, png, upload } from './_helpers.mjs'

const token = await login()

{
  const form = new FormData()
  form.append('file', new Blob([png], { type: 'image/png' }), 'sem-auth.png')
  assert.equal((await fetch(`${BASE}/api/media`, { method: 'POST', body: form })).status, 401)
}

{
  const response = await upload(token)
  assert.equal(response.status, 200, 'PNG válido deveria ser aceito')
  const body = await response.json()
  assert.match(body.url, /^\/api\/media\/[a-f\d]{24}$/)
  assert.equal(body.contentType, 'image/png')
}

assert.equal((await upload(token, { name: 'falso.png', data: Buffer.from('não é imagem') })).status, 400)
assert.equal((await upload(token, { name: 'arquivo.pdf', type: 'application/pdf', data: Buffer.from('%PDF-1.4') })).status, 400)
assert.equal((await upload(token, { name: 'grande.png', data: Buffer.concat([png, Buffer.alloc(5 * 1024 * 1024)]) })).status, 400)

{
  const response = await upload(token, {
    name: 'logo.svg', type: 'image/svg+xml', data: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>')
  })
  assert.equal(response.status, 200, 'SVG válido deveria ser aceito')
}

console.log('OK: 01-validacao')
