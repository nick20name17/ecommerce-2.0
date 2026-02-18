import type { ApiResponse, PaginationParams } from '../schema'

export type UserRole = 'admin' | 'manager' | 'superadmin' | 'sale'

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

export type CreateUserPayload = Omit<User, 'id' | 'updated_at' | 'date_joined'>

export interface UpdateUserPayload {
  id: number
  payload: Partial<CreateUserPayload>
}

export type UserResponse = ApiResponse<User>

export interface UserParams extends PaginationParams {
  search?: string
  ordering?: string
}
