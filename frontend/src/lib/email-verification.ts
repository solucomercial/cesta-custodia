import crypto from 'crypto'
import { sql as drizzleSql } from 'drizzle-orm'
import { db } from '@/lib/db'

const CODE_LENGTH = 6
const DEFAULT_TTL_MINUTES = 10
const DEFAULT_RESEND_SECONDS = 60
const DEFAULT_MAX_ATTEMPTS = 5

class CooldownError extends Error {
  retryAfterSeconds: number

  constructor(message: string, retryAfterSeconds: number) {
    super(message)
    this.retryAfterSeconds = retryAfterSeconds
  }
}

type SqlExecutor = {
  execute: (query: ReturnType<typeof drizzleSql>) => Promise<unknown>
}

type LatestVerificationRow = {
  criado_em: Date | string | null
}

type VerificationRecordRow = {
  id: string | number
  codigo_hash: string
  expira_em: Date | string | null
  usado_em: Date | string | null
  tentativas: number | null
}

function getRows<T>(result: unknown) {
  if (Array.isArray(result)) {
    return result as T[]
  }

  if (result && typeof result === 'object' && 'rows' in result) {
    return ((result as { rows?: T[] }).rows ?? []) as T[]
  }

  return [] as T[]
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

export async function createEmailVerification(email: string, executor: SqlExecutor = db) {
  const normalizedEmail = normalizeEmail(email)
  if (!normalizedEmail) {
    throw new Error('Email obrigatorio')
  }

  const resendSeconds = Number(process.env.EMAIL_VERIFICATION_RESEND_SECONDS ?? DEFAULT_RESEND_SECONDS)
  const latestResult = await executor.execute(drizzleSql`
    SELECT criado_em
    FROM verificacoes_email
    WHERE email = ${normalizedEmail}
    ORDER BY criado_em DESC
    LIMIT 1
  `)
  const [latest] = getRows<LatestVerificationRow>(latestResult)

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

  await executor.execute(drizzleSql`
    INSERT INTO verificacoes_email (email, codigo_hash, expira_em, tentativas)
    VALUES (${normalizedEmail}, ${codeHash}, ${expiresAt.toISOString()}, 0)
  `)

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
    return { ok: false, reason: 'invalido' }
  }

  const codeHash = hashCode(cleanCode)
  const recordResult = await db.execute(drizzleSql`
    SELECT id, codigo_hash, expira_em, usado_em, tentativas
    FROM verificacoes_email
    WHERE email = ${normalizedEmail}
    ORDER BY criado_em DESC
    LIMIT 1
  `)
  const [record] = getRows<VerificationRecordRow>(recordResult)

  if (!record) {
    return { ok: false, reason: 'nao_encontrado' }
  }

  if (record.usado_em) {
    return { ok: false, reason: 'usado' }
  }

  if (record.expira_em && new Date(record.expira_em) < new Date()) {
    return { ok: false, reason: 'expirado' }
  }

  const maxAttempts = Number(process.env.EMAIL_VERIFICATION_MAX_ATTEMPTS ?? DEFAULT_MAX_ATTEMPTS)
  const attempts = Number(record.tentativas ?? 0)
  if (attempts >= maxAttempts) {
    return { ok: false, reason: 'limite_tentativas' }
  }

  if (record.codigo_hash !== codeHash) {
    await db.execute(drizzleSql`
      UPDATE verificacoes_email
      SET tentativas = tentativas + 1
      WHERE id = ${record.id}
    `)
    return { ok: false, reason: 'codigo_invalido' }
  }

  await db.execute(drizzleSql`
    UPDATE verificacoes_email
    SET usado_em = now()
    WHERE id = ${record.id}
  `)
  return { ok: true }
}

export function isCooldownError(error: unknown): error is CooldownError {
  return error instanceof CooldownError
}
