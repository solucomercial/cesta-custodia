import { z } from 'zod'

const truthy = new Set(['1', 'true', 'yes', 'on'])
const falsy = new Set(['0', 'false', 'no', 'off'])

function parseBoolean(value: string | undefined) {
  if (value == null) return null
  const normalized = value.trim().toLowerCase()
  if (truthy.has(normalized)) return true
  if (falsy.has(normalized)) return false
  return null
}

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).optional(),

    DATABASE_URL: z.string().min(1, 'DATABASE_URL obrigatoria'),
    DATABASE_SSL: z.string().optional(),
    DATABASE_SSL_REJECT_UNAUTHORIZED: z.string().optional(),

    AUTH_TOKEN_SECRET: z.string().min(32, 'AUTH_TOKEN_SECRET deve ter pelo menos 32 caracteres'),
    AUTH_TOKEN_TTL_SECONDS: z.string().optional(),

    FRONTEND_ORIGIN: z.string().optional(),

    SMTP_HOST: z.string().optional(),
    SMTP_FROM: z.string().optional(),
    SMTP_PORT: z.string().optional(),
    SMTP_SECURE: z.string().optional(),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    const isProd = (value.NODE_ENV ?? 'development') === 'production'

    if (isProd) {
      if (!value.SMTP_HOST) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['SMTP_HOST'], message: 'SMTP_HOST obrigatoria em producao' })
      }
      if (!value.SMTP_FROM) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['SMTP_FROM'], message: 'SMTP_FROM obrigatoria em producao' })
      }
    }

    if (value.SMTP_USER && !value.SMTP_PASS) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['SMTP_PASS'], message: 'SMTP_PASS obrigatoria quando SMTP_USER estiver definido' })
    }
  })

export const env = envSchema.parse(process.env)

export const isProduction = (env.NODE_ENV ?? 'development') === 'production'

export const databaseSslEnabled = (() => {
  const parsed = parseBoolean(env.DATABASE_SSL)
  if (parsed !== null) return parsed
  return isProduction
})()

export const databaseSslRejectUnauthorized = (() => {
  const parsed = parseBoolean(env.DATABASE_SSL_REJECT_UNAUTHORIZED)
  if (parsed !== null) return parsed
  return true
})()
