import assert from 'node:assert/strict'
import { BASE, authHeaders, login, upload } from './_helpers.mjs'

const token = await login()
const auth = authHeaders(token)
const original = (await (await fetch(`${BASE}/api/app-config`)).json()).data

const subir = async (name) => {
  const response = await upload(token, { name })
  assert.equal(response.status, 200)
  return (await response.json()).url
}
const vive = async url => (await fetch(`${BASE}${url}`)).status === 200

const usado = await subir('usado.png')
const orfao1 = await subir('orfao-1.png')
const orfao2 = await subir('orfao-2.png')

try {
  const save = await fetch(`${BASE}/api/app-config`, {
    method: 'PUT', headers: { ...auth, 'Content-Type': 'application/json' },
    body: JSON.stringify({ brand: { logo: usado } })
  })
  assert.equal(save.status, 200)
  assert.ok(await vive(usado))
  assert.ok(await vive(orfao1), 'órfão recente deve sobreviver à janela padrão')

  assert.equal((await fetch(`${BASE}/api/media/cleanup`, { method: 'POST' })).status, 401)
  const protectedCleanup = await fetch(`${BASE}/api/media/cleanup`, { method: 'POST', headers: auth })
  assert.equal(protectedCleanup.status, 200)
  assert.equal((await protectedCleanup.json()).removidos, 0)

  const immediate = await fetch(`${BASE}/api/media/cleanup?graceMs=0`, { method: 'POST', headers: auth })
  assert.equal(immediate.status, 200)
  assert.ok((await immediate.json()).removidos >= 2)
  assert.ok(await vive(usado))
  assert.equal(await vive(orfao1), false)
  assert.equal(await vive(orfao2), false)
} finally {
  await fetch(`${BASE}/api/app-config`, {
    method: 'PUT', headers: { ...auth, 'Content-Type': 'application/json' }, body: JSON.stringify(original)
  })
  await fetch(`${BASE}/api/media/cleanup?graceMs=0`, { method: 'POST', headers: auth })
}

console.log('OK: 03-orfaos')
