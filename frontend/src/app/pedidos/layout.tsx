import type { Metadata } from 'next'
import { SWRProvider } from '@/lib/swr-provider'

export const metadata: Metadata = {
  title: 'Pedidos',
  description: 'Lista de pedidos realizados pelos usuários.',
}

export default function PedidosLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <SWRProvider>{children}</SWRProvider>
}
