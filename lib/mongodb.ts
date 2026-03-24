import mongoose from 'mongoose'
import { getAppConfig } from './config'

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  console.warn('MONGODB_URI not set — database features disabled')
}

interface MongooseCache {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
  dbName: string | null
}

declare global {
  var mongoose: MongooseCache | undefined
}

const cached: MongooseCache = global.mongoose ?? { conn: null, promise: null, dbName: null }
global.mongoose = cached

export async function connectDB() {
  if (!MONGODB_URI) throw new Error('MONGODB_URI environment variable is not set')

  const { mongoDbName } = getAppConfig()

  // Reconnect if the database name has changed since the last connection
  if (cached.conn && cached.dbName !== mongoDbName) {
    try { await mongoose.disconnect() } catch { /* ignore */ }
    cached.conn = null
    cached.promise = null
    cached.dbName = null
  }

  if (cached.conn) return cached.conn

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      dbName: mongoDbName,
    })
  }

  cached.conn = await cached.promise
  cached.dbName = mongoDbName
  return cached.conn
}
