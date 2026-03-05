export type PapelUsuario = 'ADMIN' | 'FISCAL_SEAP' | 'COMPRADOR' | 'OPERADOR'
export type StatusPedido =
  | 'PENDENTE_SIPEN'
  | 'PAGO'
  | 'PREPARANDO'
  | 'EM_TRANSITO'
  | 'ENTREGUE'
  | 'CANCELADO'

export interface Order {
  id: string
  buyer_id: string
  inmate_id: string | null
  status: StatusPedido
  sipen_protocol: string | null
  total_value: number
  delivery_fee: number
  fuesp_tax: number
  prescription_url: string | null
  prescription_validation_code: string | null
  created_at: string
  updated_at: string
  buyer_name?: string
  inmate_name?: string
  inmate_registration?: string
  prison_unit_name?: string
}

export interface MeResponse {
  user: {
    id: string
    email: string
    role: PapelUsuario
    email_verified_at: string | null
    unit_name?: string | null
  }
  buyer: unknown | null
}

export const STATUS_LABELS: Record<StatusPedido, string> = {
  PENDENTE_SIPEN: 'Aguardando SIPEN',
  PAGO: 'Pago',
  PREPARANDO: 'Em Preparo',
  EM_TRANSITO: 'Em Transito',
  ENTREGUE: 'Entregue',
  CANCELADO: 'Cancelado',
}
