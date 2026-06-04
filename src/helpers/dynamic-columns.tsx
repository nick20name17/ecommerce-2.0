import type { FieldConfigResponse } from '@/api/field-config/schema'

const isEmptyValue = (value: unknown): boolean => {
  if (value == null) return true
  const str = String(value).trim()
  return str === ''
}

export const formatCellValue = (value: unknown): string => {
  if (isEmptyValue(value)) return '—'
  return String(value)
}

export const getColumnLabel = (
  key: string,
  entity: string,
  fieldConfig: FieldConfigResponse | null | undefined
): string => {
  const entry = fieldConfig?.[entity]?.find(e => e.field === key)
  if (entry?.alias?.trim()) return entry.alias.trim()
  return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}
