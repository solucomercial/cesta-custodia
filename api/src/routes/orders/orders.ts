import type { FastifyRequest } from 'fastify'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { clearAuthCookie, getAuthSessionFromFastifyRequest } from '@/lib/auth'
import { sql } from '@/lib/db'
import { calcularFrete, calcularFuespTax, LIMITE_SEMANAL_POR_INTERNO } from '@/lib/fees'
import { validateCfmPrescription } from '@/lib/prescription-validator'

type AuthSession = {
  userId: string
  email: string
  role: string
  emailVerifiedAt: string | null
  iat: number
  exp: number
}

type AuthenticatedRequest = FastifyRequest & {
  authUser: AuthSession
}

const WEEKLY_LIMIT = Number(process.env.LIMITE_SEMANAL_POR_INTERNO ?? LIMITE_SEMANAL_POR_INTERNO)

const orderItemSchema = z.object({
  product_id: z.string().uuid(),
  price: z.number().positive(),
  quantity: z.number().int().positive(),
  category: z.enum(['ALIMENTOS', 'HIGIENE', 'VESTUARIO_BRANCO', 'MEDICAMENTOS']).optional(),
  name: z.string().optional(),
})

const orderBodySchema = z.object({
  inmate: z.object({
    name: z.string().min(1),
    registration: z.string().optional(),
    ward: z.string().min(1),
    cell: z.string().min(1),
    prison_unit_id: z.string().uuid().optional(),
    prison_unit_name: z.string().optional(),
  }),
  items: z.array(orderItemSchema).min(1),
  prescription_url: z.string().url().nullable().optional(),
  payment_method: z.enum(['CARTAO', 'BOLETO', 'PIX']),
  sipen_protocol: z.string().optional(),
  prescription_code: z.string().nullable().optional(),
})

function generateSipenProtocol() {
  return `SIPEN-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 999999)).padStart(6, '0')}`
}

