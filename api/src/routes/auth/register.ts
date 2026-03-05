import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import crypto from 'node:crypto'
import { z } from 'zod'
import { sql } from '@/lib/db'
import { createEmailVerification, isCooldownError } from '@/lib/email-verification'
import { sendVerificationEmail } from '@/lib/email'
import { hashPassword } from '@/lib/password'

const registerBodySchema = z
  .object({
    name: z.string().min(3),
    email: z.string().email(),
    cpf: z.string().min(11),
    rg: z.string().min(5),
    birth_date: z.string().min(1),
    phone: z.string().min(10),
    address_street: z.string().min(1),
    address_number: z.string().min(1),
    address_complement: z.string().optional(),
    address_neighborhood: z.string().min(1),
    address_city: z.string().min(1),
    address_state: z.string().length(2),
    address_zip_code: z.string().min(8),
    professional_type: z.enum(['ADVOGADO', 'AGENTE_CONSULAR', 'OUTRO']),
    oab_number: z.string().optional(),
    consular_registration: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.professional_type === 'ADVOGADO' && !data.oab_number) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Inscricao OAB obrigatoria para advogados',
        path: ['oab_number'],
      })
    }

    if (data.professional_type === 'AGENTE_CONSULAR' && !data.consular_registration) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Matricula consular obrigatoria',
        path: ['consular_registration'],
      })
    }
  })

const digitsOnly = (value: string) => value.replace(/\D/g, '')

function formatAddress(buyer: {
  address_street: string
  address_number: string
  address_complement?: string
  address_neighborhood: string
  address_city: string
  address_state: string
  address_zip_code: string
}) {
  const parts = [
    `${buyer.address_street}, ${buyer.address_number}`,
    buyer.address_complement,
    buyer.address_neighborhood,
    buyer.address_city,
    buyer.address_state,
    `CEP ${buyer.address_zip_code}`,
  ]
  return parts.filter(Boolean).join(' - ')
}

export const authRegisterRoute: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/auth/register',
    {
      schema: {
        tags: ['Auth'],
        summary: 'Cadastrar novo comprador',
        body: registerBodySchema,
        response: {
          201: z.object({
            ok: z.literal(true),
            user_id: z.string().uuid(),
            expiresAt: z.date(),
            resendAfterSeconds: z.number(),
            ttlSeconds: z.number(),
          }),
          400: z.object({ error: z.string() }),
          409: z.object({ error: z.string() }),
          429: z.object({ error: z.string(), retryAfterSeconds: z.number() }),
          500: z.object({ error: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const {
        name,
        email,
        cpf,
        rg,
        birth_date,
        phone,
        address_street,
        address_number,
        address_complement,
        address_neighborhood,
        address_city,
        address_state,
        address_zip_code,
        professional_type,
        oab_number,
        consular_registration,
      } = request.body

      const normalizedEmail = email.trim().toLowerCase()
      const normalizedCpf = digitsOnly(cpf)
      const normalizedRg = rg ? digitsOnly(rg) : ''
      const normalizedPhone = digitsOnly(phone)
      const normalizedZip = digitsOnly(address_zip_code)
      const normalizedOab = oab_number?.trim() || null
      const normalizedConsular = consular_registration ? digitsOnly(consular_registration) : null

      const [existingUser] = (await sql`
        SELECT id FROM usuarios WHERE email = ${normalizedEmail} LIMIT 1
      `) as Array<{ id: string }>
      if (existingUser) {
        return reply.code(409).send({ error: 'Email ja cadastrado' })
      }

      const [existingBuyer] = (await sql`
        SELECT id FROM compradores WHERE cpf = ${normalizedCpf} LIMIT 1
      `) as Array<{ id: string }>
      if (existingBuyer) {
        return reply.code(409).send({ error: 'CPF ja cadastrado' })
      }

      const address = formatAddress({
        address_street,
        address_number,
        address_complement,
        address_neighborhood,
        address_city,
        address_state,
        address_zip_code: normalizedZip,
      })

      try {
        const disabledPasswordHash = await hashPassword(
          crypto.randomBytes(32).toString('hex'),
        )

        const [newUser] = (await sql`
          INSERT INTO usuarios (email, senha_hash, papel)
          VALUES (${normalizedEmail}, ${disabledPasswordHash}, 'COMPRADOR')
          RETURNING id
        `) as Array<{ id: string }>

        await sql`
          INSERT INTO compradores (usuario_id, nome, cpf, rg, data_nascimento, endereco, telefone, tipo_profissional, oab, matricula_consular)
          VALUES (${newUser.id}, ${name}, ${normalizedCpf}, ${normalizedRg || null}, ${birth_date}, ${address}, ${normalizedPhone}, ${professional_type}, ${normalizedOab}, ${normalizedConsular})
        `

        const { code, expiresAt, resendAfterSeconds, ttlSeconds } = await createEmailVerification(normalizedEmail)
        await sendVerificationEmail({ to: normalizedEmail, code })

        return reply.code(201).send({
          ok: true as const,
          user_id: newUser.id,
          expiresAt,
          resendAfterSeconds,
          ttlSeconds,
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro ao cadastrar'

        if (isCooldownError(error)) {
          return reply.code(429).send({ error: message, retryAfterSeconds: error.retryAfterSeconds })
        }

        if (message.includes('SMTP_')) {
          return reply.code(500).send({ error: 'Servico de email indisponivel' })
        }

        return reply.code(500).send({ error: 'Erro interno' })
      }
    },
  )
}
