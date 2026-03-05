import type { MeResponse, Order, OrderStatus, Product } from '@/lib/types'
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
    const authEndpoints = ['/auth/magic-link']
    const isAuthRequest = authEndpoints.some((endpoint) => path.startsWith(endpoint))

    const browser = typeof globalThis !== 'undefined'
      ? (globalThis as { location?: { pathname?: string; assign?: (url: string) => void } })
      : undefined
    if (!isAuthRequest && browser?.location?.pathname) {
      const { pathname } = browser.location
      const isOnAuthPage = pathname.startsWith('/login')

      if (!isOnAuthPage) {
        browser.location.assign?.('/login')
      }
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

export type MagicLinkRequest = {
  matricula?: string
}

export function requestMagicLink(payload: MagicLinkRequest) {
  return request<{ ok: true }>('/auth/magic-link', {
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

export function updateOrderStatus(id: string, status: OrderStatus) {
  return request<{ success: true }>(`/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

export function getProducts() {
  return request<Product[]>('/products')
}

export function updateProductStock(id: string, stockQuantity: number) {
  return request<{ success: true }>(`/products/${id}/stock`, {
    method: 'PATCH',
    body: JSON.stringify({ stock_quantity: stockQuantity }),
  })
}
