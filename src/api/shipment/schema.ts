import type { PaginationParams } from '@/api/schema'

export interface ShipmentItem {
  detail_autoid: string
  product_id?: string
  description?: string
  quantity?: string
}

export interface ShipmentRecord {
  id: number
  order_autoid: string
  order_invoice: string
  order_name: string
  pick_list_id: number | null
  pick_list_name: string | null
  ship_to_name: string | null
  carrier_id: string
  service_name: string
  cost: string
  tracking_number: string
  label_id: string
  label_url: string
  voided: boolean
  items?: ShipmentItem[]
  created_at: string
}

export type ShipmentResponse = ShipmentRecord[]

export interface ShipmentParams extends PaginationParams {
  search?: string
  ordering?: string
  voided?: boolean
  order_autoid?: string
  pick_list_id?: number
  project_id?: number
}
