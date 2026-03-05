import Link from 'next/link'
import Image from 'next/image'
import {
  ShieldCheck,
  Package,
  Truck,
  Lock,
  ArrowRight,
  Building2,
  FileCheck,
  Scale,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const FEATURES = [
  {
    icon: Package,
    title: 'Catalogo Controlado',
    description:
      'Itens autorizados pela Resolucao SEAP/RJ: alimentos, higiene, vestuario branco e medicamentos com prescricao.',
  },
  {
    icon: FileCheck,
    title: 'Validacao SIPEN',
    description:
      'Consulta sincrona ao WebService Montreal para verificar vinculo entre visitante e interno antes da compra.',
  },
  {
    icon: Scale,
    title: 'Frete Ad Valorem',
    description:
      'Calculo automatico da taxa de entrega baseado em faixas do salario minimo vigente, com total transparencia.',
  },
  {
    icon: Building2,
    title: 'Repasse FUESP',
    description:
      'Taxa de retorno ao Erario estadual calculada automaticamente e rastreada para prestacao de contas.',
  },
  {
    icon: Lock,
    title: 'Auditoria Completa',
    description:
      'Registro imutavel de todas as acoes criticas: validacoes, alteracoes de preco e status de pedidos.',
  },
  {
    icon: Truck,
    title: 'Rastreamento',
    description:
      'Acompanhamento em tempo real do status de cada pedido, desde a validacao ate a entrega na unidade.',
  },
]

const FRETE_TABLE = [
  { faixa: 'Ate R$ 151,80', aliquota: '10%' },
  { faixa: 'Ate R$ 303,60', aliquota: '7,50%' },
  { faixa: 'Ate R$ 759,00', aliquota: '5%' },
  { faixa: 'A partir de R$ 1.518,00', aliquota: '3,50%' },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white shadow-md">
              <Image src="/solu-web.png" alt="Logo" width={36} height={36} />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold leading-tight text-foreground">Cesta de Custodia</span>
              <span className="text-[11px] leading-tight text-muted-foreground">SEAP/RJ - Sistema Penitenciario</span>
            </div>
          </div>
          <nav className="hidden items-center gap-4 md:flex">
            <Link href="/catalogo">
              <Button size="sm" className="gap-1">
                Acessar Catalogo
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-16 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mx-auto mb-4 flex w-60 items-center justify-center">
              <Image
                src="/logo-solu-web.png"
                alt="Logo Soluções Serviços Terceirizados"
                width={240}
                height={72}
                className="h-auto w-full"
              />
            </div>

            <h1 className="text-balance text-3xl font-bold tracking-tight text-foreground md:text-5xl">
              Sistema de Gestão de Cestas de Custodia
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-pretty leading-relaxed text-muted-foreground md:text-lg">
              Plataforma segura e transparente para familiares adquirirem itens autorizados
              para internos do sistema penitenciario do Estado do Rio de Janeiro.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link href="/catalogo">
                <Button size="lg" className="gap-2">
                  <Package className="h-4 w-4" />
                  Acessar Catalogo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-10 text-center">
            <h2 className="text-balance text-2xl font-bold tracking-tight text-foreground">
              Funcionalidades do Sistema
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-pretty text-sm text-muted-foreground">
              Construido para atender aos requisitos da SEAP/RJ com foco em transparencia,
              rastreabilidade e conformidade legal.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <Card key={feature.title} className="transition-shadow hover:shadow-md">
                <CardContent className="flex gap-4 p-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{feature.title}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{feature.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Frete Table */}
      <section className="border-t border-border bg-card py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-center text-2xl font-bold tracking-tight text-foreground">
              Tabela de Frete Ad Valorem
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-center text-sm text-muted-foreground">
              A taxa de entrega e calculada automaticamente com base no valor bruto da venda,
              seguindo faixas do salario minimo vigente (R$ 1.518,00).
            </p>
            <div className="mt-8 overflow-hidden rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-secondary/50">
                    <th className="px-6 py-3 text-left font-medium text-muted-foreground">Faixa de Venda</th>
                    <th className="px-6 py-3 text-right font-medium text-muted-foreground">Aliquota</th>
                  </tr>
                </thead>
                <tbody>
                  {FRETE_TABLE.map((row, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="px-6 py-3 text-foreground">{row.faixa}</td>
                      <td className="px-6 py-3 text-right font-mono font-semibold text-primary">{row.aliquota}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mx-auto max-w-2xl rounded-xl border border-border bg-card p-8 text-center md:p-12">
            <ShieldCheck className="mx-auto h-10 w-10 text-primary" />
            <h2 className="mt-4 text-xl font-bold text-foreground md:text-2xl">
              Proof of Concept - SEAP/RJ
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Esta POC demonstra a integracao de dados criticos e o motor de regras de negocio
              para o sistema de cestas de custodia.
            </p>
            <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link href="/catalogo">
                <Button size="lg" className="gap-2">
                  Testar Catalogo
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">
                Cesta de Custodia - SEAP/RJ | Proof of Concept
              </span>
            </div>
            <Link href="/admin">
            <p className="text-xs text-muted-foreground">
              Área para administradores
            </p>
            </Link>
            <p className="text-xs text-muted-foreground">
              Conformidade LGPD | WCAG 2.1 AA | HTTPS
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
