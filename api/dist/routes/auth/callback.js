"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authCallbackRoute = void 0;
const node_crypto_1 = __importDefault(require("node:crypto"));
const zod_1 = require("zod");
const auth_1 = require("../../lib/auth");
const db_1 = require("../../lib/db");
function hashToken(token) {
    return node_crypto_1.default.createHash('sha256').update(token).digest('hex');
}
function getTargetPath(role) {
    if (role === 'ADMIN' || role === 'FISCAL_SEAP') {
        return '/admin';
    }
    return '/catalogo';
}
const authCallbackRoute = async (app) => {
    app.get('/auth/callback', {
        schema: {
            tags: ['Auth'],
            summary: 'Consumir magic link e autenticar sessao',
            querystring: zod_1.z.object({ token: zod_1.z.string().optional() }),
        },
    }, async (request, reply) => {
        const token = request.query.token;
        const frontendOrigin = process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000';
        if (!token) {
            return reply.redirect(`${frontendOrigin}/login?magic=missing`);
        }
        try {
            const tokenHash = hashToken(token);
            const [record] = (await (0, db_1.sql) `
          SELECT id, email, expira_em, usado_em
          FROM verificacoes_email
          WHERE codigo_hash = ${tokenHash}
          LIMIT 1
        `);
            if (!record) {
                return reply.redirect(`${frontendOrigin}/login?magic=invalid`);
            }
            if (record.usado_em) {
                return reply.redirect(`${frontendOrigin}/login?magic=used`);
            }
            if (record.expira_em && new Date(record.expira_em) < new Date()) {
                return reply.redirect(`${frontendOrigin}/login?magic=expired`);
            }
            const [user] = (await (0, db_1.sql) `
          SELECT id, email, papel, email_verificado_em
          FROM usuarios
          WHERE email = ${record.email}
          LIMIT 1
        `);
            if (!user) {
                return reply.redirect(`${frontendOrigin}/login?magic=invalid`);
            }
            await (0, db_1.sql) `
          UPDATE verificacoes_email
          SET usado_em = now()
          WHERE id = ${record.id}
        `;
            const emailVerifiedAt = user.email_verificado_em
                ? new Date(user.email_verificado_em).toISOString()
                : null;
            const authToken = await (0, auth_1.createAuthToken)({
                userId: user.id,
                email: user.email,
                role: user.papel,
                emailVerifiedAt,
            });
            reply.setCookie(auth_1.AUTH_COOKIE_NAME, authToken, {
                httpOnly: true,
                sameSite: 'lax',
                secure: process.env.NODE_ENV === 'production',
                maxAge: auth_1.AUTH_TOKEN_TTL_SECONDS,
                path: '/',
            });
            return reply.redirect(`${frontendOrigin}${getTargetPath(user.papel)}`);
        }
        catch {
            return reply.redirect(`${frontendOrigin}/login?magic=error`);
        }
    });
};
exports.authCallbackRoute = authCallbackRoute;
