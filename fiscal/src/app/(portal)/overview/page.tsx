'use client'

import { useMemo } from 'react'
import useSWR from 'swr'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getOrders } from '@/services/api'
import type { Order } from '@/lib/types'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export default function OverviewPage() {
  const { data: orders, isLoading } = useSWR('orders', getOrders)

  const metrics = useMemo(() => {
    const data = orders ?? []
    const totalOrders = data.length
    const paidOrders = data.filter((order) => order.status === 'PAGO').length
    const pendingOrders = data.filter((order) => order.status === 'PENDENTE_SIPEN').length
    const totalRevenue = data.reduce((acc, order) => acc + Number(order.total_value ?? 0), 0)

    return {
      totalOrders,
      paidOrders,
      pendingOrders,
      totalRevenue,
    }
  }, [orders])

  const chartData = useMemo(() => {
    const data = orders ?? []
    const byUnit = data.reduce<Record<string, number>>((acc, order: Order) => {
      const key = order.prison_unit_name || 'Unidade nao informada'
      acc[key] = (acc[key] ?? 0) + 1
      return acc
    }, {})

    return Object.entries(byUnit)
      .map(([unit, total]) => ({ unit, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
  }, [orders])

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Total de Pedidos</CardDescription>
            <CardTitle className="text-2xl">{isLoading ? '...' : metrics.totalOrders}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Pedidos Pagos</CardDescription>
            <CardTitle className="text-2xl">{isLoading ? '...' : metrics.paidOrders}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Pedidos Pendentes</CardDescription>
            <CardTitle className="text-2xl">{isLoading ? '...' : metrics.pendingOrders}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Total Financeiro Movimentado</CardDescription>
            <CardTitle className="text-2xl">{isLoading ? '...' : formatCurrency(metrics.totalRevenue)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Volume de Pedidos por Unidade Prisional</CardTitle>
          <CardDescription>Top 10 unidades com maior volume</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? <div className="text-sm text-muted-foreground">Carregando dados...</div> : null}
          {!isLoading && chartData.length === 0 ? (
            <div className="text-sm text-muted-foreground">Nenhum pedido disponivel para consolidacao.</div>
          ) : null}
          {chartData.length ? (
            <div className="h-[360px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ left: 24, right: 24, top: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="unit" width={240} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="total" fill="var(--color-chart-1)" radius={[4, 4, 4, 4]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
