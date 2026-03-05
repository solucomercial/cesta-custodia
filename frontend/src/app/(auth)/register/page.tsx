'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
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
import { ApiError, getAddressByCep, register } from '@/services/api'

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

const getInputValue = (event: React.ChangeEvent<HTMLInputElement>) =>
  (event.currentTarget as { value?: string } | null)?.value ?? ''

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState<RegisterInput>(INITIAL_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [addressUnlocked, setAddressUnlocked] = useState(false)
  const submitLock = useRef(false)
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const requiresOab = form.professional_type === 'ADVOGADO'
  const requiresConsular = form.professional_type === 'AGENTE_CONSULAR'

  const cepLimpo = form.address_zip_code.replace(/\D/g, '')
  const isCepComplete = cepLimpo.length === 8
  const canEditAddress = isCepComplete && addressUnlocked

  useEffect(() => {
    if (!isCepComplete) {
      return
    }

    const handleCepLookup = async () => {
      try {
        const data = await getAddressByCep(cepLimpo)

        setForm((prev) => ({
          ...prev,
          address_street: data.street,
          address_neighborhood: data.neighborhood,
          address_city: data.city,
          address_state: data.state,
        }))

        setAddressUnlocked(true)

        toast.success('Endereco preenchido automaticamente')
      } catch {
        setAddressUnlocked(false)
        toast.error('CEP nao encontrado, digite um CEP valido')
      }
    }

    handleCepLookup()
  }, [cepLimpo, isCepComplete])

  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
    }
  }, [])

  async function handleSubmit() {
    if (submitLock.current) {
      return
    }

    submitLock.current = true
    const result = registerSchema.safeParse(form)

    if (!result.success) {
      toast.error(result.error.issues[0]?.message || 'Dados invalidos')
      submitLock.current = false
      return
    }

    setSubmitting(true)

    const attemptRegister = async (allowRetry: boolean) => {
      try {
        await register(result.data)

        const email = result.data.email.trim()
        toast.success('Cadastro enviado. Verifique seu email para validar o acesso.')
        router.push(`/verify?email=${encodeURIComponent(email)}`)
        setSubmitting(false)
        submitLock.current = false
      } catch (error) {
        if (error instanceof ApiError && error.status === 429) {
          const retryAfterSeconds =
            typeof error.data === 'object'
            && error.data !== null
            && 'retryAfterSeconds' in error.data
              ? Number((error.data as { retryAfterSeconds?: number }).retryAfterSeconds)
              : 0

          if (allowRetry && retryAfterSeconds > 0) {
            toast.error(`Muitas tentativas. Tentando novamente em ${retryAfterSeconds}s.`)
            if (retryTimeoutRef.current) {
              clearTimeout(retryTimeoutRef.current)
            }
            retryTimeoutRef.current = setTimeout(() => {
              attemptRegister(false)
            }, retryAfterSeconds * 1000)
            return
          }
        }

        const message = error instanceof Error ? error.message : 'Erro ao cadastrar'
        toast.error(message)
        setSubmitting(false)
        submitLock.current = false
      }
    }

    attemptRegister(true)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 px-4 py-10">
      <div className="w-full max-w-2xl space-y-6 rounded-xl border bg-card p-8 shadow-lg">
        <div className="space-y-2 text-center">
          <Image src="/logo-solu-web.png" alt="Logo" width={160} height={48} className="mx-auto h-12 w-auto" />
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
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: getInputValue(e) }))
                }
                placeholder="Seu nome completo"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, email: getInputValue(e) }))
                }
                placeholder="seu@email.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label>CPF</Label>
              <Input
                value={form.cpf}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    cpf: formatCpf(getInputValue(e)),
                  }))
                }
                placeholder="000.000.000-00"
                inputMode="numeric"
              />
            </div>
            <div className="space-y-1.5">
              <Label>RG</Label>
              <Input
                value={form.rg}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    rg: formatRg(getInputValue(e)),
                  }))
                }
                placeholder="00.000.000-0"
                inputMode="numeric"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Data de nascimento</Label>
              <Input
                type="date"
                value={form.birth_date}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, birth_date: getInputValue(e) }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Telefone</Label>
              <Input
                value={form.phone}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    phone: formatPhone(getInputValue(e)),
                  }))
                }
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
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    address_street: getInputValue(e),
                  }))
                }
                placeholder="Rua"
                className="md:col-span-2"
                disabled={!canEditAddress}
              />
              <Input
                value={form.address_number}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    address_number: getInputValue(e),
                  }))
                }
                placeholder="Numero"
              />
              <Input
                value={form.address_complement}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    address_complement: getInputValue(e),
                  }))
                }
                placeholder="Complemento"
              />
              <Input
                value={form.address_neighborhood}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    address_neighborhood: getInputValue(e),
                  }))
                }
                placeholder="Bairro"
                disabled={!canEditAddress}
              />
              <Input
                value={form.address_city}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    address_city: getInputValue(e),
                  }))
                }
                placeholder="Cidade"
                disabled={!canEditAddress}
              />
              <Input
                value={form.address_state}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    address_state: getInputValue(e),
                  }))
                }
                placeholder="UF"
                disabled={!canEditAddress}
              />
              <Input
                value={form.address_zip_code}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    address_zip_code: formatCep(getInputValue(e)),
                  }))
                }
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
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, oab_number: getInputValue(e) }))
                  }
                  placeholder="OAB/UF 000000"
                />
              </div>
            )}
            {requiresConsular && (
              <div className="space-y-1.5">
                <Label>Matricula consular</Label>
                <Input
                  value={form.consular_registration}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      consular_registration: getInputValue(e),
                    }))
                  }
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
          <p className="text-center text-sm text-muted-foreground">
            <Link href="/" className="text-primary hover:underline">
            Voltar a tela inicial
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
