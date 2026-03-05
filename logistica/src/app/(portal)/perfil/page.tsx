'use client'

import useSWR from 'swr'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getMe } from '@/services/api'
import { clearBearerToken } from '@/lib/bearer-token'

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Perfil do Operador</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Carregando perfil...</div>
        ) : null}
        {!isLoading ? (
          <div className="space-y-2">
            <div>
              <div className="text-xs text-muted-foreground">Email</div>
              <div className="font-medium">{data?.user.email ?? 'Nao informado'}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Papel</div>
              <div className="font-medium">{data?.user.role ?? 'Nao informado'}</div>
            </div>
          </div>
        ) : null}
        <Button variant="destructive" onClick={handleLogout}>
          Sair
        </Button>
      </CardContent>
    </Card>
  )
}
