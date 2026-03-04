import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { clearAuthCookie, getAuthSessionFromFastifyRequest } from '@/lib/auth'
import { sql } from '@/lib/db'

export const adminAuditRoute: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/admin/audit',
    {
      schema: {
        tags: ['Admin'],
        summary: 'Listar logs de auditoria',
        response: {
          200: z.any(),
          401: z.object({ error: z.string() }),
          403: z.object({ error: z.string() }),
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

      const logs = await sql`
        SELECT la.*, u.email as user_email
        FROM logs_auditoria la
        LEFT JOIN usuarios u ON la.usuario_id = u.id
        ORDER BY la.criado_em DESC
        LIMIT 100
      `

      return logs
    },
  )
}
