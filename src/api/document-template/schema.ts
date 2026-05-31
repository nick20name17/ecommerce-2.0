export type EntityType = 'order' | 'proposal' | 'customer'
export type PageSize = 'letter' | 'a4' | 'label_4x6'
export type Orientation = 'portrait' | 'landscape'

/** Routes where a template can show up in the Print menu. */
export type AccessibleRouteKey =
  | 'order_detail'
  | 'order_list'
  | 'proposal_detail'
  | 'proposal_list'
  | 'customer_detail'
  | 'customer_list'

export interface PageMargins {
  top?: number
  right?: number
  bottom?: number
  left?: number
}

// ── Layout shapes (free-form JSON, validated server-side) ──

export type ElementType = 'text' | 'field' | 'image' | 'table' | 'line' | 'rect'

/** Per-cell value formatter applied before HTML escape. */
export type TableColumnFormat =
  | 'string'
  | 'number'
  | 'integer'
  | 'currency'
  | 'percent'

/** One column in a Table element. */
export interface TableColumn {
  /** Dotted field key relative to each item row (e.g. `descr`, `unit_price`). */
  fieldKey: string
  /** Header label. Falls back to fieldKey if empty. */
  label?: string
  /** Width as a percentage of the table element's width. */
  widthPct?: number
  align?: 'left' | 'right' | 'center'
  format?: TableColumnFormat
}

/** Element common shape. type-specific config lives in `props`. */
export interface LayoutElement {
  id: string
  type: ElementType
  /** Position + size in inches, relative to page origin (top-left). */
  x: number
  y: number
  w: number
  h: number
  props?: Record<string, unknown>
}

export interface LayoutPage {
  elements: LayoutElement[]
}

export interface DocumentLayout {
  pages?: LayoutPage[]
}

// ── Template ──

export interface DocumentTemplate {
  id: number
  name: string
  description: string
  entity_type: EntityType
  accessible_from: AccessibleRouteKey[]
  page_size: PageSize
  orientation: Orientation
  page_margins: PageMargins
  logo_url: string
  layout: DocumentLayout
  is_active: boolean
  created_by: number | null
  created_by_email: string | null
  created_at: string
  updated_at: string
}

export interface DocumentTemplateListParams {
  entity_type?: EntityType
  accessible_from?: AccessibleRouteKey
  is_active?: boolean
  project_id?: number | null
}

export interface CreateDocumentTemplatePayload {
  name: string
  description?: string
  entity_type: EntityType
  accessible_from?: AccessibleRouteKey[]
  page_size?: PageSize
  orientation?: Orientation
  page_margins?: PageMargins
  logo_url?: string
  layout?: DocumentLayout
  is_active?: boolean
}

export type UpdateDocumentTemplatePayload = Partial<CreateDocumentTemplatePayload>

export interface RenderResponseStub {
  template_id: number
  template_name: string
  entity_type: EntityType
  entity_id: string
  render_status: 'stub' | 'ok'
  note?: string
}
