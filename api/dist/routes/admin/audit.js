"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminAuditRoute = void 0;
const zod_1 = require("zod");
const auth_1 = require("../../lib/auth");
const db_1 = require("../../lib/db");
const adminAuditRoute = async (app) => {
    app.get('/admin/audit', {
        schema: {
            tags: ['Admin'],
            summary: 'Listar logs de auditoria',
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
        const logs = await (0, db_1.sql) `
        SELECT la.*, u.email as user_email
        FROM logs_auditoria la
        LEFT JOIN usuarios u ON la.usuario_id = u.id
        ORDER BY la.criado_em DESC
        LIMIT 100
      `;
        return logs;
    });
};
exports.adminAuditRoute = adminAuditRoute;
