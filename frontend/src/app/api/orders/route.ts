import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'
import { calcularFrete, calcularFuespTax, LIMITE_SEMANAL_POR_INTERNO } from '@/lib/types'
import { getAuthSessionFromRequest } from '@/lib/auth'
import { validateCfmPrescription } from '@/lib/prescription-validator'

const WEEKLY_LIMIT = Number(process.env.LIMITE_SEMANAL_POR_INTERNO ?? LIMITE_SEMANAL_POR_INTERNO)

function normalize(value: string) {
  return value.trim().toUpperCase()
}

export async function GET() {
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
      i.nome as inmate_name,
      i.matricula as inmate_registration,
      up.nome as prison_unit_name,
      (SELECT COUNT(*) FROM itens_pedido ip WHERE ip.pedido_id = p.id) as item_count
    FROM pedidos p
    JOIN compradores c ON p.comprador_id = c.id
    JOIN internos i ON p.interno_id = i.id
    JOIN unidades_prisionais up ON i.unidade_prisional_id = up.id
    ORDER BY p.criado_em DESC
  `

  return NextResponse.json(orders)
}

export async function POST(request: Request) {
  const session = await getAuthSessionFromRequest(request)
  if (!session) {
    return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
  }

  const body = await request.json()
  const { inmate, items, prescription_url, payment_method, sipen_protocol, prescription_code } = body

  if (!inmate || !items || items.length === 0) {
    return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
  }

  if (!session.emailVerifiedAt) {
    return NextResponse.json({ error: 'Email nao verificado' }, { status: 403 })
  }

  if (!payment_method) {
    return NextResponse.json({ error: 'Forma de pagamento obrigatoria' }, { status: 400 })
  }

  if (!inmate.name || !inmate.ward || !inmate.cell) {
    return NextResponse.json({ error: 'Dados do interno incompletos' }, { status: 400 })
  }

  const hasMedicamentos = items.some((item: { category?: string }) => item.category === 'MEDICAMENTOS')
  if (hasMedicamentos && !prescription_url) {
    return NextResponse.json({ error: 'Prescricao obrigatoria para medicamentos' }, { status: 400 })
  }

  if (hasMedicamentos && !prescription_code) {
    return NextResponse.json({ error: 'Codigo de validacao da receita obrigatorio' }, { status: 400 })
  }

  let prescriptionValidation: Awaited<ReturnType<typeof validateCfmPrescription>> | null = null
  if (hasMedicamentos && prescription_code) {
    prescriptionValidation = await validateCfmPrescription(String(prescription_code))
    if (!prescriptionValidation.valid) {
      return NextResponse.json({ error: prescriptionValidation.error || 'Receita nao autenticada' }, { status: 403 })
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
    return NextResponse.json({ error: 'Comprador nao cadastrado' }, { status: 400 })
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

  if (internos.length === 0) {
    return NextResponse.json({ error: 'Interno nao encontrado no SIPEN' }, { status: 404 })
  }

  const internal = internos[0]
  const matches =
    normalize(internal.nome) === normalize(inmate.name) &&
    normalize(internal.ala) === normalize(inmate.ward) &&
    normalize(internal.cela) === normalize(inmate.cell)

  if (!matches) {
    return NextResponse.json({ error: 'Dados do interno divergentes' }, { status: 403 })
  }

  // Calculate totals
  let totalValue = 0
  for (const item of items) {
    totalValue += item.price * item.quantity
  }

  const deliveryFee = calcularFrete(totalValue)
  const fuespTax = calcularFuespTax(totalValue)

  const weekly = (await sql`
    SELECT COALESCE(SUM(valor_total), 0) as total
    FROM pedidos
    WHERE interno_id = ${internal.id}
      AND criado_em >= now() - interval '7 days'
  `) as Array<{ total: string | number }>

  const weeklyTotal = Number(weekly[0]?.total ?? 0)
  if (weeklyTotal + totalValue > WEEKLY_LIMIT) {
    return NextResponse.json({ error: 'Limite semanal excedido para este interno' }, { status: 400 })
  }

  let sipenProtocol = sipen_protocol
  if (!sipenProtocol) {
    sipenProtocol = `SIPEN-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 999999)).padStart(6, '0')}`
  }

  const orderResult = (await sql`
    INSERT INTO pedidos (comprador_id, interno_id, status, protocolo_sipen, valor_total, frete, taxa_fuesp, url_receita, codigo_validacao_receita)
    VALUES (${buyer.id}, ${internal.id}, 'PENDENTE_SIPEN', ${sipenProtocol}, ${totalValue}, ${deliveryFee}, ${fuespTax}, ${prescription_url || null}, ${prescription_code || null})
    RETURNING id
  `) as Array<{ id: string }>

  const orderId = orderResult[0].id

  for (const item of items) {
    await sql`
      INSERT INTO itens_pedido (pedido_id, produto_id, quantidade, preco_no_pedido)
      VALUES (${orderId}, ${item.product_id}, ${item.quantity}, ${item.price})
    `
  }

  await sql`
    INSERT INTO logs_auditoria (user_id, pedido_id, acao, detalhes)
    VALUES (${session.userId}, ${orderId}, 'PEDIDO_CRIADO', ${JSON.stringify({
      sipen_protocol: sipenProtocol,
      total_value: totalValue,
      payment_method,
      verification_method: 'EMAIL',
      buyer_email: buyer.email,
    })})
  `

  if (prescriptionValidation?.valid) {
    await sql`
      INSERT INTO logs_auditoria (user_id, pedido_id, acao, detalhes)
      VALUES (${session.userId}, ${orderId}, 'VALIDACAO_RECEITA', ${JSON.stringify({
        validation_code: prescription_code,
        doctor_name: prescriptionValidation.doctorName,
        crm: prescriptionValidation.crm,
        prescribed_at: prescriptionValidation.prescribedAt,
        source: 'CFM/ITI',
      })})
    `
  }

  await sql`
    INSERT INTO logs_auditoria (user_id, pedido_id, acao, detalhes)
    VALUES (${session.userId}, ${orderId}, 'VALIDACAO_SIPEN', ${JSON.stringify({ protocol: sipenProtocol, result: 'APROVADO' })})
  `

  return NextResponse.json({ id: orderId, sipen_protocol: sipenProtocol }, { status: 201 })
}
