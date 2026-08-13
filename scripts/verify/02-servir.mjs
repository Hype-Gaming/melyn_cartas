import assert from 'node:assert/strict'
import { BASE, login, upload } from './_helpers.mjs'

const token = await login()
const uploaded = await upload(token)
assert.equal(uploaded.status, 200)
const { url } = await uploaded.json()

const response = await fetch(`${BASE}${url}`)
assert.equal(response.status, 200)
assert.equal(response.headers.get('content-type'), 'image/png')
assert.equal(response.headers.get('cache-control'), 'public, max-age=31536000, immutable')
assert.equal(response.headers.get('x-content-type-options'), 'nosniff')
assert.equal(response.headers.get('content-security-policy'), "default-src 'none'; style-src 'unsafe-inline'")
const etag = response.headers.get('etag')
assert.ok(etag)

const cached = await fetch(`${BASE}${url}`, { headers: { 'If-None-Match': etag } })
assert.equal(cached.status, 304)
assert.equal((await fetch(`${BASE}/api/media/invalido`)).status, 400)
assert.equal((await fetch(`${BASE}/api/media/000000000000000000000000`)).status, 404)

console.log('OK: 02-servir')
