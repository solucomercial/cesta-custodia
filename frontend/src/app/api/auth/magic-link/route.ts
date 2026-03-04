import crypto from 'crypto'
import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { sendMagicLinkEmail } from '@/lib/email'

const MAGIC_LINK_TTL_MINUTES = 5

const digitsOnly = (value: string) => value.replace(/\D/g, '')

function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

type MagicLinkUser = {
  id: string
  email: string
  papel: string
  email_verificado_em: Date | string | null
}

export async function POST(request: Request) {
  const { cpf, oab, matricula } = await request.json()

  const normalizedCpf = cpf ? digitsOnly(String(cpf)) : ''
  const normalizedOab = oab ? String(oab).trim() : ''
  const normalizedMatricula = matricula ? String(matricula).trim() : ''

  const identifier = normalizedCpf || normalizedOab || normalizedMatricula
  if (!identifier) {
    return NextResponse.json({ error: 'Identificador obrigatorio' }, { status: 400 })
  }

  try {
    let user: MagicLinkUser | undefined

    if (normalizedCpf) {
      ;[user] = (await sql`
        SELECT u.id, u.email, u.papel, u.email_verificado_em
        FROM usuarios u
        JOIN compradores c ON c.usuario_id = u.id
        WHERE c.cpf = ${normalizedCpf}
        LIMIT 1
      `) as MagicLinkUser[]
    } else if (normalizedOab) {
      ;[user] = (await sql`
        SELECT u.id, u.email, u.papel, u.email_verificado_em
        FROM usuarios u
        JOIN compradores c ON c.usuario_id = u.id
        WHERE c.oab = ${normalizedOab}
        LIMIT 1
      `) as MagicLinkUser[]
    } else {
      ;[user] = (await sql`
        SELECT u.id, u.email, u.papel, u.email_verificado_em
        FROM usuarios u
        JOIN compradores c ON c.usuario_id = u.id
        WHERE c.matricula_consular = ${normalizedMatricula}
        LIMIT 1
      `) as MagicLinkUser[]
    }

    if (!user) {
      return NextResponse.json({ error: 'Cadastro nao encontrado' }, { status: 404 })
    }

    const token = crypto.randomUUID()
    const tokenHash = hashToken(token)
    const expiresAt = new Date(Date.now() + MAGIC_LINK_TTL_MINUTES * 60 * 1000)

    await sql`
      INSERT INTO verificacoes_email (email, codigo_hash, expira_em, tentativas)
      VALUES (${user.email}, ${tokenHash}, ${expiresAt.toISOString()}, 0)
    `

    const origin = request.headers.get('origin') ?? new URL(request.url).origin
    const link = `${origin}/api/auth/callback?token=${encodeURIComponent(token)}`

    await sendMagicLinkEmail({
      to: user.email,
      link,
      expiresAt,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Erro ao enviar magic link:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
