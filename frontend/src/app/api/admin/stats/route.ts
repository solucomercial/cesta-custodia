import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  const [totalOrders] = await sql`SELECT COUNT(*) as count FROM pedidos`
  const [totalRevenue] = await sql`SELECT COALESCE(SUM(valor_total), 0) as total FROM pedidos WHERE status != 'CANCELADO'`
  const [totalDeliveryFees] = await sql`SELECT COALESCE(SUM(frete), 0) as total FROM pedidos WHERE status != 'CANCELADO'`
  const [totalFuespTax] = await sql`SELECT COALESCE(SUM(taxa_fuesp), 0) as total FROM pedidos WHERE status != 'CANCELADO'`
  const [pendingOrders] = await sql`SELECT COUNT(*) as count FROM pedidos WHERE status IN ('PENDENTE_SIPEN', 'PAGO', 'PREPARANDO')`
  const [deliveredOrders] = await sql`SELECT COUNT(*) as count FROM pedidos WHERE status = 'ENTREGUE'`
  const [totalProducts] = await sql`SELECT COUNT(*) as count FROM produtos WHERE ativo = true`
  const [totalInmates] = await sql`SELECT COUNT(*) as count FROM internos`

  const statusBreakdown = await sql`
    SELECT status, COUNT(*) as count 
    FROM pedidos 
    GROUP BY status
  `

  const categoryBreakdown = await sql`
    SELECT p.categoria as category, COUNT(DISTINCT ip.pedido_id) as order_count, SUM(ip.quantidade * ip.preco_no_pedido) as revenue
    FROM itens_pedido ip
    JOIN produtos p ON ip.produto_id = p.id
    GROUP BY p.categoria
  `

  const recentOrders = await sql`
    SELECT p.id, p.status, p.valor_total as total_value, p.criado_em as created_at,
      c.nome as buyer_name, i.nome as inmate_name
    FROM pedidos p
    JOIN compradores c ON p.comprador_id = c.id
    JOIN internos i ON p.interno_id = i.id
    ORDER BY p.criado_em DESC
    LIMIT 5
  `

  return NextResponse.json({
    total_orders: Number(totalOrders.count),
    total_revenue: Number(totalRevenue.total),
    total_delivery_fees: Number(totalDeliveryFees.total),
    total_fuesp_tax: Number(totalFuespTax.total),
    pending_orders: Number(pendingOrders.count),
    delivered_orders: Number(deliveredOrders.count),
    total_products: Number(totalProducts.count),
    total_inmates: Number(totalInmates.count),
    status_breakdown: statusBreakdown,
    category_breakdown: categoryBreakdown,
    recent_orders: recentOrders,
  })
}
