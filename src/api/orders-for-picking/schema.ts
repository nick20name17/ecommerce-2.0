export interface PickingOrderItem {
  autoid: string
  inven: string
  doc_aid: string
  quan: string
  ship: string
  descr: string
  price: string
  so_amount: string
  weight: string | null
  is_picked: boolean
  packed: boolean
  shipment_id: number | null
  picked_by: string | null
  picked_at: string | null
}

export interface PickingOrder {
  autoid: string
  id: string
  invoice: string
  name: string
  c_id: string
  c_name: string
  address1?: string
  address2?: string
  c_address1?: string
  c_city?: string
  c_state?: string
  c_zip?: string
  status: string
  items?: PickingOrderItem[]
  [key: string]: unknown
}

export interface PickingCustomerGroup {
  customer_id: string
  customer_name: string
  order_count: number
  orders: PickingOrder[]
}

export interface PickingOrdersResponse {
  results: PickingCustomerGroup[]
}

export interface PickingOrdersParams {
  include_items?: boolean
  customer_id?: string
  search?: string
}
