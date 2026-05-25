import type { PaginationParams } from '@/api/schema'

export type PayloadLogSource = 'internal' | 'storefront'

export interface PayloadLog {
  id: number
  project_id: number
  project_name: string
  source: PayloadLogSource
  method: string
  url: string
  entity: string
  key: string
  action_name: string | null
  external_ref: string | null
  payload: Record<string, unknown> | null
  response: Record<string, unknown> | null
  status_code: number
  is_error: boolean
  error_message: string | null
  duration_ms: number
  created_at: string
}

export interface PayloadLogDetail extends PayloadLog {
  is_autoid: boolean
}

export interface PayloadLogListResponse {
  count: number
  limit: number
  offset: number
  results: PayloadLog[]
}

export interface PayloadLogParams extends PaginationParams {
  search?: string
  ordering?: string
  created_after?: string
  created_before?: string
  entity?: string
  is_error?: boolean
  method?: string
  project_id?: number
  status_code?: number
  source?: PayloadLogSource
  action_name?: string
  external_ref?: string
}
