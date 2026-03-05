'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { requestMagicLink } from '@/services/api'
import { toast } from 'sonner'
import { getBearerToken, readFragmentParams, setBearerToken } from '@/lib/bearer-token'

export default function LoginPage() {
  const router = useRouter()
  const [matricula, setMatricula] = useState('')
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
        fetch?: typeof fetch
      }

      const params = readFragmentParams(browser.location.hash)
      const token = params.get('token')
      const next = params.get('next')

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

        router.replace(next || '/')
        return
      }

      if (getBearerToken()) {
        router.replace('/')
      }
    })()
  }, [router])

  async function handleSubmit() {
    const normalizedMatricula = matricula.trim()
    if (!normalizedMatricula) {
      toast.error('Informe a matricula para continuar')
      return
    }

    setSubmitting(true)
    setSuccessMessage('')
    try {
      await requestMagicLink({ matricula: normalizedMatricula })
      setSuccessMessage('Link enviado para o email cadastrado. Verifique sua caixa de entrada.')
      toast.success('Link enviado com sucesso')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao solicitar magic link'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6 rounded-2xl border bg-card p-8 shadow-lg">
        <div className="space-y-2 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">L</div>
          <h1 className="text-2xl font-semibold">Portal de Logistica</h1>
          <p className="text-sm text-muted-foreground">Acesso exclusivo para operadores</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Matricula funcional</label>
            <Input
              placeholder="Digite sua matricula"
              value={matricula}
              onChange={(event) => {
                setMatricula(event.target.value)
                setSuccessMessage('')
              }}
            />
          </div>
          <Button className="w-full" onClick={handleSubmit} disabled={submitting}>
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Entrar
          </Button>
        </div>

        {successMessage ? (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {successMessage}
          </div>
        ) : null}
      </div>
    </div>
  )
}
