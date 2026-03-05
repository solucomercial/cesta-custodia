// app/(auth)/login/page.tsx
'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { requestMagicLink } from '@/services/api'
import { toast } from 'sonner'

const digitsOnly = (value: string) => value.replace(/\D/g, '')

const formatCpf = (value: string) => {
  const digits = digitsOnly(value).slice(0, 11)
  const parts = [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 9), digits.slice(9, 11)].filter(Boolean)
  if (parts.length <= 2) {
    return parts.join('.')
  }
  if (parts.length === 3) {
    return `${parts[0]}.${parts[1]}.${parts[2]}`
  }
  return `${parts[0]}.${parts[1]}.${parts[2]}-${parts[3]}`
}

export default function LoginPage() {
  const [cpf, setCpf] = useState('')
  const [oab, setOab] = useState('')
  const [matricula, setMatricula] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  async function handleSubmit(mode: 'cpf' | 'oab' | 'matricula') {
    const normalizedCpf = digitsOnly(cpf)
    const normalizedOab = oab.trim()
    const normalizedMatricula = matricula.trim()

    const payload: Record<string, string> = {}
    if (mode === 'cpf') payload.cpf = normalizedCpf
    if (mode === 'oab') payload.oab = normalizedOab
    if (mode === 'matricula') payload.matricula = normalizedMatricula

    const hasIdentifier = Object.values(payload).some((value) => value)
    if (!hasIdentifier) {
      const message =
        mode === 'cpf'
          ? 'Informe o CPF para continuar'
          : mode === 'oab'
            ? 'Informe a OAB para continuar'
            : 'Informe a matricula para continuar'
      toast.error(message)
      return
    }

    setSubmitting(true)
    setSuccessMessage('')
    try {
      await requestMagicLink(payload)

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
    <div className="flex min-h-screen items-center justify-center bg-muted/50 px-4">
      <div className="w-full max-w-md space-y-8 rounded-xl border bg-card p-8 shadow-lg">
        <div className="text-center">
          <Image src="/logo-solu-web.png" alt="Logo" width={160} height={48} className="mx-auto mb-4 h-12 w-auto" />
          <h2 className="text-2xl font-bold tracking-tight">Cesta de Custodia</h2>
          <p className="text-sm text-muted-foreground">Portal de Acesso ao Familiar e Representante</p>
        </div>

        <Tabs defaultValue="visitante" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="visitante">Familiar</TabsTrigger>
            <TabsTrigger value="advogado">Advogado</TabsTrigger>
            <TabsTrigger value="consular">Consular</TabsTrigger>
          </TabsList>

          <TabsContent value="visitante" className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">CPF</label>
              <Input
                placeholder="000.000.000-00"
                value={cpf}
                onChange={(e) => {
                  setCpf(formatCpf(e.target.value))
                  setSuccessMessage('')
                }}
                inputMode="numeric"
              />
            </div>
            <Button
              className="w-full bg-primary hover:bg-primary/90"
              onClick={() => handleSubmit('cpf')}
              disabled={submitting}
            >
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Entrar no Sistema
            </Button>
          </TabsContent>

          <TabsContent value="advogado" className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Inscricao OAB</label>
              <Input
                placeholder="Numero da OAB"
                value={oab}
                onChange={(e) => {
                  setOab(e.target.value)
                  setSuccessMessage('')
                }}
              />
            </div>
            <Button
              className="w-full bg-primary hover:bg-primary/90"
              onClick={() => handleSubmit('oab')}
              disabled={submitting}
            >
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Entrar no Sistema
            </Button>
          </TabsContent>
          
          <TabsContent value="consular" className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Matricula Funcional</label>
              <Input
                placeholder="Numero da matricula"
                value={matricula}
                onChange={(e) => {
                  setMatricula(e.target.value)
                  setSuccessMessage('')
                }}
              />
            </div>
            <Button
              className="w-full bg-primary hover:bg-primary/90"
              onClick={() => handleSubmit('matricula')}
              disabled={submitting}
            >
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Entrar no Sistema
            </Button>
          </TabsContent>
        </Tabs>

        {successMessage ? (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {successMessage}
          </div>
        ) : null}

        <div className="pt-4">
          <div className="mt-2 text-center text-sm text-muted-foreground">
            Ainda nao tem uma conta? <a href="/register" className="text-primary hover:underline">Cadastre-se aqui</a>
          </div>
        </div>
      </div>
    </div>
  )
}