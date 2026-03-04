import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'

const UNIT_GROUP_CATEGORY_RULES: Record<string, string[]> = {
  PADRAO: ['ALIMENTOS', 'HIGIENE', 'VESTUARIO_BRANCO'],
  MEDICAMENTOS_LIBERADOS: ['ALIMENTOS', 'HIGIENE', 'VESTUARIO_BRANCO', 'MEDICAMENTOS'],
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const unitId = searchParams.get('unit_id')

  let products
  const hasCategoryFilter = category && category !== 'ALL'

  if (hasCategoryFilter) {
    products = await sql`
      SELECT id, nome as name, descricao as description, preco as price, categoria as category,
        ativo as is_active, quantidade_estoque as stock_quantity, url_imagem as image_url
      FROM produtos
      WHERE ativo = true AND categoria = ${category}
      ORDER BY categoria, nome
    `
  } else {
    products = await sql`
      SELECT id, nome as name, descricao as description, preco as price, categoria as category,
        ativo as is_active, quantidade_estoque as stock_quantity, url_imagem as image_url
      FROM produtos
      WHERE ativo = true
      ORDER BY categoria, nome
    `
  }

  if (unitId) {
    const units = await sql`
      SELECT grupo_unidade
      FROM unidades_prisionais
      WHERE id = ${unitId}
      LIMIT 1
    `

    const unitGroup = units[0]?.grupo_unidade
    const allowedCategories = unitGroup ? UNIT_GROUP_CATEGORY_RULES[unitGroup] : null

    if (allowedCategories) {
      products = products.filter((product: { category: string }) =>
        allowedCategories.includes(product.category)
      )
    }
  }

  return NextResponse.json(products)
}
