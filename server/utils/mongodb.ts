import { MongoClient, type Db } from 'mongodb'
import { arch, platform, release, type } from 'node:os'

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017'
const DB_NAME = process.env.MONGO_DB_NAME || 'melyn_cartas'

let client: MongoClient | null = null
let db: Db | null = null

export const getDb = async (): Promise<Db> => {
  if (db) return db

  // O driver MongoDB 7 usa `require('os')` como fallback, mas o servidor Nitro é
  // ESM. Fornecer o adaptador explicitamente mantém o build funcional em runtime.
  client = new MongoClient(MONGO_URI, {
    runtimeAdapters: { os: { arch, platform, release, type } }
  })
  await client.connect()
  db = client.db(DB_NAME)

  return db
}
