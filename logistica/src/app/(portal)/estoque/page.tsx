'use client'

import { useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { getProducts, updateProductStock } from '@/services/api'
import { CATEGORY_LABELS, type Product } from '@/lib/types'

export default function EstoquePage() {
  const { data: products, isLoading, mutate } = useSWR('products', () => getProducts())
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const sortedProducts = useMemo(() => {
    if (!products) return []
    return [...products].sort((a, b) => a.name.localeCompare(b.name))
  }, [products])

  useEffect(() => {
    if (open && selected) {
      setQuantity(String(selected.stock_quantity))
    }
  }, [open, selected])

  async function handleSubmit() {
    if (!selected) return
    const parsed = Number(quantity)
    if (!Number.isFinite(parsed) || parsed < 0) {
      toast.error('Informe uma quantidade valida')
      return
    }

    setSubmitting(true)
    try {
      await updateProductStock(selected.id, parsed)
      toast.success('Estoque atualizado')
      await mutate()
      setOpen(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao atualizar estoque'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gestao de Estoque</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-sm text-muted-foreground">Carregando produtos...</div>
          ) : null}
          {!isLoading && sortedProducts.length === 0 ? (
            <div className="text-sm text-muted-foreground">Nenhum produto encontrado.</div>
          ) : null}
          {sortedProducts.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Acao</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>{CATEGORY_LABELS[product.category]}</TableCell>
                    <TableCell className="font-mono text-sm">{product.stock_quantity}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelected(product)
                          setOpen(true)
                        }}
                      >
                        Ajustar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajustar estoque</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              {selected ? selected.name : 'Produto selecionado'}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Quantidade em estoque</label>
              <Input
                type="number"
                min={0}
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Salvando' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
