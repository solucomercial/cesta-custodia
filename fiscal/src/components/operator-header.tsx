'use client'

import Image from 'next/image'
import Link from 'next/link'
import { LogOut, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { clearBearerToken } from '@/lib/bearer-token'

export function OperatorHeader() {
  const handleLogout = () => {
    void fetch('/api/auth/session', { method: 'DELETE' }).catch(() => null)
    clearBearerToken()
    const browser = typeof globalThis !== 'undefined'
      ? (globalThis as { location?: { assign?: (url: string) => void } })
      : undefined
    browser?.location?.assign?.('/login')
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/overview" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white">
            <Image src="/logo-solu-web.png" alt="Logo Solu Web" width={36} height={36} />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold leading-tight text-foreground">Portal de Fiscalizacao SEAP</span>
            <span className="text-[10px] leading-tight text-muted-foreground">Cesta Custodia</span>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link href="/overview" className="text-sm font-medium hover:text-primary">Overview</Link>
          <Link href="/pedidos" className="text-sm font-medium hover:text-primary">Pedidos</Link>
          <Link href="/perfil" className="text-sm font-medium hover:text-primary">Perfil</Link>
        </nav>

        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-accent" />
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>
      </div>
    </header>
  )
}