export const ordersRoute: FastifyPluginAsyncZod = async (app) => {
  app.addHook('preHandler', async (request, reply) => {
    const session = await getAuthSessionFromFastifyRequest(request)
    if (!session) {
      clearAuthCookie(reply)
      return reply.code(401).send({ error: 'Nao autenticado' })
    }

    ;(request as AuthenticatedRequest).authUser = session as AuthSession
  })

  app.get(
    '/orders',
    {
      schema: {
        tags: ['Orders'],
        summary: 'Listar pedidos',
      },
    },
    async () => {
      const orders = await sql`
        SELECT
          p.id,
          p.comprador_id as buyer_id,
          p.interno_id as inmate_id,
          p.status,
          p.protocolo_sipen as sipen_protocol,
          p.valor_total as total_value,
          p.frete as delivery_fee,
          p.taxa_fuesp as fuesp_tax,
          p.url_receita as prescription_url,
          p.codigo_validacao_receita as prescription_validation_code,
          p.criado_em as created_at,
          p.atualizado_em as updated_at,
          c.nome as buyer_name,
          c.cpf as buyer_cpf,
          COALESCE(i.nome, p.interno_nome) as inmate_name,
          COALESCE(i.matricula, p.interno_matricula) as inmate_registration,
          COALESCE(up.nome, p.unidade_prisional_nome) as prison_unit_name,
          (SELECT COUNT(*) FROM itens_pedido ip WHERE ip.pedido_id = p.id) as item_count
        FROM pedidos p
        JOIN compradores c ON p.comprador_id = c.id
        LEFT JOIN internos i ON p.interno_id = i.id
        LEFT JOIN unidades_prisionais up ON i.unidade_prisional_id = up.id
        ORDER BY p.criado_em DESC
      `

      return orders
    },
  )

  app.post(
    '/orders',
    {
      schema: {
        tags: ['Orders'],
        summary: 'Criar pedido',
        body: orderBodySchema,
        response: {
          201: z.object({
            id: z.string().uuid(),
            sipen_protocol: z.string(),
          }),
          400: z.object({ error: z.string() }),
          401: z.object({ error: z.string() }),
          403: z.object({ error: z.string() }),
          404: z.object({ error: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const session = (request as AuthenticatedRequest).authUser
      const { inmate, items, payment_method, prescription_url, sipen_protocol, prescription_code } = request.body

      if (!session.emailVerifiedAt) {
        return reply.code(403).send({ error: 'Email nao verificado' })
      }

      if (!inmate.name || !inmate.ward || !inmate.cell) {
        return reply.code(400).send({ error: 'Dados do interno incompletos' })
      }

      const hasMedicamentos = items.some((item) => item.category === 'MEDICAMENTOS')
      if (hasMedicamentos && !prescription_url) {
        return reply.code(400).send({ error: 'Prescricao obrigatoria para medicamentos' })
      }

      if (hasMedicamentos && !prescription_code) {
        return reply.code(400).send({ error: 'Codigo de validacao da receita obrigatorio' })
      }

      let prescriptionValidation: Awaited<ReturnType<typeof validateCfmPrescription>> | null = null
      if (hasMedicamentos && prescription_code) {
        prescriptionValidation = await validateCfmPrescription(String(prescription_code))
        if (!prescriptionValidation.valid) {
          return reply.code(403).send({ error: prescriptionValidation.error || 'Receita nao autenticada' })
        }
      }

      const [buyer] = (await sql`
        SELECT
          c.id,
          c.nome,
          c.cpf,
          c.endereco,
          c.tipo_profissional,
          c.oab,
          c.matricula_consular,
          u.email
        FROM compradores c
        JOIN usuarios u ON u.id = c.usuario_id
        WHERE c.usuario_id = ${session.userId}
        LIMIT 1
      `) as Array<{
        id: string
        nome: string
        cpf: string
        endereco: string
        tipo_profissional: string
        oab: string | null
        matricula_consular: string | null
        email: string
      }>

      if (!buyer) {
        return reply.code(400).send({ error: 'Comprador nao cadastrado' })
      }

      const prisonUnitFilter = inmate.prison_unit_id
        ? sql`AND unidade_prisional_id = ${inmate.prison_unit_id}`
        : inmate.prison_unit_name
          ? sql`AND unidade_prisional_id IN (
              SELECT id FROM unidades_prisionais WHERE nome = ${inmate.prison_unit_name}
            )`
          : sql``

      const internos = (await sql`
        SELECT id, nome, ala, cela, unidade_prisional_id
        FROM internos
        WHERE nome = ${inmate.name}
          AND ala = ${inmate.ward}
          AND cela = ${inmate.cell}
          ${prisonUnitFilter}
        LIMIT 1
      `) as Array<{
        id: string
        nome: string
        ala: string
        cela: string
        unidade_prisional_id: string
      }>

      const internal = internos[0]

      let totalValue = 0
      for (const item of items) {
        totalValue += item.price * item.quantity
      }

      const deliveryFee = calcularFrete(totalValue)
      const fuespTax = calcularFuespTax(totalValue)

      if (internal?.id) {
        const weekly = (await sql`
          SELECT COALESCE(SUM(valor_total), 0) as total
          FROM pedidos
          WHERE interno_id = ${internal.id}
            AND criado_em >= now() - interval '7 days'
        `) as Array<{ total: string | number }>

        const weeklyTotal = Number(weekly[0]?.total ?? 0)
        if (weeklyTotal + totalValue > WEEKLY_LIMIT) {
          return reply.code(400).send({ error: 'Limite semanal excedido para este interno' })
        }
      }

      const sipenProtocol = sipen_protocol || generateSipenProtocol()

      try {
        const { orderId } = await sql.begin(async (tx) => {
          // postgres-js types define TransactionSql via Omit<Sql,...>, which drops call signatures.
          // At runtime `tx` is still a tagged-template function, so we cast to keep TS happy.
          const txSql = tx as unknown as typeof sql

          const orderResult = (await txSql`
            INSERT INTO pedidos (
              comprador_id,
              interno_id,
              interno_nome,
              interno_matricula,
              interno_ala,
              interno_cela,
              unidade_prisional_nome,
              status,
              protocolo_sipen,
              valor_total,
              frete,
              taxa_fuesp,
              url_receita,
              codigo_validacao_receita
            )
            VALUES (
              ${buyer.id},
              ${internal?.id ?? null},
              ${inmate.name},
              ${inmate.registration || null},
              ${inmate.ward},
              ${inmate.cell},
              ${inmate.prison_unit_name || null},
              'PENDENTE_SIPEN',
              ${sipenProtocol},
              ${totalValue},
              ${deliveryFee},
              ${fuespTax},
              ${prescription_url || null},
              ${prescription_code || null}
            )
            RETURNING id
          `) as Array<{ id: string }>

          const orderId = orderResult[0]?.id
          if (!orderId) {
            throw new Error('ORDER_CREATE_FAILED')
          }

          for (const item of items) {
            const updated = (await txSql`
              UPDATE produtos
              SET quantidade_estoque = quantidade_estoque - ${item.quantity},
                  atualizado_em = now()
              WHERE id = ${item.product_id}
                AND quantidade_estoque >= ${item.quantity}
              RETURNING id, quantidade_estoque
            `) as Array<{ id: string; quantidade_estoque: number }>

            if (updated.length === 0) {
              const current = (await txSql`
                SELECT id, quantidade_estoque
                FROM produtos
                WHERE id = ${item.product_id}
                LIMIT 1
              `) as Array<{ id: string; quantidade_estoque: number }>

              if (current.length === 0) {
                throw new Error(`PRODUCT_NOT_FOUND:${item.product_id}`)
              }

              throw new Error(`INSUFFICIENT_STOCK:${item.product_id}`)
            }

            const newStock = Number(updated[0].quantidade_estoque)
            const previousStock = newStock + item.quantity

            await txSql`
              INSERT INTO itens_pedido (pedido_id, produto_id, quantidade, preco_no_pedido)
              VALUES (${orderId}, ${item.product_id}, ${item.quantity}, ${item.price})
            `

            await txSql`
              INSERT INTO logs_auditoria (usuario_id, pedido_id, acao, detalhes)
              VALUES (${session.userId}, ${orderId}, 'ESTOQUE_REDUZIDO', ${JSON.stringify({
                produto_id: item.product_id,
                quantidade_removida: item.quantity,
                estoque_anterior: previousStock,
                estoque_atual: newStock,
              })})
            `
          }

          await txSql`
            INSERT INTO logs_auditoria (usuario_id, pedido_id, acao, detalhes)
            VALUES (${session.userId}, ${orderId}, 'PEDIDO_CRIADO', ${JSON.stringify({
              sipen_protocol: sipenProtocol,
              total_value: totalValue,
              payment_method,
              verification_method: 'EMAIL',
              buyer_email: buyer.email,
            })})
          `

          if (prescriptionValidation?.valid) {
            await txSql`
              INSERT INTO logs_auditoria (usuario_id, pedido_id, acao, detalhes)
              VALUES (${session.userId}, ${orderId}, 'VALIDACAO_RECEITA', ${JSON.stringify({
                validation_code: prescription_code,
                doctor_name: prescriptionValidation.doctorName,
                crm: prescriptionValidation.crm,
                prescribed_at: prescriptionValidation.prescribedAt,
                source: 'CFM/ITI',
              })})
            `
          }

          return { orderId }
        })

        return reply.code(201).send({ id: orderId, sipen_protocol: sipenProtocol })
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)

        if (message.startsWith('PRODUCT_NOT_FOUND:')) {
          return reply.code(404).send({ error: 'Produto nao encontrado' })
        }

        if (message.startsWith('INSUFFICIENT_STOCK:')) {
          return reply.code(400).send({ error: 'Estoque insuficiente para um ou mais itens' })
        }

        request.log.error({ err: error }, 'Erro ao criar pedido')
        return reply.code(400).send({ error: 'Nao foi possivel criar o pedido' })
      }
    },
  )
}
