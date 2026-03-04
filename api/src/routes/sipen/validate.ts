import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { sql } from '@/lib/db'

function normalize(value: string) {
  return value.trim().toUpperCase()
}

export const sipenValidateRoute: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/sipen/validate',
    {
      schema: {
        tags: ['SIPEN'],
        summary: 'Validar vinculo de interno no SIPEN',
        body: z.object({
          buyer_cpf: z.string().min(1),
          inmate: z.object({
            name: z.string().min(1),
            ward: z.string().min(1),
            cell: z.string().min(1),
            prison_unit_id: z.string().uuid().optional(),
            prison_unit_name: z.string().optional(),
          }),
        }),
        response: {
          200: z.object({
            status: z.literal('APROVADO'),
            protocol: z.string(),
            inmate_id: z.string().uuid(),
          }),
          400: z.object({ error: z.string() }),
          403: z.object({ error: z.string() }),
          404: z.object({ error: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const { inmate } = request.body

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
        return reply.code(404).send({ error: 'Interno nao encontrado no SIPEN' })
      }

      const internal = rows[0]
      const matches =
        normalize(internal.nome) === normalize(inmate.name) &&
        normalize(internal.ala) === normalize(inmate.ward) &&
        normalize(internal.cela) === normalize(inmate.cell)

      if (!matches) {
        return reply.code(403).send({ error: 'Dados do interno divergentes' })
      }

      const protocol = `SIPEN-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 999999)).padStart(6, '0')}`

      return { status: 'APROVADO', protocol, inmate_id: internal.id } as const
    },
  )
}
