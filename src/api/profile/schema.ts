import { z } from 'zod'

import { NameSchema, PasswordSchema } from '@/api/schema'

export interface UpdateProfilePayload {
  first_name?: string
  last_name?: string
}

export interface ChangePasswordPayload {
  old_password: string
  new_password: string
  new_password_confirm: string
}

export const UpdateProfileSchema = z.object({
  first_name: NameSchema,
  last_name: NameSchema
})

export type UpdateProfileFormValues = z.infer<typeof UpdateProfileSchema>

export const ChangePasswordSchema = z
  .object({
    old_password: PasswordSchema,
    new_password: PasswordSchema,
    new_password_confirm: PasswordSchema
  })
  .refine((data) => data.new_password === data.new_password_confirm, {
    message: 'passwords do not match',
    path: ['new_password_confirm']
  })

export type ChangePasswordFormValues = z.infer<typeof ChangePasswordSchema>
