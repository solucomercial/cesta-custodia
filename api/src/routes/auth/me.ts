import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { clearAuthCookie, getAuthSessionFromFastifyRequest } from '@/lib/auth'
import { sql } from '@/lib/db'

export const authMeRoute: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/auth/me',
    {
      schema: {
        tags: ['Auth'],
        summary: 'Obter perfil da sessao atual',
        response: {
          200: z.any(),
          401: z.object({ error: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const session = await getAuthSessionFromFastifyRequest(request)
      if (!session) {
        clearAuthCookie(reply)
        return reply.code(401).send({ error: 'Nao autenticado' })
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

      return {
        user: {
          id: session.userId,
          email: session.email,
          role: session.role,
          email_verified_at: session.emailVerifiedAt,
        },
        buyer: buyer || null,
      }
    },
  )
}
