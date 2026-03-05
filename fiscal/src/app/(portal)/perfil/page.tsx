'use client'

import useSWR from 'swr'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { clearBearerToken } from '@/lib/bearer-token'
import { getMe } from '@/services/api'

export default function PerfilPage() {
  const { data, isLoading } = useSWR('me', getMe)

  const handleLogout = () => {
    void fetch('/api/auth/session', { method: 'DELETE' }).catch(() => null)
    clearBearerToken()

    const browser = typeof globalThis !== 'undefined'
      ? (globalThis as { location?: { assign?: (url: string) => void } })
      : undefined
    browser?.location?.assign?.('/login')
  }

  const unitName = data?.user.unit_name ?? 'Nao informado'

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Perfil do Fiscal</CardTitle>
        <CardDescription>Dados do usuario autenticado</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? <div className="text-sm text-muted-foreground">Carregando perfil...</div> : null}

        {!isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="text-xs text-muted-foreground">E-mail</div>
              <div className="text-sm font-medium">{data?.user.email ?? 'Nao informado'}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Papel</div>
              <div className="text-sm font-medium">{data?.user.role ?? 'Nao informado'}</div>
            </div>
            <div className="md:col-span-2">
              <div className="text-xs text-muted-foreground">Unidade de lotacao</div>
              <div className="text-sm font-medium">{unitName}</div>
            </div>
          </div>
        ) : null}

        <Button variant="destructive" onClick={handleLogout}>
          Logout
        </Button>
      </CardContent>
    </Card>
  )
}
