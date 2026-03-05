"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProductsRoute = void 0;
const zod_1 = require("zod");
const db_1 = require("../../lib/db");
const UNIT_GROUP_CATEGORY_RULES = {
    PADRAO: ['ALIMENTOS', 'HIGIENE', 'VESTUARIO_BRANCO'],
    MEDICAMENTOS_LIBERADOS: ['ALIMENTOS', 'HIGIENE', 'VESTUARIO_BRANCO', 'MEDICAMENTOS'],
};
const getProductsRoute = async (app) => {
    app.get('/products', {
        schema: {
            tags: ['Products'],
            summary: 'Listar produtos ativos por categoria e unidade',
            querystring: zod_1.z.object({
                category: zod_1.z.string().optional(),
                unit_id: zod_1.z.string().uuid().optional(),
            }),
        },
    }, async (request) => {
        const { category, unit_id: unitId } = request.query;
        const hasCategoryFilter = category && category !== 'ALL';
        const products = (hasCategoryFilter
            ? await (0, db_1.sql) `
            SELECT id, nome as name, descricao as description, preco as price, categoria as category,
              ativo as is_active, quantidade_estoque as stock_quantity, url_imagem as image_url
            FROM produtos
            WHERE ativo = true AND categoria = ${category}
            ORDER BY categoria, nome
          `
            : await (0, db_1.sql) `
            SELECT id, nome as name, descricao as description, preco as price, categoria as category,
              ativo as is_active, quantidade_estoque as stock_quantity, url_imagem as image_url
            FROM produtos
            WHERE ativo = true
            ORDER BY categoria, nome
          `);
        let filteredProducts = products;
        if (unitId) {
            const units = await (0, db_1.sql) `
          SELECT grupo_unidade
          FROM unidades_prisionais
          WHERE id = ${unitId}
          LIMIT 1
        `;
            const unitGroup = units[0]?.grupo_unidade;
            const allowedCategories = unitGroup ? UNIT_GROUP_CATEGORY_RULES[unitGroup] : null;
            if (allowedCategories) {
                filteredProducts = products.filter((product) => allowedCategories.includes(product.category));
            }
        }
        return filteredProducts;
    });
};
exports.getProductsRoute = getProductsRoute;
