import * as z from 'zod/mini'

import { VALIDATION_MESSAGES } from '@/constants/validation-messages'

export const RequiredStringSchema = z
  .string({ error: VALIDATION_MESSAGES.required })
  .check(z.minLength(1, { error: VALIDATION_MESSAGES.required }), z.trim())

export const PasswordSchema = RequiredStringSchema.check(
  z.maxLength(64, { error: 'max 64 characters' })
)

export const EmailSchema = z
  .email({ error: VALIDATION_MESSAGES.invalidEmail })
  .check(z.minLength(1, { error: VALIDATION_MESSAGES.required }), z.trim())

export interface ApiResponse<T> {
  count: number
  results: T[]
}

export interface PaginationParams {
  limit?: number
  offset?: number
}
