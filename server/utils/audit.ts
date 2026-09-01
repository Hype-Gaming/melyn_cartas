import { getDb } from './mongodb'

export const writeAuditLog = async (entry: {
  admin: string
  action: string
  entity: string
  entityId: string
  before?: unknown
  after?: unknown
}) => {
  const db = await getDb()
  await db.collection('admin_audit_log').insertOne({ ...entry, createdAt: new Date() })
}
