import { NextRequest, NextResponse } from 'next/server'
import { AUTH_COOKIE_NAME } from '@/lib/auth'

// Define rotas públicas que não precisam de autenticação
const PUBLIC_ROUTES: string[] = []

// Define rotas que requerem autenticação
const PROTECTED_ROUTES = ['/admin', '/catalogo']

// Define rotas de auth que não devem ser acessadas por usuários autenticados
const AUTH_ROUTES = ['/login', '/auth/login', '/register', '/verify']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Middleware apenas checa presenca de token emitido pela API Fastify
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value
  const isAuthenticated = Boolean(token)

  // Verificar se é uma rota pública
  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route))
  
  // Verificar se é uma rota protegida
  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route))
  
  // Verificar se é uma rota de autenticação
  const isAuthRoute = AUTH_ROUTES.some(route => pathname.startsWith(route))

  // Se é rota pública, permitir acesso
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Se é rota de auth e o usuário está autenticado, redirecionar para admin
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/catalogo', request.url))
  }

  // Se é rota de auth e não está autenticado, permitir acesso
  if (isAuthRoute && !isAuthenticated) {
    return NextResponse.next()
  }

  // Se é rota protegida e não está autenticado, redirecionar para login
  if (isProtectedRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Se é rota protegida e está autenticado, permitir acesso
  if (isProtectedRoute && isAuthenticated) {
    return NextResponse.next()
  }

  // Padrão: permitir acesso
  return NextResponse.next()
}

// Configurar quais rotas o middleware deve processar
export const config = {
  matcher: [
    /*
     * Corresponder a todas as rotas de requisição, exceto as seguintes:
     * - _next/static (assets estáticos)
     * - _next/image (otimização de imagens)
     * - favicon.ico (arquivo de ícone)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
