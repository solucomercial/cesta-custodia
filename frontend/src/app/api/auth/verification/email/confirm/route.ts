import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { verifyEmailCode } from '@/lib/email-verification'
import { AUTH_COOKIE_NAME, AUTH_TOKEN_TTL_SECONDS, createAuthToken } from '@/lib/auth'

type EmailVerifyUserRow = {
  id: string
  email: string
  papel: string
}

const ERROR_MAP: Record<string, string> = {
  usado: 'Codigo de verificacao ja utilizado',
  expirado: 'Codigo de verificacao expirado',
  limite_tentativas: 'Limite de tentativas excedido. Solicite novo codigo',
  codigo_invalido: 'Codigo de verificacao invalido',
  nao_encontrado: 'Codigo de verificacao nao encontrado',
  invalido: 'Codigo de verificacao invalido',
}

export async function POST(request: Request) {
  const { email, code } = await request.json()

  if (!email || !code) {
    return NextResponse.json({ error: 'Email e codigo sao obrigatorios' }, { status: 400 })
  }

  const normalizedEmail = String(email).trim().toLowerCase()

  const users = (await sql`
    SELECT id, email, papel
    FROM usuarios
    WHERE email = ${normalizedEmail}
    LIMIT 1
  `) as EmailVerifyUserRow[]

  const user = users[0]

  if (!user) {
    return NextResponse.json({ error: 'Usuario nao encontrado' }, { status: 404 })
  }

  const verification = await verifyEmailCode(normalizedEmail, String(code))
  if (!verification.ok) {
    const message = ERROR_MAP[verification.reason || 'invalido'] || 'Codigo de verificacao invalido'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  await sql`UPDATE usuarios SET email_verificado_em = now() WHERE id = ${user.id}`

  const token = await createAuthToken({
    userId: user.id,
    email: user.email,
    role: user.papel,
    emailVerifiedAt: new Date().toISOString(),
  })

  const response = NextResponse.json({ ok: true })
  response.cookies.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: AUTH_TOKEN_TTL_SECONDS,
    path: '/',
  })

  return response
}
