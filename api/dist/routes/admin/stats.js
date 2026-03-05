"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminStatsRoute = void 0;
const zod_1 = require("zod");
const auth_1 = require("../../lib/auth");
const db_1 = require("../../lib/db");
const adminStatsRoute = async (app) => {
    app.get('/admin/stats', {
        schema: {
            tags: ['Admin'],
            summary: 'Obter estatisticas administrativas',
            response: {
                200: zod_1.z.any(),
                401: zod_1.z.object({ error: zod_1.z.string() }),
                403: zod_1.z.object({ error: zod_1.z.string() }),
            },
        },
    }, async (request, reply) => {
        const session = await (0, auth_1.getAuthSessionFromFastifyRequest)(request);
        if (!session) {
            (0, auth_1.clearAuthCookie)(reply);
            return reply.code(401).send({ error: 'Nao autenticado' });
        }
        if (session.role !== 'ADMIN' && session.role !== 'FISCAL_SEAP') {
            return reply.code(403).send({ error: 'Acesso negado' });
        }
        const [totalOrders] = (await (0, db_1.sql) `SELECT COUNT(*) as count FROM pedidos`);
        const [totalRevenue] = (await (0, db_1.sql) `SELECT COALESCE(SUM(valor_total), 0) as total FROM pedidos WHERE status != 'CANCELADO'`);
        const [totalDeliveryFees] = (await (0, db_1.sql) `SELECT COALESCE(SUM(frete), 0) as total FROM pedidos WHERE status != 'CANCELADO'`);
        const [totalFuespTax] = (await (0, db_1.sql) `SELECT COALESCE(SUM(taxa_fuesp), 0) as total FROM pedidos WHERE status != 'CANCELADO'`);
        const [pendingOrders] = (await (0, db_1.sql) `SELECT COUNT(*) as count FROM pedidos WHERE status IN ('PENDENTE_SIPEN', 'PAGO', 'PREPARANDO')`);
        const [deliveredOrders] = (await (0, db_1.sql) `SELECT COUNT(*) as count FROM pedidos WHERE status = 'ENTREGUE'`);
        const [totalProducts] = (await (0, db_1.sql) `SELECT COUNT(*) as count FROM produtos WHERE ativo = true`);
        const [totalInmates] = (await (0, db_1.sql) `SELECT COUNT(*) as count FROM internos`);
        const statusBreakdown = await (0, db_1.sql) `
        SELECT status, COUNT(*) as count
        FROM pedidos
        GROUP BY status
      `;
        const categoryBreakdown = await (0, db_1.sql) `
        SELECT p.categoria as category, COUNT(DISTINCT ip.pedido_id) as order_count, SUM(ip.quantidade * ip.preco_no_pedido) as revenue
        FROM itens_pedido ip
        JOIN produtos p ON ip.produto_id = p.id
        GROUP BY p.categoria
      `;
        const recentOrders = await (0, db_1.sql) `
        SELECT p.id, p.status, p.valor_total as total_value, p.criado_em as created_at,
          c.nome as buyer_name, COALESCE(i.nome, p.interno_nome) as inmate_name
        FROM pedidos p
        JOIN compradores c ON p.comprador_id = c.id
        LEFT JOIN internos i ON p.interno_id = i.id
        ORDER BY p.criado_em DESC
        LIMIT 5
      `;
        return {
            total_orders: Number(totalOrders?.count ?? 0),
            total_revenue: Number(totalRevenue?.total ?? 0),
            total_delivery_fees: Number(totalDeliveryFees?.total ?? 0),
            total_fuesp_tax: Number(totalFuespTax?.total ?? 0),
            pending_orders: Number(pendingOrders?.count ?? 0),
            delivered_orders: Number(deliveredOrders?.count ?? 0),
            total_products: Number(totalProducts?.count ?? 0),
            total_inmates: Number(totalInmates?.count ?? 0),
            status_breakdown: statusBreakdown,
            category_breakdown: categoryBreakdown,
            recent_orders: recentOrders,
        };
    });
};
exports.adminStatsRoute = adminStatsRoute;
