import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '@/lib/db/schema'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is missing')
}

const client = postgres(process.env.DATABASE_URL, {
  ssl: false,
  connect_timeout: 30,
  prepare: false,
})

export const db = drizzle(client, { schema })
export const sql = client
