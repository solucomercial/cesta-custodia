import type { Metadata, Viewport } from 'next'
import { Space_Grotesk, IBM_Plex_Mono } from 'next/font/google'
import { Toaster } from 'sonner'
import { SWRProvider } from '@/lib/swr-provider'
import './globals.css'

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-sans' })
const plexMono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-mono' })

export const metadata: Metadata = {
  title: {
    default: 'Portal de Logistica - Cesta Custodia',
    template: '%s | Portal de Logistica',
  },
  description: 'Portal logistico para operacao de pedidos e estoque da Cesta Custodia.',
}

export const viewport: Viewport = {
  themeColor: '#1c4033',
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
    <html lang="pt-BR" className={`${spaceGrotesk.variable} ${plexMono.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,120,92,0.15),_transparent_55%),linear-gradient(180deg,_rgba(251,249,242,0.9),_rgba(246,243,234,0.95))]">
          <SWRProvider>{children}</SWRProvider>
        </div>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
