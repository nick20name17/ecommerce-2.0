import * as z from 'zod/mini'

import { OptionalStringSchema, RequiredStringSchema } from '../schema'
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
  project_id?: number
  fields?: string
}

export const CustomerSchema = z.object({
  l_name: RequiredStringSchema,
  contact_1: OptionalStringSchema,
  contact_3: OptionalStringSchema,
  address1: OptionalStringSchema,
  address2: OptionalStringSchema,
  city: OptionalStringSchema,
  state: OptionalStringSchema,
  zip: OptionalStringSchema,
  country: OptionalStringSchema,
  in_level: OptionalStringSchema,
  inactive: z.optional(z.boolean()),
})

export type CustomerFormValues = z.infer<typeof CustomerSchema>
