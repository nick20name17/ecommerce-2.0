import type { AssignedUser } from '@/api/schema'
import type { PaginatedResponse, PaginationParams } from '@/api/schema'
import type { OrderStatus } from '@/constants/order'

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
  external_id: string | null
  total_quan: string
  total_ship: string
  // Bill To
  address1?: string | null
  address2?: string | null
  city?: string | null
  state?: string | null
  zip?: string | null
  // Ship To
  c_name?: string | null
  c_address1?: string | null
  c_address2?: string | null
  c_city?: string | null
  c_state?: string | null
  c_zip?: string | null
  // Contact
  email?: string | null
  phone?: string | null
  // Order details
  salesman?: string | null
  po_no?: string | null
  ship_date?: string | null
  ship_via?: string | null
  in_level?: string | null
  charge?: string | null
  // Notes
  memo?: string | null
  internalnt?: string | null

  // Pick progress
  pick_status?: string // e.g. '3/7'

  items?: OrderItem[]
  assigned_user?: AssignedUser | null
  [key: string]: unknown
}

export type OrderPatchPayload = Partial<
  Pick<
    Order,
    | 'name'
    | 'address1'
    | 'address2'
    | 'city'
    | 'state'
    | 'zip'
    | 'c_name'
    | 'c_address1'
    | 'c_address2'
    | 'c_city'
    | 'c_state'
    | 'c_zip'
    | 'email'
    | 'phone'
    | 'salesman'
    | 'po_no'
    | 'ship_date'
    | 'ship_via'
    | 'in_level'
    | 'charge'
    | 'memo'
    | 'internalnt'
  >
> & { [key: string]: unknown }

export interface OrderItem {
  autoid: string
  inven: string
  doc_aid: string
  quan: string
  ship: string
  descr: string
  price: string
  so_amount: string
  is_picked: boolean
  picked_by: string | null
  picked_at: string | null
}

export interface PickStatusRequest {
  is_picked: boolean
}

export interface ShippingRate {
  type: string
  cost: number
  carrier_id: string
  service_id: string
}

export interface ShippingPackage {
  items: string[]
  weight: number
  length: number
  width: number
  height: number
}

export interface ShippingPackagePayload {
  items: string[]
  weight: number
  length: number
  width: number
  height: number
}

export interface ShippingRatesRequest {
  shipping_address_id: number
  packages: ShippingPackagePayload[]
}

export interface ShippingRatesResponse {
  rates: ShippingRate[]
  packages: ShippingPackage[]
}

export type OrderResponse = PaginatedResponse<Order>

export interface OrderParams extends PaginationParams {
  search?: string
  autoid?: string
  ordering?: string
  status?: string
  customer_id?: string
  project_id?: number
  notes?: boolean
}
