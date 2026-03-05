"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = require("fastify");
const fastify_type_provider_zod_1 = require("fastify-type-provider-zod");
const zod_1 = require("zod");
const swagger_1 = require("@fastify/swagger");
const cors_1 = require("@fastify/cors");
const cookie_1 = require("@fastify/cookie");
const fastify_api_reference_1 = __importDefault(require("@scalar/fastify-api-reference"));
require("./lib/env");
const db_1 = require("./lib/db");
const login_1 = require("./routes/auth/login");
const magic_link_1 = require("./routes/auth/magic-link");
const register_1 = require("./routes/auth/register");
const verification_email_1 = require("./routes/auth/verification-email");
const me_1 = require("./routes/auth/me");
const callback_1 = require("./routes/auth/callback");
const get_products_1 = require("./routes/products/get-products");
const search_inmate_1 = require("./routes/inmates/search-inmate");
const orders_1 = require("./routes/orders/orders");
const update_order_status_1 = require("./routes/orders/update-order-status");
const get_prison_units_1 = require("./routes/prison-units/get-prison-units");
const audit_1 = require("./routes/admin/audit");
const stats_1 = require("./routes/admin/stats");
const get_cep_1 = require("./routes/cep/get-cep");
async function bootstrap() {
    const app = (0, fastify_1.fastify)({
        logger: true, // Ativa o logger nativo do Fastify
    }).withTypeProvider();
    // Log para verificar qual origem está sendo carregada
    console.log('CORS: FRONTEND_ORIGIN configurado como:', process.env.FRONTEND_ORIGIN);
    app.setValidatorCompiler(fastify_type_provider_zod_1.validatorCompiler);
    app.setSerializerCompiler(fastify_type_provider_zod_1.serializerCompiler);
    app.register(cors_1.fastifyCors, {
        origin: (origin, cb) => {
            console.log('CORS: Requisição vinda da origem:', origin);
            const allowed = process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000';
            if (!origin || origin === allowed) {
                cb(null, true);
                return;
            }
            console.error(`CORS: Bloqueado. Origem ${origin} não coincide com ${allowed}`);
            cb(new Error('Not allowed by CORS'), false);
        },
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        credentials: true,
        maxAge: 28800, // 8 hours
    });
    app.register(cookie_1.fastifyCookie);
    app.register(swagger_1.fastifySwagger, {
        openapi: {
            info: {
                title: 'Seap API',
                description: 'API para gerenciamento de dados de solicitações de compras e operações relacionadas',
                version: '1.0.0',
            },
        },
        transform: fastify_type_provider_zod_1.jsonSchemaTransform,
    });
    app.register(fastify_api_reference_1.default, {
        routePrefix: '/docs',
    });
    app.register(login_1.authLoginRoute);
    app.register(magic_link_1.authMagicLinkRoute);
    app.register(register_1.authRegisterRoute);
    app.register(verification_email_1.authVerificationEmailRoute);
    app.register(me_1.authMeRoute);
    app.register(callback_1.authCallbackRoute);
    app.register(get_products_1.getProductsRoute);
    app.register(search_inmate_1.searchInmateRoute);
    app.register(orders_1.ordersRoute);
    app.register(update_order_status_1.updateOrderStatusRoute);
    app.register(get_prison_units_1.getPrisonUnitsRoute);
    app.register(audit_1.adminAuditRoute);
    app.register(stats_1.adminStatsRoute);
    app.register(get_cep_1.getCepRoute);
    app.get('/health', {
        schema: {
            tags: ['System'],
            summary: 'Health check',
            response: {
                200: zod_1.z.object({
                    status: zod_1.z.enum(['ok', 'unhealthy']),
                    database: zod_1.z.enum(['connected', 'disconnected']),
                    error: zod_1.z.string().optional(),
                }),
            },
        },
    }, async () => {
        try {
            await (0, db_1.sql) `SELECT 1`;
            return { status: 'ok', database: 'connected' };
        }
        catch (err) {
            return {
                status: 'unhealthy',
                database: 'disconnected',
                error: err.message,
            };
        }
    });
    try {
        await app.listen({ port: 3333, host: '0.0.0.0' });
        console.log('HTTP server running on http://localhost:3333');
        console.log('Docs available at http://localhost:3333/docs');
        // Validação PÓS-DEPLOY: não derruba o container em caso de falha
        console.log('🔄 [POST-DEPLOY] Verificando conexão com o banco de dados...');
        void (0, db_1.sql) `SELECT 1`
            .then(() => {
            console.log('✅ [POST-DEPLOY] Banco de dados conectado com sucesso!');
        })
            .catch((err) => {
            console.error('❌ [POST-DEPLOY] Erro de conexão detectado após o boot:');
            console.error(err.message);
        });
    }
    catch (err) {
        app.log.error(err);
        process.exit(1);
    }
}
bootstrap();
