"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCepRoute = void 0;
const zod_1 = require("zod");
const viaCepSchema = zod_1.z.object({
    erro: zod_1.z.boolean().optional(),
    cep: zod_1.z.string().optional(),
    logradouro: zod_1.z.string().optional(),
    complemento: zod_1.z.string().optional(),
    bairro: zod_1.z.string().optional(),
    localidade: zod_1.z.string().optional(),
    uf: zod_1.z.string().optional(),
});
const brasilApiSchema = zod_1.z.object({
    cep: zod_1.z.string().optional(),
    street: zod_1.z.string().optional(),
    neighborhood: zod_1.z.string().optional(),
    city: zod_1.z.string().optional(),
    state: zod_1.z.string().optional(),
});
const openCepSchema = zod_1.z.object({
    cep: zod_1.z.string().optional(),
    logradouro: zod_1.z.string().optional(),
    complemento: zod_1.z.string().optional(),
    bairro: zod_1.z.string().optional(),
    localidade: zod_1.z.string().optional(),
    uf: zod_1.z.string().optional(),
});
const getCepRoute = async (app) => {
    app.get('/cep/:code', {
        schema: {
            tags: ['CEP'],
            summary: 'Consultar CEP com fallback',
            params: zod_1.z.object({
                code: zod_1.z.string().regex(/^\d{8}$/, 'CEP deve conter 8 digitos numericos'),
            }),
        },
    }, async (request, reply) => {
        const { code } = request.params;
        const viaCep = await tryViaCep(code);
        if (viaCep)
            return viaCep;
        app.log.warn(`ViaCEP falhou para o CEP ${code}, tentando Brasil API...`);
        const brasilApi = await tryBrasilApi(code);
        if (brasilApi)
            return brasilApi;
        app.log.warn(`Brasil API falhou para o CEP ${code}, tentando OpenCEP...`);
        const openCep = await tryOpenCep(code);
        if (openCep)
            return openCep;
        return reply.status(404).send({
            error: 'CEP não encontrado em nenhuma fonte',
        });
    });
};
exports.getCepRoute = getCepRoute;
async function tryViaCep(cep) {
    try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();
        const parsed = viaCepSchema.safeParse(data);
        if (!parsed.success || parsed.data.erro)
            return null;
        const result = parsed.data;
        if (!result.cep)
            return null;
        return {
            zip_code: String(result.cep).replace('-', ''),
            street: result.logradouro ?? '',
            complement: result.complemento ?? '',
            neighborhood: result.bairro ?? '',
            city: result.localidade ?? '',
            state: result.uf ?? '',
        };
    }
    catch {
        return null;
    }
}
async function tryBrasilApi(cep) {
    try {
        const response = await fetch(`https://brasilapi.com.br/api/cep/v1/${cep}`);
        if (!response.ok)
            return null;
        const data = await response.json();
        const parsed = brasilApiSchema.safeParse(data);
        if (!parsed.success)
            return null;
        const result = parsed.data;
        if (!result.cep)
            return null;
        return {
            zip_code: String(result.cep),
            street: result.street ?? '',
            complement: '',
            neighborhood: result.neighborhood ?? '',
            city: result.city ?? '',
            state: result.state ?? '',
        };
    }
    catch {
        return null;
    }
}
async function tryOpenCep(cep) {
    try {
        const response = await fetch(`https://opencep.com/v1/${cep}`);
        if (!response.ok)
            return null;
        const data = await response.json();
        const parsed = openCepSchema.safeParse(data);
        if (!parsed.success)
            return null;
        const result = parsed.data;
        if (!result.cep)
            return null;
        return {
            zip_code: String(result.cep).replace('-', ''),
            street: result.logradouro ?? '',
            complement: result.complemento ?? '',
            neighborhood: result.bairro ?? '',
            city: result.localidade ?? '',
            state: result.uf ?? '',
        };
    }
    catch {
        return null;
    }
}
