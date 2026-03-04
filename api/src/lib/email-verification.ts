import crypto from 'node:crypto'
import { sql } from '@/lib/db'

const CODE_LENGTH = 6
const DEFAULT_TTL_MINUTES = 10
const DEFAULT_RESEND_SECONDS = 60
const DEFAULT_RESEND_SECONDS_DEV = 2
const DEFAULT_MAX_ATTEMPTS = 5

class CooldownError extends Error {
  retryAfterSeconds: number

  constructor(message: string, retryAfterSeconds: number) {
    super(message)
    this.retryAfterSeconds = retryAfterSeconds
  }
}

type Executor = typeof sql

type LatestVerificationRow = {
  criado_em: Date | string | null
}

type VerificationRecordRow = {
  id: string
  codigo_hash: string
  expira_em: Date | string | null
  usado_em: Date | string | null
  tentativas: number | null
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function generateCode() {
  const min = 10 ** (CODE_LENGTH - 1)
  const max = 10 ** CODE_LENGTH - 1
  return String(Math.floor(Math.random() * (max - min + 1)) + min)
}

function hashCode(code: string) {
  return crypto.createHash('sha256').update(code).digest('hex')
}

export async function createEmailVerification(email: string, executor: Executor = sql) {
  const normalizedEmail = normalizeEmail(email)
  if (!normalizedEmail) {
    throw new Error('Email obrigatorio')
  }

  const isDev = process.env.NODE_ENV !== 'production'
  const resendSeconds = Number(
    process.env.EMAIL_VERIFICATION_RESEND_SECONDS
      ?? (isDev ? DEFAULT_RESEND_SECONDS_DEV : DEFAULT_RESEND_SECONDS),
  )
  const [latest] = (await executor`
    SELECT criado_em
    FROM verificacoes_email
    WHERE email = ${normalizedEmail}
    ORDER BY criado_em DESC
    LIMIT 1
  `) as LatestVerificationRow[]

  if (latest?.criado_em) {
    const lastSent = new Date(latest.criado_em)
    const diffSeconds = (Date.now() - lastSent.getTime()) / 1000
    if (diffSeconds < resendSeconds) {
      const retryAfterSeconds = Math.max(1, Math.ceil(resendSeconds - diffSeconds))
      throw new CooldownError('Aguarde alguns segundos antes de solicitar novo codigo', retryAfterSeconds)
    }
  }

  const ttlMinutes = Number(process.env.EMAIL_VERIFICATION_TTL_MINUTES ?? DEFAULT_TTL_MINUTES)
  const code = generateCode()
  const codeHash = hashCode(code)
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000)

  await executor`
    INSERT INTO verificacoes_email (email, codigo_hash, expira_em, tentativas)
    VALUES (${normalizedEmail}, ${codeHash}, ${expiresAt.toISOString()}, 0)
  `

  return {
    code,
    expiresAt,
    ttlSeconds: ttlMinutes * 60,
    resendAfterSeconds: resendSeconds,
  }
}

export async function verifyEmailCode(email: string, code: string) {
  const normalizedEmail = normalizeEmail(email)
  const cleanCode = code.trim()

  if (!normalizedEmail || !cleanCode) {
    return { ok: false, reason: 'invalido' as const }
  }

  const codeHash = hashCode(cleanCode)
  const [record] = (await sql`
    SELECT id, codigo_hash, expira_em, usado_em, tentativas
    FROM verificacoes_email
    WHERE email = ${normalizedEmail}
    ORDER BY criado_em DESC
    LIMIT 1
  `) as VerificationRecordRow[]

  if (!record) {
    return { ok: false, reason: 'nao_encontrado' as const }
  }

  if (record.usado_em) {
    return { ok: false, reason: 'usado' as const }
  }

  if (record.expira_em && new Date(record.expira_em) < new Date()) {
    return { ok: false, reason: 'expirado' as const }
  }

  const maxAttempts = Number(process.env.EMAIL_VERIFICATION_MAX_ATTEMPTS ?? DEFAULT_MAX_ATTEMPTS)
  const attempts = Number(record.tentativas ?? 0)
  if (attempts >= maxAttempts) {
    return { ok: false, reason: 'limite_tentativas' as const }
  }

  if (record.codigo_hash !== codeHash) {
    await sql`
      UPDATE verificacoes_email
      SET tentativas = tentativas + 1
      WHERE id = ${record.id}
    `
    return { ok: false, reason: 'codigo_invalido' as const }
  }

  await sql`
    UPDATE verificacoes_email
    SET usado_em = now()
    WHERE id = ${record.id}
  `

  return { ok: true as const }
}

export function isCooldownError(error: unknown): error is CooldownError {
  return error instanceof CooldownError
}
