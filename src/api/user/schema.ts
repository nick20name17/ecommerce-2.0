import { z } from 'zod'

import { EmailSchema, NameSchema, PasswordSchema } from '@/api/schema'
import type { ApiResponse, PaginationParams } from '@/api/schema'
import { USER_ROLES, isSuperAdmin } from '@/constants/user'
import type { UserRole } from '@/constants/user'

export type { UserRole } from '@/constants/user'

export interface User {
  id: number
  email: string
  first_name: string
  last_name: string
  role: UserRole
  project: number
  project_name: string
  is_active: boolean
  date_joined: string
  updated_at: string
}

export interface UserSummary {
  id: number
  email: string
  first_name: string
  last_name: string
  full_name: string
  role: string
}

export interface CreateUserPayload {
  email: string
  password: string
  password_confirm: string
  first_name: string
  last_name: string
  role: string
  project: number
}

export interface UpdateUserPayload {
  id: number
  payload: {
    is_active?: boolean
    first_name?: string
    last_name?: string
    email?: string
    role?: string
    project?: number
  }
}

export type UserResponse = ApiResponse<User>

export interface UserParams extends PaginationParams {
  search?: string
  ordering?: string
}

const roleValues = Object.values(USER_ROLES) as [string, ...string[]]

export const CreateUserSchema = z
  .object({
    first_name: NameSchema,
    last_name: NameSchema,
    email: EmailSchema,
    role: z.enum(roleValues),
    project: z.number(),
    password: PasswordSchema,
    password_confirm: PasswordSchema
  })
  .refine((data) => data.password === data.password_confirm, {
    message: 'passwords do not match',
    path: ['password_confirm']
  })
  .superRefine((data, ctx) => {
    if (!isSuperAdmin(data.role as UserRole) && (!data.project || data.project < 1)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Project is required', path: ['project'] })
    }
  })

export type CreateUserFormValues = z.infer<typeof CreateUserSchema>

export const UpdateUserSchema = z
  .object({
    first_name: NameSchema,
    last_name: NameSchema,
    email: EmailSchema,
    role: z.enum(roleValues),
    project: z.number(),
    is_active: z.boolean()
  })
  .superRefine((data, ctx) => {
    if (!isSuperAdmin(data.role as UserRole) && (!data.project || data.project < 1)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Project is required', path: ['project'] })
    }
  })

export type UpdateUserFormValues = z.infer<typeof UpdateUserSchema>

