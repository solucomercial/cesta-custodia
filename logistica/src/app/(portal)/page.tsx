'use client'

import { useMemo, useState } from 'react'
import useSWR from 'swr'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getOrders, updateOrderStatus } from '@/services/api'
import { ORDER_STATUS_LABELS, type Order, type OrderStatus } from '@/lib/types'

const SLA_DAYS = 5
const STATUS_OPTIONS: OrderStatus[] = ['PENDENTE_SIPEN', 'PAGO', 'PREPARANDO', 'EM_TRANSITO', 'ENTREGUE', 'CANCELADO']

function formatDate(value: string) {
  const date = new Date(value)
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function getElapsedDays(value: string) {
  const created = new Date(value).getTime()
  const now = Date.now()
  return Math.floor((now - created) / (1000 * 60 * 60 * 24))
}

function getStatusVariant(status: OrderStatus) {
  if (status === 'ENTREGUE') return 'secondary'
  if (status === 'CANCELADO') return 'destructive'
  if (status === 'PAGO') return 'outline'
  return 'default'
}

export default function DashboardPage() {
  const { data: orders, isLoading, mutate } = useSWR('orders', getOrders)
  const [nextStatusByOrder, setNextStatusByOrder] = useState<Record<string, OrderStatus | ''>>({})
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const sortedOrders = useMemo(() => {
    if (!orders) return []
    return [...orders].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }, [orders])

  async function handleStatusUpdate(order: Order) {
    const nextStatus = nextStatusByOrder[order.id]
    if (!nextStatus || nextStatus === order.status) {
      toast.error('Selecione um novo status')
      return
    }

    setUpdatingId(order.id)
    try {
      await updateOrderStatus(order.id, nextStatus)
      toast.success('Status atualizado')
      setNextStatusByOrder((prev) => ({ ...prev, [order.id]: '' }))
      await mutate()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao atualizar status'
      toast.error(message)
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Dashboard de Pedidos</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-sm text-muted-foreground">Carregando pedidos...</div>
          ) : null}
          {!isLoading && sortedOrders.length === 0 ? (
            <div className="text-sm text-muted-foreground">Nenhum pedido encontrado.</div>
          ) : null}
          {sortedOrders.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Comprador</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead>SLA</TableHead>
                  <TableHead>Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedOrders.map((order) => {
                  const elapsedDays = getElapsedDays(order.created_at)
                  const slaExceeded = elapsedDays > SLA_DAYS && order.status !== 'ENTREGUE'
                  const selectedStatus = nextStatusByOrder[order.id] ?? ''

                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-xs text-muted-foreground">{order.id.slice(0, 8)}</TableCell>
                      <TableCell>{order.buyer_name ?? 'Nao informado'}</TableCell>
                      <TableCell>{order.prison_unit_name ?? 'Nao informado'}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(order.status)}>
                          {ORDER_STATUS_LABELS[order.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(order.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-muted-foreground">{elapsedDays} dias</span>
                          {slaExceeded ? (
                            <Badge variant="destructive">SLA Excedido</Badge>
                          ) : (
                            <Badge variant="secondary">Dentro do SLA</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Select
                            value={selectedStatus}
                            onValueChange={(value) =>
                              setNextStatusByOrder((prev) => ({
                                ...prev,
                                [order.id]: value as OrderStatus,
                              }))
                            }
                          >
                            <SelectTrigger size="sm" className="min-w-[170px]">
                              <SelectValue placeholder="Atualizar status" />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUS_OPTIONS.filter((status) => status !== order.status).map((status) => (
                                <SelectItem key={status} value={status}>
                                  {ORDER_STATUS_LABELS[status]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm"
                            onClick={() => handleStatusUpdate(order)}
                            disabled={updatingId === order.id || !selectedStatus}
                          >
                            {updatingId === order.id ? 'Atualizando' : 'Salvar'}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
