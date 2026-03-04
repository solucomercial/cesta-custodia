import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getAuthSessionFromRequest } from '@/lib/auth'

export async function GET(request: Request) {
  const session = await getAuthSessionFromRequest(request)
  if (!session) {
    return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
  }

  const [buyer] = await sql`
    SELECT
      c.id,
      c.usuario_id as user_id,
      c.nome as name,
      c.cpf,
      c.rg,
      c.data_nascimento as birth_date,
      c.endereco as address,
      c.telefone as phone,
      c.tipo_profissional as professional_type,
      c.oab as oab_number,
      c.matricula_consular as consular_registration,
      u.email,
      u.email_verificado_em as email_verified_at
    FROM compradores c
    JOIN usuarios u ON u.id = c.usuario_id
    WHERE c.usuario_id = ${session.userId}
    LIMIT 1
  `

  return NextResponse.json({
    user: {
      id: session.userId,
      email: session.email,
      role: session.role,
      email_verified_at: session.emailVerifiedAt,
    },
    buyer: buyer || null,
  })
}
