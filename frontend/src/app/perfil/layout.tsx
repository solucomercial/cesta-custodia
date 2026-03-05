import type { Metadata } from 'next'
import { SWRProvider } from '@/lib/swr-provider'

export const metadata: Metadata = {
  title: 'Perfil',
  description: 'Informações do perfil do usuário.',
}

export default function PerfilLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <SWRProvider>{children}</SWRProvider>
}
