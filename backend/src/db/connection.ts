import { Pool } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const normalizeDatabaseUrl = (rawValue: string | undefined) => {
  if (!rawValue) return undefined

  const trimmed = rawValue.trim()
  const match = trimmed.match(/postgres(?:ql)?:\/\/[^\s'\"]+/i)

  // Allow users to paste values like: psql 'postgresql://...'
  if (match?.[0]) {
    return match[0]
  }

  return trimmed
}

const connectionString = normalizeDatabaseUrl(process.env.DATABASE_URL)

const parseBool = (value: string | undefined, defaultValue = false) => {
  if (value === undefined) return defaultValue
  return value.toLowerCase() === 'true'
}

const useSsl = parseBool(process.env.DB_SSL, process.env.NODE_ENV === 'production')
const rejectUnauthorized = parseBool(process.env.DB_SSL_REJECT_UNAUTHORIZED, false)

const pool = connectionString
  ? new Pool({
      connectionString,
      ssl: useSsl ? { rejectUnauthorized } : undefined,
      max: parseInt(process.env.DB_POOL_MAX || '10'),
      idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT_MS || '30000'),
      connectionTimeoutMillis: parseInt(process.env.DB_CONNECT_TIMEOUT_MS || '10000'),
    })
  : new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'falaahun',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      ssl: useSsl ? { rejectUnauthorized } : undefined,
      max: parseInt(process.env.DB_POOL_MAX || '10'),
      idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT_MS || '30000'),
      connectionTimeoutMillis: parseInt(process.env.DB_CONNECT_TIMEOUT_MS || '10000'),
    })

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err)
})

if (process.env.DATABASE_URL && !connectionString?.startsWith('postgres')) {
  console.warn('⚠️ DATABASE_URL format looks invalid. Expected a postgresql:// URL.')
}

export default pool
