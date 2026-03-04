import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { createEmailVerification, isCooldownError } from '@/lib/email-verification'
import { sendVerificationEmail } from '@/lib/email'
import { registerSchema } from '@/lib/validations/register'

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

export async function POST(request: Request) {
  console.log('[API] Rota /api/auth/register acessada com sucesso')

  try {
    const body = await request.json()
    console.log('[API] Body recebido:', JSON.stringify(body, null, 2))
    const result = registerSchema.safeParse(body)

    if (!result.success) {
      console.error('[API] Erro de validacao Zod:', result.error.format())
      return NextResponse.json({ error: 'Dados invalidos' }, { status: 400 })
    }

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
    } = result.data

    const normalizedEmail = email.trim().toLowerCase()
    const normalizedCpf = digitsOnly(cpf)
    const normalizedRg = rg ? digitsOnly(rg) : ''
    const normalizedPhone = digitsOnly(phone)
    const normalizedZip = digitsOnly(address_zip_code)
    const normalizedOab = oab_number?.trim() || null
    const normalizedConsular = consular_registration ? digitsOnly(consular_registration) : null

    const existingUser = await db.query.usuarios.findFirst({
      where: (table: any, { eq }: any) => eq(table.email, normalizedEmail),
      columns: { id: true },
    })

    if (existingUser) {
      return NextResponse.json({ error: 'Email ja cadastrado' }, { status: 409 })
    }

    const existingBuyer = await db.query.compradores.findFirst({
      where: (table: any, { eq }: any) => eq(table.cpf, normalizedCpf),
      columns: { id: true },
    })

    if (existingBuyer) {
      return NextResponse.json({ error: 'CPF ja cadastrado' }, { status: 409 })
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
      const transactionResult = await db.transaction(async (tx) => {
        const [newUser] = await tx
          .insert(schema.usuarios)
          .values({
            email: normalizedEmail,
            senhaHash: 'PENDENTE_VERIFICACAO',
            papel: 'COMPRADOR',
          })
          .returning({ id: schema.usuarios.id })

        await tx.insert(schema.compradores).values({
          usuarioId: newUser.id,
          nome: name,
          cpf: normalizedCpf,
          rg: normalizedRg || null,
          dataNascimento: birth_date,
          endereco: address,
          telefone: normalizedPhone,
          tipoProfissional: professional_type,
          oab: normalizedOab,
          matriculaConsular: normalizedConsular,
        })

        const { code, expiresAt, resendAfterSeconds, ttlSeconds } = await createEmailVerification(
          normalizedEmail,
          tx
        )
        await sendVerificationEmail({ to: normalizedEmail, code })

        return {
          userId: newUser.id,
          expiresAt,
          resendAfterSeconds,
          ttlSeconds,
        }
      })

      return NextResponse.json(
        {
          ok: true,
          user_id: transactionResult.userId,
          expiresAt: transactionResult.expiresAt,
          resendAfterSeconds: transactionResult.resendAfterSeconds,
          ttlSeconds: transactionResult.ttlSeconds,
        },
        { status: 201 }
      )
    } catch (error) {
      console.error('[API ERROR] Falha no registro:', error)
      const message = error instanceof Error ? error.message : 'Erro ao enviar codigo'

      if (isCooldownError(error)) {
        return NextResponse.json({ error: message, retryAfterSeconds: error.retryAfterSeconds }, { status: 429 })
      }

      if (message.includes('SMTP_')) {
        return NextResponse.json({ error: 'Servico de email indisponivel' }, { status: 500 })
      }

      throw error
    }
  } catch (error) {
    console.error('[API] Erro fatal no registro:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
