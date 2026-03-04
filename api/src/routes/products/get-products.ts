import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { sql } from '@/lib/db'

const UNIT_GROUP_CATEGORY_RULES: Record<string, string[]> = {
  PADRAO: ['ALIMENTOS', 'HIGIENE', 'VESTUARIO_BRANCO'],
  MEDICAMENTOS_LIBERADOS: ['ALIMENTOS', 'HIGIENE', 'VESTUARIO_BRANCO', 'MEDICAMENTOS'],
}

type ProductRow = {
  id: string
  name: string
  description: string | null
  price: string | number
  category: string
  is_active: boolean
  stock_quantity: number
  image_url: string | null
}

export const getProductsRoute: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/products',
    {
      schema: {
        tags: ['Products'],
        summary: 'Listar produtos ativos por categoria e unidade',
        querystring: z.object({
          category: z.string().optional(),
          unit_id: z.string().uuid().optional(),
        }),
      },
    },
    async (request) => {
      const { category, unit_id: unitId } = request.query
      const hasCategoryFilter = category && category !== 'ALL'

      const products = (hasCategoryFilter
        ? await sql`
            SELECT id, nome as name, descricao as description, preco as price, categoria as category,
              ativo as is_active, quantidade_estoque as stock_quantity, url_imagem as image_url
            FROM produtos
            WHERE ativo = true AND categoria = ${category}
            ORDER BY categoria, nome
          `
        : await sql`
            SELECT id, nome as name, descricao as description, preco as price, categoria as category,
              ativo as is_active, quantidade_estoque as stock_quantity, url_imagem as image_url
            FROM produtos
            WHERE ativo = true
            ORDER BY categoria, nome
          `) as ProductRow[]

      let filteredProducts = products

      if (unitId) {
        const units = await sql`
          SELECT grupo_unidade
          FROM unidades_prisionais
          WHERE id = ${unitId}
          LIMIT 1
        `

        const unitGroup = units[0]?.grupo_unidade as string | undefined
        const allowedCategories = unitGroup ? UNIT_GROUP_CATEGORY_RULES[unitGroup] : null

        if (allowedCategories) {
          filteredProducts = products.filter((product) =>
            allowedCategories.includes(product.category),
          )
        }
      }

      return filteredProducts
    },
  )
}
