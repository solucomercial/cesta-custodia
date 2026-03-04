import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { createEmailVerification, isCooldownError, verifyEmailCode } from '@/lib/email-verification'
import { sendVerificationEmail } from '@/lib/email'
import { AUTH_COOKIE_NAME, AUTH_TOKEN_TTL_SECONDS, createAuthToken } from '@/lib/auth'
import { sql } from '@/lib/db'

const ERROR_MAP: Record<string, string> = {
  usado: 'Codigo de verificacao ja utilizado',
  expirado: 'Codigo de verificacao expirado',
  limite_tentativas: 'Limite de tentativas excedido. Solicite novo codigo',
  codigo_invalido: 'Codigo de verificacao invalido',
  nao_encontrado: 'Codigo de verificacao nao encontrado',
  invalido: 'Codigo de verificacao invalido',
}

async function resendVerification(email: string) {
  const { code, expiresAt, resendAfterSeconds, ttlSeconds } = await createEmailVerification(email)
  await sendVerificationEmail({ to: email, code })

  return {
    ok: true as const,
    expiresAt,
    resendAfterSeconds,
    ttlSeconds,
  }
}

export const authVerificationEmailRoute: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/auth/verification/email',
    {
      schema: {
        tags: ['Auth'],
        summary: 'Enviar codigo de verificacao de email',
        body: z.object({ email: z.string().email() }),
      },
    },
    async (request, reply) => {
      try {
        const data = await resendVerification(request.body.email)
        return data
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro ao enviar codigo'

        if (isCooldownError(error)) {
          return reply.code(429).send({ error: message, retryAfterSeconds: error.retryAfterSeconds })
        }

        if (message.includes('SMTP_')) {
          return reply.code(500).send({ error: 'Servico de email indisponivel' })
        }

        return reply.code(400).send({ error: message })
      }
    },
  )

  app.post(
    '/auth/verification/email/resend',
    {
      schema: {
        tags: ['Auth'],
        summary: 'Reenviar codigo de verificacao de email',
        body: z.object({ email: z.string().email() }),
      },
    },
    async (request, reply) => {
      try {
        const data = await resendVerification(request.body.email)
        return data
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro ao reenviar codigo'

        if (isCooldownError(error)) {
          return reply.code(429).send({ error: message, retryAfterSeconds: error.retryAfterSeconds })
        }

        if (message.includes('SMTP_')) {
          return reply.code(500).send({ error: 'Servico de email indisponivel' })
        }

        return reply.code(400).send({ error: message })
      }
    },
  )

  app.post(
    '/auth/verification/email/confirm',
    {
      schema: {
        tags: ['Auth'],
        summary: 'Confirmar codigo de verificacao de email',
        body: z.object({
          email: z.string().email(),
          code: z.string().min(1),
        }),
        response: {
          200: z.object({ ok: z.literal(true) }),
          400: z.object({ error: z.string() }),
          404: z.object({ error: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const normalizedEmail = request.body.email.trim().toLowerCase()

      const users = (await sql`
        SELECT id, email, papel
        FROM usuarios
        WHERE email = ${normalizedEmail}
        LIMIT 1
      `) as Array<{ id: string; email: string; papel: string }>

      const user = users[0]
      if (!user) {
        return reply.code(404).send({ error: 'Usuario nao encontrado' })
      }

      const verification = await verifyEmailCode(normalizedEmail, request.body.code)
      if (!verification.ok) {
        const message = ERROR_MAP[verification.reason || 'invalido'] || 'Codigo de verificacao invalido'
        return reply.code(400).send({ error: message })
      }

      await sql`UPDATE usuarios SET email_verificado_em = now() WHERE id = ${user.id}`

      const token = await createAuthToken({
        userId: user.id,
        email: user.email,
        role: user.papel,
        emailVerifiedAt: new Date().toISOString(),
      })

      reply.setCookie(AUTH_COOKIE_NAME, token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: AUTH_TOKEN_TTL_SECONDS,
        path: '/',
      })

      return { ok: true as const }
    },
  )
}
