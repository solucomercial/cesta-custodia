import { NextRequest, NextResponse } from 'next/server'

const AUTH_COOKIE_NAME = 'auth_token'
const PUBLIC_ROUTES = ['/login', '/api/auth/session']
const API_PUBLIC_ORIGIN = process.env.API_PUBLIC_ORIGIN ?? 'http://localhost:3333'

async function hasFiscalAccess(token: string) {
  const response = await fetch(`${API_PUBLIC_ORIGIN}/auth/me`, {
    headers: {
      cookie: `${AUTH_COOKIE_NAME}=${encodeURIComponent(token)}`,
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    return false
  }

  const body = (await response.json().catch(() => null)) as null | {
    user?: { role?: string }
  }

  const role = body?.user?.role
  return role === 'FISCAL_SEAP' || role === 'ADMIN'
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route))

  if (isPublicRoute) {
    return NextResponse.next()
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/overview', request.url))
  }

  const authorized = await hasFiscalAccess(token)
  if (!authorized) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
