import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import './globals.css'

const _inter = Inter({ subsets: ['latin'] })
const _jetbrains = JetBrains_Mono({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'Cesta de Custodia - SEAP/RJ',
    template: '%s | Cesta de Custodia',
  },
  description: 'Sistema de gerenciamento de cestas de custodia para familiares de internos do sistema penitenciario do Rio de Janeiro.',
}

export const viewport: Viewport = {
  themeColor: '#1a2744',
  width: 'device-width',
  initialScale: 1,
  userScalable: true,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body className="font-sans antialiased">
        {children}
        <Toaster richColors position="top-right" />
        <Analytics />
      </body>
    </html>
  )
}
