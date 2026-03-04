const DEFAULT_TOKEN_TTL_SECONDS = 60 * 60 * 8

export const AUTH_COOKIE_NAME = 'auth_token'
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
const textDecoder = new TextDecoder()

function getSecret() {
  const secret = process.env.AUTH_TOKEN_SECRET
  if (!secret) {
    throw new Error('AUTH_TOKEN_SECRET obrigatorio')
  }
  return secret
}

function base64UrlEncode(data: Uint8Array) {
  const base64 =
    typeof Buffer !== 'undefined'
      ? Buffer.from(data).toString('base64')
      : btoa(String.fromCharCode(...data))
  return base64.replace(/=+$/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

function base64UrlDecode(input: string) {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(padded, 'base64'))
  }
  const binary = atob(padded)
  return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}

function base64UrlEncodeJson(payload: unknown) {
  const json = JSON.stringify(payload)
  return base64UrlEncode(textEncoder.encode(json))
}

function base64UrlDecodeJson<T>(payload: string) {
  const data = base64UrlDecode(payload)
  const json = textDecoder.decode(data)
  return JSON.parse(json) as T
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

async function verifyHmac(message: string, signature: string, secret: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  )
  return crypto.subtle.verify(
    'HMAC',
    key,
    base64UrlDecode(signature),
    textEncoder.encode(message),
  )
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

export async function verifyAuthToken(token: string) {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [header, payload, signature] = parts
  if (!header || !payload || !signature) return null

  const isValid = await verifyHmac(`${header}.${payload}`, signature, getSecret())
  if (!isValid) return null

  const data = base64UrlDecodeJson<AuthTokenPayload>(payload)
  if (!data?.exp || data.exp < Math.floor(Date.now() / 1000)) {
    return null
  }

  return data
}

export function getAuthTokenFromCookieHeader(cookieHeader: string | null) {
  if (!cookieHeader) return null
  const parts = cookieHeader.split(';')
  for (const part of parts) {
    const [key, ...rest] = part.trim().split('=')
    if (key === AUTH_COOKIE_NAME) {
      return decodeURIComponent(rest.join('='))
    }
  }
  return null
}

export async function getAuthSessionFromRequest(request: Request) {
  const token = getAuthTokenFromCookieHeader(request.headers.get('cookie'))
  if (!token) return null
  return verifyAuthToken(token)
}
