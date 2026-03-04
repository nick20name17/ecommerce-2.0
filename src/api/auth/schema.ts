import { z } from 'zod'

import type { User } from '../user/schema'

import { EmailSchema, PasswordSchema } from '@/api/schema'

export interface Tokens {
  access: string
  refresh: string
}

export const SignInPayloadSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema
})

export type SignInPayload = z.infer<typeof SignInPayloadSchema>

export interface RefreshPayload {
  refresh: string
}

export type RefreshResponse = Pick<Tokens, 'access'>

export interface SignInResponse extends Tokens {
  user: User
}

export type Session = SignInResponse
