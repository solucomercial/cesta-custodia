"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateOrderStatusRoute = void 0;
const zod_1 = require("zod");
const auth_1 = require("../../lib/auth");
const db_1 = require("../../lib/db");
const statusSchema = zod_1.z.enum([
    'PENDENTE_SIPEN',
    'PAGO',
    'PREPARANDO',
    'EM_TRANSITO',
    'ENTREGUE',
    'CANCELADO',
]);
const updateOrderStatusRoute = async (app) => {
    app.patch('/orders/:id/status', {
        schema: {
            tags: ['Orders'],
            summary: 'Atualizar status do pedido',
            params: zod_1.z.object({ id: zod_1.z.string().uuid() }),
            body: zod_1.z.object({ status: statusSchema }),
            response: {
                200: zod_1.z.object({ success: zod_1.z.literal(true) }),
                401: zod_1.z.object({ error: zod_1.z.string() }),
                403: zod_1.z.object({ error: zod_1.z.string() }),
                404: zod_1.z.object({ error: zod_1.z.string() }),
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
        const { id } = request.params;
        const { status } = request.body;
        const currentOrder = (await (0, db_1.sql) `
        SELECT status FROM pedidos WHERE id = ${id}
      `);
        if (currentOrder.length === 0) {
            return reply.code(404).send({ error: 'Pedido nao encontrado' });
        }
        await (0, db_1.sql) `
        UPDATE pedidos
        SET status = ${status}, atualizado_em = now()
        WHERE id = ${id}
      `;
        await (0, db_1.sql) `
        INSERT INTO logs_auditoria (usuario_id, pedido_id, acao, detalhes)
        VALUES (${session.userId}, ${id}, 'STATUS_ALTERADO', ${JSON.stringify({ from: currentOrder[0].status, to: status })})
      `;
        return { success: true };
    });
};
exports.updateOrderStatusRoute = updateOrderStatusRoute;
