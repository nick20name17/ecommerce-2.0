import type { OrderStatus } from '@/constants/order'

import type { PaginatedResponse, PaginationParams } from '@/api/schema'

export type { OrderStatus } from '@/constants/order'

export interface Order {
  autoid: string
  id: string
  invoice: string
  name: string
  inv_date: string | null
  due_date: string | null
  status: OrderStatus
  tax: string
  subtotal: string
  total: string
  balance: string
  items?: OrderItem[]
}

export interface OrderItem {
  autoid: string
  inven: string
  doc_aid: string
  quan: string
  descr: string
  price: string
  so_amount: string
}

export type OrderResponse = PaginatedResponse<Order>

export interface OrderParams extends PaginationParams {
  invoice?: string
  autoid?: string
  ordering?: string
  status?: OrderStatus
  customer?: string
  project_id?: number
}
