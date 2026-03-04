'use client'

import { ShoppingCart, Trash2, Plus, Minus, X, Truck, Building2, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useCart } from '@/lib/cart-store'
import { formatCurrency } from '@/lib/types'

export function CartSidebar({
  open,
  onOpenChange,
  onCheckout,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCheckout: () => void
}) {
  const { items, subtotal, deliveryFee, fuespTax, total, itemCount, updateQuantity, removeFromCart } = useCart()

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Carrinho ({itemCount} {itemCount === 1 ? 'item' : 'itens'})
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3">
            <ShoppingCart className="h-12 w-12 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Seu carrinho esta vazio</p>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-3 overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={item.product.id} className="flex gap-3 rounded-lg border border-border bg-secondary/30 p-3">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-foreground">{item.product.name}</h4>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatCurrency(Number(item.product.price))} /un
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-col items-end justify-between">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => removeFromCart(item.product.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                    <span className="text-sm font-semibold text-foreground">
                      {formatCurrency(Number(item.product.price) * item.quantity)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3 border-t border-border pt-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-foreground">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Truck className="h-3 w-3" /> Frete ad valorem
                  </span>
                  <span className="text-foreground">{formatCurrency(deliveryFee)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Building2 className="h-3 w-3" /> Taxa FUESP
                  </span>
                  <span className="text-foreground">{formatCurrency(fuespTax)}</span>
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold text-foreground">Total</span>
                <span className="text-lg font-bold text-foreground">{formatCurrency(total)}</span>
              </div>
              <Button className="w-full gap-2" size="lg" onClick={onCheckout}>
                Finalizar Pedido
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
