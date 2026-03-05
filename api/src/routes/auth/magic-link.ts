import crypto from 'node:crypto'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { sendMagicLinkEmail } from '@/lib/email'
import { sql } from '@/lib/db'

const MAGIC_LINK_TTL_MINUTES = 5

const digitsOnly = (value: string) => value.replace(/\D/g, '')

function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

type MagicLinkUser = {
  id: string
  email: string
  papel: string
  email_verificado_em: Date | string | null
}

export const authMagicLinkRoute: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/auth/magic-link',
    {
      schema: {
        tags: ['Auth'],
        summary: 'Enviar magic link para login',
        body: z.object({
          cpf: z.string().optional(),
          oab: z.string().optional(),
          matricula: z.string().optional(),
        }),
        response: {
          200: z.object({ ok: z.literal(true) }),
          400: z.object({ error: z.string() }),
          404: z.object({ error: z.string() }),
          500: z.object({
            error: z.string(),
            details: z.string().optional(),
          }),
        },
      },
    },
    async (request, reply) => {
      console.log('MAGIC-LINK: Iniciando requisição')

      try {
        const { cpf, oab, matricula } = request.body

        const normalizedCpf = cpf ? digitsOnly(String(cpf)) : ''
        const normalizedOab = oab ? String(oab).trim() : ''
        const normalizedMatricula = matricula ? String(matricula).trim() : ''

        const identifier = normalizedCpf || normalizedOab || normalizedMatricula
        console.log('MAGIC-LINK: Identificador recebido:',
          normalizedCpf ? 'cpf' : normalizedOab ? 'oab' : normalizedMatricula ? 'matricula' : 'nenhum',
        )

        if (!identifier) {
          return reply.code(400).send({ error: 'Identificador obrigatorio' })
        }

        console.log('MAGIC-LINK: Buscando usuário com identificador:',
          normalizedCpf ? `[cpf len=${normalizedCpf.length}]` : normalizedOab ? `[oab len=${normalizedOab.length}]` : `[matricula len=${normalizedMatricula.length}]`,
        )

        let user: MagicLinkUser | undefined

        if (normalizedCpf) {
          ;[user] = (await sql`
            SELECT u.id, u.email, u.papel, u.email_verificado_em
            FROM usuarios u
            JOIN compradores c ON c.usuario_id = u.id
            WHERE c.cpf = ${normalizedCpf}
            LIMIT 1
          `) as MagicLinkUser[]
        } else if (normalizedOab) {
          ;[user] = (await sql`
            SELECT u.id, u.email, u.papel, u.email_verificado_em
            FROM usuarios u
            JOIN compradores c ON c.usuario_id = u.id
            WHERE c.oab = ${normalizedOab}
            LIMIT 1
          `) as MagicLinkUser[]
        } else {
          ;[user] = (await sql`
            SELECT u.id, u.email, u.papel, u.email_verificado_em
            FROM usuarios u
            JOIN compradores c ON c.usuario_id = u.id
            WHERE c.matricula_consular = ${normalizedMatricula}
            LIMIT 1
          `) as MagicLinkUser[]
        }

        console.log(
          'MAGIC-LINK: Resultado da busca no banco:',
          user ? `Usuário encontrado: ${user.email}` : 'Usuário não encontrado',
        )

        if (!user) {
          return reply.code(404).send({ error: 'Cadastro nao encontrado' })
        }

        console.log('MAGIC-LINK: Gerando token e gravando no banco...')
        const token = crypto.randomUUID()
        const tokenHash = hashToken(token)
        const expiresAt = new Date(
          Date.now() + MAGIC_LINK_TTL_MINUTES * 60 * 1000,
        )

        await sql`
          INSERT INTO verificacoes_email (email, codigo_hash, expira_em, tentativas)
          VALUES (${user.email}, ${tokenHash}, ${expiresAt.toISOString()}, 0)
        `

        const apiOrigin = process.env.API_PUBLIC_ORIGIN ?? 'http://localhost:3333'
        const link = `${apiOrigin}/auth/callback?token=${encodeURIComponent(token)}`
        console.log('MAGIC-LINK: Link gerado:', link)

        console.log('MAGIC-LINK: Tentando enviar e-mail para:', user.email)
        await sendMagicLinkEmail({
          to: user.email,
          link,
          expiresAt,
        })
        console.log('MAGIC-LINK: E-mail enviado com sucesso')

        return reply.send({ ok: true as const })
      } catch (error) {
        console.error('MAGIC-LINK: ERRO CRÍTICO NA EXECUÇÃO:')
        console.error(error)

        return reply.code(500).send({
          error: 'Erro interno no servidor',
          details: error instanceof Error ? error.message : 'Erro desconhecido',
        })
      }
    },
  )
}
