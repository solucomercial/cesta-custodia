"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEmailVerification = createEmailVerification;
exports.verifyEmailCode = verifyEmailCode;
exports.isCooldownError = isCooldownError;
const node_crypto_1 = __importDefault(require("node:crypto"));
const db_1 = require("../lib/db");
const CODE_LENGTH = 6;
const DEFAULT_TTL_MINUTES = 10;
const DEFAULT_RESEND_SECONDS = 60;
const DEFAULT_RESEND_SECONDS_DEV = 2;
const DEFAULT_MAX_ATTEMPTS = 5;
class CooldownError extends Error {
    retryAfterSeconds;
    constructor(message, retryAfterSeconds) {
        super(message);
        this.retryAfterSeconds = retryAfterSeconds;
    }
}
function normalizeEmail(email) {
    return email.trim().toLowerCase();
}
function generateCode() {
    const min = 10 ** (CODE_LENGTH - 1);
    const max = 10 ** CODE_LENGTH - 1;
    return String(Math.floor(Math.random() * (max - min + 1)) + min);
}
function hashCode(code) {
    return node_crypto_1.default.createHash('sha256').update(code).digest('hex');
}
async function createEmailVerification(email, executor = db_1.sql) {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) {
        throw new Error('Email obrigatorio');
    }
    const isDev = process.env.NODE_ENV !== 'production';
    const resendSeconds = Number(process.env.EMAIL_VERIFICATION_RESEND_SECONDS
        ?? (isDev ? DEFAULT_RESEND_SECONDS_DEV : DEFAULT_RESEND_SECONDS));
    const [latest] = (await executor `
    SELECT criado_em
    FROM verificacoes_email
    WHERE email = ${normalizedEmail}
    ORDER BY criado_em DESC
    LIMIT 1
  `);
    if (latest?.criado_em) {
        const lastSent = new Date(latest.criado_em);
        const diffSeconds = (Date.now() - lastSent.getTime()) / 1000;
        if (diffSeconds < resendSeconds) {
            const retryAfterSeconds = Math.max(1, Math.ceil(resendSeconds - diffSeconds));
            throw new CooldownError('Aguarde alguns segundos antes de solicitar novo codigo', retryAfterSeconds);
        }
    }
    const ttlMinutes = Number(process.env.EMAIL_VERIFICATION_TTL_MINUTES ?? DEFAULT_TTL_MINUTES);
    const code = generateCode();
    const codeHash = hashCode(code);
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
    await executor `
    INSERT INTO verificacoes_email (email, codigo_hash, expira_em, tentativas)
    VALUES (${normalizedEmail}, ${codeHash}, ${expiresAt.toISOString()}, 0)
  `;
    return {
        code,
        expiresAt,
        ttlSeconds: ttlMinutes * 60,
        resendAfterSeconds: resendSeconds,
    };
}
async function verifyEmailCode(email, code) {
    const normalizedEmail = normalizeEmail(email);
    const cleanCode = code.trim();
    if (!normalizedEmail || !cleanCode) {
        return { ok: false, reason: 'invalido' };
    }
    const codeHash = hashCode(cleanCode);
    const [record] = (await (0, db_1.sql) `
    SELECT id, codigo_hash, expira_em, usado_em, tentativas
    FROM verificacoes_email
    WHERE email = ${normalizedEmail}
    ORDER BY criado_em DESC
    LIMIT 1
  `);
    if (!record) {
        return { ok: false, reason: 'nao_encontrado' };
    }
    if (record.usado_em) {
        return { ok: false, reason: 'usado' };
    }
    if (record.expira_em && new Date(record.expira_em) < new Date()) {
        return { ok: false, reason: 'expirado' };
    }
    const maxAttempts = Number(process.env.EMAIL_VERIFICATION_MAX_ATTEMPTS ?? DEFAULT_MAX_ATTEMPTS);
    const attempts = Number(record.tentativas ?? 0);
    if (attempts >= maxAttempts) {
        return { ok: false, reason: 'limite_tentativas' };
    }
    if (record.codigo_hash !== codeHash) {
        await (0, db_1.sql) `
      UPDATE verificacoes_email
      SET tentativas = tentativas + 1
      WHERE id = ${record.id}
    `;
        return { ok: false, reason: 'codigo_invalido' };
    }
    await (0, db_1.sql) `
    UPDATE verificacoes_email
    SET usado_em = now()
    WHERE id = ${record.id}
  `;
    return { ok: true };
}
function isCooldownError(error) {
    return error instanceof CooldownError;
}
