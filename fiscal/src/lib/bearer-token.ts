const STORAGE_KEY = 'auth_token'

function isBrowser() {
  return (
    typeof globalThis !== 'undefined'
    && 'document' in globalThis
    && 'location' in globalThis
  )
}

function getCookieValue(name: string) {
  if (!isBrowser()) return null

  const browser = globalThis as unknown as { document: { cookie: string } }

  const parts = browser.document.cookie.split(';')
  for (const part of parts) {
    const [key, ...rest] = part.trim().split('=')
    if (key === name) {
      return decodeURIComponent(rest.join('='))
    }
  }

  return null
}

export function getBearerToken() {
  if (!isBrowser()) return null

  const browser = globalThis as unknown as {
    localStorage?: { getItem: (k: string) => string | null }
  }

  try {
    const stored = browser.localStorage?.getItem(STORAGE_KEY)
    if (stored) return stored
  } catch {
    // ignore
  }

  return getCookieValue(STORAGE_KEY)
}

export function setBearerToken(token: string, maxAgeSeconds = 60 * 60 * 8) {
  if (!isBrowser()) return

  const browser = globalThis as unknown as {
    localStorage?: { setItem: (k: string, v: string) => void }
    location: { protocol: string }
    document: { cookie: string }
  }

  try {
    browser.localStorage?.setItem(STORAGE_KEY, token)
  } catch {
    // ignore
  }

  const secure = browser.location.protocol === 'https:' ? '; Secure' : ''
  browser.document.cookie = `${STORAGE_KEY}=${encodeURIComponent(token)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax${secure}`
}

export function clearBearerToken() {
  if (!isBrowser()) return

  const browser = globalThis as unknown as {
    localStorage?: { removeItem: (k: string) => void }
    location: { protocol: string }
    document: { cookie: string }
  }

  try {
    browser.localStorage?.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }

  const secure = browser.location.protocol === 'https:' ? '; Secure' : ''
  browser.document.cookie = `${STORAGE_KEY}=; Path=/; Max-Age=0; SameSite=Lax${secure}`
}

export function readFragmentParams(hash: string) {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash
  return new URLSearchParams(raw)
}
