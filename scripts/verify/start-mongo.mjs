import { createRequire } from 'node:module'

const root = process.env.VERIFY_TOOLS_ROOT
if (!root) throw new Error('VERIFY_TOOLS_ROOT não definido')
const require = createRequire(`${root.replace(/[/\\]$/, '')}/package.json`)
const { MongoMemoryServer } = require('mongodb-memory-server')

const mongo = await MongoMemoryServer.create({
  instance: { port: Number(process.env.VERIFY_MONGO_PORT || 27019) }
})
console.log(`READY ${mongo.getUri()}`)

const stop = async () => {
  await mongo.stop()
  process.exit(0)
}
process.on('SIGINT', stop)
process.on('SIGTERM', stop)
setInterval(() => {}, 1 << 30)
