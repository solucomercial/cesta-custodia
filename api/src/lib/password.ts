import bcrypt from 'bcryptjs'

const DEFAULT_BCRYPT_COST = 12

function getBcryptCost() {
  const raw = process.env.BCRYPT_COST
  if (!raw) return DEFAULT_BCRYPT_COST

  const parsed = Number(raw)
  if (!Number.isFinite(parsed) || parsed < 10 || parsed > 15) {
    return DEFAULT_BCRYPT_COST
  }

  return parsed
}

export function isBcryptHash(value: string) {
  return value.startsWith('$2a$') || value.startsWith('$2b$') || value.startsWith('$2y$')
}

export async function hashPassword(plain: string) {
  const cost = getBcryptCost()
  return bcrypt.hash(plain, cost)
}

export async function verifyPassword(plain: string, hash: string) {
  if (!hash || !isBcryptHash(hash)) return false
  return bcrypt.compare(plain, hash)
}
