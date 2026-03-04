import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'

function normalize(value: string) {
  return value.trim().toUpperCase()
}

export async function POST(request: Request) {
  const body = await request.json()
  const { buyer_cpf, inmate } = body || {}

  if (!buyer_cpf || !inmate?.name || !inmate?.ward || !inmate?.cell) {
    return NextResponse.json({ error: 'Dados incompletos para validacao SIPEN' }, { status: 400 })
  }

  const prisonUnitFilter = inmate?.prison_unit_id
    ? sql`AND unidade_prisional_id = ${inmate.prison_unit_id}`
    : inmate?.prison_unit_name
      ? sql`AND unidade_prisional_id IN (
          SELECT id FROM unidades_prisionais WHERE nome = ${inmate.prison_unit_name}
        )`
      : sql``

  const rows = (await sql`
    SELECT id, nome, ala, cela, unidade_prisional_id
    FROM internos
    WHERE nome = ${inmate.name}
      AND ala = ${inmate.ward}
      AND cela = ${inmate.cell}
      ${prisonUnitFilter}
    LIMIT 1
  `) as Array<{
    id: string
    nome: string
    ala: string
    cela: string
    unidade_prisional_id: string
  }>

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Interno nao encontrado no SIPEN' }, { status: 404 })
  }

  const internal = rows[0]
  const matches =
    normalize(internal.nome) === normalize(inmate.name) &&
    normalize(internal.ala) === normalize(inmate.ward) &&
    normalize(internal.cela) === normalize(inmate.cell)

  if (!matches) {
    return NextResponse.json({ error: 'Dados do interno divergentes' }, { status: 403 })
  }

  const protocol = `SIPEN-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 999999)).padStart(6, '0')}`

  return NextResponse.json({ status: 'APROVADO', protocol, inmate_id: internal.id })
}
