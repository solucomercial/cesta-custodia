const DEFAULT_TOKEN_TTL_SECONDS = 60 * 60 * 8

export const AUTH_TOKEN_TTL_SECONDS = Number(
  process.env.AUTH_TOKEN_TTL_SECONDS ?? DEFAULT_TOKEN_TTL_SECONDS,
)

type AuthTokenPayload = {
  userId: string
  email: string
  role: string
  emailVerifiedAt: string | null
  iat: number
  exp: number
}

const textEncoder = new TextEncoder()

function getSecret() {
  const secret = process.env.AUTH_TOKEN_SECRET
  if (!secret) {
    throw new Error('AUTH_TOKEN_SECRET obrigatorio')
  }
  return secret
}

function base64UrlEncode(data: Uint8Array) {
  return Buffer.from(data)
    .toString('base64')
    .replace(/=+$/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

function base64UrlEncodeJson(payload: unknown) {
  return base64UrlEncode(textEncoder.encode(JSON.stringify(payload)))
}

async function signHmac(message: string, secret: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    textEncoder.encode(message),
  )

  return base64UrlEncode(new Uint8Array(signature))
}

export async function createAuthToken(payload: {
  userId: string
  email: string
  role: string
  emailVerifiedAt: string | null
}) {
  const now = Math.floor(Date.now() / 1000)

  const body: AuthTokenPayload = {
    ...payload,
    iat: now,
    exp: now + AUTH_TOKEN_TTL_SECONDS,
  }

  const header = base64UrlEncodeJson({ alg: 'HS256', typ: 'JWT' })
  const encodedPayload = base64UrlEncodeJson(body)
  const message = `${header}.${encodedPayload}`
  const signature = await signHmac(message, getSecret())

  return `${message}.${signature}`
}
