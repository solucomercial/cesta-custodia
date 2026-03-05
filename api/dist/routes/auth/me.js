"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMeRoute = void 0;
const zod_1 = require("zod");
const auth_1 = require("../../lib/auth");
const db_1 = require("../../lib/db");
const authMeRoute = async (app) => {
    app.get('/auth/me', {
        schema: {
            tags: ['Auth'],
            summary: 'Obter perfil da sessao atual',
            response: {
                200: zod_1.z.any(),
                401: zod_1.z.object({ error: zod_1.z.string() }),
            },
        },
    }, async (request, reply) => {
        const session = await (0, auth_1.getAuthSessionFromFastifyRequest)(request);
        if (!session) {
            (0, auth_1.clearAuthCookie)(reply);
            return reply.code(401).send({ error: 'Nao autenticado' });
        }
        const [buyer] = await (0, db_1.sql) `
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
      `;
        return {
            user: {
                id: session.userId,
                email: session.email,
                role: session.role,
                email_verified_at: session.emailVerifiedAt,
            },
            buyer: buyer || null,
        };
    });
};
exports.authMeRoute = authMeRoute;
