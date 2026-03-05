"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRegisterRoute = void 0;
const node_crypto_1 = __importDefault(require("node:crypto"));
const zod_1 = require("zod");
const db_1 = require("../../lib/db");
const email_verification_1 = require("../../lib/email-verification");
const email_1 = require("../../lib/email");
const password_1 = require("../../lib/password");
const registerBodySchema = zod_1.z
    .object({
    name: zod_1.z.string().min(3),
    email: zod_1.z.string().email(),
    cpf: zod_1.z.string().min(11),
    rg: zod_1.z.string().min(5),
    birth_date: zod_1.z.string().min(1),
    phone: zod_1.z.string().min(10),
    address_street: zod_1.z.string().min(1),
    address_number: zod_1.z.string().min(1),
    address_complement: zod_1.z.string().optional(),
    address_neighborhood: zod_1.z.string().min(1),
    address_city: zod_1.z.string().min(1),
    address_state: zod_1.z.string().length(2),
    address_zip_code: zod_1.z.string().min(8),
    professional_type: zod_1.z.enum(['ADVOGADO', 'AGENTE_CONSULAR', 'OUTRO']),
    oab_number: zod_1.z.string().optional(),
    consular_registration: zod_1.z.string().optional(),
})
    .superRefine((data, ctx) => {
    if (data.professional_type === 'ADVOGADO' && !data.oab_number) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            message: 'Inscricao OAB obrigatoria para advogados',
            path: ['oab_number'],
        });
    }
    if (data.professional_type === 'AGENTE_CONSULAR' && !data.consular_registration) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            message: 'Matricula consular obrigatoria',
            path: ['consular_registration'],
        });
    }
});
const digitsOnly = (value) => value.replace(/\D/g, '');
function formatAddress(buyer) {
    const parts = [
        `${buyer.address_street}, ${buyer.address_number}`,
        buyer.address_complement,
        buyer.address_neighborhood,
        buyer.address_city,
        buyer.address_state,
        `CEP ${buyer.address_zip_code}`,
    ];
    return parts.filter(Boolean).join(' - ');
}
const authRegisterRoute = async (app) => {
    app.post('/auth/register', {
        schema: {
            tags: ['Auth'],
            summary: 'Cadastrar novo comprador',
            body: registerBodySchema,
            response: {
                201: zod_1.z.object({
                    ok: zod_1.z.literal(true),
                    user_id: zod_1.z.string().uuid(),
                    expiresAt: zod_1.z.date(),
                    resendAfterSeconds: zod_1.z.number(),
                    ttlSeconds: zod_1.z.number(),
                }),
                400: zod_1.z.object({ error: zod_1.z.string() }),
                409: zod_1.z.object({ error: zod_1.z.string() }),
                429: zod_1.z.object({ error: zod_1.z.string(), retryAfterSeconds: zod_1.z.number() }),
                500: zod_1.z.object({ error: zod_1.z.string() }),
            },
        },
    }, async (request, reply) => {
        const { name, email, cpf, rg, birth_date, phone, address_street, address_number, address_complement, address_neighborhood, address_city, address_state, address_zip_code, professional_type, oab_number, consular_registration, } = request.body;
        const normalizedEmail = email.trim().toLowerCase();
        const normalizedCpf = digitsOnly(cpf);
        const normalizedRg = rg ? digitsOnly(rg) : '';
        const normalizedPhone = digitsOnly(phone);
        const normalizedZip = digitsOnly(address_zip_code);
        const normalizedOab = oab_number?.trim() || null;
        const normalizedConsular = consular_registration ? digitsOnly(consular_registration) : null;
        const [existingUser] = (await (0, db_1.sql) `
        SELECT id FROM usuarios WHERE email = ${normalizedEmail} LIMIT 1
      `);
        if (existingUser) {
            return reply.code(409).send({ error: 'Email ja cadastrado' });
        }
        const [existingBuyer] = (await (0, db_1.sql) `
        SELECT id FROM compradores WHERE cpf = ${normalizedCpf} LIMIT 1
      `);
        if (existingBuyer) {
            return reply.code(409).send({ error: 'CPF ja cadastrado' });
        }
        const address = formatAddress({
            address_street,
            address_number,
            address_complement,
            address_neighborhood,
            address_city,
            address_state,
            address_zip_code: normalizedZip,
        });
        try {
            const disabledPasswordHash = await (0, password_1.hashPassword)(node_crypto_1.default.randomBytes(32).toString('hex'));
            const [newUser] = (await (0, db_1.sql) `
          INSERT INTO usuarios (email, senha_hash, papel)
          VALUES (${normalizedEmail}, ${disabledPasswordHash}, 'COMPRADOR')
          RETURNING id
        `);
            await (0, db_1.sql) `
          INSERT INTO compradores (usuario_id, nome, cpf, rg, data_nascimento, endereco, telefone, tipo_profissional, oab, matricula_consular)
          VALUES (${newUser.id}, ${name}, ${normalizedCpf}, ${normalizedRg || null}, ${birth_date}, ${address}, ${normalizedPhone}, ${professional_type}, ${normalizedOab}, ${normalizedConsular})
        `;
            const { code, expiresAt, resendAfterSeconds, ttlSeconds } = await (0, email_verification_1.createEmailVerification)(normalizedEmail);
            await (0, email_1.sendVerificationEmail)({ to: normalizedEmail, code });
            return reply.code(201).send({
                ok: true,
                user_id: newUser.id,
                expiresAt,
                resendAfterSeconds,
                ttlSeconds,
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Erro ao cadastrar';
            if ((0, email_verification_1.isCooldownError)(error)) {
                return reply.code(429).send({ error: message, retryAfterSeconds: error.retryAfterSeconds });
            }
            if (message.includes('SMTP_')) {
                return reply.code(500).send({ error: 'Servico de email indisponivel' });
            }
            return reply.code(500).send({ error: 'Erro interno' });
        }
    });
};
exports.authRegisterRoute = authRegisterRoute;
