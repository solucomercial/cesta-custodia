'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, AlertCircle, Loader2, FileText, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select'
import { useCart } from '@/lib/cart-store'
import { formatCurrency } from '@/lib/types'
import type { BuyerProfile, CheckoutInmateInput } from '@/lib/types'
import { createOrder, validateSipen } from '@/services/api'
import { toast } from 'sonner'

export function CheckoutDialog({
  open,
  onOpenChange,
  buyer,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  buyer: BuyerProfile | null
}) {
  const { items, subtotal, deliveryFee, fuespTax, total, hasMedicamentos, clearCart } = useCart()
  const [step, setStep] = useState<'search' | 'confirm' | 'success'>('search')
  const [inmateFound, setInmateFound] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [sipenProtocol, setSipenProtocol] = useState('')
  const [sipenStatus, setSipenStatus] = useState<'idle' | 'validating' | 'approved' | 'rejected'>('idle')
  const [sipenError, setSipenError] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'CARTAO' | 'BOLETO' | 'PIX'>('PIX')
  const [prescriptionUrl, setPrescriptionUrl] = useState('')
  const [prescriptionCode, setPrescriptionCode] = useState('')
  const [prescriptionFileName, setPrescriptionFileName] = useState('')

  const [inmateInput, setInmateInput] = useState<CheckoutInmateInput>({
    name: '',
    ward: '',
    cell: '',
    prison_unit_name: '',
  })

  const canValidateSipen = Boolean(
    buyer?.cpf?.trim() &&
    inmateInput.name.trim() &&
    inmateInput.ward.trim() &&
    inmateInput.cell.trim()
  )

  const itemCountLabel = useMemo(() => {
    return `${items.length} ${items.length === 1 ? 'item' : 'itens'}`
  }, [items.length])

  function goToConfirm() {
    if (!inmateInput.name.trim() || !inmateInput.ward.trim() || !inmateInput.cell.trim()) {
      setError('Preencha nome, ala e cela do interno')
      return
    }
    setError('')
    setInmateFound(true)
    setStep('confirm')
  }

  async function validateSipen() {
    if (!canValidateSipen) return
    if (!buyer) {
      toast.error('Cadastro do comprador nao encontrado')
      return
    }
    setSipenStatus('validating')
    setSipenError('')

    try {
      const data = await validateSipen({
        buyer_cpf: buyer.cpf,
        inmate: inmateInput,
      })
      setSipenStatus('approved')
      setSipenProtocol(data.protocol)
    } catch (error) {
      setSipenStatus('rejected')
      const message = error instanceof Error ? error.message : 'Erro na validacao SIPEN. Tente novamente.'
      setSipenError(message)
    }
  }

  async function submitOrder() {
    if (!inmateFound) {
      toast.error('Dados do interno obrigatorios')
      return
    }

    if (!buyer) {
      toast.error('Cadastro do comprador obrigatorio')
      return
    }

    if (hasMedicamentos && !prescriptionUrl.trim()) {
      toast.error('Prescricao eletronicamente assinada e obrigatoria')
      return
    }

    if (hasMedicamentos && !prescriptionCode.trim()) {
      toast.error('Codigo de validacao da receita obrigatorio')
      return
    }

    if (sipenStatus !== 'approved') {
      toast.error('Validacao SIPEN obrigatoria antes de confirmar')
      return
    }

    setSubmitting(true)
    try {
      const data = await createOrder({
        inmate: inmateInput,
        sipen_protocol: sipenProtocol,
        payment_method: paymentMethod,
        prescription_url: prescriptionUrl || null,
        prescription_code: prescriptionCode || null,
        items: items.map((item) => ({
          product_id: item.product.id,
          price: Number(item.product.price),
          quantity: item.quantity,
          category: item.product.category,
          name: item.product.name,
        })),
      })

      setSipenProtocol(data.sipen_protocol)
      setStep('success')
      clearCart()
      toast.success('Pedido realizado com sucesso!')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao processar pedido. Tente novamente.'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  function handleClose() {
    onOpenChange(false)
    setTimeout(() => {
      setStep('search')
      setInmateInput({ name: '', ward: '', cell: '', prison_unit_name: '' })
      setInmateFound(false)
      setError('')
      setSipenProtocol('')
      setSipenStatus('idle')
      setSipenError('')
      setPaymentMethod('PIX')
      setPrescriptionUrl('')
      setPrescriptionCode('')
      setPrescriptionFileName('')
    }, 300)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {step === 'search' && 'Identificar Interno'}
            {step === 'confirm' && 'Confirmar Pedido'}
            {step === 'success' && 'Pedido Confirmado'}
          </DialogTitle>
          <DialogDescription>
            {step === 'search' && 'Informe os dados do interno destinatario.'}
            {step === 'confirm' && 'Revise os dados antes de confirmar.'}
            {step === 'success' && 'Seu pedido foi registrado e validado pelo SIPEN.'}
          </DialogDescription>
        </DialogHeader>

        {step === 'search' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="inmateName">Nome do interno</Label>
              <Input
                id="inmateName"
                placeholder="Nome completo"
                value={inmateInput.name}
                onChange={(e) => setInmateInput((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inmateUnit">Unidade prisional (opcional)</Label>
              <Input
                id="inmateUnit"
                placeholder="Ex: UP 01"
                value={inmateInput.prison_unit_name || ''}
                onChange={(e) => setInmateInput((prev) => ({ ...prev, prison_unit_name: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label htmlFor="inmateWard">Ala</Label>
                <Input
                  id="inmateWard"
                  placeholder="Raio"
                  value={inmateInput.ward}
                  onChange={(e) => setInmateInput((prev) => ({ ...prev, ward: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inmateCell">Cela</Label>
                <Input
                  id="inmateCell"
                  placeholder="Cela"
                  value={inmateInput.cell}
                  onChange={(e) => setInmateInput((prev) => ({ ...prev, cell: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && goToConfirm()}
                />
              </div>
            </div>
            <Button onClick={goToConfirm} className="w-full">
              Continuar
            </Button>
            {error && (
              <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3">
                <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
          </div>
        )}

        {step === 'confirm' && inmateFound && (
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-secondary/30 p-4 space-y-2">
              <h4 className="text-sm font-semibold text-foreground">Dados do Interno</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Nome:</span>
                  <Input
                    value={inmateInput.name}
                    onChange={(e) =>
                      setInmateInput((prev) => ({ ...prev, name: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <span className="text-muted-foreground">Unidade:</span>
                  <Input
                    value={inmateInput.prison_unit_name || ''}
                    onChange={(e) =>
                      setInmateInput((prev) => ({ ...prev, prison_unit_name: e.target.value }))
                    }
                    placeholder="Nao informada"
                  />
                </div>
                <div>
                  <span className="text-muted-foreground">Localizacao:</span>
                  <div className="flex gap-2">
                    <Input
                      value={inmateInput.ward}
                      onChange={(e) =>
                        setInmateInput((prev) => ({ ...prev, ward: e.target.value }))
                      }
                      placeholder="Raio"
                    />
                    <Input
                      value={inmateInput.cell}
                      onChange={(e) =>
                        setInmateInput((prev) => ({ ...prev, cell: e.target.value }))
                      }
                      placeholder="Cela"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-3 flex flex-col gap-2">
                <Button
                  variant="outline"
                  onClick={validateSipen}
                  disabled={!canValidateSipen || sipenStatus === 'validating'}
                  className="gap-2"
                >
                  {sipenStatus === 'validating' ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                  Validar vinculo SIPEN
                </Button>
                {sipenStatus === 'approved' && (
                  <div className="flex items-center gap-2 text-xs text-emerald-600">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Vinculo validado. Protocolo: {sipenProtocol}
                  </div>
                )}
                {sipenStatus === 'rejected' && sipenError && (
                  <div className="flex items-center gap-2 text-xs text-destructive">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {sipenError}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">Comprador</h4>
              <div className="rounded-lg border border-border bg-secondary/30 p-3">
                {buyer ? (
                  <div className="grid gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Nome:</span> {buyer.name}
                    </div>
                    <div>
                      <span className="text-muted-foreground">CPF:</span> {buyer.cpf}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Email:</span> {buyer.email}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>Cadastro do comprador nao localizado.</p>
                    <Link href="/register" className="text-primary hover:underline">
                      Completar cadastro
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {hasMedicamentos && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3">
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                <div>
                  <p className="text-sm font-medium text-destructive">Prescricao Medica Obrigatoria</p>
                  <p className="text-xs text-muted-foreground">
                    Seu pedido contem medicamentos. A prescricao eletronica sera validada via CFM/ITI antes da conclusao.
                  </p>
                  <div className="mt-2">
                    <Label htmlFor="prescriptionCode" className="text-xs">Codigo de validacao da receita</Label>
                    <Input
                      id="prescriptionCode"
                      value={prescriptionCode}
                      onChange={(e) => setPrescriptionCode(e.target.value)}
                      placeholder="Ex: 2F9A8B1C"
                    />
                  </div>
                  <div className="mt-2">
                    <Label htmlFor="prescriptionPdf" className="text-xs">Arquivo PDF da receita</Label>
                    <Input
                      id="prescriptionPdf"
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        setPrescriptionFileName(file ? file.name : '')
                      }}
                    />
                    {prescriptionFileName && (
                      <p className="mt-1 text-[11px] text-muted-foreground">Selecionado: {prescriptionFileName}</p>
                    )}
                  </div>
                  <div className="mt-2">
                    <Label htmlFor="prescriptionUrl" className="text-xs">URL da prescricao assinada</Label>
                    <Input
                      id="prescriptionUrl"
                      value={prescriptionUrl}
                      onChange={(e) => setPrescriptionUrl(e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground">Forma de Pagamento</h4>
              <Select value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as typeof paymentMethod)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CARTAO">Cartao</SelectItem>
                  <SelectItem value="BOLETO">Boleto</SelectItem>
                  <SelectItem value="PIX">PIX</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal ({itemCountLabel})</span>
                <span className="text-foreground">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Frete ad valorem</span>
                <span className="text-foreground">{formatCurrency(deliveryFee)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Taxa FUESP</span>
                <span className="text-foreground">{formatCurrency(fuespTax)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-base font-semibold">
                <span className="text-foreground">Total</span>
                <span className="text-foreground">{formatCurrency(total)}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep('search')}>
                Voltar
              </Button>
              <Button className="flex-1" onClick={submitOrder} disabled={submitting || !buyer}>
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Confirmar Pedido
              </Button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/15">
              <CheckCircle2 className="h-8 w-8 text-accent" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-semibold text-foreground">Pedido registrado com sucesso!</p>
              <p className="text-xs text-muted-foreground">Protocolo SIPEN:</p>
              <p className="font-mono text-sm font-bold text-primary">{sipenProtocol}</p>
            </div>
            <p className="text-center text-xs text-muted-foreground">
              Guarde este protocolo para acompanhamento. O pedido sera preparado apos confirmacao do pagamento.
            </p>
            <Button onClick={handleClose} className="mt-2">
              Fechar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
