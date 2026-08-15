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
    console.log('Creating new MongoDB client...')
    console.log('MongoDB URI:', process.env.MONGODB_URI.replace(/:([^:@]{1,10})@/, ':****@'))
    global.__electrotrackMongoClient = new MongoClient(process.env.MONGODB_URI, {
      // Increased timeout for production use
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      // Add SSL options for better compatibility with MongoDB Atlas
      tls: true,
      tlsAllowInvalidCertificates: false,
      retryWrites: true,
      w: 'majority',
      maxPoolSize: 10,
      minPoolSize: 2,
    })
  }

  const client = global.__electrotrackMongoClient
  console.log('Connecting to MongoDB...')
  await client.connect()
  console.log('MongoDB connected successfully')
  return client
}

export async function getMongoDb() {
  const client = await getMongoClient()
  const dbName = process.env.MONGODB_DB || 'electrostack'
  console.log('Using database:', dbName)
  return client.db(dbName)
}

