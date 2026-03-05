"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMagicLinkRoute = void 0;
const node_crypto_1 = __importDefault(require("node:crypto"));
const zod_1 = require("zod");
const email_1 = require("../../lib/email");
const db_1 = require("../../lib/db");
const MAGIC_LINK_TTL_MINUTES = 5;
const digitsOnly = (value) => value.replace(/\D/g, '');
function hashToken(token) {
    return node_crypto_1.default.createHash('sha256').update(token).digest('hex');
}
const authMagicLinkRoute = async (app) => {
    app.post('/auth/magic-link', {
        schema: {
            tags: ['Auth'],
            summary: 'Enviar magic link para login',
            body: zod_1.z.object({
                cpf: zod_1.z.string().optional(),
                oab: zod_1.z.string().optional(),
                matricula: zod_1.z.string().optional(),
            }),
            response: {
                200: zod_1.z.object({ ok: zod_1.z.literal(true) }),
                400: zod_1.z.object({ error: zod_1.z.string() }),
                404: zod_1.z.object({ error: zod_1.z.string() }),
                500: zod_1.z.object({
                    error: zod_1.z.string(),
                    details: zod_1.z.string().optional(),
                }),
            },
        },
    }, async (request, reply) => {
        console.log('MAGIC-LINK: Iniciando requisição');
        try {
            const { cpf, oab, matricula } = request.body;
            const normalizedCpf = cpf ? digitsOnly(String(cpf)) : '';
            const normalizedOab = oab ? String(oab).trim() : '';
            const normalizedMatricula = matricula ? String(matricula).trim() : '';
            const identifier = normalizedCpf || normalizedOab || normalizedMatricula;
            console.log('MAGIC-LINK: Identificador recebido:', normalizedCpf ? 'cpf' : normalizedOab ? 'oab' : normalizedMatricula ? 'matricula' : 'nenhum');
            if (!identifier) {
                return reply.code(400).send({ error: 'Identificador obrigatorio' });
            }
            console.log('MAGIC-LINK: Buscando usuário com identificador:', normalizedCpf ? `[cpf len=${normalizedCpf.length}]` : normalizedOab ? `[oab len=${normalizedOab.length}]` : `[matricula len=${normalizedMatricula.length}]`);
            let user;
            if (normalizedCpf) {
                ;
                [user] = (await (0, db_1.sql) `
            SELECT u.id, u.email, u.papel, u.email_verificado_em
            FROM usuarios u
            JOIN compradores c ON c.usuario_id = u.id
            WHERE c.cpf = ${normalizedCpf}
            LIMIT 1
          `);
            }
            else if (normalizedOab) {
                ;
                [user] = (await (0, db_1.sql) `
            SELECT u.id, u.email, u.papel, u.email_verificado_em
            FROM usuarios u
            JOIN compradores c ON c.usuario_id = u.id
            WHERE c.oab = ${normalizedOab}
            LIMIT 1
          `);
            }
            else {
                ;
                [user] = (await (0, db_1.sql) `
            SELECT u.id, u.email, u.papel, u.email_verificado_em
            FROM usuarios u
            JOIN compradores c ON c.usuario_id = u.id
            WHERE c.matricula_consular = ${normalizedMatricula}
            LIMIT 1
          `);
            }
            console.log('MAGIC-LINK: Resultado da busca no banco:', user ? `Usuário encontrado: ${user.email}` : 'Usuário não encontrado');
            if (!user) {
                return reply.code(404).send({ error: 'Cadastro nao encontrado' });
            }
            console.log('MAGIC-LINK: Gerando token e gravando no banco...');
            const token = node_crypto_1.default.randomUUID();
            const tokenHash = hashToken(token);
            const expiresAt = new Date(Date.now() + MAGIC_LINK_TTL_MINUTES * 60 * 1000);
            await (0, db_1.sql) `
          INSERT INTO verificacoes_email (email, codigo_hash, expira_em, tentativas)
          VALUES (${user.email}, ${tokenHash}, ${expiresAt.toISOString()}, 0)
        `;
            const apiOrigin = process.env.API_PUBLIC_ORIGIN ?? 'http://localhost:3333';
            const link = `${apiOrigin}/auth/callback?token=${encodeURIComponent(token)}`;
            console.log('MAGIC-LINK: Link gerado:', link);
            console.log('MAGIC-LINK: Tentando enviar e-mail para:', user.email);
            await (0, email_1.sendMagicLinkEmail)({
                to: user.email,
                link,
                expiresAt,
            });
            console.log('MAGIC-LINK: E-mail enviado com sucesso');
            return reply.send({ ok: true });
        }
        catch (error) {
            console.error('MAGIC-LINK: ERRO CRÍTICO NA EXECUÇÃO:');
            console.error(error);
            return reply.code(500).send({
                error: 'Erro interno no servidor',
                details: error instanceof Error ? error.message : 'Erro desconhecido',
            });
        }
    });
};
exports.authMagicLinkRoute = authMagicLinkRoute;
