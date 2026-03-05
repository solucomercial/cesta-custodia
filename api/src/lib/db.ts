import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '@/lib/db/schema'
import { databaseSslEnabled, databaseSslRejectUnauthorized, env } from '@/lib/env'

const client = postgres(env.DATABASE_URL, {
  ssl: require,
  connect_timeout: 30,
  prepare: false,
})

export const db = drizzle(client, { schema })
export const sql = client
