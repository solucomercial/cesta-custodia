'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { requestMagicLink } from '@/services/api'
import { getBearerToken, readFragmentParams, setBearerToken } from '@/lib/bearer-token'

export default function LoginPage() {
  const router = useRouter()
  const [identifier, setIdentifier] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    void (async () => {
      if (typeof globalThis === 'undefined' || !('location' in globalThis) || !('history' in globalThis)) {
        return
      }

      const browser = globalThis as unknown as {
        location: { hash: string; pathname: string; search: string }
        history: { replaceState: (data: unknown, unused: string, url?: string | null) => void }
        document?: { title: string }
      }

      const params = readFragmentParams(browser.location.hash)
      const token = params.get('token')

      if (token) {
        setBearerToken(token)

        try {
          await fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
          })
        } catch {
          // best-effort
        }

        browser.history.replaceState(
          null,
          browser.document?.title ?? '',
          browser.location.pathname + browser.location.search,
        )

        router.replace('/overview')
        return
      }

      if (getBearerToken()) {
        router.replace('/overview')
      }
    })()
  }, [router])

  async function handleSubmit() {
    const normalized = identifier.trim()
    if (!normalized) {
      toast.error('Informe sua matricula para continuar')
      return
    }

    setSubmitting(true)
    setSuccessMessage('')
    try {
      await requestMagicLink(normalized)
      setSuccessMessage('Link enviado para o e-mail cadastrado. Verifique sua caixa de entrada.')
      toast.success('Magic link enviado com sucesso')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao solicitar magic link'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 px-4">
      <div className="w-full max-w-md space-y-8 rounded-xl border bg-card p-8 shadow-lg">
        <div className="text-center">
          <Image src="/logo-solu-web.png" alt="Logo Solu Web" width={160} height={48} className="mx-auto mb-4 h-12 w-auto" />
          <h1 className="text-2xl font-bold tracking-tight">Portal de Fiscalizacao SEAP</h1>
          <p className="text-sm text-muted-foreground">Acesso por magic link para fiscais e administradores</p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Matricula funcional</label>
          <Input
            placeholder="Digite sua matricula"
            value={identifier}
            onChange={(event) => {
              setIdentifier(event.target.value)
              setSuccessMessage('')
            }}
          />
        </div>

        <Button className="w-full bg-primary hover:bg-primary/90" onClick={handleSubmit} disabled={submitting}>
          {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Entrar no sistema
        </Button>

        {successMessage ? (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {successMessage}
          </div>
        ) : null}
      </div>
    </div>
  )
}
