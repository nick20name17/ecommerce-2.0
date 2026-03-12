import * as z from 'zod/mini'

import { RequiredStringSchema, OptionalStringSchema } from '@/api/schema'

export interface ShippingAddress {
  id: number
  title: string
  is_default: boolean
  name: string
  company_name: string
  phone: string
  address_line1: string
  address_line2: string
  city: string
  state: string
  postal_code: string
  country_code: string
  created_at: string
  updated_at: string
}

export type ShippingAddressPayload = Omit<ShippingAddress, 'id' | 'created_at' | 'updated_at'>

export const ShippingAddressSchema = z.object({
  title: RequiredStringSchema,
  name: RequiredStringSchema,
  company_name: OptionalStringSchema,
  phone: OptionalStringSchema,
  address_line1: RequiredStringSchema,
  address_line2: OptionalStringSchema,
  city: RequiredStringSchema,
  state: RequiredStringSchema,
  postal_code: RequiredStringSchema,
  country_code: RequiredStringSchema.check(z.maxLength(2, { error: 'Use 2-letter code (e.g. US, CA)' })),
  is_default: z.boolean(),
})

export type ShippingAddressFormValues = z.infer<typeof ShippingAddressSchema>
