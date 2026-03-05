'use client'

import { useMemo, useState } from 'react'
import useSWR from 'swr'
import { toast } from 'sonner'
import { MarketplaceHeader } from '@/components/marketplace-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getMe, type BuyerProfile } from '@/services/api'

type ProfileForm = {
  name: string
  cpf: string
  rg: string
  birth_date: string
  professional_type: 'ADVOGADO' | 'AGENTE_CONSULAR' | 'OUTRO'
  oab_number: string
  consular_registration: string
  phone: string
  email: string
  email_verified_at: string | null
  address_street: string
  address_number: string
  address_complement: string
  address_neighborhood: string
  address_city: string
  address_state: string
  address_zip_code: string
}

const PROFESSIONAL_LABELS: Record<ProfileForm['professional_type'], string> = {
  ADVOGADO: 'Advogado',
  AGENTE_CONSULAR: 'Agente Consular',
  OUTRO: 'Outro',
}

const onlyDigits = (value: string) => value.replace(/\D/g, '')
const getInputValue = (event: React.ChangeEvent<HTMLInputElement>) =>
  (event.currentTarget as { value?: string } | null)?.value ?? ''

function formatCpf(value: string) {
  const digits = onlyDigits(value).slice(0, 11)
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

function formatPhone(value: string) {
  const digits = onlyDigits(value).slice(0, 11)
  if (digits.length <= 10) {
    return digits
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
  }
  return digits
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
}

function formatZip(value: string) {
  const digits = onlyDigits(value).slice(0, 8)
  if (digits.length <= 5) return digits
  return `${digits.slice(0, 5)}-${digits.slice(5)}`
}

function parseAddress(address: string) {
  const parts = address.split(' - ').map((part) => part.trim()).filter(Boolean)
  const first = parts[0] ?? ''
  const firstParts = first.split(',').map((part) => part.trim())

  const zipPart = parts.find((part) => part.startsWith('CEP ')) ?? ''
  const zip = zipPart.replace(/^CEP\s*/i, '')

  const state = parts[parts.length - 2] ?? ''
  const city = parts[parts.length - 3] ?? ''
  const neighborhood = parts[parts.length - 4] ?? ''
  const complement = parts.length > 5 ? parts.slice(1, parts.length - 4).join(' - ') : ''

  return {
    street: firstParts[0] ?? '',
    number: firstParts.slice(1).join(', ') || '',
    complement,
    neighborhood,
    city,
    state,
    zip,
  }
}

function formatBirthDate(value: string) {
  if (!value) return 'Nao informado'

  const parsed = new Date(`${value}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('pt-BR').format(parsed)
}

function buildForm(buyer: BuyerProfile): ProfileForm {
  const address = parseAddress(buyer.address || '')

  return {
    name: buyer.name || '',
    cpf: buyer.cpf || '',
    rg: buyer.rg || '',
    birth_date: buyer.birth_date ? String(buyer.birth_date).slice(0, 10) : '',
    professional_type: buyer.professional_type || 'OUTRO',
    oab_number: buyer.oab_number || '',
    consular_registration: buyer.consular_registration || '',
    phone: buyer.phone || '',
    email: buyer.email || '',
    email_verified_at: buyer.email_verified_at,
    address_street: address.street,
    address_number: address.number,
    address_complement: address.complement,
    address_neighborhood: address.neighborhood,
    address_city: address.city,
    address_state: address.state,
    address_zip_code: address.zip,
  }
}

export default function PerfilPage() {
  const { data, isLoading } = useSWR(['auth/me'], () => getMe())
  const buyer = data?.buyer ?? null

  const [isEditing, setIsEditing] = useState(false)
  const [localBuyer, setLocalBuyer] = useState<BuyerProfile | null>(null)

  const form = useMemo(() => {
    if (localBuyer) return buildForm(localBuyer)
    if (buyer) return buildForm(buyer)
    return null
  }, [buyer, localBuyer])

  const professionalCredentialLabel =
    form?.professional_type === 'ADVOGADO'
      ? 'Inscricao OAB'
      : form?.professional_type === 'AGENTE_CONSULAR'
        ? 'Registro Consular'
        : 'Credencial'

  const professionalCredentialValue =
    form?.professional_type === 'ADVOGADO'
      ? form.oab_number
      : form?.professional_type === 'AGENTE_CONSULAR'
        ? form.consular_registration
        : ''

  function updateField<K extends keyof ProfileForm>(field: K, value: ProfileForm[K]) {
    const source = localBuyer || buyer
    if (!source) return

    const current = buildForm(source)
    const nextForm = {
      ...current,
      [field]: value,
    }

    const addressParts = [
      `${nextForm.address_street}, ${nextForm.address_number}`,
      nextForm.address_complement,
      nextForm.address_neighborhood,
      nextForm.address_city,
      nextForm.address_state,
      nextForm.address_zip_code ? `CEP ${onlyDigits(nextForm.address_zip_code)}` : '',
    ].filter(Boolean)

    setLocalBuyer({
      ...source,
      name: nextForm.name,
      cpf: onlyDigits(nextForm.cpf),
      rg: nextForm.rg,
      birth_date: nextForm.birth_date,
      professional_type: nextForm.professional_type,
      oab_number: nextForm.oab_number || null,
      consular_registration: nextForm.consular_registration || null,
      phone: onlyDigits(nextForm.phone),
      email: nextForm.email,
      email_verified_at: nextForm.email_verified_at,
      address: addressParts.join(' - '),
    })
  }

  function handleSaveLocal() {
    setIsEditing(false)
    toast.success('Informacoes atualizadas na visualizacao local.')
  }

  return (
    <div className="min-h-screen bg-background">
      <MarketplaceHeader />

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6">
        <section className="rounded-xl border border-border bg-card p-6 md:p-8">
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">Meu Perfil</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Gerencie suas informacoes pessoais e enderecos de entrega.
          </p>
        </section>

        {isLoading ? (
          <Card>
            <CardContent>
              <p className="text-sm text-muted-foreground">Carregando dados do perfil...</p>
            </CardContent>
          </Card>
        ) : !form ? (
          <Card>
            <CardContent>
              <p className="text-sm text-muted-foreground">Nao foi possivel carregar os dados do comprador.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex justify-end gap-2">
              {isEditing ? (
                <>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveLocal}>Salvar alteracoes</Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)}>Editar Informacoes</Button>
              )}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Dados Pessoais</CardTitle>
                <CardDescription>Informacoes basicas de identificacao do comprador.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5 md:col-span-2">
                  <Label>Nome Completo</Label>
                  <Input
                    readOnly={!isEditing}
                    value={form.name}
                    onChange={(event) => updateField('name', getInputValue(event))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>CPF</Label>
                  <Input
                    readOnly={!isEditing}
                    value={formatCpf(form.cpf)}
                    onChange={(event) => updateField('cpf', getInputValue(event))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>RG</Label>
                  <Input
                    readOnly={!isEditing}
                    value={isEditing ? form.rg : (form.rg || 'Nao informado')}
                    onChange={(event) => updateField('rg', getInputValue(event))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Data de Nascimento</Label>
                  {isEditing ? (
                    <Input
                      type="date"
                      value={form.birth_date}
                      onChange={(event) => updateField('birth_date', getInputValue(event))}
                    />
                  ) : (
                    <Input readOnly value={formatBirthDate(form.birth_date)} />
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Tipo Profissional</Label>
                  <Input readOnly value={PROFESSIONAL_LABELS[form.professional_type]} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Credenciais Profissionais</CardTitle>
                <CardDescription>Documento profissional conforme o perfil informado.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5 md:col-span-2">
                  <Label>{professionalCredentialLabel}</Label>
                  <Input
                    readOnly={!isEditing}
                    value={isEditing ? professionalCredentialValue : (professionalCredentialValue || 'Nao informado')}
                    onChange={(event) => {
                      if (form.professional_type === 'ADVOGADO') {
                        updateField('oab_number', getInputValue(event))
                      }
                      if (form.professional_type === 'AGENTE_CONSULAR') {
                        updateField('consular_registration', getInputValue(event))
                      }
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Informacoes de Contato</CardTitle>
                <CardDescription>Dados para comunicacao e recuperacao de acesso.</CardDescription>
                <CardAction>
                  <Badge
                    variant="outline"
                    className={
                      form.email_verified_at
                        ? 'border-primary/30 bg-primary/10 text-primary'
                        : 'border-destructive/30 bg-destructive/10 text-destructive'
                    }
                  >
                    {form.email_verified_at ? 'E-mail verificado' : 'E-mail nao verificado'}
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Telefone</Label>
                  <Input
                    readOnly={!isEditing}
                    value={formatPhone(form.phone)}
                    onChange={(event) => updateField('phone', getInputValue(event))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>E-mail</Label>
                  <Input
                    readOnly={!isEditing}
                    type="email"
                    value={form.email}
                    onChange={(event) => updateField('email', getInputValue(event))}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Endereco</CardTitle>
                <CardDescription>Endereco de entrega cadastrado para os pedidos.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5 md:col-span-2">
                  <Label>Rua</Label>
                  <Input
                    readOnly={!isEditing}
                    value={isEditing ? form.address_street : (form.address_street || 'Nao informado')}
                    onChange={(event) => updateField('address_street', getInputValue(event))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Numero</Label>
                  <Input
                    readOnly={!isEditing}
                    value={isEditing ? form.address_number : (form.address_number || 'Nao informado')}
                    onChange={(event) => updateField('address_number', getInputValue(event))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Complemento</Label>
                  <Input
                    readOnly={!isEditing}
                    value={isEditing ? form.address_complement : (form.address_complement || 'Nao informado')}
                    onChange={(event) => updateField('address_complement', getInputValue(event))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Bairro</Label>
                  <Input
                    readOnly={!isEditing}
                    value={isEditing ? form.address_neighborhood : (form.address_neighborhood || 'Nao informado')}
                    onChange={(event) => updateField('address_neighborhood', getInputValue(event))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Cidade / Estado</Label>
                  <Input
                    readOnly={!isEditing}
                    value={
                      isEditing
                        ? `${form.address_city}${form.address_state ? `/${form.address_state}` : ''}`
                        : form.address_city && form.address_state
                        ? `${form.address_city}/${form.address_state}`
                        : 'Nao informado'
                    }
                    onChange={(event) => {
                      const [city, state = ''] = getInputValue(event).split('/')
                      updateField('address_city', city?.trim() || '')
                      updateField('address_state', state?.trim() || '')
                    }}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>CEP</Label>
                  <Input
                    readOnly={!isEditing}
                    value={formatZip(form.address_zip_code)}
                    onChange={(event) => updateField('address_zip_code', getInputValue(event))}
                  />
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  )
}
