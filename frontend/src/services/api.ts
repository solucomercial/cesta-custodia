const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333'

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })

  const body = await response.json().catch(() => null)

  if (!response.ok) {
    const message = body && typeof body === 'object' && 'error' in body
      ? String(body.error)
      : 'Erro ao comunicar com a API'

    throw new ApiError(message, response.status)
  }

  return body as T
}

export type LoginRequest = {
  email?: string
  identifier?: string
  password: string
  role?: 'ADMIN' | 'FISCAL_SEAP' | 'COMPRADOR' | 'OPERADOR'
}

export type LoginResponse = {
  token: string
  user: {
    id: string
    email: string
    role: string
    email_verified_at: string | null
  }
}

export function login(payload: LoginRequest) {
  return request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export type MagicLinkRequest = {
  cpf?: string
  oab?: string
  matricula?: string
}

export function requestMagicLink(payload: MagicLinkRequest) {
  return request<{ ok: true }>('/auth/magic-link', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function getProducts(category?: string, unitId?: string) {
  const params = new URLSearchParams()
  if (category) params.append('category', category)
  if (unitId) params.append('unit_id', unitId)

  const queryString = params.toString()
  return request<any[]>(`/products${queryString ? `?${queryString}` : ''}`)
}

export function getPrisonUnits() {
  return request<any[]>('/prison-units')
}

export function searchInmate(registration: string) {
  const params = new URLSearchParams({ registration })
  return request<any>(`/inmates/search?${params.toString()}`)
}

export function createOrder(payload: any) {
  return request<{ id: string; sipen_protocol: string }>('/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
