import { getMongoDb } from '@/lib/mongodb'
import type { User } from '@/lib/types'

export async function getUserByEmail(email: string): Promise<User | null> {
  const db = await getMongoDb()
  const user = await db.collection('users').findOne({ email: email.toLowerCase() })
  return user as User | null
}

export async function createUser(user: User): Promise<void> {
  const db = await getMongoDb()
  await db.collection('users').insertOne(user)
}
