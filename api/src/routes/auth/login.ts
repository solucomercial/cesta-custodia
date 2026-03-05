import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { createAuthToken } from '@/lib/auth'
import { sql } from '@/lib/db'
import { verifyPassword } from '@/lib/password'

type LoginUserRow = {
  id: string
  email: string
  papel: string
  email_verificado_em: string | Date | null
  senha_hash: string
}

export const authLoginRoute: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/auth/login',
    {
      schema: {
        tags: ['Auth'],
        summary: 'Autenticar usuário com email/identificador e senha',
        body: z.object({
          email: z.string().email().optional(),
          identifier: z.string().min(1).optional(),
          password: z.string().min(1),
          role: z.enum(['ADMIN', 'FISCAL_SEAP', 'COMPRADOR', 'OPERADOR']).optional(),
        }),
        response: {
          200: z.object({
            token: z.string(),
            user: z.object({
              id: z.string(),
              email: z.string(),
              role: z.string(),
              email_verified_at: z.string().nullable(),
            }),
          }),
          400: z.object({ error: z.string() }),
          401: z.object({ error: z.string() }),
          403: z.object({ error: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const { email, identifier, password, role } = request.body
      const loginEmail = email || identifier

      if (!loginEmail || !password) {
        return reply.code(400).send({ error: 'Email e senha sao obrigatorios' })
      }

      const users = (await sql`
        SELECT id, email, papel, email_verificado_em, senha_hash
        FROM usuarios
        WHERE email = ${loginEmail}
        LIMIT 1
      `) as LoginUserRow[]

      const user = users[0]

      if (!user) {
        return reply.code(401).send({ error: 'Credenciais invalidas' })
      }

      const isValidPassword = await verifyPassword(password, user.senha_hash)
      if (!isValidPassword) {
        return reply.code(401).send({ error: 'Credenciais invalidas' })
      }

      if (role === 'COMPRADOR' || role === 'OPERADOR') {
        const isAuthorized = await checkSipenAuthorization(loginEmail, role)
        if (!isAuthorized) {
          return reply.code(403).send({ error: 'Acesso negado: Vinculo nao autorizado ou vencido no SIPEN' })
        }
      }

      const emailVerifiedAt = user.email_verificado_em
        ? new Date(user.email_verificado_em).toISOString()
        : null

      const token = await createAuthToken({
        userId: user.id,
        email: user.email,
        role: user.papel,
        emailVerifiedAt,
      })

      return reply.send({
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.papel,
          email_verified_at: emailVerifiedAt,
        },
      })
    },
  )
}

async function checkSipenAuthorization(_identifier: string, _type: string) {
  return true
}
