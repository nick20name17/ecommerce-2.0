export interface FieldConfigEntry {
  field: string
  alias: string | null
  default: boolean
  enabled: boolean
  extra?: boolean
}

export type FieldConfigResponse = Record<string, FieldConfigEntry[]>

export type FieldConfigPatchPayload =
  | Record<string, string[]>
  | { _aliases: Record<string, Record<string, string>> }

export interface FieldConfigPatchResponse {
  status: string
  field_config?: Record<string, string[]>
  field_aliases?: Record<string, Record<string, string>>
}

export interface FieldConfigRow {
  field: string
  alias: string | null
  default: boolean
  enabled: boolean
  entity: string
}
