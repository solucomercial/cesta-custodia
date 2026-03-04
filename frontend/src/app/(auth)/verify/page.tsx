'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp'
import { toast } from 'sonner'

export default function VerifyPage() {
  const router = useRouter()
  const params = useSearchParams()
  const [email, setEmail] = useState(params.get('email') ?? '')
  const [code, setCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendAvailableAt, setResendAvailableAt] = useState<Date | null>(null)
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const resendSecondsRemaining = useMemo(() => {
    if (!resendAvailableAt) return 0
    const diff = Math.ceil((resendAvailableAt.getTime() - now.getTime()) / 1000)
    return Math.max(0, diff)
  }, [now, resendAvailableAt])

  function formatSeconds(seconds: number) {
    const minutes = Math.floor(seconds / 60)
    const remaining = seconds % 60
    return `${String(minutes).padStart(2, '0')}:${String(remaining).padStart(2, '0')}`
  }

  async function handleVerify() {
    if (!email.trim() || !code.trim()) {
      toast.error('Informe o email e o codigo')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/auth/verification/email/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), code: code.trim() }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao validar codigo')
      }

      toast.success('Email verificado com sucesso!')
      router.push('/catalogo')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao validar codigo'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleResend() {
    if (!email.trim()) {
      toast.error('Informe o email para reenviar')
      return
    }

    setResending(true)
    try {
      const res = await fetch('/api/auth/verification/email/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })

      const data = await res.json()
      if (!res.ok) {
        if (res.status === 429 && data.retryAfterSeconds) {
          setResendAvailableAt(new Date(Date.now() + data.retryAfterSeconds * 1000))
        }
        throw new Error(data.error || 'Erro ao reenviar codigo')
      }

      setResendAvailableAt(new Date(Date.now() + Number(data.resendAfterSeconds ?? 60) * 1000))
      toast.success('Codigo reenviado')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao reenviar codigo'
      toast.error(message)
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 px-4">
      <div className="w-full max-w-md space-y-6 rounded-xl border bg-card p-8 shadow-lg">
        <div className="space-y-2 text-center">
          <img src="/logo-solu-web.png" alt="Logo" className="mx-auto h-12" />
          <h2 className="text-2xl font-bold tracking-tight">Confirmar Email</h2>
          <p className="text-sm text-muted-foreground">
            Digite o codigo enviado para o seu email para liberar o acesso.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Codigo de verificacao</Label>
            <InputOTP maxLength={6} value={code} onChange={setCode}>
              <InputOTPGroup>
                {Array.from({ length: 6 }).map((_, index) => (
                  <InputOTPSlot key={index} index={index} />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>
        </div>

        <div className="space-y-3">
          <Button className="w-full" onClick={handleVerify} disabled={submitting}>
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Validar email
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={handleResend}
            disabled={resending || resendSecondsRemaining > 0}
          >
            {resendSecondsRemaining > 0
              ? `Reenviar codigo em ${formatSeconds(resendSecondsRemaining)}`
              : 'Reenviar codigo'}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Precisa corrigir dados?{' '}
            <Link href="/register" className="text-primary hover:underline">
              Voltar ao cadastro
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
