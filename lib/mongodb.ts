import { MongoClient } from 'mongodb'

const uri = process.env.MONGODB_URI

if (!uri) {
  // This module is imported by API routes only; fail fast there.
  // (Do not throw at build time for client bundles.)
}

declare global {
  // eslint-disable-next-line no-var
  var __electrotrackMongoClient: MongoClient | undefined
}

export async function getMongoClient(): Promise<MongoClient> {
  if (!process.env.MONGODB_URI) {
    throw new Error('Missing MONGODB_URI')
  }

  if (!global.__electrotrackMongoClient) {
    global.__electrotrackMongoClient = new MongoClient(process.env.MONGODB_URI, {
      // Fail fast in dev when Mongo isn't running.
      serverSelectionTimeoutMS: 2500,
      connectTimeoutMS: 2500,
    })
  }

  const client = global.__electrotrackMongoClient
  await client.connect()
  return client
}

export async function getMongoDb() {
  const client = await getMongoClient()
  const dbName = process.env.MONGODB_DB || 'electrotrack'
  return client.db(dbName)
}

