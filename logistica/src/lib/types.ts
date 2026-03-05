export type UserRole = 'ADMIN' | 'FISCAL_SEAP' | 'COMPRADOR' | 'OPERADOR'
export type OrderStatus = 'PENDENTE_SIPEN' | 'PAGO' | 'PREPARANDO' | 'EM_TRANSITO' | 'ENTREGUE' | 'CANCELADO'
export type ProductCategory = 'ALIMENTOS' | 'HIGIENE' | 'VESTUARIO_BRANCO' | 'MEDICAMENTOS'

export interface Product {
  id: string
  name: string
  description: string | null
  price: number
  category: ProductCategory
  is_active: boolean
  stock_quantity: number
  image_url: string | null
}

export interface Order {
  id: string
  buyer_id: string
  inmate_id: string | null
  status: OrderStatus
  sipen_protocol: string | null
  total_value: number
  delivery_fee: number
  fuesp_tax: number
  prescription_url: string | null
  prescription_validation_code: string | null
  created_at: string
  updated_at: string
  buyer_name?: string
  buyer_cpf?: string
  inmate_name?: string
  inmate_registration?: string
  prison_unit_name?: string
  item_count?: number
}

export type MeResponse = {
  user: {
    id: string
    email: string
    role: UserRole
    email_verified_at: string | null
  }
  buyer: unknown | null
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDENTE_SIPEN: 'Aguardando SIPEN',
  PAGO: 'Pago',
  PREPARANDO: 'Em preparo',
  EM_TRANSITO: 'Em transito',
  ENTREGUE: 'Entregue',
  CANCELADO: 'Cancelado',
}

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  ALIMENTOS: 'Alimentos',
  HIGIENE: 'Higiene',
  VESTUARIO_BRANCO: 'Vestuario branco',
  MEDICAMENTOS: 'Medicamentos',
}
