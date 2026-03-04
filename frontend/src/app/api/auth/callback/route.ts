import crypto from 'crypto'
import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { AUTH_COOKIE_NAME, AUTH_TOKEN_TTL_SECONDS, createAuthToken } from '@/lib/auth'

function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

function getTargetPath(role: string) {
  if (role === 'ADMIN' || role === 'FISCAL_SEAP') {
    return '/admin'
  }
  return '/catalogo'
}

type MagicLinkRecord = {
  id: string
  email: string
  expira_em: Date | string | null
  usado_em: Date | string | null
}

type MagicLinkUser = {
  id: string
  email: string
  papel: string
  email_verificado_em: Date | string | null
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const token = url.searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(new URL('/login?magic=missing', url.origin))
  }

  try {
    const tokenHash = hashToken(token)

    const [record] = (await sql`
      SELECT id, email, expira_em, usado_em
      FROM verificacoes_email
      WHERE codigo_hash = ${tokenHash}
      LIMIT 1
    `) as MagicLinkRecord[]

    if (!record) {
      return NextResponse.redirect(new URL('/login?magic=invalid', url.origin))
    }

    if (record.usado_em) {
      return NextResponse.redirect(new URL('/login?magic=used', url.origin))
    }

    if (record.expira_em && new Date(record.expira_em) < new Date()) {
      return NextResponse.redirect(new URL('/login?magic=expired', url.origin))
    }

    const [user] = (await sql`
      SELECT id, email, papel, email_verificado_em
      FROM usuarios
      WHERE email = ${record.email}
      LIMIT 1
    `) as MagicLinkUser[]

    if (!user) {
      return NextResponse.redirect(new URL('/login?magic=invalid', url.origin))
    }

    await sql`
      UPDATE verificacoes_email
      SET usado_em = now()
      WHERE id = ${record.id}
    `

    const emailVerifiedAt = user.email_verificado_em
      ? new Date(user.email_verificado_em).toISOString()
      : null

    const authToken = await createAuthToken({
      userId: user.id,
      email: user.email,
      role: user.papel,
      emailVerifiedAt,
    })

    const response = NextResponse.redirect(new URL(getTargetPath(user.papel), url.origin))
    response.cookies.set(AUTH_COOKIE_NAME, authToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: AUTH_TOKEN_TTL_SECONDS,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Erro no callback do magic link:', error)
    return NextResponse.redirect(new URL('/login?magic=error', url.origin))
  }
}
