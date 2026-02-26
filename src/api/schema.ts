import * as z from 'zod/mini'

import { VALIDATION_MESSAGES } from '@/constants/validation-messages'

export const RequiredStringSchema = z
  .string({ error: VALIDATION_MESSAGES.required })
  .check(z.minLength(1, { error: VALIDATION_MESSAGES.required }), z.trim())

export const PasswordSchema = RequiredStringSchema.check(
  z.minLength(6, { error: 'min 6 characters' }),
  z.maxLength(64, { error: 'max 64 characters' })
)

export const EmailSchema = z
  .email({ error: VALIDATION_MESSAGES.invalidEmail })
  .check(z.minLength(1, { error: VALIDATION_MESSAGES.required }), z.trim())

export const NameSchema = RequiredStringSchema.check(
  z.maxLength(100, { error: 'max 100 characters' })
)

export const OptionalStringSchema = z.optional(z.string().check(z.trim()))

export interface ApiResponse<T> {
  count: number
  results: T[]
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface PaginationParams {
  limit?: number
  offset?: number
}

export interface EntityAttachment {
  id: number
  entity_type: string
  entity_autoid: string
  project: number
  file_name: string
  file_size: number
  file_size_mb: string
  file_type: string
  uploaded_by: number | null
  uploaded_by_details: { id: number; full_name?: string } | null
  download_url: string
  created_at: string
}
