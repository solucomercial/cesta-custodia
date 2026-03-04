import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { sql } from '@/lib/db'

export const getPrisonUnitsRoute: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/prison-units',
    {
      schema: {
        tags: ['Prison Units'],
        summary: 'Listar unidades prisionais',
      },
    },
    async () => {
      const units = await sql`
        SELECT id, nome as name, grupo_unidade as unit_group, endereco as address
        FROM unidades_prisionais
        ORDER BY nome
      `

      return units
    },
  )
}
