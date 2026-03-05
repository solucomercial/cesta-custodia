'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { FileQuestion } from 'lucide-react'

import { Button } from '@/components/ui/button'

export default function NotFound() {
  const router = useRouter()

  return (
    <div className="flex min-h-screen items-center justify-center bg-background bg-gradient-to-b from-background to-primary/10 px-4">
      <main className="w-full max-w-md space-y-6 rounded-xl border bg-card p-8 text-center shadow-lg">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Image src="/solu-web.png" alt="Logo Soluções Web" width={64} height={64} />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Página não encontrada</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            O link que você acessou pode estar quebrado ou a página foi movida. Verifique o endereço
            ou retorne à página inicial.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link href="/catalogo">Ir para o Catálogo</Link>
          </Button>
          <Button variant="outline" onClick={() => router.back()}>
            Voltar
          </Button>
        </div>
      </main>
    </div>
  )
}
