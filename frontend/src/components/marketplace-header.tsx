'use client'

import Link from 'next/link'
import { ShieldCheck, ShoppingCart, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCart } from '@/lib/cart-store'
import { useState } from 'react'

export function MarketplaceHeader({ onCartClick }: { onCartClick?: () => void }) {
  const { itemCount } = useCart()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white">
            <img src="/solu-web.png" alt="Logo Soluções Web" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold leading-tight text-foreground">Cesta de Custodia</span>
            <span className="text-[10px] leading-tight text-muted-foreground">SEAP/RJ</span>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="relative"
            onClick={onCartClick}
          >
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">Carrinho</span>
            {itemCount > 0 && (
              <Badge className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-accent p-0 text-[10px] text-accent-foreground">
                {itemCount}
              </Badge>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      {mobileMenuOpen && (
        <div className="border-t border-border bg-card px-4 py-3 md:hidden">
          <nav className="flex flex-col gap-2">
            <Link href="/catalogo" className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary" onClick={() => setMobileMenuOpen(false)}>
              Catalogo
            </Link>
            <Link href="/admin" className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary" onClick={() => setMobileMenuOpen(false)}>
              Painel SEAP
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
