import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { clearAuthCookie, getAuthSessionFromFastifyRequest } from '@/lib/auth'
import { sql } from '@/lib/db'

const statusSchema = z.enum([
  'PENDENTE_SIPEN',
  'PAGO',
  'PREPARANDO',
  'EM_TRANSITO',
  'ENTREGUE',
  'CANCELADO',
])

export const updateOrderStatusRoute: FastifyPluginAsyncZod = async (app) => {
  app.patch(
    '/orders/:id/status',
    {
      schema: {
        tags: ['Orders'],
        summary: 'Atualizar status do pedido',
        params: z.object({ id: z.string().uuid() }),
        body: z.object({ status: statusSchema }),
        response: {
          200: z.object({ success: z.literal(true) }),
          401: z.object({ error: z.string() }),
          403: z.object({ error: z.string() }),
          404: z.object({ error: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const session = await getAuthSessionFromFastifyRequest(request)
      if (!session) {
        clearAuthCookie(reply)
        return reply.code(401).send({ error: 'Nao autenticado' })
      }

      if (session.role !== 'ADMIN' && session.role !== 'FISCAL_SEAP') {
        return reply.code(403).send({ error: 'Acesso negado' })
      }

      const { id } = request.params
      const { status } = request.body

      const currentOrder = (await sql`
        SELECT status FROM pedidos WHERE id = ${id}
      `) as Array<{ status: string }>

      if (currentOrder.length === 0) {
        return reply.code(404).send({ error: 'Pedido nao encontrado' })
      }

      await sql`
        UPDATE pedidos
        SET status = ${status}, atualizado_em = now()
        WHERE id = ${id}
      `

      await sql`
        INSERT INTO logs_auditoria (usuario_id, pedido_id, acao, detalhes)
        VALUES (${session.userId}, ${id}, 'STATUS_ALTERADO', ${JSON.stringify({ from: currentOrder[0].status, to: status })})
      `

      return { success: true as const }
    },
  )
}
