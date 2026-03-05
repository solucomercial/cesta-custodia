'use client'

import { useMemo, useState } from 'react'
import useSWR from 'swr'
import { Search } from 'lucide-react'
import { MarketplaceHeader } from '@/components/marketplace-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency, formatDate, type OrderStatus } from '@/lib/types'
import { getMe, getOrders, type Order } from '@/services/api'

type OrderStatusFilter = OrderStatus | 'ALL'
const getInputValue = (event: React.ChangeEvent<HTMLInputElement>) =>
  (event.currentTarget as { value?: string } | null)?.value ?? ''

const STATUS_FILTERS: Array<{ value: OrderStatusFilter; label: string }> = [
  { value: 'ALL', label: 'Todos os status' },
  { value: 'PENDENTE_SIPEN', label: 'Somente Pendentes' },
  { value: 'PAGO', label: 'Somente Confirmados' },
  { value: 'PREPARANDO', label: 'Somente Confirmados' },
  { value: 'EM_TRANSITO', label: 'Somente Em Transito' },
  { value: 'ENTREGUE', label: 'Somente Entregues' },
  { value: 'CANCELADO', label: 'Somente Cancelados' },
]

function getStatusMeta(status: OrderStatus) {
  if (status === 'PENDENTE_SIPEN') {
    return {
      label: 'Pendente',
      className: 'border-yellow-300 bg-yellow-100 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
    }
  }

  if (status === 'PAGO' || status === 'PREPARANDO') {
    return {
      label: 'Confirmado',
      className: 'border-orange-300 bg-orange-100 text-orange-800 dark:border-orange-800 dark:bg-orange-900/30 dark:text-orange-200',
    }
  }

  if (status === 'EM_TRANSITO') {
    return {
      label: 'Em Transito',
      className: 'border-blue-300 bg-blue-100 text-blue-800 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
    }
  }

  if (status === 'ENTREGUE') {
    return {
      label: 'Entregue',
      className: 'border-green-300 bg-green-100 text-green-800 dark:border-green-800 dark:bg-green-900/30 dark:text-green-200',
    }
  }

  return {
    label: 'Cancelado',
    className: 'border-red-300 bg-red-100 text-red-800 dark:border-red-800 dark:bg-red-900/30 dark:text-red-200',
  }
}

function protocolLabel(protocol: string | null) {
  if (!protocol) return '#SIPEN-NAO-GERADO'
  return protocol.startsWith('#') ? protocol : `#${protocol}`
}

export default function PedidosPage() {
  const { data: session } = useSWR(['auth/me'], () => getMe())
  const { data: orders, isLoading } = useSWR(['orders'], () => getOrders())

  const [statusFilter, setStatusFilter] = useState<OrderStatusFilter>('ALL')
  const [protocolQuery, setProtocolQuery] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  const myOrders = useMemo(() => {
    if (!orders || orders.length === 0) return []
    if (!session?.buyer?.id) return orders
    return orders.filter((order) => order.buyer_id === session.buyer?.id)
  }, [orders, session])

  const filteredOrders = useMemo(() => {
    const normalizedQuery = protocolQuery.trim().toLowerCase()

    return myOrders.filter((order) => {
      const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter
      const matchesProtocol =
        normalizedQuery.length === 0
        || (order.sipen_protocol ?? '').toLowerCase().includes(normalizedQuery)
      return matchesStatus && matchesProtocol
    })
  }, [myOrders, protocolQuery, statusFilter])

  return (
    <div className="min-h-screen bg-background">
      <MarketplaceHeader />

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6">
        <section className="rounded-xl border border-border bg-card p-6 md:p-8">
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">Meus Pedidos</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Acompanhe seus protocolos SIPEN e o status de entrega de cada pedido.
          </p>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>Filtre rapidamente por status ou busque por numero de protocolo.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-[280px_1fr]">
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as OrderStatusFilter)}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_FILTERS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={protocolQuery}
                onChange={(event) => setProtocolQuery(getInputValue(event))}
                placeholder="Buscar por protocolo SIPEN"
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Historico de Pedidos</CardTitle>
            <CardDescription>
              {filteredOrders.length} pedido(s) encontrado(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Carregando pedidos...</p>
            ) : filteredOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum pedido encontrado com os filtros aplicados.</p>
            ) : (
              <>
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Protocolo SIPEN</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Resumo</TableHead>
                        <TableHead className="text-right">Acoes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.map((order) => {
                        const meta = getStatusMeta(order.status)

                        return (
                          <TableRow key={order.id}>
                            <TableCell className="font-semibold">{protocolLabel(order.sipen_protocol)}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={meta.className}>
                                {meta.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="text-sm text-foreground">{formatDate(order.created_at)}</span>
                                <span className="text-xs text-muted-foreground">{formatCurrency(Number(order.total_value || 0))}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="outline" size="sm" onClick={() => setSelectedOrder(order)}>
                                Ver Detalhes
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>

                <div className="space-y-3 md:hidden">
                  {filteredOrders.map((order) => {
                    const meta = getStatusMeta(order.status)

                    return (
                      <Card key={order.id} className="gap-4 py-4">
                        <CardContent className="space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-foreground">{protocolLabel(order.sipen_protocol)}</p>
                            <Badge variant="outline" className={meta.className}>
                              {meta.label}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <p>Compra: {formatDate(order.created_at)}</p>
                            <p>Total: {formatCurrency(Number(order.total_value || 0))}</p>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => setSelectedOrder(order)}>
                            Ver Detalhes
                          </Button>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </main>

      <Dialog open={Boolean(selectedOrder)} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Detalhes do Pedido {selectedOrder ? protocolLabel(selectedOrder.sipen_protocol) : ''}
            </DialogTitle>
            <DialogDescription>
              Visualize itens da cesta, unidade prisional de destino e historico de status.
            </DialogDescription>
          </DialogHeader>

          {selectedOrder ? (
            <div className="space-y-4">
              <Card className="gap-3 py-4">
                <CardHeader className="px-4">
                  <CardTitle className="text-base">Itens da Cesta</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 px-4">
                  <p className="text-sm text-foreground">
                    {selectedOrder.item_count ?? 0} item(ns) registrado(s) neste pedido.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    A API atual ainda nao retorna a lista detalhada dos itens neste endpoint.
                  </p>
                </CardContent>
              </Card>

              <Card className="gap-3 py-4">
                <CardHeader className="px-4">
                  <CardTitle className="text-base">Destino</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 px-4 text-sm">
                  <p><span className="font-medium">Unidade prisional:</span> {selectedOrder.prison_unit_name || 'Nao informada'}</p>
                  <p><span className="font-medium">Interno:</span> {selectedOrder.inmate_name || 'Nao informado'}</p>
                  <p><span className="font-medium">Matricula:</span> {selectedOrder.inmate_registration || 'Nao informada'}</p>
                </CardContent>
              </Card>

              <Card className="gap-3 py-4">
                <CardHeader className="px-4">
                  <CardTitle className="text-base">Historico de Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 px-4">
                  <div className="rounded-md border border-border p-3 text-sm">
                    <p className="font-medium">{getStatusMeta(selectedOrder.status).label}</p>
                    <p className="text-xs text-muted-foreground">Atualizado em {formatDate(selectedOrder.updated_at)}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    O endpoint atual nao retorna o historico completo de transicoes do pedido.
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
