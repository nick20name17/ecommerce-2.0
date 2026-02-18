import type { ApiResponse, PaginationParams } from '../schema'

export interface Project {
  id: number
  name: string
  db_type: string
  db_host: string
  db_port?: number
  db_name?: string
  db_username?: string
  api_endpoint?: string
  api_login?: string
  extra_columns?: string
  price_field?: string
  markup_id_trigger?: string
  s3_bucket_name?: string
  s3_region?: string
  s3_access_key_id?: string
  user_count: string
  created_at: string
  updated_at: string
}

export interface ProjectHealth {
  id: number
  name: string
  description: string
  is_enabled: boolean
  customer: number
  customer_name: string
  domain_control: string
  third_party_email: string
  website_url: string
  website_status: 'healthy' | 'unhealthy'
  website_last_checked: string
  website_response_ms: number
  website_error: string
  backend_api_url: string
  backend_status: 'healthy' | 'unhealthy'
  backend_last_checked: string
  backend_response_ms: number
  backend_error: string
  db_alias: string
  db_type: string
  db_name: string
  db_host: string
  db_port: number
  db_user: string
  api_url: string
  api_login: string
  has_ebms_config: boolean
  ebms_status: 'healthy' | 'unhealthy'
  ebms_last_checked: string
  ebms_response_ms: number
  ebms_error: string
  has_sync_config: boolean
  sync_status: 'healthy' | 'unhealthy'
  sync_last_checked: string
  sync_response_ms: number
  sync_error: string
  overall_status: 'healthy' | 'unhealthy'
  check_count: number
}

export interface CreateProjectPayload {
  name: string
  db_type: string
  db_host: string
  db_port: number
  db_name: string
  db_username: string
  db_password: string
  api_endpoint?: string
  api_login?: string
  api_password?: string
  extra_columns?: string
  price_field?: string
  markup_id_trigger?: string
  s3_bucket_name?: string
  s3_region?: string
  s3_access_key_id?: string
  s3_secret_key?: string
}

export type UpdateProjectPayload = Partial<CreateProjectPayload>

export type ProjectResponse = ApiResponse<Project>

export interface ProjectParams extends PaginationParams {
  search?: string
  ordering?: string
}
