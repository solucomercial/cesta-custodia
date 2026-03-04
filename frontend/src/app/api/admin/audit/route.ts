import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  const logs = await sql`
    SELECT la.*, u.email as user_email
    FROM logs_auditoria la
    LEFT JOIN usuarios u ON la.usuario_id = u.id
    ORDER BY la.criado_em DESC
    LIMIT 100
  `

  return NextResponse.json(logs)
}
