import * as z from 'zod/mini'

import type { PaginatedResponse, PaginationParams } from '@/api/schema'
import type { ShipmentRecord } from '@/api/shipment/schema'
import { RequiredStringSchema, OptionalStringSchema } from '@/api/schema'
import type { PickListStatus } from '@/constants/pick-list'

export type { PickListStatus } from '@/constants/pick-list'

// ── Ship-to address ─────────────────────────────────────────

export interface ShipTo {
  name: string
  phone?: string
  address1: string
  address2?: string
  city: string
  state: string
  postal: string
  country: string
}

// ── Pick list item ──────────────────────────────────────────

export interface PickListItem {
  id: number
  order_autoid: string
  detail_autoid: string
  inven?: string
  descr?: string
  picked_quantity: string
  push_status?: 'success' | 'failed' | null
  push_error?: string | null
}

// ── Pick list ───────────────────────────────────────────────

export interface PickList {
  id: number
  name: string | null
  notes: string | null
  status: PickListStatus
  ship_to: ShipTo
  item_count: number
  order_count: number
  items?: PickListItem[]
  shipments?: ShipmentRecord[]
  created_at: string
  updated_at: string
}

// ── Shipping ────────────────────────────────────────────────

export interface PickListShippingRate {
  rate_id: string
  type: string
  cost: number
  carrier_id: string
  service_id: string
}

export interface PickListShippingPackage {
  items: string[]
  length: string
  width: string
  height: string
  weight?: string
}

export interface ShippingRatesRequest {
  shipping_address_id: number
  packages: PickListShippingPackage[]
}

export interface ShippingRatesResponse {
  rates: PickListShippingRate[]
  packages: PickListShippingPackage[]
}

export interface ShippingSelectionResponse {
  label_id: string
  tracking_number: string
  label_url: string
}

// ── Payloads ────────────────────────────────────────────────

export interface CreatePickListPayload {
  ship_to: ShipTo
  shipping_address_id: number
  name?: string
  notes?: string
}

export interface UpdatePickListPayload {
  name?: string
  notes?: string
}

export interface AddItemsPayload {
  items: {
    order_autoid: string
    detail_autoid: string
    picked_quantity: string
  }[]
}

export interface UpdateItemPayload {
  picked_quantity: string
}

// ── Params ──────────────────────────────────────────────────

export type PickListResponse = PaginatedResponse<PickList>

export interface PickListParams extends PaginationParams {
  status?: string
  search?: string
  ordering?: string
}

// ── Zod schemas ─────────────────────────────────────────────

export const ShipToSchema = z.object({
  name: RequiredStringSchema,
  phone: OptionalStringSchema,
  address1: RequiredStringSchema,
  address2: OptionalStringSchema,
  city: RequiredStringSchema,
  state: RequiredStringSchema,
  postal: RequiredStringSchema,
  country: RequiredStringSchema,
})

export const CreatePickListSchema = z.object({
  ship_to: ShipToSchema,
  name: OptionalStringSchema,
  notes: OptionalStringSchema,
})

export type CreatePickListFormValues = z.infer<typeof CreatePickListSchema>
