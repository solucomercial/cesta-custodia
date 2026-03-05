import crypto from 'node:crypto'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { AUTH_COOKIE_NAME, AUTH_TOKEN_TTL_SECONDS, createAuthToken } from '@/lib/auth'
import { sql } from '@/lib/db'

function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

function getTargetPath(role: string) {
  if (role === 'ADMIN' || role === 'FISCAL_SEAP') {
    return '/admin'
  }

  return '/catalogo'
}

export const authCallbackRoute: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/auth/callback',
    {
      schema: {
        tags: ['Auth'],
        summary: 'Consumir magic link e autenticar sessao',
        querystring: z.object({ token: z.string().optional() }),
      },
    },
    async (request, reply) => {
      const token = request.query.token
      const frontendOrigin = process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000'

      if (!token) {
        return reply.redirect(`${frontendOrigin}/login?magic=missing`)
      }

      try {
        const tokenHash = hashToken(token)

        const [record] = (await sql`
          SELECT id, email, expira_em, usado_em
          FROM verificacoes_email
          WHERE codigo_hash = ${tokenHash}
          LIMIT 1
        `) as Array<{ id: string; email: string; expira_em: Date | string | null; usado_em: Date | string | null }>

        if (!record) {
          return reply.redirect(`${frontendOrigin}/login?magic=invalid`)
        }

        if (record.usado_em) {
          return reply.redirect(`${frontendOrigin}/login?magic=used`)
        }

        if (record.expira_em && new Date(record.expira_em) < new Date()) {
          return reply.redirect(`${frontendOrigin}/login?magic=expired`)
        }

        const [user] = (await sql`
          SELECT id, email, papel, email_verificado_em
          FROM usuarios
          WHERE email = ${record.email}
          LIMIT 1
        `) as Array<{ id: string; email: string; papel: string; email_verificado_em: Date | string | null }>

        if (!user) {
          return reply.redirect(`${frontendOrigin}/login?magic=invalid`)
        }

        await sql`
          UPDATE verificacoes_email
          SET usado_em = now()
          WHERE id = ${record.id}
        `

        const emailVerifiedAt = user.email_verificado_em
          ? new Date(user.email_verificado_em).toISOString()
          : null

        const authToken = await createAuthToken({
          userId: user.id,
          email: user.email,
          role: user.papel,
          emailVerifiedAt,
        })

        reply.setCookie(AUTH_COOKIE_NAME, authToken, {
          httpOnly: true,
          sameSite: 'none', // Alterado de 'lax' para 'none'
          secure: true,      // Deve ser sempre true para 'none'
          maxAge: AUTH_TOKEN_TTL_SECONDS,
          path: '/',
        })

        return reply.redirect(`${frontendOrigin}${getTargetPath(user.papel)}`)
      } catch {
        return reply.redirect(`${frontendOrigin}/login?magic=error`)
      }
    },
  )
}
