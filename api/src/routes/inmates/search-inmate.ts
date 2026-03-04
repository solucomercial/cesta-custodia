import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { sql } from '@/lib/db'

export const searchInmateRoute: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/inmates/search',
    {
      schema: {
        tags: ['Inmates'],
        summary: 'Buscar interno por matrícula',
        querystring: z.object({
          registration: z.string().min(1),
        }),
        response: {
          200: z.object({
            id: z.string().uuid(),
            name: z.string(),
            registration: z.string(),
            ward: z.string(),
            cell: z.string(),
            prison_unit_id: z.string().uuid(),
            prison_unit_name: z.string(),
          }),
          400: z.object({ error: z.string() }),
          404: z.object({ error: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const { registration } = request.query

      if (!registration) {
        return reply.code(400).send({ error: 'Matricula obrigatoria' })
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
        return reply.code(404).send({ error: 'Interno nao encontrado' })
      }

      const inmate = inmates[0] as {
        id: string
        name: string
        registration: string
        ward: string
        cell: string
        prison_unit_id: string
        prison_unit_name: string
      }

      return {
        id: inmate.id,
        name: inmate.name,
        registration: inmate.registration,
        ward: inmate.ward,
        cell: inmate.cell,
        prison_unit_id: inmate.prison_unit_id,
        prison_unit_name: inmate.prison_unit_name,
      }
    },
  )
}
