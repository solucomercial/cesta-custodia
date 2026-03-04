import type { Metadata } from 'next'
import { SWRProvider } from '@/lib/swr-provider'

export const metadata: Metadata = {
  title: 'Catalogo de Produtos',
  description: 'Catalogo de itens autorizados para compra de cestas de custodia SEAP/RJ.',
}

export default function CatalogoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <SWRProvider>{children}</SWRProvider>
}
