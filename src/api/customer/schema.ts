import type { PaginatedResponse, PaginationParams } from '../schema'

export interface Customer {
  id: string
  l_name: string
  contact_1?: string
  contact_3?: string
  address1?: string
  address2?: string
  city?: string
  state?: string
  zip?: string
  country?: string
  in_level?: string
  inactive?: boolean
  last_order_date?: string | null
}

export interface CreateCustomerPayload {
  l_name: string
  contact_1?: string
  contact_3?: string
  address1?: string
  address2?: string
  city?: string
  state?: string
  zip?: string
  country?: string
  in_level?: string
  inactive?: boolean
}

export type UpdateCustomerPayload = Partial<CreateCustomerPayload>

export type CustomerResponse = PaginatedResponse<Customer>

export interface CustomerParams extends PaginationParams {
  search?: string
  ordering?: string
  inactive?: boolean
}
