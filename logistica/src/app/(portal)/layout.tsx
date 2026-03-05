import { OperatorHeader } from '@/components/operator-header'

export default function PortalLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="min-h-screen">
      <OperatorHeader />
      <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-8">
        {children}
      </main>
    </div>
  )
}
