import { z } from 'zod'

import { EmailSchema, NameSchema, NewPasswordSchema } from '@/api/schema'
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
  project_id: number
  salesman: string

  project_name: string
  shipping_enabled: boolean
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
  salesman?: string
  project?: number
}

export interface UpdateUserPayload {
  id: number
  payload: {
    is_active?: boolean
    first_name?: string
    last_name?: string
    email?: string
    role?: string
    salesman?: string
    project?: number
  }
}

export type UserResponse = ApiResponse<User>

export interface UserParams extends PaginationParams {
  search?: string
  ordering?: string
  role?: string
  project?: number
}

const roleValues = Object.values(USER_ROLES) as [string, ...string[]]

const createUserSchemaBase = (isCurrentUserSuperAdmin: boolean) => {
  const projectSchema = isCurrentUserSuperAdmin ? z.number() : z.number().optional()
  return z.object({
    first_name: NameSchema,
    last_name: NameSchema,
    email: EmailSchema,
    role: z.enum(roleValues),
    salesman: z.string(),
    project: projectSchema,
    password: NewPasswordSchema,
    password_confirm: NewPasswordSchema
  })
}

export const getCreateUserSchema = (isCurrentUserSuperAdmin: boolean) =>
  createUserSchemaBase(isCurrentUserSuperAdmin)
    .refine((data) => data.password === data.password_confirm, {
      message: 'passwords do not match',
      path: ['password_confirm']
    })
    .superRefine((data, ctx) => {
      if (
        isCurrentUserSuperAdmin &&
        !isSuperAdmin(data.role as UserRole) &&
        (!data.project || data.project < 1)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Project is required',
          path: ['project']
        })
      }
    })

export const CreateUserSchema = getCreateUserSchema(true)

export type CreateUserFormValues = z.infer<ReturnType<typeof getCreateUserSchema>>

const updateUserSchemaBase = (isCurrentUserSuperAdmin: boolean) => {
  const projectSchema = isCurrentUserSuperAdmin ? z.number() : z.number().optional()
  return z
    .object({
      first_name: NameSchema,
      last_name: NameSchema,
      email: EmailSchema,
      role: z.enum(roleValues),
      salesman: z.string(),
      project: projectSchema,
      is_active: z.boolean()
    })
    .superRefine((data, ctx) => {
      if (
        isCurrentUserSuperAdmin &&
        !isSuperAdmin(data.role as UserRole) &&
        (!data.project || data.project < 1)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Project is required',
          path: ['project']
        })
      }
    })
}

export const getUpdateUserSchema = (isCurrentUserSuperAdmin: boolean) =>
  updateUserSchemaBase(isCurrentUserSuperAdmin)

export const UpdateUserSchema = getUpdateUserSchema(true)

export type UpdateUserFormValues = z.infer<ReturnType<typeof getUpdateUserSchema>>
