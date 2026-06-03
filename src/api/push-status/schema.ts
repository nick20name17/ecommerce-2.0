import type { PaginationParams } from '@/api/schema'

// Live push state of one storefront's approved, not-finished orders, joined
// with PayloadLog history. Backed by GET /api/data/proposals/push-status/.

export interface PushStatusItem {
  // Live storefront state (GET /api/crm/proposal)
  proposal_id: number
  status: string
  arinv_status: string
  arinv_autoid: string | null
  email: string | null
  subtotal: number | null
  tax: number | null
  shipping: number | null
  total: number | null
  items_total: number | null
  items_pushed: number | null
  is_approved: boolean
  created_at: string | null
  updated_at: string | null
  // Enriched from PayloadLog (source=storefront, joined on external_ref)
  attempts: number
  last_attempt_at: string | null
  last_status_code: number | null
  last_error_message: string | null
  last_entity: string | null
  last_action_name: string | null
  next_retry_at: string | null
}

export interface PushStatusResponse {
  // false => synchronous storefront with no /api/crm/proposal endpoint;
  // results is empty and the UI degrades to a log-only notice.
  supported: boolean
  count: number
  limit: number
  offset: number
  results: PushStatusItem[]
}

export interface PushStatusParams extends PaginationParams {
  search?: string
  ordering?: string
  project_id?: number
}
