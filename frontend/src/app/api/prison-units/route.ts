import { NextResponse } from 'next/server'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333'

export async function GET() {
  const response = await fetch(`${API_BASE_URL}/prison-units`, {
    method: 'GET',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
  })

  const body = await response.json().catch(() => null)

  if (!response.ok) {
    const message = body && typeof body === 'object' && 'error' in body
      ? String(body.error)
      : 'Erro ao buscar unidades prisionais'
    return NextResponse.json({ error: message }, { status: response.status })
  }

  return NextResponse.json(body)
}
