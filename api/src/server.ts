import {fastify} from 'fastify'
import {
  serializerCompiler,
  validatorCompiler,
  jsonSchemaTransform,
  type ZodTypeProvider
} from 'fastify-type-provider-zod'
import { z } from 'zod'
import { fastifySwagger } from '@fastify/swagger'
import { fastifyCors } from '@fastify/cors'
import { fastifyCookie } from '@fastify/cookie'
import ScalarApiReference from '@scalar/fastify-api-reference'
import '@/lib/env'
import { sql } from '@/lib/db'
import { authLoginRoute } from '@/routes/auth/login'
import { authMagicLinkRoute } from '@/routes/auth/magic-link'
import { authRegisterRoute } from '@/routes/auth/register'
import { authVerificationEmailRoute } from '@/routes/auth/verification-email'
import { authMeRoute } from '@/routes/auth/me'
import { authCallbackRoute } from '@/routes/auth/callback'
import { getProductsRoute } from '@/routes/products/get-products'
import { searchInmateRoute } from '@/routes/inmates/search-inmate'
import { ordersRoute } from '@/routes/orders/orders'
import { updateOrderStatusRoute } from '@/routes/orders/update-order-status'
import { getPrisonUnitsRoute } from '@/routes/prison-units/get-prison-units'
import { adminAuditRoute } from '@/routes/admin/audit'
import { adminStatsRoute } from '@/routes/admin/stats'
import { getCepRoute } from '@/routes/cep/get-cep'


async function bootstrap() {
  const app = fastify({
    logger: true, // Ativa o logger nativo do Fastify
  }).withTypeProvider<ZodTypeProvider>()

  // Log para verificar qual origem está sendo carregada
  console.log('CORS: FRONTEND_ORIGIN configurado como:', process.env.FRONTEND_ORIGIN)

  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)

  app.register(fastifyCors, {
    origin: (origin, cb) => {
      console.log('CORS: Requisição vinda da origem:', origin)
      const allowed = process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000'

      if (!origin || origin === allowed) {
        cb(null, true)
        return
      }

      console.error(
        `CORS: Bloqueado. Origem ${origin} não coincide com ${allowed}`,
      )
      cb(new Error('Not allowed by CORS'), false)
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
    maxAge: 28800, // 8 hours
  })

  app.register(fastifyCookie)

  app.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'Seap API',
        description: 'API para gerenciamento de dados de solicitações de compras e operações relacionadas',
        version: '1.0.0',
      },
    },
    transform: jsonSchemaTransform,
  })

  app.register(ScalarApiReference, {
    routePrefix: '/docs',
  })

  app.register(authLoginRoute)
  app.register(authMagicLinkRoute)
  app.register(authRegisterRoute)
  app.register(authVerificationEmailRoute)
  app.register(authMeRoute)
  app.register(authCallbackRoute)
  app.register(getProductsRoute)
  app.register(searchInmateRoute)
  app.register(ordersRoute)
  app.register(updateOrderStatusRoute)
  app.register(getPrisonUnitsRoute)
  app.register(adminAuditRoute)
  app.register(adminStatsRoute)
  app.register(getCepRoute)

  app.get(
    '/health',
    {
      schema: {
        tags: ['System'],
        summary: 'Health check',
        response: {
          200: z.object({
            ok: z.boolean(),
            status: z.enum(['ok', 'unhealthy']),
            timestamp: z.string(),
            uptime_seconds: z.number(),
            database: z.enum(['connected', 'disconnected']),
            error: z.string().optional(),
          }),
        },
      },
    },
    async () => {
      const base = {
        timestamp: new Date().toISOString(),
        uptime_seconds: Math.floor(process.uptime()),
      }

      try {
        await sql`SELECT 1`
        return {
          ok: true,
          status: 'ok' as const,
          database: 'connected' as const,
          ...base,
        }
      } catch (err) {
        return {
          ok: false,
          status: 'unhealthy' as const,
          database: 'disconnected' as const,
          error: (err as Error).message,
          ...base,
        }
      }
    },
  )

  try {
    await app.listen({ port: 3333, host: '0.0.0.0'})

    console.log('HTTP server running on http://localhost:3333')
    console.log('Docs available at http://localhost:3333/docs')

    // Validação PÓS-DEPLOY: não derruba o container em caso de falha
    console.log('🔄 [POST-DEPLOY] Verificando conexão com o banco de dados...')
    void sql`SELECT 1`
      .then(() => {
        console.log('✅ [POST-DEPLOY] Banco de dados conectado com sucesso!')
      })
      .catch((err) => {
        console.error('❌ [POST-DEPLOY] Erro de conexão detectado após o boot:')
        console.error((err as Error).message)
      })
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

bootstrap()