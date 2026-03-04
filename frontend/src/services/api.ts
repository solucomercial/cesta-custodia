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

  if (response.status === 401) {
    const authEndpoints = ['/auth/login', '/auth/register', '/auth/magic-link']
    const isAuthRequest = authEndpoints.some((endpoint) => path.startsWith(endpoint))

    if (!isAuthRequest && typeof window !== 'undefined') {
      const { pathname } = window.location
      const isOnAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register') || pathname.startsWith('/verify')

      if (!isOnAuthPage) {
        window.location.assign('/login')
      }
    }
  }

  if (!response.ok) {
    const message = body && typeof body === 'object' && 'error' in body
      ? String(body.error)
      : 'Erro ao comunicar com a API'

    throw new ApiError(message, response.status)
  }

  return body as T
}

export type RegisterPayload = {
  name: string
  email: string
  cpf: string
  rg: string
  birth_date: string
  phone: string
  address_street: string
  address_number: string
  address_complement?: string
  address_neighborhood: string
  address_city: string
  address_state: string
  address_zip_code: string
  professional_type: 'ADVOGADO' | 'AGENTE_CONSULAR' | 'OUTRO'
  oab_number?: string
  consular_registration?: string
}

export type VerifyEmailPayload = {
  email: string
  code: string
}

export type ValidateSipenPayload = {
  buyer_cpf: string
  inmate: {
    name: string
    ward: string
    cell: string
    prison_unit_id?: string
    prison_unit_name?: string
  }
}

export type CepResponse = {
  zip_code: string
  street: string
  complement: string
  neighborhood: string
  city: string
  state: string
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

export function getAddressByCep(cep: string) {
  const cleanCep = cep.replace(/\D/g, '')
  return request<CepResponse>(`/cep/${cleanCep}`)
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

export function register(payload: RegisterPayload) {
  return request<{
    ok: true
    user_id: string
    expiresAt: string
    resendAfterSeconds: number
    ttlSeconds: number
  }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function resendEmailVerification(email: string) {
  return request<{
    ok: true
    expiresAt: string
    resendAfterSeconds: number
    ttlSeconds: number
  }>('/auth/verification/email/resend', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export function confirmEmailVerification(payload: VerifyEmailPayload) {
  return request<{ ok: true }>('/auth/verification/email/confirm', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function getMe() {
  return request<{ user: any; buyer: any | null }>('/auth/me')
}

export function validateSipen(payload: ValidateSipenPayload) {
  return request<{ status: 'APROVADO'; protocol: string; inmate_id: string }>('/sipen/validate', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateOrderStatus(id: string, status: string) {
  return request<{ success: true }>(`/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

export function getAdminStats() {
  return request<any>('/admin/stats')
}

export function getAuditLogs() {
  return request<any[]>('/admin/audit')
}
