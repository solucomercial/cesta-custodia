import type { AuditLog, Inmate, PrisonUnit, Product } from '@/lib/types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333'

export type OrderStatus = 'PENDENTE_SIPEN' | 'PAGO' | 'PREPARANDO' | 'EM_TRANSITO' | 'ENTREGUE' | 'CANCELADO'

export type Order = {
  id: string
  buyer_id: string
  inmate_id: string | null
  status: OrderStatus
  sipen_protocol: string | null
  total_value: number
  delivery_fee: number
  fuesp_tax: number
  prescription_url: string | null
  prescription_validation_code: string | null
  created_at: string
  updated_at: string
  buyer_name?: string
  buyer_cpf?: string
  inmate_name?: string
  inmate_registration?: string
  prison_unit_name?: string
  item_count?: number
}

export type BuyerProfile = {
  id: string
  user_id: string
  name: string
  cpf: string
  rg: string | null
  birth_date: string
  address: string
  phone: string
  professional_type?: 'ADVOGADO' | 'AGENTE_CONSULAR' | 'OUTRO'
  oab_number?: string | null
  consular_registration?: string | null
  email: string
  email_verified_at: string | null
}

export type MeResponse = {
  user: {
    id: string
    email: string
    role: string
    email_verified_at: string | null
    name?: string
  }
  buyer: BuyerProfile | null
}

export class ApiError extends Error {
  status: number
  data: unknown

  constructor(message: string, status: number, data?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
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

    const browser = typeof globalThis !== 'undefined'
      ? (globalThis as { location?: { pathname?: string; assign?: (url: string) => void } })
      : undefined
    if (!isAuthRequest && browser?.location?.pathname) {
      const { pathname } = browser.location
      const isOnAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register') || pathname.startsWith('/verify')

      if (!isOnAuthPage) {
        browser.location.assign?.('/login')
      }
    }
  }

  if (!response.ok) {
    const message = body && typeof body === 'object' && 'error' in body
      ? String(body.error)
      : 'Erro ao comunicar com a API'

    throw new ApiError(message, response.status, body)
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
  return request<Product[]>(`/products${queryString ? `?${queryString}` : ''}`)
}

export function getPrisonUnits() {
  return request<PrisonUnit[]>('/prison-units')
}

export function getAddressByCep(cep: string) {
  const cleanCep = cep.replace(/\D/g, '')
  return request<CepResponse>(`/cep/${cleanCep}`)
}

export function searchInmate(registration: string) {
  const params = new URLSearchParams({ registration })
  return request<Inmate>(`/inmates/search?${params.toString()}`)
}

export function createOrder(payload: Record<string, unknown>) {
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
  return request<MeResponse>('/auth/me')
}

export function getOrders() {
  return request<Order[]>('/orders')
}

export function updateOrderStatus(id: string, status: string) {
  return request<{ success: true }>(`/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

export function getAdminStats() {
  return request<Record<string, unknown>>('/admin/stats')
}

export function getAuditLogs() {
  return request<AuditLog[]>('/admin/audit')
}
