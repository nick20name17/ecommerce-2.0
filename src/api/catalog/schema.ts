import type { PaginationParams } from '@/api/schema'

// ── Category ─────────────────────────────────────────────────

export interface CatalogCategory {
  id: string
  parent_id: string | null
  name: string
  slug: string
  image_url: string
  path: string
  sort_order: number
  active: boolean
  children: CatalogCategory[]
  items?: CatalogCategoryItem[]
}

export interface CatalogCategoryItem {
  id: string
  category_id: string
  item_type: 'product' | 'variable_product'
  item_id: string
  sort_order: number
}

// ── Params ───────────────────────────────────────────────────

export interface CatalogParams extends PaginationParams {
  project_id?: number
  parent_id?: string
}

export interface CatalogTreeParams {
  project_id?: number
}

// ── Payloads ─────────────────────────────────────────────────

export interface CreateCatalogCategoryPayload {
  name: string
  parent_id?: string | null
  slug?: string
  image_url?: string
  sort_order?: number
}

export type UpdateCatalogCategoryPayload = Partial<CreateCatalogCategoryPayload>

export interface CreateCatalogItemPayload {
  item_type: 'product' | 'variable_product'
  item_id: string
  sort_order?: number
}

export interface ImportFromInventrePayload {
  root_tree_id?: string | null
}

// ── Responses ────────────────────────────────────────────────

export interface CatalogTreeResponse {
  results: CatalogCategory[]
}

export interface CatalogListResponse {
  results: CatalogCategory[]
}
