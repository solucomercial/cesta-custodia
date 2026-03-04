// app/api/auth/login/route.ts
import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { AUTH_COOKIE_NAME, AUTH_TOKEN_TTL_SECONDS, createAuthToken } from '@/lib/auth'

type LoginUserRow = {
  id: string
  email: string
  papel: string
  email_verificado_em: string | Date | null
}

export async function POST(request: Request) {
  const { email, identifier, password, role } = await request.json()
  const loginEmail = email || identifier

  if (!loginEmail || !password) {
    return NextResponse.json({ error: 'Email e senha sao obrigatorios' }, { status: 400 })
  }

  try {
    // 1. Procurar o utilizador no banco de dados local
    // Nota: Em produção, utilize hashing (como bcrypt) para as senhas
    const users = (await sql`
      SELECT id, email, papel, email_verificado_em
      FROM usuarios
      WHERE email = ${loginEmail}
      AND senha_hash = ${password}
      LIMIT 1
    `) as LoginUserRow[]

    const user = users[0]

    if (!user) {
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 })
    }

    // 2. Validação Específica para Visitantes/Advogados (Requisito SEAP)
    // É obrigatório validar a autorização ativa no SIPEN antes de permitir o acesso
    if (role === 'COMPRADOR' || role === 'OPERADOR') {
      const isAuthorized = await checkSipenAuthorization(loginEmail, role)
      if (!isAuthorized) {
        return NextResponse.json({ 
          error: 'Acesso negado: Vínculo não autorizado ou vencido no SIPEN' 
        }, { status: 403 })
      }
    }

    const emailVerifiedAt = user.email_verificado_em
      ? new Date(user.email_verificado_em).toISOString()
      : null

    const token = await createAuthToken({
      userId: user.id,
      email: user.email,
      role: user.papel,
      emailVerifiedAt,
    })

    const response = NextResponse.json({
      user: { id: user.id, email: user.email, role: user.papel, email_verified_at: emailVerifiedAt },
    })

    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: AUTH_TOKEN_TTL_SECONDS,
      path: '/',
    })

    return response

  } catch (error) {
    console.error('Erro no login:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// Função placeholder para a integração WebService exigida no edital [cite: 492, 930]
async function checkSipenAuthorization(id: string, type: string) {
  // Aqui será implementada a chamada ao WebService da Montreal/SIPEN
  // Por agora, retorna true para permitir o desenvolvimento da POC
  return true 
}