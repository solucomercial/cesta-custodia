'use client'

import Link from 'next/link'
import { ChevronDown, ClipboardList, LogOut, Package, User } from 'lucide-react'
import useSWR from 'swr'
import { Button } from '@/components/ui/button'
import { getMe } from '@/services/api'
import { clearBearerToken } from '@/lib/bearer-token'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function OperatorHeader() {
  const { data } = useSWR('me', getMe)
  const user = data?.user

  const handleLogout = () => {
    void fetch('/api/auth/session', { method: 'DELETE' }).catch(() => null)
    clearBearerToken()
    const browser = typeof globalThis !== 'undefined'
      ? (globalThis as { location?: { assign?: (url: string) => void } })
      : undefined
    browser?.location?.assign?.('/login')
  }

  return (
    <header className="border-b border-border bg-card/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-semibold">Portal de Logistica</div>
            <div className="text-xs text-muted-foreground">Cesta Custodia</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          <Link href="/" className="hover:text-primary">Dashboard</Link>
          <Link href="/estoque" className="hover:text-primary">Estoque</Link>
          <Link href="/perfil" className="hover:text-primary">Perfil</Link>
        </nav>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" asChild className="md:hidden">
            <Link href="/estoque">Estoque</Link>
          </Button>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">{user.email}</span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Minha conta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/perfil" className="flex w-full items-center gap-2">
                    <User className="h-4 w-4" /> Perfil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/estoque" className="flex w-full items-center gap-2">
                    <Package className="h-4 w-4" /> Estoque
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                  <LogOut className="h-4 w-4" /> Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button size="sm" asChild>
              <Link href="/login">Entrar</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
