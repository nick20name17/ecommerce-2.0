import type { PaginationParams } from '@/api/schema'

export interface ShipmentRecord {
  id: number
  order_autoid: string
  order_invoice: string
  order_name: string
  carrier_id: string
  service_name: string
  cost: string
  tracking_number: string
  label_id: string
  label_url: string
  voided: boolean
  created_at: string
}

export type ShipmentResponse = ShipmentRecord[]

export interface ShipmentParams extends PaginationParams {
  search?: string
  ordering?: string
  voided?: boolean
  order_autoid?: string
  project_id?: number
}
