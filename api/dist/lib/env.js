"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.databaseSslRejectUnauthorized = exports.databaseSslEnabled = exports.isProduction = exports.env = void 0;
const zod_1 = require("zod");
const truthy = new Set(['1', 'true', 'yes', 'on']);
const falsy = new Set(['0', 'false', 'no', 'off']);
function parseBoolean(value) {
    if (value == null)
        return null;
    const normalized = value.trim().toLowerCase();
    if (truthy.has(normalized))
        return true;
    if (falsy.has(normalized))
        return false;
    return null;
}
const envSchema = zod_1.z
    .object({
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).optional(),
    DATABASE_URL: zod_1.z.string().url('DATABASE_URL invalida'),
    DATABASE_SSL: zod_1.z.string().optional(),
    DATABASE_SSL_REJECT_UNAUTHORIZED: zod_1.z.string().optional(),
    AUTH_TOKEN_SECRET: zod_1.z.string().min(32, 'AUTH_TOKEN_SECRET deve ter pelo menos 32 caracteres'),
    AUTH_TOKEN_TTL_SECONDS: zod_1.z.string().optional(),
    FRONTEND_ORIGIN: zod_1.z.string().url('FRONTEND_ORIGIN invalida').optional(),
    SMTP_HOST: zod_1.z.string().optional(),
    SMTP_FROM: zod_1.z.string().optional(),
    SMTP_PORT: zod_1.z.string().optional(),
    SMTP_SECURE: zod_1.z.string().optional(),
    SMTP_USER: zod_1.z.string().optional(),
    SMTP_PASS: zod_1.z.string().optional(),
})
    .superRefine((value, ctx) => {
    const isProd = (value.NODE_ENV ?? 'development') === 'production';
    if (isProd) {
        if (!value.FRONTEND_ORIGIN) {
            ctx.addIssue({ code: zod_1.z.ZodIssueCode.custom, path: ['FRONTEND_ORIGIN'], message: 'FRONTEND_ORIGIN obrigatoria em producao' });
        }
        if (!value.SMTP_HOST) {
            ctx.addIssue({ code: zod_1.z.ZodIssueCode.custom, path: ['SMTP_HOST'], message: 'SMTP_HOST obrigatoria em producao' });
        }
        if (!value.SMTP_FROM) {
            ctx.addIssue({ code: zod_1.z.ZodIssueCode.custom, path: ['SMTP_FROM'], message: 'SMTP_FROM obrigatoria em producao' });
        }
    }
    if (value.SMTP_USER && !value.SMTP_PASS) {
        ctx.addIssue({ code: zod_1.z.ZodIssueCode.custom, path: ['SMTP_PASS'], message: 'SMTP_PASS obrigatoria quando SMTP_USER estiver definido' });
    }
});
const parsed = envSchema.safeParse(process.env);
if (parsed.success === false) {
    // eslint-disable-next-line no-console
    console.error('❌ Variaveis de ambiente invalidas:', parsed.error.format());
    throw new Error('Variaveis de ambiente invalidas.');
}
exports.env = parsed.data;
exports.isProduction = (exports.env.NODE_ENV ?? 'development') === 'production';
exports.databaseSslEnabled = (() => {
    const parsed = parseBoolean(exports.env.DATABASE_SSL);
    if (parsed !== null)
        return parsed;
    return exports.isProduction;
})();
exports.databaseSslRejectUnauthorized = (() => {
    const parsed = parseBoolean(exports.env.DATABASE_SSL_REJECT_UNAUTHORIZED);
    if (parsed !== null)
        return parsed;
    return true;
})();
