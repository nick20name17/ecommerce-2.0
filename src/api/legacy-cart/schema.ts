import type { ApiResponse, PaginationParams } from '@/api/schema'

export interface LegacyCartItem {
  id: string
  name: string
  price: number
  unit: string
  amount: number
  quantity: {
    current: number
    max: number
  }
  photo: string | null
}

export interface LegacyCart {
  user_id: number
  email: string
  ebms_id: string
  in_level: string
  created_at: string | null
  updated_at: string | null
  cart_total: number
  items: LegacyCartItem[]
}

export type LegacyCartResponse = ApiResponse<LegacyCart>

export interface LegacyCartParams extends PaginationParams {
  search?: string
  ordering?: string
  project_id?: number
}
