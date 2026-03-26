/** Per-entity lists of fields that can be updated via PATCH */
export type EditableFieldsResponse = Record<string, string[]>

/** Per-entity field type mappings: string | boolean | integer | number | date */
export type FieldTypesResponse = Record<string, Record<string, string>>

/** Per-entity field alias (display name) mappings */
export type FieldAliasesResponse = Record<string, Record<string, string>>
