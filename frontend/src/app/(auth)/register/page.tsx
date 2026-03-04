'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { registerSchema, type RegisterInput } from '@/lib/validations/register'

const INITIAL_FORM: RegisterInput = {
  name: '',
  email: '',
  cpf: '',
  rg: '',
  birth_date: '',
  phone: '',
  address_street: '',
  address_number: '',
  address_complement: '',
  address_neighborhood: '',
  address_city: '',
  address_state: '',
  address_zip_code: '',
  professional_type: 'OUTRO',
  oab_number: '',
  consular_registration: '',
}

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

const formatRg = (value: string) => {
  const digits = digitsOnly(value).slice(0, 9)
  const parts = [digits.slice(0, 2), digits.slice(2, 5), digits.slice(5, 8), digits.slice(8, 9)].filter(Boolean)
  if (parts.length <= 2) {
    return parts.join('.')
  }
  if (parts.length === 3) {
    return `${parts[0]}.${parts[1]}.${parts[2]}`
  }
  return `${parts[0]}.${parts[1]}.${parts[2]}-${parts[3]}`
}

const formatCep = (value: string) => {
  const digits = digitsOnly(value).slice(0, 8)
  const first = digits.slice(0, 5)
  const second = digits.slice(5, 8)
  if (!second) {
    return first
  }
  return `${first}-${second}`
}

const formatPhone = (value: string) => {
  const digits = digitsOnly(value).slice(0, 11)
  const area = digits.slice(0, 2)
  const rest = digits.slice(2)
  if (!area) {
    return ''
  }

  if (rest.length <= 4) {
    return `(${area}) ${rest}`.trim()
  }

  if (rest.length <= 8) {
    return `(${area}) ${rest.slice(0, 4)}-${rest.slice(4)}`
  }

  return `(${area}) ${rest.slice(0, 5)}-${rest.slice(5)}`
}

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState<RegisterInput>(INITIAL_FORM)
  const [submitting, setSubmitting] = useState(false)

  const requiresOab = form.professional_type === 'ADVOGADO'
  const requiresConsular = form.professional_type === 'AGENTE_CONSULAR'

  async function handleSubmit() {
    const result = registerSchema.safeParse(form)

    if (!result.success) {
      toast.error(result.error.issues[0]?.message || 'Dados invalidos')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result.data),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao cadastrar')
      }

      const email = result.data.email.trim()
      toast.success('Cadastro enviado. Verifique seu email para validar o acesso.')
      router.push(`/verify?email=${encodeURIComponent(email)}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao cadastrar'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 px-4 py-10">
      <div className="w-full max-w-2xl space-y-6 rounded-xl border bg-card p-8 shadow-lg">
        <div className="space-y-2 text-center">
          <img src="/logo-solu-web.png" alt="Logo" className="mx-auto h-12" />
          <h2 className="text-2xl font-bold tracking-tight">Cadastro do Comprador</h2>
          <p className="text-sm text-muted-foreground">
            Informe seus dados para liberar o acesso ao catalogo.
          </p>
        </div>

        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Nome completo</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Seu nome completo"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="seu@email.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label>CPF</Label>
              <Input
                value={form.cpf}
                onChange={(e) => setForm((prev) => ({ ...prev, cpf: formatCpf(e.target.value) }))}
                placeholder="000.000.000-00"
                inputMode="numeric"
              />
            </div>
            <div className="space-y-1.5">
              <Label>RG</Label>
              <Input
                value={form.rg}
                onChange={(e) => setForm((prev) => ({ ...prev, rg: formatRg(e.target.value) }))}
                placeholder="00.000.000-0"
                inputMode="numeric"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Data de nascimento</Label>
              <Input
                type="date"
                value={form.birth_date}
                onChange={(e) => setForm((prev) => ({ ...prev, birth_date: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Telefone</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm((prev) => ({ ...prev, phone: formatPhone(e.target.value) }))}
                placeholder="(00) 00000-0000"
                inputMode="numeric"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Endereco completo</Label>
            <div className="grid gap-3 md:grid-cols-3">
              <Input
                value={form.address_street}
                onChange={(e) => setForm((prev) => ({ ...prev, address_street: e.target.value }))}
                placeholder="Rua"
                className="md:col-span-2"
              />
              <Input
                value={form.address_number}
                onChange={(e) => setForm((prev) => ({ ...prev, address_number: e.target.value }))}
                placeholder="Numero"
              />
              <Input
                value={form.address_complement}
                onChange={(e) => setForm((prev) => ({ ...prev, address_complement: e.target.value }))}
                placeholder="Complemento"
              />
              <Input
                value={form.address_neighborhood}
                onChange={(e) => setForm((prev) => ({ ...prev, address_neighborhood: e.target.value }))}
                placeholder="Bairro"
              />
              <Input
                value={form.address_city}
                onChange={(e) => setForm((prev) => ({ ...prev, address_city: e.target.value }))}
                placeholder="Cidade"
              />
              <Input
                value={form.address_state}
                onChange={(e) => setForm((prev) => ({ ...prev, address_state: e.target.value }))}
                placeholder="UF"
              />
              <Input
                value={form.address_zip_code}
                onChange={(e) => setForm((prev) => ({ ...prev, address_zip_code: formatCep(e.target.value) }))}
                placeholder="00000-000"
                inputMode="numeric"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Perfil profissional</Label>
              <Select
                value={form.professional_type}
                onValueChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    professional_type: value as RegisterInput['professional_type'],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OUTRO">Outro</SelectItem>
                  <SelectItem value="ADVOGADO">Advogado</SelectItem>
                  <SelectItem value="AGENTE_CONSULAR">Agente Consular</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {requiresOab && (
              <div className="space-y-1.5">
                <Label>Inscricao OAB</Label>
                <Input
                  value={form.oab_number}
                  onChange={(e) => setForm((prev) => ({ ...prev, oab_number: e.target.value }))}
                  placeholder="OAB/UF 000000"
                />
              </div>
            )}
            {requiresConsular && (
              <div className="space-y-1.5">
                <Label>Matricula consular</Label>
                <Input
                  value={form.consular_registration}
                  onChange={(e) => setForm((prev) => ({ ...prev, consular_registration: e.target.value }))}
                  placeholder="Matricula consular"
                />
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <Button className="w-full" onClick={handleSubmit} disabled={submitting}>
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Cadastrar
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Ja possui cadastro?{' '}
            <Link href="/login" className="text-primary hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
