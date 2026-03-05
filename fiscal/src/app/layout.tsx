import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { Toaster } from 'sonner'
import { SWRProvider } from '@/lib/swr-provider'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' })

export const metadata: Metadata = {
  title: {
    default: 'Portal de Fiscalizacao SEAP - Cesta Custodia',
    template: '%s | Portal de Fiscalizacao SEAP',
  },
  description: 'Portal administrativo para visualizacao e auditoria de pedidos da Cesta Custodia.',
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
    <html lang="pt-BR" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans antialiased">
        <SWRProvider>{children}</SWRProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
