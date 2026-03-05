"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authVerificationEmailRoute = void 0;
const zod_1 = require("zod");
const email_verification_1 = require("../../lib/email-verification");
const email_1 = require("../../lib/email");
const auth_1 = require("../../lib/auth");
const db_1 = require("../../lib/db");
const ERROR_MAP = {
    usado: 'Codigo de verificacao ja utilizado',
    expirado: 'Codigo de verificacao expirado',
    limite_tentativas: 'Limite de tentativas excedido. Solicite novo codigo',
    codigo_invalido: 'Codigo de verificacao invalido',
    nao_encontrado: 'Codigo de verificacao nao encontrado',
    invalido: 'Codigo de verificacao invalido',
};
async function resendVerification(email) {
    const { code, expiresAt, resendAfterSeconds, ttlSeconds } = await (0, email_verification_1.createEmailVerification)(email);
    await (0, email_1.sendVerificationEmail)({ to: email, code });
    return {
        ok: true,
        expiresAt,
        resendAfterSeconds,
        ttlSeconds,
    };
}
const authVerificationEmailRoute = async (app) => {
    app.post('/auth/verification/email', {
        schema: {
            tags: ['Auth'],
            summary: 'Enviar codigo de verificacao de email',
            body: zod_1.z.object({ email: zod_1.z.string().email() }),
        },
    }, async (request, reply) => {
        try {
            const data = await resendVerification(request.body.email);
            return data;
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Erro ao enviar codigo';
            if ((0, email_verification_1.isCooldownError)(error)) {
                return reply.code(429).send({ error: message, retryAfterSeconds: error.retryAfterSeconds });
            }
            if (message.includes('SMTP_')) {
                return reply.code(500).send({ error: 'Servico de email indisponivel' });
            }
            return reply.code(400).send({ error: message });
        }
    });
    app.post('/auth/verification/email/resend', {
        schema: {
            tags: ['Auth'],
            summary: 'Reenviar codigo de verificacao de email',
            body: zod_1.z.object({ email: zod_1.z.string().email() }),
        },
    }, async (request, reply) => {
        try {
            const data = await resendVerification(request.body.email);
            return data;
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Erro ao reenviar codigo';
            if ((0, email_verification_1.isCooldownError)(error)) {
                return reply.code(429).send({ error: message, retryAfterSeconds: error.retryAfterSeconds });
            }
            if (message.includes('SMTP_')) {
                return reply.code(500).send({ error: 'Servico de email indisponivel' });
            }
            return reply.code(400).send({ error: message });
        }
    });
    app.post('/auth/verification/email/confirm', {
        schema: {
            tags: ['Auth'],
            summary: 'Confirmar codigo de verificacao de email',
            body: zod_1.z.object({
                email: zod_1.z.string().email(),
                code: zod_1.z.string().min(1),
            }),
            response: {
                200: zod_1.z.object({ ok: zod_1.z.literal(true) }),
                400: zod_1.z.object({ error: zod_1.z.string() }),
                404: zod_1.z.object({ error: zod_1.z.string() }),
            },
        },
    }, async (request, reply) => {
        const normalizedEmail = request.body.email.trim().toLowerCase();
        const users = (await (0, db_1.sql) `
        SELECT id, email, papel
        FROM usuarios
        WHERE email = ${normalizedEmail}
        LIMIT 1
      `);
        const user = users[0];
        if (!user) {
            return reply.code(404).send({ error: 'Usuario nao encontrado' });
        }
        const verification = await (0, email_verification_1.verifyEmailCode)(normalizedEmail, request.body.code);
        if (!verification.ok) {
            const message = ERROR_MAP[verification.reason || 'invalido'] || 'Codigo de verificacao invalido';
            return reply.code(400).send({ error: message });
        }
        await (0, db_1.sql) `UPDATE usuarios SET email_verificado_em = now() WHERE id = ${user.id}`;
        const token = await (0, auth_1.createAuthToken)({
            userId: user.id,
            email: user.email,
            role: user.papel,
            emailVerifiedAt: new Date().toISOString(),
        });
        reply.setCookie(auth_1.AUTH_COOKIE_NAME, token, {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            maxAge: auth_1.AUTH_TOKEN_TTL_SECONDS,
            path: '/',
        });
        return { ok: true };
    });
};
exports.authVerificationEmailRoute = authVerificationEmailRoute;
