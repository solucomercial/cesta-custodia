"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authLoginRoute = void 0;
const zod_1 = require("zod");
const auth_1 = require("../../lib/auth");
const db_1 = require("../../lib/db");
const password_1 = require("../../lib/password");
const authLoginRoute = async (app) => {
    app.post('/auth/login', {
        schema: {
            tags: ['Auth'],
            summary: 'Autenticar usuário com email/identificador e senha',
            body: zod_1.z.object({
                email: zod_1.z.string().email().optional(),
                identifier: zod_1.z.string().min(1).optional(),
                password: zod_1.z.string().min(1),
                role: zod_1.z.enum(['ADMIN', 'FISCAL_SEAP', 'COMPRADOR', 'OPERADOR']).optional(),
            }),
            response: {
                200: zod_1.z.object({
                    token: zod_1.z.string(),
                    user: zod_1.z.object({
                        id: zod_1.z.string(),
                        email: zod_1.z.string(),
                        role: zod_1.z.string(),
                        email_verified_at: zod_1.z.string().nullable(),
                    }),
                }),
                400: zod_1.z.object({ error: zod_1.z.string() }),
                401: zod_1.z.object({ error: zod_1.z.string() }),
                403: zod_1.z.object({ error: zod_1.z.string() }),
            },
        },
    }, async (request, reply) => {
        const { email, identifier, password, role } = request.body;
        const loginEmail = email || identifier;
        if (!loginEmail || !password) {
            return reply.code(400).send({ error: 'Email e senha sao obrigatorios' });
        }
        const users = (await (0, db_1.sql) `
        SELECT id, email, papel, email_verificado_em, senha_hash
        FROM usuarios
        WHERE email = ${loginEmail}
        LIMIT 1
      `);
        const user = users[0];
        if (!user) {
            return reply.code(401).send({ error: 'Credenciais invalidas' });
        }
        const isValidPassword = await (0, password_1.verifyPassword)(password, user.senha_hash);
        if (!isValidPassword) {
            return reply.code(401).send({ error: 'Credenciais invalidas' });
        }
        if (role === 'COMPRADOR' || role === 'OPERADOR') {
            const isAuthorized = await checkSipenAuthorization(loginEmail, role);
            if (!isAuthorized) {
                return reply.code(403).send({ error: 'Acesso negado: Vinculo nao autorizado ou vencido no SIPEN' });
            }
        }
        const emailVerifiedAt = user.email_verificado_em
            ? new Date(user.email_verificado_em).toISOString()
            : null;
        const token = await (0, auth_1.createAuthToken)({
            userId: user.id,
            email: user.email,
            role: user.papel,
            emailVerifiedAt,
        });
        return reply.send({
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.papel,
                email_verified_at: emailVerifiedAt,
            },
        });
    });
};
exports.authLoginRoute = authLoginRoute;
async function checkSipenAuthorization(_identifier, _type) {
    return true;
}
