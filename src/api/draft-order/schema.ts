import type { PaginatedResponse, PaginationParams } from '@/api/schema'

export type DraftOrderStatus =
  | 'queued'
  | 'extracting'
  | 'ready'
  | 'confirming'
  | 'confirmed'
  | 'failed'

export interface DraftLineCandidate {
  /** INVENTRY.ID */
  id: string
  autoid: string
  descr_1: string
  score: number
  source: 'exact' | 'fuzzy'
}

export interface DraftLineItem {
  qty: number
  unit: string | null
  code: string | null
  description: string
  /** 0..1 from the extraction model */
  confidence: number
  /** Chosen INVENTRY.ID (auto-set when exact match or score >= 0.9) */
  product_id: string | null
  candidates: DraftLineCandidate[]
}

export interface CustomerCandidate {
  /** ARCUST natural key */
  id: string
  name: string
  score: number
}

/** Empty object `{}` until extraction has run — all fields optional. */
export interface DraftExtraction {
  customer_ref?: string | null
  po_number?: string | null
  order_date?: string | null
  notes?: string | null
  model_used?: string
  avg_confidence?: number
}

export interface DraftOrder {
  id: number
  status: DraftOrderStatus
  file_name: string
  file_content_type: string
  file_size: number
  /** Presigned S3 GET url, regenerated on every read (7-day exp). Read-only. */
  file_url: string
  customer_id: string | null
  customer_candidates: CustomerCandidate[]
  extraction: DraftExtraction
  line_items: DraftLineItem[]
  error: string
  /** "" until confirmed */
  created_order_autoid: string
  created_by_email: string | null
  created_at: string
  updated_at: string
}

export interface UpdateDraftOrderPayload {
  customer_id?: string | null
  line_items?: DraftLineItem[]
  extraction?: DraftExtraction
}

export interface DraftOrderListParams extends PaginationParams {
  status?: DraftOrderStatus
}

export type DraftOrderListResponse = PaginatedResponse<DraftOrder>
