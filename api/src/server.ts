import {fastify} from 'fastify'
import {
  serializerCompiler,
  validatorCompiler,
  jsonSchemaTransform,
  type ZodTypeProvider
} from 'fastify-type-provider-zod'
import { fastifySwagger } from '@fastify/swagger'
import { fastifyCors } from '@fastify/cors'
import { fastifyCookie } from '@fastify/cookie'
import ScalarApiReference from '@scalar/fastify-api-reference'
import { authLoginRoute } from '@/routes/auth/login'
import { authMagicLinkRoute } from '@/routes/auth/magic-link'
import { getProductsRoute } from '@/routes/products/get-products'
import { searchInmateRoute } from '@/routes/inmates/search-inmate'
import { ordersRoute } from '@/routes/orders/orders'
import { getPrisonUnitsRoute } from '@/routes/prison-units/get-prison-units'


const app = fastify().withTypeProvider<ZodTypeProvider>()

app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)

app.register(fastifyCors, {
  origin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true,
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
app.register(getProductsRoute)
app.register(searchInmateRoute)
app.register(ordersRoute)
app.register(getPrisonUnitsRoute)

app.listen({ port: 3333, host: '0.0.0.0'}).then(() => {
  console.log('HTTP server running on http://localhost:3333')
  console.log('Docs available at http://localhost:3333/docs')
})