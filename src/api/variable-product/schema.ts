import type { PaginationParams } from '@/api/schema'

// ── Variable Product ─────────────────────────────────────────

export interface VariableProduct {
  id: string
  name: string
  description: string
  slug: string
  image_url: string
  category_id: string | null
  sort_order: number
  active: boolean
  items: VariableProductItem[]
  specs: VariableProductSpec[]
}

export interface VariableProductListItem {
  id: string
  name: string
  description: string
  slug: string
  image_url: string
  category_id: string | null
  sort_order: number
  active: boolean
}

// ── Items (product variants within a VP) ─────────────────────

export interface VariableProductItem {
  id: string
  product_autoid: string
  is_default: boolean
  sort_order: number
  product_id: string
  descr_1: string
  descr_2: string
  def_unit: string
  count: number
  available_stock: number
  price: string
  old_price: string
  price_level: string
  inactive: boolean
  notqtysell: boolean
}

// ── Spec Definitions ─────────────────────────────────────────

export type SpecDisplayType = 'swatch' | 'dropdown' | 'button'

export interface VariableProductSpec {
  id: string
  name: string
  display_type: SpecDisplayType
  sort_order: number
  values: VariableProductSpecValue[]
}

// ── Spec Values ──────────────────────────────────────────────

export interface VariableProductSpecValue {
  id: string
  item_id: string
  value: string
  color_hex: string
  image_url: string
  hover_text: string
  sort_order: number
}

// ── Params ───────────────────────────────────────────────────

export interface VariableProductParams extends PaginationParams {
  project_id?: number
  search?: string
  category_id?: string
}

// ── Payloads ─────────────────────────────────────────────────

export interface CreateVariableProductPayload {
  name: string
  description?: string
  slug?: string
  image_url?: string
  category_id?: string | null
  sort_order?: number
}

export type UpdateVariableProductPayload = Partial<CreateVariableProductPayload> & {
  active?: boolean
}

export interface CreateVPItemPayload {
  product_autoid: string
  is_default?: boolean
  sort_order?: number
}

export interface CreateVPSpecPayload {
  name: string
  display_type: SpecDisplayType
  sort_order?: number
}

export type UpdateVPSpecPayload = Partial<CreateVPSpecPayload>

export interface CreateVPSpecValuePayload {
  item_id: string
  value: string
  color_hex?: string
  image_url?: string
  hover_text?: string
  sort_order?: number
}

export type UpdateVPSpecValuePayload = Partial<CreateVPSpecValuePayload>

export interface ImportFromSuperIdPayload {
  super_id: string
  swatch_spec_names?: string[]
}

export interface ImportAllVPPayload {
  swatch_spec_names?: string[]
}

// ── Responses ────────────────────────────────────────────────

export interface VariableProductListResponse {
  count: number
  limit: number
  offset: number
  results: VariableProductListItem[]
}

export interface ImportVPResponse {
  imported: number
  skipped: number
  errors: string[]
}
