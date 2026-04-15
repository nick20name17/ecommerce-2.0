import type { PaginationParams } from '@/api/schema'

// ── Global Spec Definitions ─────────────────────────────────

export type SpecDisplayType = 'swatch' | 'dropdown' | 'button'

export interface SpecOption {
  id: string
  value: string
  slug: string
  color_hex: string
  image_url: string
  hover_text: string
  sort_order: number
}

export interface GlobalSpecDefinition {
  id: string
  name: string
  slug: string
  display_type: SpecDisplayType
  sort_order: number
  vp_count?: number
  option_count?: number
  options?: SpecOption[]
}

// ── Item Spec Link ──────────────────────────────────────────

export interface ItemSpecLink {
  id: string
  item_id: string
  spec_option_id: string
}

// ── Variable Product ────────────────────────────────────────

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
  spec_definitions: GlobalSpecDefinition[]
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
  active: boolean
  specs: Record<string, { option_id: string; value: string }>
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

// ── Params ───────────────────────────────────────────────────

export interface VariableProductParams extends PaginationParams {
  project_id?: number
  search?: string
  category_id?: string
}

export interface SpecParams {
  project_id?: number
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

export interface CreateSpecPayload {
  name: string
  display_type: SpecDisplayType
  sort_order?: number
}

export type UpdateSpecPayload = Partial<CreateSpecPayload>

export interface CreateSpecOptionPayload {
  value: string
  color_hex?: string
  image_url?: string
  hover_text?: string
  sort_order?: number
}

export type UpdateSpecOptionPayload = Partial<CreateSpecOptionPayload>

export interface MergeSpecsPayload {
  source_id: string
}

export interface LinkItemSpecPayload {
  spec_option_id: string
}

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

export interface SpecListResponse {
  count: number
  limit: number
  offset: number
  results: GlobalSpecDefinition[]
}

export interface ImportVPResponse {
  imported: number
  skipped: number
  errors: string[]
}