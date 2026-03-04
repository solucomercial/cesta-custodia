import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  const units = await sql`
    SELECT id, nome as name, grupo_unidade as unit_group, endereco as address
    FROM unidades_prisionais
    ORDER BY nome
  `

  return NextResponse.json(units)
}
