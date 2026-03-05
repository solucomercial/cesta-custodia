'use client'

import { useMemo, useState } from 'react'
import useSWR from 'swr'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { getOrders } from '@/services/api'
import { STATUS_LABELS, type StatusPedido } from '@/lib/types'

const STATUS_OPTIONS: Array<StatusPedido | 'ALL'> = [
  'ALL',
  'PENDENTE_SIPEN',
  'PAGO',
  'PREPARANDO',
  'EM_TRANSITO',
  'ENTREGUE',
  'CANCELADO',
]

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

function formatDate(value: string) {
  const date = new Date(value)
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

function getStatusVariant(status: StatusPedido) {
  if (status === 'ENTREGUE') return 'secondary'
  if (status === 'CANCELADO') return 'destructive'
  return 'outline'
}

export default function PedidosPage() {
  const { data: orders, isLoading } = useSWR('orders', getOrders)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusPedido | 'ALL'>('ALL')

  const filteredOrders = useMemo(() => {
    const data = orders ?? []
    const normalizedSearch = search.trim().toLowerCase()

    return data.filter((order) => {
      const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter

      const inmateName = (order.inmate_name ?? '').toLowerCase()
      const registration = (order.inmate_registration ?? '').toLowerCase()
      const matchesSearch = !normalizedSearch
        || inmateName.includes(normalizedSearch)
        || registration.includes(normalizedSearch)

      return matchesStatus && matchesSearch
    })
  }, [orders, search, statusFilter])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Central de Monitoramento de Pedidos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <Input
            placeholder="Buscar por nome do interno ou matricula"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="md:max-w-md"
          />
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusPedido | 'ALL')}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((status) => (
                <SelectItem key={status} value={status}>
                  {status === 'ALL' ? 'Todos os status' : STATUS_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? <div className="text-sm text-muted-foreground">Carregando pedidos...</div> : null}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Comprador</TableHead>
              <TableHead>Interno</TableHead>
              <TableHead>Unidade Prisional</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Valor Total</TableHead>
              <TableHead>Data</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-mono text-xs">{order.id.slice(0, 8)}</TableCell>
                <TableCell>{order.buyer_name ?? 'Nao informado'}</TableCell>
                <TableCell>{order.inmate_name ?? 'Nao informado'}</TableCell>
                <TableCell>{order.prison_unit_name ?? 'Nao informada'}</TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(order.status)}>{STATUS_LABELS[order.status]}</Badge>
                </TableCell>
                <TableCell>{formatCurrency(Number(order.total_value ?? 0))}</TableCell>
                <TableCell>{formatDate(order.created_at)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
