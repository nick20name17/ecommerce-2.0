export interface SchemaTable {
  name: string
  db_table: string
  default_fields: string[]
  all_fields: string[]
  computed_fields: string[]
  extra_columns: string[]
}

export interface ProjectSchema {
  project_id: number
  project_name: string
  tables: SchemaTable[]
}

export interface TableField {
  name: string
  dbTable: string
  isEnabled: boolean
}

export interface UpdateFieldsPayload {
  project_id: number
  table_name: string
  default_fields: string[]
}
