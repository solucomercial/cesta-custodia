import type { MeResponse, Order, StatusPedido } from '@/lib/types'
import { getBearerToken } from '@/lib/bearer-token'

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_PUBLIC_ORIGIN
  ?? process.env.API_PUBLIC_ORIGIN
  ?? 'http://localhost:3333'

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
  const bearerToken = getBearerToken()

  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(bearerToken ? { Authorization: `Bearer ${bearerToken}` } : {}),
      ...(init?.headers ?? {}),
    },
  })

  const body = await response.json().catch(() => null)

  if (response.status === 401) {
    const isAuthRequest = path.startsWith('/auth/magic-link')
    const browser = typeof globalThis !== 'undefined'
      ? (globalThis as { location?: { pathname?: string; assign?: (url: string) => void } })
      : undefined

    if (!isAuthRequest && browser?.location?.pathname && !browser.location.pathname.startsWith('/login')) {
      browser.location.assign?.('/login')
    }
  }

  if (!response.ok) {
    const message = body && typeof body === 'object' && 'error' in body
      ? String((body as { error?: string }).error)
      : 'Erro ao comunicar com a API'

    throw new ApiError(message, response.status, body)
  }

  return body as T
}

export function requestMagicLink(identifier: string) {
  return request<{ ok: true }>('/auth/magic-link', {
    method: 'POST',
    body: JSON.stringify({ matricula: identifier }),
  })
}

export function getMe() {
  return request<MeResponse>('/auth/me')
}

export function getOrders() {
  return request<Order[]>('/orders')
}

export function getAdminStats() {
  return request<{
    total_orders: number
    total_revenue: number
    pending_orders: number
    delivered_orders: number
    status_breakdown: Array<{ status: StatusPedido; count: number | string }>
  }>('/admin/stats')
}
