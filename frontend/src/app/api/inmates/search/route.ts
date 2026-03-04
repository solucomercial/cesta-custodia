import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const registration = searchParams.get('registration')

  if (!registration) {
    return NextResponse.json({ error: 'Matricula obrigatoria' }, { status: 400 })
  }

  const inmates = await sql`
    SELECT i.id,
      i.nome as name,
      i.matricula as registration,
      i.ala as ward,
      i.cela as cell,
      i.unidade_prisional_id as prison_unit_id,
      pu.nome as prison_unit_name
    FROM internos i
    JOIN unidades_prisionais pu ON i.unidade_prisional_id = pu.id
    WHERE i.matricula = ${registration}
  `

  if (inmates.length === 0) {
    return NextResponse.json({ error: 'Interno nao encontrado' }, { status: 404 })
  }

  return NextResponse.json(inmates[0])
}
