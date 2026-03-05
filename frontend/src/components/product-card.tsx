'use client'

import Image from 'next/image'
import { Package, Plus, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Product } from '@/lib/types'
import { formatCurrency, CATEGORY_LABELS } from '@/lib/types'
import { addToCart } from '@/lib/cart-store'
import { toast } from 'sonner'

const CATEGORY_COLORS: Record<string, string> = {
  ALIMENTOS: 'bg-accent/15 text-accent border-accent/30',
  HIGIENE: 'bg-primary/10 text-primary border-primary/30',
  VESTUARIO_BRANCO: 'bg-muted text-muted-foreground border-border',
  MEDICAMENTOS: 'bg-destructive/10 text-destructive border-destructive/30',
}

export function ProductCard({ product }: { product: Product }) {
  const isMedicamento = product.category === 'MEDICAMENTOS'

  function handleAdd() {
    addToCart(product, 1)
    toast.success(`${product.name} adicionado ao carrinho`)
  }

  return (
    <Card className="group flex flex-col overflow-hidden transition-shadow hover:shadow-md">
      <div className="relative h-32 w-full overflow-hidden bg-secondary/50">
      {product.image_url ? (
        <Image
          src={product.image_url}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-110"
          sizes="(max-width: 768px) 100vw, 25vw"
          unoptimized
        />
      ) : (
        <div className="flex h-full items-center justify-center">
          <Package className="h-10 w-10 text-muted-foreground/40" />
        </div>
      )}
    </div>
      <CardContent className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold leading-tight text-foreground">{product.name}</h3>
          <Badge variant="outline" className={`shrink-0 text-[10px] ${CATEGORY_COLORS[product.category] || ''}`}>
            {CATEGORY_LABELS[product.category]}
          </Badge>
        </div>
        {product.description && (
          <p className="text-xs leading-relaxed text-muted-foreground line-clamp-2">{product.description}</p>
        )}
        {isMedicamento && (
          <div className="flex items-center gap-1.5 rounded-md bg-destructive/5 px-2 py-1.5">
            <AlertTriangle className="h-3 w-3 shrink-0 text-destructive" />
            <span className="text-[10px] text-destructive">Requer prescricao medica</span>
          </div>
        )}
        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="flex flex-col">
            <span className="text-lg font-bold text-foreground">{formatCurrency(Number(product.price))}</span>
            <span className="text-[10px] text-muted-foreground">
              {product.stock_quantity > 0
                ? `${product.stock_quantity} em estoque`
                : 'Indisponivel'}
            </span>
          </div>
          <Button
            size="sm"
            onClick={handleAdd}
            disabled={product.stock_quantity <= 0}
            className="gap-1"
          >
            <Plus className="h-3.5 w-3.5" />
            Adicionar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
