'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ShoppingCart, Menu, X, User, Package, LogOut, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCart } from '@/lib/cart-store'
import { useState } from 'react'
import { getMe } from '@/services/api'
import useSWR from 'swr'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function MarketplaceHeader({ onCartClick }: { onCartClick?: () => void }) {
  const { itemCount } = useCart()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { data: session } = useSWR('me', getMe)
  const user = session?.user

  const handleLogout = () => {
    const browser = typeof globalThis !== 'undefined'
      ? (globalThis as { location?: { assign?: (url: string) => void }; document?: { cookie?: string } })
      : undefined
    if (!browser) return
    if (browser.document) {
      browser.document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
    }
    browser.location?.assign?.('/login')
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white">
            <Image src="/solu-web.png" alt="Logo Soluções Web" width={36} height={36} />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold leading-tight text-foreground">Cesta de Custodia</span>
            <span className="text-[10px] leading-tight text-muted-foreground">SEAP/RJ</span>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link href="/catalogo" className="text-sm font-medium hover:text-primary">
            Catalogo
          </Link>
          <Link href="/pedidos" className="text-sm font-medium hover:text-primary">
            Meus Pedidos
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="relative"
            onClick={onCartClick}
          >
            <ShoppingCart className="h-4 w-4" />
            <span className="ml-2 hidden sm:inline">Carrinho</span>
            {itemCount > 0 && (
              <Badge className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-accent p-0 text-[10px] text-accent-foreground">
                {itemCount}
              </Badge>
            )}
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">{user.name || 'Minha Conta'}</span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/perfil" className="flex w-full items-center gap-2">
                    <User className="h-4 w-4" /> Perfil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/pedidos" className="flex w-full items-center gap-2">
                    <Package className="h-4 w-4" /> Pedidos
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" /> Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button size="sm" asChild>
              <Link href="/login">Entrar</Link>
            </Button>
          )}

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
            <Link
              href="/catalogo"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary"
              onClick={() => setMobileMenuOpen(false)}
            >
              Catalogo
            </Link>
            <Link
              href="/pedidos"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary"
              onClick={() => setMobileMenuOpen(false)}
            >
              Meus Pedidos
            </Link>
            {user ? (
              <>
                <Link
                  href="/perfil"
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Meu Perfil
                </Link>
                <div className="my-1 h-px bg-border" />
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-destructive hover:bg-secondary"
                >
                  <LogOut className="h-4 w-4" /> Sair
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary"
                onClick={() => setMobileMenuOpen(false)}
              >
                Entrar
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
