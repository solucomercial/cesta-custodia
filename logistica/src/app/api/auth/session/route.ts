import { NextResponse } from 'next/server'

const COOKIE_NAME = 'auth_token'
const DEFAULT_MAX_AGE_SECONDS = 60 * 60 * 8

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as null | { token?: unknown; maxAgeSeconds?: unknown }
  const token = typeof body?.token === 'string' ? body.token : ''
  const maxAgeSeconds = typeof body?.maxAgeSeconds === 'number' && Number.isFinite(body.maxAgeSeconds)
    ? Math.max(60, Math.floor(body.maxAgeSeconds))
    : DEFAULT_MAX_AGE_SECONDS

  if (!token) {
    return NextResponse.json({ ok: false, error: 'Missing token' }, { status: 400 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    path: '/',
    maxAge: maxAgeSeconds,
  })

  return response
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true })
  response.cookies.set({
    name: COOKIE_NAME,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    path: '/',
    maxAge: 0,
  })

  return response
}
