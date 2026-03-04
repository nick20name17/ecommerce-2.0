import type { ColumnDef } from '@tanstack/react-table'

import type { FieldConfigResponse } from '@/api/field-config/schema'
import { ColumnHeader } from '@/components/common/data-table/column-header'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export const RESERVED_KEYS = ['_pending', 'items', 'assigned_user'] as const

function isEmptyValue(value: unknown): boolean {
  if (value == null) return true
  const str = String(value).trim()
  return str === ''
}

export function formatCellValue(value: unknown): string {
  if (isEmptyValue(value)) return '—'
  return String(value)
}

export function getKeysFromRows(
  rows: Record<string, unknown>[],
  exclude: readonly string[] = []
): string[] {
  const set = new Set<string>()
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (!exclude.includes(key)) set.add(key)
    }
  }
  return [...set].sort()
}

export function humanizeKey(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function getOrderedDataKeys(
  dataRows: Record<string, unknown>[],
  entity: string,
  fieldConfig: FieldConfigResponse | null | undefined
): string[] {
  const fromData = new Set<string>()
  for (const row of dataRows) {
    for (const key of Object.keys(row)) {
      if (!RESERVED_KEYS.includes(key as (typeof RESERVED_KEYS)[number])) {
        fromData.add(key)
      }
    }
  }
  const orderedFromConfig =
    fieldConfig?.[entity]?.filter((e) => e.enabled).map((e) => e.field) ?? []
  const configSet = new Set(orderedFromConfig)
  const ordered =
    dataRows.length > 0 ? orderedFromConfig.filter((k) => fromData.has(k)) : orderedFromConfig
  const rest = dataRows.length > 0 ? [...fromData].filter((k) => !configSet.has(k)).sort() : []
  return [...ordered, ...rest]
}

export function getColumnLabel(
  key: string,
  entity: string,
  fieldConfig: FieldConfigResponse | null | undefined
): string {
  const entry = fieldConfig?.[entity]?.find((e) => e.field === key)
  if (entry?.alias?.trim()) return entry.alias.trim()
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export type DynamicCellFormatter<T> = (value: unknown, row: T) => React.ReactNode

export interface BuildDynamicDataColumnsOptions<T> {
  formatters?: Partial<Record<string, DynamicCellFormatter<T>>>
}

export function buildDynamicDataColumns<T extends Record<string, unknown>>(
  orderedKeys: string[],
  getLabel: (key: string) => string,
  options?: BuildDynamicDataColumnsOptions<T>
): ColumnDef<T>[] {
  const formatters = options?.formatters ?? {}

  return orderedKeys.map((key) => {
    const formatter = formatters[key]
    return {
      accessorKey: key,
      header: ({ column }) => (
        <ColumnHeader
          column={column}
          title={getLabel(key)}
        />
      ),
      cell: ({ row }) => {
        const value = row.original[key]
        if (formatter) return formatter(value, row.original)
        const pending = row.original._pending as boolean | undefined
        if (pending) return <span className='text-muted-foreground'>—</span>
        const str = formatCellValue(value)
        if (str === '—') return <span className='text-muted-foreground'>—</span>
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className='block max-w-full truncate'>{str}</span>
            </TooltipTrigger>
            <TooltipContent>{str}</TooltipContent>
          </Tooltip>
        )
      },
      size: 140,
      minSize: 80
    }
  })
}
