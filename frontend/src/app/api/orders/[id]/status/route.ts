import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params
  const { status } = await request.json()

  const validStatuses = ['PENDENTE_SIPEN', 'PAGO', 'PREPARANDO', 'EM_TRANSITO', 'ENTREGUE', 'CANCELADO']
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: 'Status invalido' }, { status: 400 })
  }

  const currentOrder = (await sql`SELECT status FROM pedidos WHERE id = ${id}`) as Array<{ status: string }>
  if (currentOrder.length === 0) {
    return NextResponse.json({ error: 'Pedido nao encontrado' }, { status: 404 })
  }

  await sql`UPDATE pedidos SET status = ${status}, atualizado_em = now() WHERE id = ${id}`

  await sql`
    INSERT INTO logs_auditoria (pedido_id, acao, detalhes)
    VALUES (${id}, 'STATUS_ALTERADO', ${JSON.stringify({ from: currentOrder[0].status, to: status })})
  `

  return NextResponse.json({ success: true })
}
