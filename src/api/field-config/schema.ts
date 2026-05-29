export interface FieldConfigEntry {
  field: string
  alias: string | null
  default: boolean
  enabled: boolean
  editable?: boolean
  extra?: boolean
  /** Whether this field is included as a column in the entity list view. */
  in_list?: boolean
  /** Normalized field type — string | boolean | integer | number | date */
  type?: string
}

/**
 * GET /api/data/field-config/ response.
 *
 * Each entity name maps to an array of field entries.
 * Top-level `_list_columns` is a per-entity ordered list driving the
 * drag-and-drop reorder UI in Data Control and the column order in the
 * list views.
 */
export type FieldConfigResponse = Record<string, FieldConfigEntry[]> & {
  _list_columns?: Record<string, string[]>
}

export type FieldConfigPatchPayload =
  | Record<string, string[]>
  | { _aliases: Record<string, Record<string, string>> }
  | { _editable: Record<string, string[]> }
  | { _list_columns: Record<string, string[]> }

export interface FieldConfigPatchResponse {
  status: string
  field_config?: Record<string, string[]>
  field_aliases?: Record<string, Record<string, string>>
  _editable?: Record<string, string[]>
  list_columns?: Record<string, string[]>
}

export interface FieldConfigRow {
  field: string
  alias: string | null
  default: boolean
  enabled: boolean
  editable?: boolean
  in_list?: boolean
  type?: string
  entity: string
}
